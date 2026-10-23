package com.sms.school.service.impl;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.entity.*;
import com.sms.school.entity.admission.StudentAddress;
import com.sms.school.entity.admission.StudentGuardian;
import com.sms.school.entity.admission.StudentProfile;
import com.sms.school.entity.enums.AttendanceStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.repository.admission.StudentProfileRepository;
import com.sms.school.service.TeacherDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.IsoFields;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Teacher-facing service.
 * All write operations validate that the teacher owns the target class/section/subject
 * assignment before creating any work — teachers cannot post to random classes.
 */
@Service
@RequiredArgsConstructor
public class TeacherDashboardServiceImpl implements TeacherDashboardService {

    private final TeacherRepository              teacherRepository;
    private final TeacherAssignmentRepository    assignmentRepository;
    private final StudentClassMappingRepository  classMappingRepository;
    private final HomeworkRepository             homeworkRepository;
    private final ClassworkRepository            classworkRepository;
    private final AttendanceRepository           attendanceRepository;
    private final ResultRepository               resultRepository;
    private final ExamRepository                 examRepository;
    private final ClassAnnouncementRepository    announcementRepository;
    private final StudentRepository              studentRepository;
    private final StudentProfileRepository       profileRepository;
    private final SectionRepository              sectionRepository;
    private final SubjectRepository              subjectRepository;
    private final SchoolRepository               schoolRepository;
    private final SchoolClassRepository          classRepository;

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolve teacher profile from JWT userId.
     * Every public method calls this — it also enforces multi-tenant isolation.
     */
    private Teacher requireTeacher(Long schoolId, Long userId) {
        return teacherRepository.findActiveBySchoolAndUser(schoolId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher profile not found for this user. Contact school admin."));
    }

    /**
     * Validates that the teacher has an ACTIVE assignment for the given section + subject.
     * Throws BusinessException if not — prevents rogue posting.
     */
    private TeacherAssignment requireAssignment(Long schoolId, Long teacherId,
                                                Long sectionId, Long subjectId, String academicYear) {
        return assignmentRepository
                .findBySchoolIdAndTeacherIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
                        schoolId, teacherId, sectionId, subjectId, academicYear)
                .orElseThrow(() -> new BusinessException(
                        "You are not assigned to teach this subject in this section for " + academicYear));
    }

