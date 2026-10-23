package com.sms.school.service.impl;

import com.sms.school.dto.request.SubmitHomeworkRequest;
import com.sms.school.dto.response.*;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.EnrollmentStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.ParentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * All data exposed to the Parent App.
 * Every method verifies parent → student ownership before returning data.
 */
@Service
@RequiredArgsConstructor
public class ParentDashboardServiceImpl implements ParentDashboardService {

    private final ParentRepository                parentRepository;
    private final StudentParentMappingRepository  mappingRepository;
    private final StudentClassMappingRepository   enrollmentRepository;
    private final AttendanceRepository            attendanceRepository;
    private final HomeworkRepository              homeworkRepository;
    private final HomeworkSubmissionRepository    submissionRepository;
    private final ResultRepository                resultRepository;
    private final FeeRepository                   feeRepository;
    private final TeacherAssignmentRepository     teacherAssignmentRepository;
    private final ClassworkRepository             classworkRepository;
    private final ClassAnnouncementRepository     announcementRepository;

    // ── My Children ───────────────────────────────────────────────────

    /**
     * Returns all children linked to this parent (identified by userId from JWT).
     */
    @Transactional(readOnly = true)
    public List<ChildSummaryResponse> getMyChildren(Long schoolId, Long userId, String academicYear) {
        Parent parent = getParentByUserId(schoolId, userId);

        List<StudentParentMapping> mappings =
                mappingRepository.findBySchoolIdAndParentIdAndDeletedFalse(schoolId, parent.getId());

        return mappings.stream()
                .filter(m -> !m.isDeleted())
                .map(m -> buildChildSummary(m, academicYear))
                .toList();
    }

    // ── Security guard ────────────────────────────────────────────────

    /**
     * Verifies that the authenticated parent (by userId) is linked to the given student.
     * Throws AccessDenied if not linked.
     */
    private void assertParentOwnsStudent(Long schoolId, Long userId, Long studentId) {
        Parent parent = getParentByUserId(schoolId, userId);

        boolean linked = mappingRepository.existsBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(
                schoolId, studentId, parent.getId());

        if (!linked) {
            throw new BusinessException("You are not authorized to access this student's data");
        }
    }

    // ── Attendance ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MonthlyAttendanceResponse getAttendance(Long schoolId, Long userId, Long studentId, String month) {
        assertParentOwnsStudent(schoolId, userId, studentId);

        // Parse month "2025-06" → year + month for DB query
        String[] parts = month.split("-");
        int year     = Integer.parseInt(parts[0]);
        int monthNum = Integer.parseInt(parts[1]);

        List<Attendance> records = attendanceRepository
                .findBySchoolIdAndStudentIdAndMonth(schoolId, studentId, year, monthNum);

