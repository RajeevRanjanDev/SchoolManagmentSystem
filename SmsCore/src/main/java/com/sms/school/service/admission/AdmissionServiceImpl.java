package com.sms.school.service.admission;

import com.sms.school.dto.request.admission.LifecycleTransitionRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest;
import com.sms.school.dto.request.admission.VerifyDocumentRequest;
import com.sms.school.dto.response.admission.StudentHistoryResponse;
import com.sms.school.dto.response.admission.StudentProfileResponse;
import com.sms.school.dto.response.admission.TransportStudentResponse;
import com.sms.school.entity.*;
import com.sms.school.entity.admission.*;
import com.sms.school.entity.enums.*;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.repository.admission.*;
import com.sms.school.service.EmailService;
import com.sms.school.util.PasswordUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class AdmissionServiceImpl implements AdmissionService {

    private final StudentProfileRepository     profileRepo;
    private final StudentDocumentRepository    documentRepo;
    private final StudentGuardianRepository    guardianRepo;
    private final StudentStatusHistoryRepository historyRepo;
    private final SchoolRepository             schoolRepo;
    // existing tables — used for sync
    private final StudentRepository            studentRepo;
    private final ParentRepository             parentRepo;
    private final StudentParentMappingRepository mappingRepo;
    private final TransportRouteRepository     transportRouteRepo;
    private final StudentClassMappingRepository classMappingRepo;
    private final SchoolClassRepository        classRepo;
    private final SectionRepository            sectionRepo;
    // Student login account
    private final UserRepository               userRepo;
    private final RoleRepository               roleRepo;
    private final PasswordEncoder              passwordEncoder;
    private final EmailService                 emailService;
    private final FeeTemplateRepository         feeTemplateRepo;
    private final FeeRepository                 feeRepo;

    private static final AtomicLong seq = new AtomicLong(1);

    // ── Register ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse register(Long tenantId, RegisterStudentRequest req) {
        School school = schoolRepo.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("School", tenantId));

        // Enforce the subscription plan's student limit.
        if (school.getSubscriptionPlan() != null) {
            int max = school.getSubscriptionPlan().getMaxStudents();
            if (max > 0 && profileRepo.countByTenantIdAndDeletedFalse(tenantId) >= max) {
                throw new BusinessException("Student limit (" + max
                        + ") for the current subscription plan has been reached. Upgrade the plan to add more students.");
            }
        }

        if (req.getFeeTemplateId() == null) {
            throw new BusinessException("Please select a fee template for the student.");
        }

        if (req.getDateOfBirth() != null && req.getDateOfBirth().isAfter(LocalDate.now().minusYears(2))) {
            throw new BusinessException("Student must be at least 2 years old.");
        }

        if (req.getEmail() != null && !req.getEmail().isBlank() && userRepo.existsByEmail(req.getEmail().trim())) {
            throw new BusinessException("This email is already registered. Please use a different email.");
        }

        if (req.getAdmissionNumber() != null
                && profileRepo.existsByTenantIdAndAdmissionNumber(tenantId, req.getAdmissionNumber()))
            throw new BusinessException("Admission number '" + req.getAdmissionNumber() + "' already exists.");

        if (req.getAadhaarNumber() != null
                && profileRepo.existsByTenantIdAndAadhaarNumber(tenantId, req.getAadhaarNumber()))
            throw new BusinessException("A student with this Aadhaar number already exists.");

        String studentCode = generateStudentCode(tenantId);

        // Admission number doubles as the student's login ID — schoolCode+year+seq.
        String admissionNumber = (req.getAdmissionNumber() != null && !req.getAdmissionNumber().isBlank())
                ? req.getAdmissionNumber().trim()
                : generateAdmissionNumber(school, req.getAdmissionDate());

        // A school student registered with a class + section is enrolled immediately,
        // instead of sitting as an APPLICANT that must be admitted then enrolled.
        boolean autoEnroll = req.getInstitutionType() == InstitutionType.SCHOOL
                && req.getClassId() != null && req.getSectionId() != null;

        StudentProfile profile = StudentProfile.builder()
                .tenantId(tenantId)
                .school(school)
                .studentCode(studentCode)
                .admissionNumber(admissionNumber)
                .firstName(req.getFirstName())
                .middleName(req.getMiddleName())
                .lastName(req.getLastName())
                .gender(req.getGender())
                .dateOfBirth(req.getDateOfBirth())
                .bloodGroup(req.getBloodGroup())
                .category(req.getCategory())
                .nationality(req.getNationality() != null ? req.getNationality() : "Indian")
                .religion(req.getReligion())
                .motherTongue(req.getMotherTongue())
                .aadhaarNumber(req.getAadhaarNumber())
                .mobile(req.getMobile())
                .email(req.getEmail())
                .profilePhotoUrl(req.getProfilePhotoUrl())
                .lifecycleStatus(autoEnroll ? StudentLifecycleStatus.ENROLLED : StudentLifecycleStatus.APPLICANT)
                .admissionDate(req.getAdmissionDate())
                .admissionType(req.getAdmissionType())
                .campusId(req.getCampusId())
                .previousInstitution(req.getPreviousInstitution())
                .previousQualification(req.getPreviousQualification())
                .build();

        profile = profileRepo.save(profile);

        // Create the student's own login account (login ID = admission number).
        createStudentLogin(profile, school, req);

        // Academic profile (new table — institution-agnostic, no existing equivalent)
        buildAcademicProfile(profile, req);

        // Guardians → saved as Parent + StudentGuardian mirror (StudentGuardian for display,
        // Parent record created so guardian can log in when hasPortalAccess = true)
        buildGuardians(profile, req.getGuardians(), school, tenantId);

        // Addresses (new table — students table only has a single address text column)
        buildAddresses(profile, req, tenantId);

        if (req.getMedicalInfo() != null) buildMedical(profile, req.getMedicalInfo(), tenantId);
        if (req.getTransportInfo() != null) buildTransport(profile, req.getTransportInfo(), tenantId);
        if (req.getHostelInfo() != null) buildHostel(profile, req.getHostelInfo(), tenantId);

        if (autoEnroll) {
            recordTransition(profile, null, StudentLifecycleStatus.ENROLLED, "REGISTER",
                    "Student registered and enrolled", tenantId);
            // Mirror into the legacy students table + class/section mapping.
            syncToStudentsTable(profile);
            // Bill the student from the selected fee template.
            applyFeeTemplate(profile, school, req.getFeeTemplateId());
        } else {
            recordTransition(profile, null, StudentLifecycleStatus.APPLICANT, "REGISTER",
                    "Student registered", tenantId);
        }

        return toResponse(profile);
    }

    /** Create the student's first fee from the chosen template. */
    private void applyFeeTemplate(StudentProfile profile, School school, Long templateId) {
        if (templateId == null) return;
        Student student = studentRepo.findBySchoolIdAndAdmissionNumber(school.getId(), profile.getAdmissionNumber())
                .orElse(null);
        if (student == null) return;   // not enrolled yet — fee applies on enrollment

        FeeTemplate t = feeTemplateRepo.findById(templateId)
                .filter(ft -> ft.getSchool().getId().equals(school.getId()) && !ft.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Fee template", templateId));

        LocalDate today = LocalDate.now();
        int dueDay = t.getDueDayOfMonth() != null ? Math.min(Math.max(t.getDueDayOfMonth(), 1), 28) : 10;
        LocalDate due = LocalDate.of(today.getYear(), today.getMonthValue(), dueDay);
        String period = today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + today.getYear();

        feeRepo.save(Fee.builder()
                .school(school)
                .student(student)
                .feeCategory(t.getFeeType())
                .academicYear(t.getAcademicYear() != null ? t.getAcademicYear() : school.getCurrentAcademicYear())
                .feePeriod(period)
                .amount(t.getAmount())
                .discount(BigDecimal.ZERO)
                .fine(BigDecimal.ZERO)
                .dueDate(due)
                .status(FeeStatus.PENDING)
                .remarks("From template: " + t.getName())
                .build());
    }

    @Override
    @Transactional
    public String resetStudentPassword(Long tenantId, Long id) {
        StudentProfile profile = getProfile(tenantId, id);
        User user = ensureStudentLogin(profile);

        String tempPassword = PasswordUtils.generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepo.save(user);

        String loginId = user.getUsername() != null ? user.getUsername() : profile.getAdmissionNumber();
        emailService.sendTempPassword(user.getEmail(),
                profile.getFirstName() + " " + profile.getLastName(), loginId, tempPassword);
        return user.getEmail();
    }

    /**
     * Returns the student's login account, provisioning or repairing it if missing.
     * Older students (admitted before login accounts were auto-created) have no linked
     * user, so we either relink an existing account by username or create a fresh one
     * from the stored email.
     */
    private User ensureStudentLogin(StudentProfile profile) {
        User user = profile.getUser();
        if (user != null) return user;

        String loginId = profile.getAdmissionNumber();

        // An account may already exist (username = admission number) but just not be linked.
        user = userRepo.findByUsername(loginId).orElse(null);
        if (user != null) {
            profile.setUser(user);
            profileRepo.save(profile);
            return user;
        }

        // Otherwise create one — requires an email to send the temporary password to.
        String email = profile.getEmail();
        if (email == null || email.isBlank()) {
            throw new BusinessException(
                    "This student has no login account and no email on file. Add an email in the Profile tab first.");
        }
        Role studentRole = roleRepo.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new BusinessException("STUDENT role not found"));

        user = User.builder()
                .school(profile.getSchool())
                .username(loginId)
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .email(email)
                .phone(profile.getMobile())
                .password(passwordEncoder.encode(PasswordUtils.generateTempPassword()))
                .active(true)
                .build();
        user.getRoles().add(studentRole);
        user = userRepo.save(user);

        profile.setUser(user);
        profileRepo.save(profile);
        return user;
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getById(Long tenantId, Long id) {
        return toResponse(getProfile(tenantId, id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentProfileResponse> list(Long tenantId, List<StudentLifecycleStatus> statuses,
                                             String search, Long classId, Long sectionId, Pageable pageable) {
        // Pass an empty string (never null) so Postgres doesn't type the LIKE parameter as bytea.
        String q = (search != null && !search.isBlank()) ? search.trim() : "";
        boolean hasStatus = statuses != null && !statuses.isEmpty();
        // When not filtering by status, pass a dummy non-empty list so the IN clause still parses.
        List<StudentLifecycleStatus> stx = hasStatus ? statuses : List.of(StudentLifecycleStatus.APPLICANT);
        return profileRepo.filter(tenantId, hasStatus, stx, classId, sectionId, q, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public StudentProfileResponse update(Long tenantId, Long id, RegisterStudentRequest req) {
        StudentProfile profile = getProfile(tenantId, id);
        profile.setFirstName(req.getFirstName());
        profile.setMiddleName(req.getMiddleName());
        profile.setLastName(req.getLastName());
        profile.setGender(req.getGender());
        profile.setDateOfBirth(req.getDateOfBirth());
        profile.setBloodGroup(req.getBloodGroup());
        profile.setCategory(req.getCategory());
        profile.setMobile(req.getMobile());
        profile.setEmail(req.getEmail());
        return toResponse(profileRepo.save(profile));
    }

    // ── Lifecycle transitions ─────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse admit(Long tenantId, Long id, LifecycleTransitionRequest req) {
        return transition(tenantId, id, StudentLifecycleStatus.ADMITTED,
                List.of(StudentLifecycleStatus.APPLICANT, StudentLifecycleStatus.ADMISSION_REVIEW),
                "ADMIT", req.getRemarks(), req.getEffectiveDate());
    }

    @Override
    @Transactional
    public StudentProfileResponse enroll(Long tenantId, Long id, LifecycleTransitionRequest req) {
        StudentProfile profile = getProfile(tenantId, id);
        assertStatus(profile, List.of(StudentLifecycleStatus.ADMITTED));

        StudentLifecycleStatus from = profile.getLifecycleStatus();
        profile.setLifecycleStatus(StudentLifecycleStatus.ENROLLED);
        profileRepo.save(profile);
        recordTransition(profile, from, StudentLifecycleStatus.ENROLLED, "ENROLL", req.getRemarks(),
                tenantId);

        // Sync to existing students table so fees, attendance, teacher modules see the student
        syncToStudentsTable(profile);

        return toResponse(profile);
    }

    @Override
    @Transactional
    public StudentProfileResponse promote(Long tenantId, Long id, LifecycleTransitionRequest req) {
        StudentProfile profile = getProfile(tenantId, id);
        assertStatus(profile, List.of(StudentLifecycleStatus.ENROLLED));

        if (profile.getAcademicProfile() != null && req.getTargetClassId() != null) {
            profile.getAcademicProfile().setClassId(req.getTargetClassId());
            profile.getAcademicProfile().setSectionId(req.getTargetSectionId());
            if (req.getTargetAcademicSession() != null)
                profile.getAcademicProfile().setAcademicSession(req.getTargetAcademicSession());
        }

        return transition(tenantId, id, StudentLifecycleStatus.PROMOTED,
                List.of(StudentLifecycleStatus.ENROLLED), "PROMOTE", req.getRemarks(), req.getEffectiveDate());
    }

    @Override
    @Transactional
    public StudentProfileResponse assignClassSection(Long tenantId, Long id, LifecycleTransitionRequest req) {
        StudentProfile profile = getProfile(tenantId, id);
        StudentAcademicProfile ap = profile.getAcademicProfile();
        if (ap == null) throw new BusinessException("This student has no academic profile to update.");

        if (req.getTargetClassId() != null) {
            ap.setClassId(req.getTargetClassId());
            ap.setClassName(classRepo.findById(req.getTargetClassId()).map(SchoolClass::getName).orElse(null));
        }
        if (req.getTargetSectionId() != null) {
            ap.setSectionId(req.getTargetSectionId());
            ap.setSectionName(sectionRepo.findById(req.getTargetSectionId()).map(Section::getName).orElse(null));
        }
        if (req.getTargetAcademicSession() != null) ap.setAcademicSession(req.getTargetAcademicSession());

        // Make sure the student counts as enrolled once they have a class/section.
        if (profile.getLifecycleStatus() == StudentLifecycleStatus.APPLICANT
                || profile.getLifecycleStatus() == StudentLifecycleStatus.ADMITTED) {
            StudentLifecycleStatus from = profile.getLifecycleStatus();
            profile.setLifecycleStatus(StudentLifecycleStatus.ENROLLED);
            recordTransition(profile, from, StudentLifecycleStatus.ENROLLED, "ENROLL",
                    "Enrolled via class/section assignment", tenantId);
        }
        profileRepo.save(profile);

        // Keep the legacy students table + class/section mapping in sync.
        syncToStudentsTable(profile);
        return toResponse(profile);
    }

    @Override
    @Transactional
    public StudentProfileResponse assignRollNumber(Long tenantId, Long id, String rollNumber) {
        StudentProfile profile = getProfile(tenantId, id);
        StudentAcademicProfile ap = profile.getAcademicProfile();
        if (ap == null || ap.getSectionId() == null)
            throw new BusinessException("Assign a class and section before giving a roll number.");

        String roll = rollNumber == null ? "" : rollNumber.trim();
        if (roll.isEmpty()) throw new BusinessException("Roll number is required.");

        String year = resolveYear(profile, ap);
        Student student = legacyStudent(profile)
                .orElseThrow(() -> new BusinessException("Student is not enrolled yet."));

        if (rollTakenInSection(tenantId, ap.getSectionId(), year, roll, student.getId()))
            throw new BusinessException("Roll number " + roll + " is already assigned in this section.");

        ap.setRollNumber(roll);
        profileRepo.save(profile);
        syncToStudentsTable(profile);
        return toResponse(profile);
    }

    @Override
    @Transactional
    public StudentProfileResponse moveToSection(Long tenantId, Long id, Long targetSectionId) {
        StudentProfile profile = getProfile(tenantId, id);
        StudentAcademicProfile ap = profile.getAcademicProfile();
        if (ap == null || ap.getClassId() == null)
            throw new BusinessException("Student has no class to move within.");

        Section target = sectionRepo.findById(targetSectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        if (target.getSchoolClass() == null || !target.getSchoolClass().getId().equals(ap.getClassId()))
            throw new BusinessException("A student can only be moved to another section of the same class.");
        if (target.getId().equals(ap.getSectionId()))
            throw new BusinessException("Student is already in this section.");

        String year = resolveYear(profile, ap);
        Student student = legacyStudent(profile)
                .orElseThrow(() -> new BusinessException("Student is not enrolled yet."));

        ap.setSectionId(target.getId());
        ap.setSectionName(target.getName());
        // If their roll number is taken in the new section, clear it so a free one can be assigned.
        if (ap.getRollNumber() != null
                && rollTakenInSection(tenantId, target.getId(), year, ap.getRollNumber(), student.getId())) {
            ap.setRollNumber(null);
        }
        profileRepo.save(profile);
        syncToStudentsTable(profile);
        return toResponse(profile);
    }

    @Override
    @Transactional
    public StudentProfileResponse deactivateStudent(Long tenantId, Long id, String remarks) {
        StudentProfile profile = getProfile(tenantId, id);
        StudentLifecycleStatus from = profile.getLifecycleStatus();
        profile.setLifecycleStatus(StudentLifecycleStatus.DROPPED);
        recordTransition(profile, from, StudentLifecycleStatus.DROPPED, "DEACTIVATE",
                remarks != null ? remarks : "Student left school", tenantId);
        profileRepo.save(profile);

        // Deactivate the legacy student and free the roll number by withdrawing active enrollments.
        legacyStudent(profile).ifPresent(student -> {
            student.setActive(false);
            student.setStatus("INACTIVE");
            studentRepo.save(student);
            classMappingRepo.findBySchoolIdAndStudentIdAndDeletedFalseOrderByAcademicYearDesc(tenantId, student.getId())
                    .stream()
                    .filter(m -> m.getStatus() == EnrollmentStatus.ACTIVE)
                    .forEach(m -> { m.setStatus(EnrollmentStatus.WITHDRAWN); m.setCurrent(false); classMappingRepo.save(m); });
        });
        return toResponse(profile);
    }

    @Override
    @Transactional
    public Map<String, Object> promoteClass(Long tenantId, Long fromClassId, Long toClassId,
                                             String fromAcademicYear, String toAcademicYear) {
        SchoolClass fromCls = classRepo.findById(fromClassId)
                .filter(c -> c.getSchool().getId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Source class not found"));
        SchoolClass toCls = classRepo.findById(toClassId)
                .filter(c -> c.getSchool().getId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Target class not found"));

        List<Section> toSections = sectionRepo.findBySchoolClassIdAndDeletedFalse(toClassId);
        if (toSections.isEmpty())
            throw new BusinessException("Target class \"" + toCls.getName() + "\" has no sections. Add sections first.");

        List<StudentClassMapping> active = classMappingRepo.findActiveByClassAndYear(tenantId, fromClassId, fromAcademicYear);
        int promoted = 0;
        for (StudentClassMapping old : active) {
            Student student = old.getStudent();
            // Match the target section by name (1-A → 2-A); fall back to the first section.
            String secName = old.getSection() != null ? old.getSection().getName() : null;
            Section target = toSections.stream()
                    .filter(s -> s.getName() != null && s.getName().equalsIgnoreCase(secName))
                    .findFirst().orElse(toSections.get(0));

            old.setStatus(EnrollmentStatus.PROMOTED);
            old.setCurrent(false);
            classMappingRepo.save(old);

            classMappingRepo.save(StudentClassMapping.builder()
                    .school(fromCls.getSchool())
                    .student(student)
                    .schoolClass(toCls)
                    .section(target)
                    .academicYear(toAcademicYear)
                    .rollNumber(old.getRollNumber())
                    .current(true)
                    .status(EnrollmentStatus.ACTIVE)
                    .build());

            // Keep the admission profile in sync (display + future operations).
            profileRepo.findByTenantIdAndAdmissionNumberAndDeletedFalse(tenantId, student.getAdmissionNumber())
                    .ifPresent(p -> {
                        StudentAcademicProfile pap = p.getAcademicProfile();
                        if (pap != null) {
                            pap.setClassId(toCls.getId());
                            pap.setClassName(toCls.getName());
                            pap.setSectionId(target.getId());
                            pap.setSectionName(target.getName());
                            pap.setAcademicSession(toAcademicYear);
                            profileRepo.save(p);
                        }
                    });
            promoted++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("fromClass", fromCls.getName());
        result.put("toClass", toCls.getName());
        result.put("promoted", promoted);
        result.put("toAcademicYear", toAcademicYear);
        return result;
    }

    // ── Enrollment helpers ──────────────────────────────────────────────────────

    private String resolveYear(StudentProfile profile, StudentAcademicProfile ap) {
        if (ap.getAcademicSession() != null) return ap.getAcademicSession();
        return profile.getSchool().getCurrentAcademicYear();
    }

    private Optional<Student> legacyStudent(StudentProfile profile) {
        return studentRepo.findBySchoolIdAndAdmissionNumber(profile.getSchool().getId(), profile.getAdmissionNumber());
    }

    private boolean rollTakenInSection(Long schoolId, Long sectionId, String year, String roll, Long excludeStudentId) {
        return classMappingRepo
                .findBySchoolIdAndSectionIdAndAcademicYearAndStatusAndDeletedFalse(schoolId, sectionId, year, EnrollmentStatus.ACTIVE)
                .stream()
                .anyMatch(m -> roll.equalsIgnoreCase(m.getRollNumber())
                        && (excludeStudentId == null || !m.getStudent().getId().equals(excludeStudentId)));
    }

    @Override
    @Transactional
    public StudentProfileResponse transfer(Long tenantId, Long id, LifecycleTransitionRequest req) {
        StudentProfileResponse res = transition(tenantId, id, StudentLifecycleStatus.TRANSFERRED,
                List.of(StudentLifecycleStatus.ENROLLED, StudentLifecycleStatus.ADMITTED),
                "TRANSFER", req.getRemarks(), req.getEffectiveDate());
        updateStudentStatus(tenantId, profileRepo.findById(id).orElseThrow(), "TRANSFERRED", false);
        return res;
    }

    @Override
    @Transactional
    public StudentProfileResponse dropout(Long tenantId, Long id, String remarks) {
        StudentProfileResponse res = transition(tenantId, id, StudentLifecycleStatus.DROPPED,
                List.of(StudentLifecycleStatus.ENROLLED, StudentLifecycleStatus.ADMITTED,
                        StudentLifecycleStatus.APPLICANT),
                "DROPOUT", remarks, LocalDate.now());
        updateStudentStatus(tenantId, profileRepo.findById(id).orElseThrow(), "INACTIVE", false);
        return res;
    }

    @Override
    @Transactional
    public StudentProfileResponse markPassedOut(Long tenantId, Long id, String remarks) {
        StudentProfileResponse res = transition(tenantId, id, StudentLifecycleStatus.PASSED_OUT,
                List.of(StudentLifecycleStatus.ENROLLED, StudentLifecycleStatus.PROMOTED),
                "PASS_OUT", remarks, LocalDate.now());
        updateStudentStatus(tenantId, profileRepo.findById(id).orElseThrow(), "GRADUATED", false);
        return res;
    }

    @Override
    @Transactional
    public StudentProfileResponse convertToAlumni(Long tenantId, Long id, String remarks) {
        return transition(tenantId, id, StudentLifecycleStatus.ALUMNI,
                List.of(StudentLifecycleStatus.PASSED_OUT), "ALUMNI", remarks, LocalDate.now());
    }

    // ── Guardian update ───────────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse updateGuardians(Long tenantId, Long studentId,
                                                  List<RegisterStudentRequest.GuardianRequest> guardians) {
        StudentProfile profile = getProfile(tenantId, studentId);
        School school = profile.getSchool();

        // soft-delete existing guardian records
        profile.getGuardians().forEach(g -> g.setDeleted(true));

        // rebuild guardian records and sync Parent table
        buildGuardians(profile, guardians, school, tenantId);

        profileRepo.save(profile);

        // if student is already enrolled, re-sync parent mappings
        if (profile.getLifecycleStatus() == StudentLifecycleStatus.ENROLLED
                || profile.getLifecycleStatus() == StudentLifecycleStatus.PROMOTED) {
            studentRepo.findBySchoolIdAndAdmissionNumber(school.getId(), profile.getAdmissionNumber())
                    .ifPresent(student -> syncParentMappings(profile, student, school));
        }

        return toResponse(profileRepo.findById(studentId).orElseThrow());
    }

    // ── Contact update (mobile + email) ────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse updateContact(Long tenantId, Long studentId, String mobile, String email) {
        StudentProfile profile = getProfile(tenantId, studentId);
        String newEmail = email == null ? null : email.trim();

        // Guard against colliding with another account's email (ignore the student's own user).
        User studentUser = profile.getUser();
        String currentEmail = studentUser != null ? studentUser.getEmail() : profile.getEmail();
        if (newEmail != null && !newEmail.equalsIgnoreCase(currentEmail) && userRepo.existsByEmail(newEmail)) {
            throw new BusinessException("This email is already registered to another account.");
        }

        profile.setMobile(mobile);
        profile.setEmail(newEmail);

        // Keep the login account and the legacy students row in sync.
        if (studentUser != null) {
            studentUser.setEmail(newEmail);
            studentUser.setPhone(mobile);
            userRepo.save(studentUser);
        }
        studentRepo.findBySchoolIdAndAdmissionNumber(profile.getSchool().getId(), profile.getAdmissionNumber())
                .ifPresent(student -> {
                    student.setMobile(mobile);
                    student.setEmail(newEmail);
                    studentRepo.save(student);
                });

        return toResponse(profileRepo.save(profile));
    }

    // ── Medical update ────────────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse updateMedical(Long tenantId, Long studentId,
                                                RegisterStudentRequest.MedicalInfoRequest medicalReq) {
        StudentProfile profile = getProfile(tenantId, studentId);
        buildMedical(profile, medicalReq, tenantId);
        profileRepo.save(profile);
        return toResponse(profileRepo.findById(studentId).orElseThrow());
    }

    // ── Transport update ──────────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse updateTransport(Long tenantId, Long studentId,
                                                  RegisterStudentRequest.TransportInfoRequest transportReq) {
        StudentProfile profile = getProfile(tenantId, studentId);

        // Update StudentTransportDetail
        buildTransport(profile, transportReq, tenantId);
        profileRepo.save(profile);

        // Sync transport route FK on the students table
        studentRepo.findBySchoolIdAndAdmissionNumber(profile.getSchool().getId(), profile.getAdmissionNumber())
                .ifPresent(student -> {
                    if (transportReq.getRouteId() != null) {
                        transportRouteRepo.findById(transportReq.getRouteId())
                                .ifPresent(student::setTransportRoute);
                    } else {
                        student.setTransportRoute(null);
                    }
                    studentRepo.save(student);
                });

        return toResponse(profileRepo.findById(studentId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<TransportStudentResponse> listTransportStudents(
            Long tenantId, Long classId, Long sectionId, Long routeId, String search) {
        String q = search == null ? "" : search.trim();
        var page = profileRepo.filter(tenantId, false, java.util.List.of(), classId, sectionId, q,
                org.springframework.data.domain.PageRequest.of(0, 2000));
        return page.getContent().stream()
                .map(p -> {
                    var ap = p.getAcademicProfile();
                    var td = p.getTransportDetail();
                    return TransportStudentResponse.builder()
                            .profileId(p.getId())
                            .fullName((p.getFirstName() + " " + (p.getLastName() == null ? "" : p.getLastName())).trim())
                            .admissionNumber(p.getAdmissionNumber())
                            .classId(ap != null ? ap.getClassId() : null)
                            .className(ap != null ? ap.getClassName() : null)
                            .sectionId(ap != null ? ap.getSectionId() : null)
                            .sectionName(ap != null ? ap.getSectionName() : null)
                            .transportRequired(td != null && td.isTransportRequired())
                            .routeId(td != null ? td.getRouteId() : null)
                            .routeName(td != null ? td.getRouteName() : null)
                            .stopName(td != null ? td.getStopName() : null)
                            .pickupPoint(td != null ? td.getPickupPoint() : null)
                            .transportType(td != null ? td.getTransportType() : null)
                            .build();
                })
                .filter(r -> routeId == null || routeId.equals(r.getRouteId()))
                .sorted(java.util.Comparator.comparing(TransportStudentResponse::getFullName,
                        java.util.Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    // ── Document management ───────────────────────────────────────────────────
    @Override
    @Transactional
    public StudentProfileResponse uploadDocument(Long tenantId, Long studentId,
                                                 DocumentType documentType, MultipartFile file) {
        StudentProfile profile = getProfile(tenantId, studentId);

        String fileUrl = "/uploads/" + tenantId + "/" + studentId + "/" + file.getOriginalFilename();
        documentRepo.save(StudentDocument.builder()
                .tenantId(tenantId)
                .studentProfile(profile)
                .documentType(documentType)
                .documentName(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .fileSizeKb(file.getSize() / 1024)
                .mimeType(file.getContentType())
                .status(DocumentStatus.PENDING)
                .build());

        return toResponse(getProfile(tenantId, studentId));
    }

    @Override
    @Transactional
    public StudentProfileResponse verifyDocument(Long tenantId, Long studentId,
                                                  Long documentId, VerifyDocumentRequest request) {
        StudentDocument doc = documentRepo.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        if (request.getStatus() == DocumentStatus.REJECTED
                && (request.getRejectionReason() == null || request.getRejectionReason().isBlank()))
            throw new BusinessException("Rejection reason is required when rejecting a document.");

        doc.setStatus(request.getStatus());
        doc.setVerifiedBy(currentUser());
        doc.setVerifiedAt(LocalDateTime.now());
        if (request.getStatus() == DocumentStatus.REJECTED)
            doc.setRejectionReason(request.getRejectionReason());
        documentRepo.save(doc);

        return toResponse(getProfile(tenantId, studentId));
    }

    @Override
    @Transactional
    public void delete(Long tenantId, Long id) {
        StudentProfile profile = getProfile(tenantId, id);
        profile.setDeleted(true);
        profileRepo.save(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<StudentHistoryResponse> getHistory(Long tenantId, Long studentId) {
        getProfile(tenantId, studentId); // security check — ensures student belongs to tenant
        return historyRepo.findByStudentProfileIdAndTenantIdOrderByCreatedAtDesc(studentId, tenantId)
                .stream()
                .map(h -> StudentHistoryResponse.builder()
                        .id(h.getId())
                        .fromStatus(h.getFromStatus() != null ? h.getFromStatus().name() : null)
                        .toStatus(h.getToStatus().name())
                        .action(h.getAction())
                        .remarks(h.getRemarks())
                        .changedBy(h.getChangedBy())
                        .effectiveDate(h.getEffectiveDate())
                        .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().toString() : null)
                        .build())
                .toList();
    }

    // ── Sync: StudentProfile → students table ─────────────────────────────────

    private void syncToStudentsTable(StudentProfile profile) {
        School school = profile.getSchool();

        Student student = studentRepo
                .findBySchoolIdAndAdmissionNumber(school.getId(), profile.getAdmissionNumber())
                .orElseGet(() -> Student.builder()
                        .school(school)
                        .admissionNumber(profile.getAdmissionNumber())
                        .build());

        student.setFirstName(profile.getFirstName());
        student.setLastName(profile.getLastName() != null ? profile.getLastName() : "");
        student.setGender(profile.getGender());
        student.setDateOfBirth(profile.getDateOfBirth());
        student.setBloodGroup(profile.getBloodGroup());
        student.setMobile(profile.getMobile());
        student.setEmail(profile.getEmail());
        student.setAdmissionDate(profile.getAdmissionDate());
        student.setJoiningDate(profile.getAdmissionDate());
        student.setStatus("ACTIVE");
        student.setActive(true);

        // Wire transport route FK if transport detail exists
        if (profile.getTransportDetail() != null && profile.getTransportDetail().getRouteId() != null) {
            transportRouteRepo.findById(profile.getTransportDetail().getRouteId())
                    .ifPresent(student::setTransportRoute);
        }

        student = studentRepo.save(student);

        // Link student → class/section so section counts, class filters and fee assignment work.
        syncClassMapping(profile, student, school);

        // Sync guardians → Parent + StudentParentMapping
        syncParentMappings(profile, student, school);
    }

    /** Create or update the ACTIVE class/section enrollment row for this student's academic year. */
    private void syncClassMapping(StudentProfile profile, Student student, School school) {
        StudentAcademicProfile ap = profile.getAcademicProfile();
        if (ap == null || ap.getClassId() == null || ap.getSectionId() == null) return;

        SchoolClass schoolClass = classRepo.findById(ap.getClassId()).orElse(null);
        Section section = sectionRepo.findById(ap.getSectionId()).orElse(null);
        if (schoolClass == null || section == null) return;

        String year = ap.getAcademicSession() != null ? ap.getAcademicSession() : school.getCurrentAcademicYear();

        StudentClassMapping mapping = classMappingRepo
                .findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        school.getId(), student.getId(), year, EnrollmentStatus.ACTIVE)
                .orElseGet(() -> StudentClassMapping.builder()
                        .school(school)
                        .student(student)
                        .academicYear(year)
                        .build());

        mapping.setSchoolClass(schoolClass);
        mapping.setSection(section);
        mapping.setRollNumber(ap.getRollNumber());
        mapping.setCurrent(true);
        mapping.setStatus(EnrollmentStatus.ACTIVE);
        classMappingRepo.save(mapping);
    }

    private void syncParentMappings(StudentProfile profile, Student student, School school) {
        profile.getGuardians().stream()
                .filter(g -> !g.isDeleted())
                .forEach(g -> {
                    // Find or create Parent record by mobile (unique identifier for parent)
                    Parent parent = null;
                    if (g.getMobile() != null) {
                        parent = parentRepo.findBySchoolIdAndMobileAndDeletedFalse(
                                school.getId(), g.getMobile()).orElse(null);
                    }

                    if (parent == null) {
                        parent = Parent.builder()
                                .school(school)
                                .firstName(g.getFirstName())
                                .lastName(g.getLastName())
                                .mobile(g.getMobile())
                                .email(g.getEmail())
                                .occupation(g.getOccupation())
                                .relation(g.getRelation().name())
                                .status("ACTIVE")
                                .build();
                        parent = parentRepo.save(parent);
                    }

                    // Link student ↔ parent if not already linked
                    if (!mappingRepo.existsBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(
                            school.getId(), student.getId(), parent.getId())) {
                        mappingRepo.save(StudentParentMapping.builder()
                                .school(school)
                                .student(student)
                                .parent(parent)
                                .relationshipType(g.getRelation().name())
                                .primaryContact(g.isPrimary())
                                .emergencyContact(g.isPrimary())
                                .canPickup(true)
                                .build());
                    }

                    // Set legacy FK on student for backward compat (first primary guardian)
                    if (g.isPrimary() && student.getParent() == null) {
                        student.setParent(parent);
                        studentRepo.save(student);
                    }
                });
    }

    private void updateStudentStatus(Long tenantId, StudentProfile profile,
                                     String status, boolean active) {
        studentRepo.findBySchoolIdAndAdmissionNumber(profile.getSchool().getId(),
                profile.getAdmissionNumber()).ifPresent(student -> {
            student.setStatus(status);
            student.setActive(active);
            studentRepo.save(student);
        });
    }

    // ── Private build helpers ─────────────────────────────────────────────────

    private void buildAcademicProfile(StudentProfile profile, RegisterStudentRequest req) {
        String className = req.getClassId() == null ? null
                : classRepo.findById(req.getClassId()).map(SchoolClass::getName).orElse(null);
        String sectionName = req.getSectionId() == null ? null
                : sectionRepo.findById(req.getSectionId()).map(Section::getName).orElse(null);
        StudentAcademicProfile ap = StudentAcademicProfile.builder()
                .tenantId(profile.getTenantId())
                .studentProfile(profile)
                .institutionType(req.getInstitutionType())
                .academicSession(req.getAcademicSession())
                .classId(req.getClassId()).className(className)
                .sectionId(req.getSectionId()).sectionName(sectionName)
                .rollNumber(req.getRollNumber())
                .program(req.getProgram()).course(req.getCourse()).department(req.getDepartment())
                .branch(req.getBranch()).semester(req.getSemester()).yearOfStudy(req.getYearOfStudy())
                .registrationNumber(req.getRegistrationNumber())
                .universityRollNumber(req.getUniversityRollNumber())
                .batchId(req.getBatchId()).batchName(req.getBatchName())
                .batchStartDate(req.getBatchStartDate()).batchEndDate(req.getBatchEndDate())
                .build();
        profile.setAcademicProfile(ap);
    }

    private void buildGuardians(StudentProfile profile,
                                List<RegisterStudentRequest.GuardianRequest> guardians,
                                School school, Long tenantId) {
        boolean hasPrimary = guardians.stream().anyMatch(RegisterStudentRequest.GuardianRequest::isPrimary);
        for (int i = 0; i < guardians.size(); i++) {
            var g = guardians.get(i);
            boolean isPrimary = !hasPrimary ? i == 0 : g.isPrimary();

            // Save in student_guardians for display/retrieval via admission module
            StudentGuardian guardian = StudentGuardian.builder()
                    .tenantId(tenantId)
                    .studentProfile(profile)
                    .relation(g.getRelation())
                    .firstName(g.getFirstName())
                    .lastName(g.getLastName())
                    .mobile(g.getMobile())
                    .email(g.getEmail())
                    .occupation(g.getOccupation())
                    .annualIncome(g.getAnnualIncome())
                    .qualification(g.getQualification())
                    .aadhaarNumber(g.getAadhaarNumber())
                    .primary(isPrimary)
                    .build();
            profile.getGuardians().add(guardian);

            // Also upsert into parents table so guardian can get portal access
            if (g.getMobile() != null) {
                boolean exists = parentRepo.findBySchoolIdAndMobileAndDeletedFalse(
                        school.getId(), g.getMobile()).isPresent();
                if (!exists) {
                    parentRepo.save(Parent.builder()
                            .school(school)
                            .firstName(g.getFirstName())
                            .lastName(g.getLastName())
                            .mobile(g.getMobile())
                            .email(g.getEmail())
                            .occupation(g.getOccupation())
                            .relation(g.getRelation().name())
                            .status("ACTIVE")
                            .build());
                }
            }
        }
    }

    private void buildAddresses(StudentProfile profile, RegisterStudentRequest req, Long tenantId) {
        addAddress(profile, req.getCurrentAddress(), "CURRENT", tenantId);
        if (req.isPermanentSameAsCurrent()) {
            addAddress(profile, req.getCurrentAddress(), "PERMANENT", tenantId);
        } else if (req.getPermanentAddress() != null) {
            addAddress(profile, req.getPermanentAddress(), "PERMANENT", tenantId);
        }
    }

    private void addAddress(StudentProfile profile, RegisterStudentRequest.AddressRequest addr,
                            String type, Long tenantId) {
        profile.getAddresses().add(StudentAddress.builder()
                .tenantId(tenantId).studentProfile(profile).addressType(type)
                .addressLine1(addr.getAddressLine1()).addressLine2(addr.getAddressLine2())
                .city(addr.getCity()).state(addr.getState())
                .country(addr.getCountry() != null ? addr.getCountry() : "India")
                .pincode(addr.getPincode())
                .build());
    }

    private void buildMedical(StudentProfile profile,
                               RegisterStudentRequest.MedicalInfoRequest m, Long tenantId) {
        // Reuse the existing detail (one per student) on update; create only when none exists.
        StudentMedicalDetail detail = profile.getMedicalDetail();
        if (detail == null) {
            detail = StudentMedicalDetail.builder()
                    .tenantId(tenantId).studentProfile(profile).build();
            profile.setMedicalDetail(detail);
        }
        detail.setBloodGroup(m.getBloodGroup());
        detail.setMedicalConditions(m.getMedicalConditions());
        detail.setAllergies(m.getAllergies());
        detail.setDisabilityType(m.getDisabilityType());
        detail.setDisabilityDetails(m.getDisabilityDetails());
        detail.setDisabilityPercentage(m.getDisabilityPercentage());
        detail.setEmergencyMedicalNotes(m.getEmergencyMedicalNotes());
        detail.setFamilyDoctorName(m.getFamilyDoctorName());
        detail.setFamilyDoctorMobile(m.getFamilyDoctorMobile());
    }

    private void buildTransport(StudentProfile profile,
                                RegisterStudentRequest.TransportInfoRequest t, Long tenantId) {
        // resolve actual TransportRoute entity from existing transport_routes table
        TransportRoute route = null;
        if (t.getRouteId() != null) {
            route = transportRouteRepo.findById(t.getRouteId()).orElse(null);
        }

        // Reuse the existing detail (one per student) on update; create only when none exists.
        StudentTransportDetail detail = profile.getTransportDetail();
        if (detail == null) {
            detail = StudentTransportDetail.builder()
                    .tenantId(tenantId).studentProfile(profile).build();
            profile.setTransportDetail(detail);
        }
        detail.setTransportRequired(t.isTransportRequired());
        detail.setRouteId(route != null ? route.getId() : null);
        detail.setRouteName(route != null ? route.getRouteName() : t.getRouteName());
        detail.setStopName(t.getStopName());
        detail.setPickupPoint(t.getPickupPoint());
        detail.setTransportType(t.getTransportType());
    }

    private void buildHostel(StudentProfile profile,
                              RegisterStudentRequest.HostelInfoRequest h, Long tenantId) {
        profile.setHostelDetail(StudentHostelDetail.builder()
                .tenantId(tenantId).studentProfile(profile)
                .hostelRequired(h.isHostelRequired()).hostelName(h.getHostelName())
                .roomNumber(h.getRoomNumber()).hostelType(h.getHostelType())
                .build());
    }

    // ── Transition helper ─────────────────────────────────────────────────────

    private StudentProfileResponse transition(Long tenantId, Long id,
                                               StudentLifecycleStatus to,
                                               List<StudentLifecycleStatus> allowedFrom,
                                               String action, String remarks,
                                               LocalDate effectiveDate) {
        StudentProfile profile = getProfile(tenantId, id);
        assertStatus(profile, allowedFrom);
        StudentLifecycleStatus from = profile.getLifecycleStatus();
        profile.setLifecycleStatus(to);
        profileRepo.save(profile);
        recordTransition(profile, from, to, action, remarks, tenantId); // fixed: was called twice
        return toResponse(profile);
    }

    private void assertStatus(StudentProfile p, List<StudentLifecycleStatus> allowed) {
        if (!allowed.contains(p.getLifecycleStatus()))
            throw new BusinessException("Invalid state transition from " + p.getLifecycleStatus()
                    + ". Allowed: " + allowed);
    }

    private void recordTransition(StudentProfile profile, StudentLifecycleStatus from,
                                   StudentLifecycleStatus to, String action,
                                   String remarks, Long tenantId) {
        historyRepo.save(StudentStatusHistory.builder()
                .tenantId(tenantId).studentProfile(profile)
                .fromStatus(from).toStatus(to).action(action).remarks(remarks)
                .effectiveDate(LocalDate.now()).changedBy(currentUser())
                .build());
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

    private StudentProfile getProfile(Long tenantId, Long id) {
        return profileRepo.findByIdAndTenantIdAndDeletedFalse(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", id));
    }

    /** Create the student's login account and email the temporary password. */
    private void createStudentLogin(StudentProfile profile, School school, RegisterStudentRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) return;

        String loginId = profile.getAdmissionNumber();
        if (userRepo.existsByUsername(loginId)) {
            throw new BusinessException("Login ID '" + loginId + "' is already in use. Use a different admission number.");
        }
        Role studentRole = roleRepo.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new BusinessException("STUDENT role not found"));

        String tempPassword = PasswordUtils.generateTempPassword();
        User studentUser = User.builder()
                .school(school)
                .username(loginId)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .active(true)
                .build();
        studentUser.getRoles().add(studentRole);
        studentUser = userRepo.save(studentUser);

        profile.setUser(studentUser);
        profileRepo.save(profile);

        emailService.sendTempPassword(req.getEmail(),
                req.getFirstName() + " " + req.getLastName(), loginId, tempPassword);
    }

    /** Admission number / student login ID: {schoolCode}-{admissionYear}-{seq}. */
    private String generateAdmissionNumber(School school, LocalDate admissionDate) {
        String code = school.getCode() != null ? school.getCode().replaceAll("\\s+", "") : "SCH";
        String year = String.valueOf((admissionDate != null ? admissionDate : LocalDate.now()).getYear());
        for (int i = 1; i <= 999_999; i++) {
            String candidate = String.format("%s-%s-%04d", code, year, i);
            if (!profileRepo.existsByTenantIdAndAdmissionNumber(school.getId(), candidate)
                    && !userRepo.existsByUsername(candidate)) {
                return candidate;
            }
        }
        return code + "-" + year + "-" + System.currentTimeMillis();
    }

    private String generateStudentCode(Long tenantId) {
        String year = String.valueOf(LocalDate.now().getYear());
        long count = profileRepo.countByTenantIdAndLifecycleStatusAndDeletedFalse(
                tenantId, StudentLifecycleStatus.APPLICANT) + seq.getAndIncrement();
        return String.format("STU-%s-%06d", year, count);
    }

    private String currentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    private StudentProfileResponse toResponse(StudentProfile p) {
        var ap = p.getAcademicProfile();
        StudentProfileResponse.AcademicSummary academic = null;
        if (ap != null) {
            academic = StudentProfileResponse.AcademicSummary.builder()
                    .institutionType(ap.getInstitutionType()).academicSession(ap.getAcademicSession())
                    .className(ap.getClassName()).sectionName(ap.getSectionName())
                    .rollNumber(ap.getRollNumber()).program(ap.getProgram()).course(ap.getCourse())
                    .department(ap.getDepartment()).branch(ap.getBranch()).semester(ap.getSemester())
                    .yearOfStudy(ap.getYearOfStudy()).batchName(ap.getBatchName())
                    .batchStartDate(ap.getBatchStartDate()).batchEndDate(ap.getBatchEndDate())
                    .build();
        }

        var guardians = p.getGuardians().stream()
                .filter(g -> !g.isDeleted())
                .map(g -> StudentProfileResponse.GuardianSummary.builder()
                        .id(g.getId()).relation(g.getRelation())
                        .fullName(g.getFirstName() + (g.getLastName() != null ? " " + g.getLastName() : ""))
                        .mobile(g.getMobile()).email(g.getEmail())
                        .occupation(g.getOccupation()).primary(g.isPrimary())
                        .build())
                .toList();

        var docs = p.getDocuments().stream()
                .filter(d -> !d.isDeleted())
                .map(d -> StudentProfileResponse.DocumentSummary.builder()
                        .id(d.getId()).documentType(d.getDocumentType()).status(d.getStatus())
                        .fileUrl(d.getFileUrl()).mandatory(d.isMandatory()).verifiedAt(d.getVerifiedAt())
                        .build())
                .toList();

        long pending  = docs.stream().filter(d -> d.getStatus() == DocumentStatus.PENDING).count();
        long verified = docs.stream().filter(d -> d.getStatus() == DocumentStatus.VERIFIED).count();

        var md = p.getMedicalDetail();
        StudentProfileResponse.MedicalSummary medical = md == null ? null
                : StudentProfileResponse.MedicalSummary.builder()
                        .bloodGroup(md.getBloodGroup()).medicalConditions(md.getMedicalConditions())
                        .allergies(md.getAllergies()).disabilityType(md.getDisabilityType())
                        .disabilityDetails(md.getDisabilityDetails()).disabilityPercentage(md.getDisabilityPercentage())
                        .emergencyMedicalNotes(md.getEmergencyMedicalNotes())
                        .familyDoctorName(md.getFamilyDoctorName()).familyDoctorMobile(md.getFamilyDoctorMobile())
                        .build();

        var td = p.getTransportDetail();
        StudentProfileResponse.TransportSummary transport = td == null ? null
                : StudentProfileResponse.TransportSummary.builder()
                        .transportRequired(td.isTransportRequired()).routeId(td.getRouteId())
                        .routeName(td.getRouteName()).stopName(td.getStopName())
                        .pickupPoint(td.getPickupPoint()).transportType(td.getTransportType())
                        .build();

        return StudentProfileResponse.builder()
                .id(p.getId()).studentCode(p.getStudentCode())
                .admissionNumber(p.getAdmissionNumber()).enrollmentNumber(p.getEnrollmentNumber())
                .firstName(p.getFirstName()).middleName(p.getMiddleName()).lastName(p.getLastName())
                .fullName(p.getFullName()).gender(p.getGender()).dateOfBirth(p.getDateOfBirth())
                .bloodGroup(p.getBloodGroup()).category(p.getCategory()).nationality(p.getNationality())
                .mobile(p.getMobile()).email(p.getEmail()).profilePhotoUrl(p.getProfilePhotoUrl())
                .lifecycleStatus(p.getLifecycleStatus()).admissionDate(p.getAdmissionDate())
                .admissionType(p.getAdmissionType()).campusId(p.getCampusId()).academic(academic).guardians(guardians)
                .medical(medical).transport(transport)
                .documents(docs).pendingDocuments(pending).verifiedDocuments(verified)
                .build();
    }
}
