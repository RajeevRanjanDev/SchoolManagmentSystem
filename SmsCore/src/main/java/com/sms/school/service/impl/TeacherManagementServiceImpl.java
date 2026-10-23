package com.sms.school.service.impl;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.RoleName;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.EmailService;
import com.sms.school.service.TeacherManagementService;
import com.sms.school.util.PasswordUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherManagementServiceImpl implements TeacherManagementService {

    private final TeacherRepository         teacherRepository;
    private final SubjectRepository         subjectRepository;
    private final TeacherAssignmentRepository assignmentRepository;
    private final UserRepository            userRepository;
    private final RoleRepository            roleRepository;
    private final SchoolRepository          schoolRepository;
    private final SchoolClassRepository     classRepository;
    private final SectionRepository         sectionRepository;
    private final PasswordEncoder           passwordEncoder;
    private final EmailService              emailService;

    // ── Private helpers ───────────────────────────────────────────────────────

    private School requireSchool(Long schoolId) {
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
    }

    private Teacher requireTeacher(Long schoolId, Long teacherId) {
        return teacherRepository.findById(teacherId)
                .filter(t -> t.getSchool().getId().equals(schoolId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
    }

    private Subject requireSubject(Long schoolId, Long subjectId) {
        return subjectRepository.findById(subjectId)
                .filter(s -> s.getSchool().getId().equals(schoolId) && !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Subject", subjectId));
    }

    /** Generates the next unique employee code for a school, e.g. EMP-001, EMP-002… */
    private String generateEmployeeCode(Long schoolId) {
        long base = teacherRepository.countBySchoolIdAndDeletedFalse(schoolId);
        for (int i = 1; i <= 10_000; i++) {
            String code = String.format("EMP-%03d", base + i);
            if (!teacherRepository.existsBySchoolIdAndEmployeeCodeAndDeletedFalse(schoolId, code)) {
                return code;
            }
        }
        return "EMP-" + System.currentTimeMillis();
    }

    private TeacherResponse toTeacherResponse(Teacher t, List<TeacherAssignmentResponse> assignments) {
        User user = t.getUser();
        String roleName = "TEACHER";
        if (user != null && user.getRoles() != null) {
            roleName = user.getRoles().stream()
                    .findFirst()
                    .map(r -> r.getName().name())
                    .orElse("TEACHER");
        }
        return TeacherResponse.builder()
                .id(t.getId())
                .schoolId(t.getSchool().getId())
                .userId(user != null ? user.getId() : null)
                .email(user != null ? user.getEmail() : t.getEmail())
                .role(roleName)
                .employeeCode(t.getEmployeeCode())
                .loginId(user != null ? user.getUsername() : null)
                .firstName(user != null ? user.getFirstName() : null)
                .lastName(user != null ? user.getLastName() : null)
                .fullName(user != null ? user.getFirstName() + " " + user.getLastName() : null)
                .mobile(t.getMobile())
                .qualification(t.getQualification())
                .specialization(t.getSpecialization())
                .joiningDate(t.getJoiningDate())
                .experienceYears(t.getExperienceYears())
                .photoUrl(t.getPhotoUrl())
                .status(t.getStatus())
                .hasLogin(user != null)
                .isClassTeacher(t.isClassTeacher())
                .assignments(assignments)
                .createdAt(t.getCreatedAt())
                .build();
    }

    private TeacherAssignmentResponse toAssignmentResponse(TeacherAssignment ta) {
        Teacher t = ta.getTeacher();
        User u = t.getUser();
        return TeacherAssignmentResponse.builder()
                .id(ta.getId())
                .schoolId(ta.getSchool().getId())
                .teacherId(t.getId())
                .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                .classId(ta.getSchoolClass().getId())
                .className(ta.getSchoolClass().getName())
                .sectionId(ta.getSection().getId())
                .sectionName(ta.getSection().getName())
                .subjectId(ta.getSubject().getId())
                .subjectName(ta.getSubject().getSubjectName())
                .subjectCode(ta.getSubject().getSubjectCode())
                .academicYear(ta.getAcademicYear())
                .classTeacher(ta.isClassTeacher())
                .status(ta.getStatus())
                .build();
    }

    // ── Teachers ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TeacherResponse createTeacher(Long schoolId, CreateTeacherRequest req) {
        School school = requireSchool(schoolId);

        // Enforce the subscription plan's staff (teacher) limit.
        if (school.getSubscriptionPlan() != null) {
            int max = school.getSubscriptionPlan().getMaxTeachers();
            if (max > 0 && teacherRepository.countBySchoolIdAndDeletedFalse(schoolId) >= max) {
                throw new BusinessException("Staff limit (" + max
                        + ") for the current subscription plan has been reached. Upgrade the plan to add more staff.");
            }
        }

        // Employee code: use the provided one, or auto-generate a unique EMP-### code.
        String employeeCode = (req.getEmployeeCode() != null && !req.getEmployeeCode().isBlank())
                ? req.getEmployeeCode().trim()
                : generateEmployeeCode(schoolId);

        // Guard duplicate employee code
        if (teacherRepository.existsBySchoolIdAndEmployeeCodeAndDeletedFalse(schoolId, employeeCode)) {
            throw new BusinessException("Employee code already exists: " + employeeCode);
        }

        User user = null;
        String tempPassword = null;
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            // Create login account with TEACHER role
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new BusinessException("Email already registered: " + req.getEmail());
            }
            RoleName roleName = req.getRole() != null ? req.getRole() : RoleName.TEACHER;
            Role employeeRole = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new BusinessException(roleName + " role not found"));
            // Use the provided password, else generate a temp one to email.
            boolean generated = req.getPassword() == null || req.getPassword().isBlank();
            String rawPassword = generated ? PasswordUtils.generateTempPassword() : req.getPassword();
            if (generated) tempPassword = rawPassword;
            user = User.builder()
                    .school(school)
                    .username(generateEmployeeLoginId(school, roleName))
                    .firstName(req.getFirstName())
                    .lastName(req.getLastName())
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(rawPassword))
                    .active(true)
                    .build();
            user.getRoles().add(employeeRole);
            user = userRepository.save(user);
        }

        Teacher teacher = Teacher.builder()
                .school(school)
                .user(user)
                .employeeCode(employeeCode)
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joiningDate(req.getJoiningDate())
                .experienceYears(req.getExperienceYears())
                .photoUrl(req.getPhotoUrl())
                .mobile(req.getMobile())
                .email(req.getEmail())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .build();

        teacher = teacherRepository.save(teacher);

        // Email the generated temp password so the employee can log in (with their login ID).
        if (tempPassword != null && user != null) {
            emailService.sendTempPassword(user.getEmail(),
                    req.getFirstName() + " " + req.getLastName(), user.getUsername(), tempPassword);
        }
        return toTeacherResponse(teacher, null);
    }

    /** Generate a unique employee login ID: {schoolCode}-{TE|SS}-{year}-{seq}. */
    private String generateEmployeeLoginId(School school, RoleName role) {
        String year = academicYearStart(school);
        String code = school.getCode() != null ? school.getCode().replaceAll("\\s+", "") : "SCH";
        String tag = role == RoleName.SUPPORT_STAFF ? "SS" : "TE";
        for (int i = 1; i <= 9999; i++) {
            String candidate = String.format("%s-%s-%s-%03d", code, tag, year, i);
            if (!userRepository.existsByUsername(candidate)) return candidate;
        }
        return code + "-" + tag + "-" + year + "-" + System.currentTimeMillis();
    }

    /** First 4 digits of the school's current academic year, else the current calendar year. */
    private String academicYearStart(School school) {
        String ay = school.getCurrentAcademicYear();
        if (ay != null && ay.length() >= 4 && ay.substring(0, 4).chars().allMatch(Character::isDigit)) {
            return ay.substring(0, 4);
        }
        return String.valueOf(java.time.LocalDate.now().getYear());
    }

    @Override
    @Transactional
    public String resetTeacherPassword(Long schoolId, Long teacherId) {
        Teacher teacher = requireTeacher(schoolId, teacherId);
        User user = teacher.getUser();
        if (user == null) {
            throw new BusinessException("This employee has no login account to reset.");
        }
        String tempPassword = PasswordUtils.generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        String fullName = user.getFirstName() + " " + user.getLastName();
        String loginId = user.getUsername() != null ? user.getUsername() : user.getEmail();
        emailService.sendTempPassword(user.getEmail(), fullName, loginId, tempPassword);
        return user.getEmail();
    }

    @Override
    @Transactional
    public TeacherResponse updateTeacher(Long schoolId, Long teacherId, CreateTeacherRequest req) {
        Teacher teacher = requireTeacher(schoolId, teacherId);

        teacher.setQualification(req.getQualification());
        teacher.setSpecialization(req.getSpecialization());
        teacher.setJoiningDate(req.getJoiningDate());
        teacher.setExperienceYears(req.getExperienceYears());
        teacher.setPhotoUrl(req.getPhotoUrl());
        teacher.setMobile(req.getMobile());
        if (req.getStatus() != null) teacher.setStatus(req.getStatus());

        // Update employee code if changed
        if (req.getEmployeeCode() != null
                && !req.getEmployeeCode().equals(teacher.getEmployeeCode())
                && teacherRepository.existsBySchoolIdAndEmployeeCodeAndDeletedFalse(schoolId, req.getEmployeeCode())) {
            throw new BusinessException("Employee code already taken: " + req.getEmployeeCode());
        }
        teacher.setEmployeeCode(req.getEmployeeCode());

        // Propagate name update to user account
        if (teacher.getUser() != null) {
            User u = teacher.getUser();
            if (req.getFirstName() != null) u.setFirstName(req.getFirstName());
            if (req.getLastName()  != null) u.setLastName(req.getLastName());
            userRepository.save(u);
        }

        return toTeacherResponse(teacherRepository.save(teacher), null);
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getTeacher(Long schoolId, Long teacherId) {
        Teacher teacher = requireTeacher(schoolId, teacherId);
        return toTeacherResponse(teacher, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getAllTeachers(Long schoolId) {
        // Batch-fetch all assignments to avoid N+1
        Map<Long, List<TeacherAssignmentResponse>> assignmentsByTeacher =
                assignmentRepository.findAllBySchoolWithDetails(schoolId)
                        .stream()
                        .collect(Collectors.groupingBy(
                                ta -> ta.getTeacher().getId(),
                                Collectors.mapping(this::toAssignmentResponse, Collectors.toList())
                        ));

        return teacherRepository.findBySchoolIdAndDeletedFalse(schoolId)
                .stream()
                .map(t -> toTeacherResponse(t, assignmentsByTeacher.getOrDefault(t.getId(), java.util.Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTeacher(Long schoolId, Long teacherId) {
        Teacher teacher = requireTeacher(schoolId, teacherId);
        teacher.setDeleted(true);
        teacherRepository.save(teacher);
    }

    @Override
    @Transactional
    public TeacherResponse updateTeacherStatus(Long schoolId, Long teacherId, String status) {
        Teacher teacher = requireTeacher(schoolId, teacherId);
        teacher.setStatus(status);
        return toTeacherResponse(teacherRepository.save(teacher), null);
    }

    // ── Subjects ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SubjectResponse createSubject(Long schoolId, CreateSubjectRequest req) {
        School school = requireSchool(schoolId);
        if (subjectRepository.existsBySchoolIdAndSubjectNameAndDeletedFalse(schoolId, req.getSubjectName())) {
            throw new BusinessException("Subject already exists: " + req.getSubjectName());
        }
        Subject subject = Subject.builder()
                .school(school)
                .subjectCode(req.getSubjectCode())
                .subjectName(req.getSubjectName())
                .description(req.getDescription())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .build();
        subject = subjectRepository.save(subject);
        return toSubjectResponse(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects(Long schoolId) {
        return subjectRepository.findBySchoolIdAndDeletedFalse(schoolId)
                .stream().map(this::toSubjectResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubjectResponse updateSubject(Long schoolId, Long subjectId, CreateSubjectRequest req) {
        Subject subject = requireSubject(schoolId, subjectId);
        subject.setSubjectCode(req.getSubjectCode());
        subject.setSubjectName(req.getSubjectName());
        subject.setDescription(req.getDescription());
        if (req.getStatus() != null) subject.setStatus(req.getStatus());
        return toSubjectResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public void deleteSubject(Long schoolId, Long subjectId) {
        Subject subject = requireSubject(schoolId, subjectId);
        subject.setDeleted(true);
        subjectRepository.save(subject);
    }

    private SubjectResponse toSubjectResponse(Subject s) {
        return SubjectResponse.builder()
                .id(s.getId())
                .schoolId(s.getSchool().getId())
                .subjectCode(s.getSubjectCode())
                .subjectName(s.getSubjectName())
                .description(s.getDescription())
                .status(s.getStatus())
                .build();
    }

    // ── Teacher Assignments ───────────────────────────────────────────────────

    @Override
    @Transactional
    public TeacherAssignmentResponse assignTeacher(Long schoolId, Long teacherId, AssignTeacherRequest req) {
        Teacher teacher = requireTeacher(schoolId, teacherId);
        Subject subject = requireSubject(schoolId, req.getSubjectId());

        SchoolClass cls = classRepository.findById(req.getClassId())
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Class", req.getClassId()));

        Section section = sectionRepository.findById(req.getSectionId())
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));

        // Guard: only one teacher per subject per section per year
        if (assignmentRepository.existsBySchoolIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
                schoolId, req.getSectionId(), req.getSubjectId(), req.getAcademicYear())) {
            throw new BusinessException(
                    "Another teacher is already assigned to " + subject.getSubjectName()
                    + " in this section for " + req.getAcademicYear());
        }

        // Guard: only one class teacher per section per year
        if (req.isClassTeacher()) {
            assignmentRepository.findBySchoolIdAndSectionIdAndAcademicYearAndClassTeacherTrueAndDeletedFalse(
                    schoolId, req.getSectionId(), req.getAcademicYear())
                    .ifPresent(existing -> {
                        throw new BusinessException(
                                "Section already has a class teacher for " + req.getAcademicYear());
                    });
        }

        TeacherAssignment ta = TeacherAssignment.builder()
                .school(teacher.getSchool())
                .teacher(teacher)
                .schoolClass(cls)
                .section(section)
                .subject(subject)
                .academicYear(req.getAcademicYear())
                .classTeacher(req.isClassTeacher())
                .status("ACTIVE")
                .build();

        ta = assignmentRepository.save(ta);

        // Sync legacy flag on teacher
        if (req.isClassTeacher()) {
            teacher.setClassTeacher(true);
            teacherRepository.save(teacher);
        }

        return toAssignmentResponse(ta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponse> getTeacherAssignments(Long schoolId, Long teacherId, String academicYear) {
        // When no year is specified, return all assignments; otherwise filter by year
        if (academicYear != null && !academicYear.isBlank()) {
            return assignmentRepository.findByTeacherWithDetails(schoolId, teacherId, academicYear)
                    .stream().map(this::toAssignmentResponse).collect(Collectors.toList());
        }
        return assignmentRepository.findBySchoolIdAndTeacherIdAndDeletedFalse(schoolId, teacherId)
                .stream().map(this::toAssignmentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponse> getSectionAssignments(Long schoolId, Long sectionId, String academicYear) {
        return assignmentRepository.findBySectionWithDetails(schoolId, sectionId, academicYear)
                .stream().map(this::toAssignmentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeAssignment(Long schoolId, Long assignmentId) {
        TeacherAssignment ta = assignmentRepository.findById(assignmentId)
                .filter(a -> a.getSchool().getId().equals(schoolId) && !a.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        ta.setDeleted(true);
        ta.setStatus("REMOVED");
        assignmentRepository.save(ta);
    }

    @Override
    @Transactional
    public void setClassTeacher(Long schoolId, Long assignmentId, boolean isClassTeacher) {
        TeacherAssignment ta = assignmentRepository.findById(assignmentId)
                .filter(a -> a.getSchool().getId().equals(schoolId) && !a.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));

        if (isClassTeacher) {
            // Ensure no other class teacher for same section+year
            assignmentRepository.findBySchoolIdAndSectionIdAndAcademicYearAndClassTeacherTrueAndDeletedFalse(
                    schoolId, ta.getSection().getId(), ta.getAcademicYear())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(assignmentId)) {
                            throw new BusinessException("Section already has a class teacher.");
                        }
                    });
        }

        ta.setClassTeacher(isClassTeacher);
        assignmentRepository.save(ta);
    }
}