        long present = records.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus().name())).count();
        long absent  = records.stream().filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus().name())).count();
        long late    = records.stream().filter(a -> "LATE".equalsIgnoreCase(a.getStatus().name())).count();
        long total   = records.size();
        double pct   = total > 0 ? (double) present / total * 100 : 0;

        List<MonthlyAttendanceResponse.DayRecord> days = records.stream()
                .map(a -> MonthlyAttendanceResponse.DayRecord.builder()
                        .date(a.getAttendanceDate())
                        .status(a.getStatus().name())
                        .remarks(a.getRemarks())
                        .build())
                .toList();

        return MonthlyAttendanceResponse.builder()
                .studentId(studentId)
                .month(month)
                .presentDays((int) present)
                .absentDays((int) absent)
                .lateDays((int) late)
                .totalDays((int) total)
                .attendancePercentage(Math.round(pct * 10.0) / 10.0)
                .records(days)
                .build();
    }

    // ── Homework ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<HomeworkWithSubmissionResponse> getHomework(
            Long schoolId, Long userId, Long studentId, String academicYear) {

        assertParentOwnsStudent(schoolId, userId, studentId);

        // Get active section for this student
        Optional<com.sms.school.entity.StudentClassMapping> enrollment =
                enrollmentRepository.findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, academicYear, EnrollmentStatus.ACTIVE);

        if (enrollment.isEmpty()) return List.of();

        Long sectionId = enrollment.get().getSection().getId();

        List<Homework> hwList = homeworkRepository.findBySchoolIdAndSectionIdAndDeletedFalse(
                schoolId, sectionId);

        return hwList.stream().map(hw -> {
            Optional<HomeworkSubmission> submission =
                    submissionRepository.findBySchoolIdAndHomeworkIdAndStudentIdAndDeletedFalse(
                            schoolId, hw.getId(), studentId);

            return HomeworkWithSubmissionResponse.builder()
                    .id(hw.getId())
                    .title(hw.getTitle())
                    .description(hw.getDescription())
                    .subject(hw.getSubject())
                    .assignedDate(hw.getAssignedDate())
                    .dueDate(hw.getDueDate())
                    .attachmentUrl(hw.getAttachmentUrl())
                    .submissionStatus(submission.map(HomeworkSubmission::getStatus).orElse(null))
                    .submissionUrl(submission.map(HomeworkSubmission::getSubmissionUrl).orElse(null))
                    .grade(submission.map(HomeworkSubmission::getGrade).orElse(null))
                    .teacherRemarks(submission.map(HomeworkSubmission::getTeacherRemarks).orElse(null))
                    .build();
        }).toList();
    }

    // ── Submit Homework ───────────────────────────────────────────────

    @Transactional
    @Override
    public HomeworkWithSubmissionResponse submitHomework(
            Long schoolId, Long userId, Long studentId, Long homeworkId,
            SubmitHomeworkRequest req) {

        assertParentOwnsStudent(schoolId, userId, studentId);

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new ResourceNotFoundException("Homework", homeworkId));

        Student student = new Student(); // proxy — only id needed
        student.setId(studentId);

        // Check if already submitted → update, else insert
        HomeworkSubmission submission = submissionRepository
                .findBySchoolIdAndHomeworkIdAndStudentIdAndDeletedFalse(schoolId, homeworkId, studentId)
                .orElseGet(() -> HomeworkSubmission.builder()
                        .school(hw.getSchool())
                        .homework(hw)
                        .student(student)
                        .build());

        submission.setSubmissionUrl(req.getSubmissionUrl());
        submission.setTextResponse(req.getTextResponse());
        submission.setSubmittedAt(java.time.LocalDateTime.now());

        // Mark LATE if past due date
        boolean isLate = hw.getDueDate() != null
                && java.time.LocalDate.now().isAfter(hw.getDueDate());
        if ("SUBMITTED".equals(submission.getStatus()) || submission.getStatus() == null) {
            submission.setStatus(isLate ? "LATE" : "SUBMITTED");
        }

        submissionRepository.save(submission);

        return HomeworkWithSubmissionResponse.builder()
                .id(hw.getId())
                .title(hw.getTitle())
                .subject(hw.getSubject())
                .dueDate(hw.getDueDate())
                .submissionStatus(submission.getStatus())
                .submissionUrl(submission.getSubmissionUrl())
                .build();
    }

    // ── Results ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ResultResponse> getResults(Long schoolId, Long userId, Long studentId) {
        assertParentOwnsStudent(schoolId, userId, studentId);

        return resultRepository.findBySchoolIdAndStudentIdAndDeletedFalse(schoolId, studentId)
                .stream()
                .map(r -> {
                    Double total = r.getExam().getTotalMarks();
                    Double obtained = r.getMarksObtained();
                    return ResultResponse.builder()
                            .id(r.getId())
                            .examName(r.getExam().getExamName())
                            .subject(r.getExam().getSubject())
                            .examDate(r.getExam().getExamDate())
                            .totalMarks(total    != null ? BigDecimal.valueOf(total)   : null)
                            .marksObtained(obtained != null ? BigDecimal.valueOf(obtained) : null)
                            .grade(r.getGrade())
                            .remarks(r.getRemarks())
                            .isPublished(r.isPublished())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ── Fees ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FeeResponse> getFees(Long schoolId, Long userId, Long studentId, String academicYear) {
        assertParentOwnsStudent(schoolId, userId, studentId);

        return feeRepository.findBySchoolIdAndStudentIdAndAcademicYearAndDeletedFalse(
                        schoolId, studentId, academicYear)
                .stream()
                .map(f -> FeeResponse.builder()
                        .id(f.getId())
                        .feeCategory(f.getFeeCategory())
                        .academicYear(f.getAcademicYear())
                        .feePeriod(f.getFeePeriod())
                        .amount(f.getAmount())
                        .discount(f.getDiscount())
                        .fine(f.getFine())
                        .dueDate(f.getDueDate())
                        .status(f.getStatus())
                        .remarks(f.getRemarks())
                        .build())
                .toList();
    }

    // ── Private helpers ───────────────────────────────────────────────

    private Parent getParentByUserId(Long schoolId, Long userId) {
        return parentRepository.findBySchoolIdAndUserIdAndDeletedFalse(schoolId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parent profile not found for this user. Contact school admin."));
    }

    // ── Teacher / subject data ────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponse> getChildTeachers(Long schoolId, Long userId,
                                                             Long studentId, String academicYear) {
        assertParentOwnsStudent(schoolId, userId, studentId);
        Long sectionId = getActiveSectionId(schoolId, studentId, academicYear);
        return teacherAssignmentRepository.findBySectionWithDetails(schoolId, sectionId, academicYear)
                .stream()
                .map(ta -> TeacherAssignmentResponse.builder()
                        .id(ta.getId())
                        .teacherId(ta.getTeacher().getId())
                        .teacherName(ta.getTeacher().getUser() != null
                                ? ta.getTeacher().getUser().getFirstName() + " " + ta.getTeacher().getUser().getLastName()
                                : null)
                        .classId(ta.getSchoolClass().getId())
                        .className(ta.getSchoolClass().getName())
                        .sectionId(ta.getSection().getId())
                        .sectionName(ta.getSection().getName())
                        .subjectId(ta.getSubject().getId())
                        .subjectName(ta.getSubject().getSubjectName())
                        .subjectCode(ta.getSubject().getSubjectCode())
                        .academicYear(ta.getAcademicYear())
                        .classTeacher(ta.isClassTeacher())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassworkResponse> getClasswork(Long schoolId, Long userId,
                                                Long studentId, String academicYear) {
        assertParentOwnsStudent(schoolId, userId, studentId);
        Long sectionId = getActiveSectionId(schoolId, studentId, academicYear);
        return classworkRepository.findBySchoolIdAndSectionIdAndDeletedFalse(schoolId, sectionId)
                .stream()
                .map(cw -> {
                    Subject sub = cw.getSubject();
                    User u = cw.getTeacher().getUser();
                    return ClassworkResponse.builder()
                            .id(cw.getId())
                            .teacherId(cw.getTeacher().getId())
                            .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                            .subjectId(sub != null ? sub.getId() : null)
                            .subjectName(sub != null ? sub.getSubjectName() : cw.getSubjectText())
                            .topic(cw.getTopic() != null ? cw.getTopic() : cw.getTitle())
                            .description(cw.getDescription())
                            .classDate(cw.getClassworkDate())
                            .notes(cw.getNotes())
                            .attachmentUrl(cw.getAttachmentUrl())
                            .createdAt(cw.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassAnnouncementResponse> getAnnouncements(Long schoolId, Long userId, Long studentId) {
        assertParentOwnsStudent(schoolId, userId, studentId);

        // Get active enrollment to find class + section
        Optional<com.sms.school.entity.StudentClassMapping> enrollment =
                enrollmentRepository.findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, null, EnrollmentStatus.ACTIVE);

        if (enrollment.isEmpty()) return List.of();

        Long classId   = enrollment.get().getSchoolClass().getId();
        Long sectionId = enrollment.get().getSection().getId();

        return announcementRepository.findBySectionOrClassWide(schoolId, classId, sectionId)
                .stream()
                .map(a -> {
                    User u = a.getTeacher().getUser();
                    return ClassAnnouncementResponse.builder()
                            .id(a.getId())
                            .teacherId(a.getTeacher().getId())
                            .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                            .title(a.getTitle())
                            .content(a.getContent())
                            .attachmentUrl(a.getAttachmentUrl())
                            .published(a.isPublished())
                            .publishedAt(a.getPublishedAt())
                            .createdAt(a.getCreatedAt())
                            .build();
                })
                .toList();
    }

    /** Resolve the active section ID for a student in the given academic year. */
    private Long getActiveSectionId(Long schoolId, Long studentId, String academicYear) {
        return enrollmentRepository.findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, academicYear, EnrollmentStatus.ACTIVE)
                .map(e -> e.getSection().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active enrollment found for student " + studentId + " in year " + academicYear));
    }

    private ChildSummaryResponse buildChildSummary(StudentParentMapping mapping, String academicYear) {
        Student s = mapping.getStudent();

        // Try to find active enrollment
        Optional<com.sms.school.entity.StudentClassMapping> enrollment =
                enrollmentRepository.findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        s.getSchool().getId(), s.getId(), academicYear, EnrollmentStatus.ACTIVE);

        return ChildSummaryResponse.builder()
                .studentId(s.getId())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .fullName(s.getFirstName() + " " + s.getLastName())
                .admissionNumber(s.getAdmissionNumber())
                .profilePictureUrl(s.getProfilePictureUrl())
                .gender(s.getGender() != null ? s.getGender().name() : null)
                .bloodGroup(s.getBloodGroup())
                .relationshipType(mapping.getRelationshipType())
                .classId(enrollment.map(e -> e.getSchoolClass().getId()).orElse(null))
                .className(enrollment.map(e -> e.getSchoolClass().getName()).orElse(null))
                .sectionId(enrollment.map(e -> e.getSection().getId()).orElse(null))
                .sectionName(enrollment.map(e -> e.getSection().getName()).orElse(null))
                .academicYear(enrollment.map(com.sms.school.entity.StudentClassMapping::getAcademicYear).orElse(null))
                .rollNumber(enrollment.map(com.sms.school.entity.StudentClassMapping::getRollNumber).orElse(null))
                .build();
    }
}