    private TeacherAssignmentResponse toAssignmentResponse(TeacherAssignment ta) {
        Teacher t  = ta.getTeacher();
        User    u  = t.getUser();
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

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public TeacherDashboardResponse getMyDashboard(Long schoolId, Long userId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        User u = teacher.getUser();
        // Display the school's current year when the caller didn't specify one.
        String displayYear = (academicYear != null && !academicYear.isBlank())
                ? academicYear
                : (teacher.getSchool() != null ? teacher.getSchool().getCurrentAcademicYear() : null);

        List<TeacherAssignment> assignments =
                assignmentRepository.findByTeacherWithDetails(schoolId, teacher.getId(), academicYear);

        List<TeacherAssignmentResponse> assignmentResponses =
                assignments.stream().map(this::toAssignmentResponse).collect(Collectors.toList());

        List<TeacherDashboardResponse.ClassTeacherSection> ctSections = assignments.stream()
                .filter(TeacherAssignment::isClassTeacher)
                .map(ta -> TeacherDashboardResponse.ClassTeacherSection.builder()
                        .sectionId(ta.getSection().getId())
                        .sectionName(ta.getSection().getName())
                        .classId(ta.getSchoolClass().getId())
                        .className(ta.getSchoolClass().getName())
                        .build())
                .distinct()
                .collect(Collectors.toList());

        long distinctSections = assignments.stream()
                .map(ta -> ta.getSection().getId()).distinct().count();
        long distinctSubjects = assignments.stream()
                .map(ta -> ta.getSubject().getId()).distinct().count();

        // Count homework/classwork posted this week
        LocalDate now = LocalDate.now();
        int currentWeek = now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int currentYear = now.getYear();

        List<Homework> myHw = homeworkRepository.findBySchoolIdAndSectionIdAndDeletedFalse(
                schoolId, assignments.stream().findFirst().map(ta -> ta.getSection().getId()).orElse(0L));
        int hwThisWeek = (int) myHw.stream()
                .filter(h -> h.getAssignedDate() != null
                        && h.getAssignedDate().get(IsoFields.WEEK_OF_WEEK_BASED_YEAR) == currentWeek
                        && h.getAssignedDate().getYear() == currentYear)
                .count();

        return TeacherDashboardResponse.builder()
                .teacherId(teacher.getId())
                .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                .employeeCode(teacher.getEmployeeCode())
                .photoUrl(teacher.getPhotoUrl())
                .academicYear(displayYear)
                .assignments(assignmentResponses)
                .classTeacherSections(ctSections)
                .totalSections((int) distinctSections)
                .totalSubjects((int) distinctSubjects)
                .homeworkPostedThisWeek(hwThisWeek)
                .classworkPostedThisWeek(0) // fill similarly if needed
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherDashboardResponse.ClassTeacherSection> getMyClassSections(
            Long schoolId, Long userId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return assignmentRepository.findByTeacherWithDetails(schoolId, teacher.getId(), academicYear)
                .stream()
                .filter(TeacherAssignment::isClassTeacher)
                .map(ta -> ta.getSection())
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toMap(Section::getId, s -> s, (a, b) -> a, java.util.LinkedHashMap::new))
                .values().stream()
                .map(sec -> TeacherDashboardResponse.ClassTeacherSection.builder()
                        .sectionId(sec.getId())
                        .sectionName(sec.getName())
                        .classId(sec.getSchoolClass() != null ? sec.getSchoolClass().getId() : null)
                        .className(sec.getSchoolClass() != null ? sec.getSchoolClass().getName() : null)
                        .studentCount(classMappingRepository.findActiveBySection(sec.getId()).size())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherStudentCardResponse getStudentCard(Long schoolId, Long studentId) {
        Student st = studentRepository.findById(studentId)
                .filter(s -> s.getSchool() != null && s.getSchool().getId().equals(schoolId) && !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        StudentProfile p = profileRepository
                .findByTenantIdAndAdmissionNumberAndDeletedFalse(schoolId, st.getAdmissionNumber())
                .orElse(null);

        var builder = TeacherStudentCardResponse.builder()
                .studentId(st.getId())
                .admissionNumber(st.getAdmissionNumber())
                .firstName(st.getFirstName())
                .lastName(st.getLastName());

        if (p != null) {
            builder.firstName(p.getFirstName()).lastName(p.getLastName())
                    .dateOfBirth(p.getDateOfBirth())
                    .gender(p.getGender() != null ? p.getGender().name() : null)
                    .bloodGroup(p.getBloodGroup())
                    .category(p.getCategory())
                    .nationality(p.getNationality())
                    .religion(p.getReligion())
                    .mobile(p.getMobile())
                    .email(p.getEmail());

            if (p.getAcademicProfile() != null) {
                builder.className(p.getAcademicProfile().getClassName())
                        .sectionName(p.getAcademicProfile().getSectionName())
                        .rollNumber(p.getAcademicProfile().getRollNumber());
            }
            if (p.getAddresses() != null) {
                builder.currentAddress(formatAddress(findAddress(p, "CURRENT")));
                builder.permanentAddress(formatAddress(findAddress(p, "PERMANENT")));
            }
            if (p.getGuardians() != null) {
                builder.guardians(p.getGuardians().stream()
                        .filter(g -> !g.isDeleted())
                        .map(g -> TeacherStudentCardResponse.Guardian.builder()
                                .relation(g.getRelation() != null ? g.getRelation().name() : null)
                                .name(((g.getFirstName() == null ? "" : g.getFirstName()) + " "
                                        + (g.getLastName() == null ? "" : g.getLastName())).trim())
                                .mobile(g.getMobile())
                                .email(g.getEmail())
                                .build())
                        .collect(Collectors.toList()));
            }
        }
        return builder.build();
    }

    private StudentAddress findAddress(StudentProfile p, String type) {
        return p.getAddresses().stream()
                .filter(a -> !a.isDeleted() && type.equalsIgnoreCase(a.getAddressType()))
                .findFirst().orElse(null);
    }

    private String formatAddress(StudentAddress a) {
        if (a == null) return null;
        return java.util.stream.Stream.of(a.getAddressLine1(), a.getAddressLine2(), a.getCity(),
                        a.getState(), a.getPincode())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(", "));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponse> getMyAssignments(Long schoolId, Long userId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return assignmentRepository.findByTeacherWithDetails(schoolId, teacher.getId(), academicYear)
                .stream().map(this::toAssignmentResponse).collect(Collectors.toList());
    }

    // ── Homework ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public HomeworkWithSubmissionResponse createHomework(Long schoolId, Long userId,
                                                         CreateHomeworkRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);

        // Validate teacher is assigned to this section + subject
        TeacherAssignment ta = requireAssignment(
                schoolId, teacher.getId(), req.getSectionId(), req.getSubjectId(), req.getAcademicYear());

        Section section = ta.getSection();
        Subject subject = ta.getSubject();

        Homework hw = Homework.builder()
                .school(teacher.getSchool())
                .section(section)
                .teacher(teacher)
                .subject(req.getSubject())     // legacy String field
                .title(req.getTitle())
                .description(req.getDescription())
                .assignedDate(req.getAssignedDate() != null ? req.getAssignedDate() : LocalDate.now())
                .dueDate(req.getDueDate())
                .attachmentUrl(req.getAttachmentUrl())
                .build();

        hw = homeworkRepository.save(hw);

        return HomeworkWithSubmissionResponse.builder()
                .id(hw.getId())
                .title(hw.getTitle())
                .description(hw.getDescription())
                .subject(hw.getSubject())
                .assignedDate(hw.getAssignedDate())
                .dueDate(hw.getDueDate())
                .attachmentUrl(hw.getAttachmentUrl())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeworkWithSubmissionResponse> getMyHomework(Long schoolId, Long userId,
                                                               Long sectionId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return homeworkRepository.findBySchoolIdAndSectionIdAndDeletedFalse(schoolId, sectionId)
                .stream()
                .filter(h -> h.getTeacher().getId().equals(teacher.getId()))
                .map(h -> HomeworkWithSubmissionResponse.builder()
                        .id(h.getId())
                        .title(h.getTitle())
                        .subject(h.getSubject())
                        .assignedDate(h.getAssignedDate())
                        .dueDate(h.getDueDate())
                        .attachmentUrl(h.getAttachmentUrl())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Classwork ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ClassworkResponse createClasswork(Long schoolId, Long userId, CreateClassworkRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);

        // Validate teacher assignment for this section + subject
        TeacherAssignment ta = requireAssignment(
                schoolId, teacher.getId(), req.getSectionId(), req.getSubjectId(), req.getAcademicYear());

        Classwork cw = Classwork.builder()
                .school(teacher.getSchool())
                .teacher(teacher)
                .section(ta.getSection())
                .schoolClass(ta.getSchoolClass())
                .subject(ta.getSubject())
                .assignment(ta)
                .academicYear(req.getAcademicYear())
                .topic(req.getTopic())
                .title(req.getTopic())  // keep legacy title in sync
                .description(req.getDescription())
                .notes(req.getNotes())
                .classworkDate(req.getClassDate())
                .attachmentUrl(req.getAttachmentUrl())
                .build();

        cw = classworkRepository.save(cw);
        return toClassworkResponse(cw);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassworkResponse> getMyClasswork(Long schoolId, Long userId,
                                                    Long sectionId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return classworkRepository.findBySchoolIdAndSectionIdAndDeletedFalse(schoolId, sectionId)
                .stream()
                .filter(cw -> cw.getTeacher().getId().equals(teacher.getId()))
                .map(this::toClassworkResponse)
                .collect(Collectors.toList());
    }

    private ClassworkResponse toClassworkResponse(Classwork cw) {
        Subject sub = cw.getSubject();
        Section sec = cw.getSection();
        SchoolClass cls = cw.getSchoolClass();
        User u = cw.getTeacher().getUser();
        return ClassworkResponse.builder()
                .id(cw.getId())
                .schoolId(cw.getSchool().getId())
                .teacherId(cw.getTeacher().getId())
                .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                .classId(cls != null ? cls.getId() : null)
                .className(cls != null ? cls.getName() : null)
                .sectionId(sec.getId())
                .sectionName(sec.getName())
                .subjectId(sub != null ? sub.getId() : null)
                .subjectName(sub != null ? sub.getSubjectName() : cw.getSubjectText())
                .academicYear(cw.getAcademicYear())
                .topic(cw.getTopic() != null ? cw.getTopic() : cw.getTitle())
                .description(cw.getDescription())
                .classDate(cw.getClassworkDate())
                .notes(cw.getNotes())
                .attachmentUrl(cw.getAttachmentUrl())
                .createdAt(cw.getCreatedAt())
                .build();
    }

    // ── Attendance ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void markAttendance(Long schoolId, Long userId, BulkAttendanceRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);
        Section section = sectionRepository.findById(req.getSectionId())
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));

        // Teacher must be assigned to this section (any subject)
        List<TeacherAssignment> assignments = assignmentRepository
                .findBySchoolIdAndTeacherIdAndDeletedFalse(schoolId, teacher.getId());
        boolean authorised = assignments.stream()
                .anyMatch(ta -> ta.getSection().getId().equals(req.getSectionId()));
        if (!authorised) {
            throw new BusinessException("You are not assigned to this section.");
        }

        School school = teacher.getSchool();

        for (BulkAttendanceRequest.StudentAttendanceEntry entry : req.getEntries()) {
            // Upsert: one record per student per date
            Attendance att = attendanceRepository
                    .findByStudentIdAndAttendanceDate(entry.getStudentId(), req.getAttendanceDate())
                    .orElseGet(() -> {
                        Student student = new Student();
                        student.setId(entry.getStudentId());
                        Attendance a = new Attendance();
                        a.setSchool(school);
                        a.setStudent(student);
                        a.setSection(section);
                        return a;
                    });

            att.setAttendanceDate(req.getAttendanceDate());
            att.setStatus(AttendanceStatus.valueOf(entry.getStatus()));
            att.setRemarks(entry.getRemarks());
            att.setMarkedByTeacher(teacher);
            attendanceRepository.save(att);
        }
    }

    // ── Marks ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void enterMarks(Long schoolId, Long userId, BulkMarksRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);

        Exam exam = examRepository.findById(req.getExamId())
                .filter(e -> e.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Exam", req.getExamId()));

        // Teacher must be assigned to the section for which the exam was created
        boolean authorised = assignmentRepository
                .findBySchoolIdAndTeacherIdAndDeletedFalse(schoolId, teacher.getId())
                .stream()
                .anyMatch(ta -> ta.getSection().getId().equals(exam.getSection().getId()));
        if (!authorised) {
            throw new BusinessException("You are not assigned to the section for this exam.");
        }

        School school = teacher.getSchool();

        for (BulkMarksRequest.StudentMarksEntry entry : req.getEntries()) {
            Result result = resultRepository
                    .findByExamIdAndDeletedFalse(exam.getId())
                    .stream()
                    .filter(r -> r.getStudent().getId().equals(entry.getStudentId()))
                    .findFirst()
                    .orElseGet(() -> {
                        Student s = new Student();
                        s.setId(entry.getStudentId());
                        Result r = new Result();
                        r.setSchool(school);
                        r.setExam(exam);
                        r.setStudent(s);
                        return r;
                    });

            result.setMarksObtained(entry.getMarksObtained());
            result.setGrade(entry.getGrade());
            result.setRemarks(entry.getRemarks());
            result.setEnteredByTeacher(teacher);
            resultRepository.save(result);
        }
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ClassAnnouncementResponse createAnnouncement(Long schoolId, Long userId,
                                                         CreateClassAnnouncementRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);

        SchoolClass cls = classRepository.findById(req.getClassId())
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Class", req.getClassId()));

        Section section = null;
        if (req.getSectionId() != null) {
            section = sectionRepository.findById(req.getSectionId())
                    .filter(s -> s.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));

            // Validate teacher is assigned to this section
            final Long sectionId = req.getSectionId();
            boolean authorised = assignmentRepository
                    .findBySchoolIdAndTeacherIdAndDeletedFalse(schoolId, teacher.getId())
                    .stream()
                    .anyMatch(ta -> ta.getSection().getId().equals(sectionId));
            if (!authorised) {
                throw new BusinessException("You are not assigned to this section.");
            }
        }

        Student student = null;
        if (req.getStudentId() != null) {
            if (section == null) {
                throw new BusinessException("Select a section before targeting a student.");
            }
            final Long sid = req.getSectionId();
            student = studentRepository.findById(req.getStudentId())
                    .filter(st -> st.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new ResourceNotFoundException("Student", req.getStudentId()));
            // Ensure the student is actually enrolled in the chosen section.
            boolean inSection = classMappingRepository.findActiveBySection(sid).stream()
                    .anyMatch(m -> m.getStudent() != null && m.getStudent().getId().equals(req.getStudentId()));
            if (!inSection) {
                throw new BusinessException("That student is not in the selected section.");
            }
        }

        ClassAnnouncement ann = ClassAnnouncement.builder()
                .school(teacher.getSchool())
                .teacher(teacher)
                .schoolClass(cls)
                .section(section)
                .student(student)
                .title(req.getTitle())
                .content(req.getContent())
                .attachmentUrl(req.getAttachmentUrl())
                .attachmentName(req.getAttachmentName())
                .published(req.isPublished())
                .publishedAt(req.isPublished() ? LocalDateTime.now() : null)
                .build();

        ann = announcementRepository.save(ann);
        return toAnnouncementResponse(ann);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassAnnouncementResponse> getMyAnnouncements(Long schoolId, Long userId) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return announcementRepository.findBySchoolIdAndTeacherIdAndDeletedFalse(schoolId, teacher.getId())
                .stream().map(this::toAnnouncementResponse).collect(Collectors.toList());
    }

    private ClassAnnouncementResponse toAnnouncementResponse(ClassAnnouncement a) {
        User u = a.getTeacher().getUser();
        return ClassAnnouncementResponse.builder()
                .id(a.getId())
                .schoolId(a.getSchool().getId())
                .teacherId(a.getTeacher().getId())
                .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                .classId(a.getSchoolClass().getId())
                .className(a.getSchoolClass().getName())
                .sectionId(a.getSection() != null ? a.getSection().getId() : null)
                .sectionName(a.getSection() != null ? a.getSection().getName() : null)
                .studentId(a.getStudent() != null ? a.getStudent().getId() : null)
                .studentName(a.getStudent() != null
                        ? (a.getStudent().getFirstName() + " " + a.getStudent().getLastName()).trim() : null)
                .title(a.getTitle())
                .content(a.getContent())
                .attachmentUrl(a.getAttachmentUrl())
                .attachmentName(a.getAttachmentName())
                .published(a.isPublished())
                .publishedAt(a.getPublishedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
