package com.sms.school.controller;

import com.sms.school.dto.request.ChangePasswordRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.dto.response.student.*;
import com.sms.school.entity.*;
import com.sms.school.entity.admission.StudentGuardian;
import com.sms.school.entity.admission.StudentProfile;
import com.sms.school.entity.enums.GuardianRelation;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.repository.admission.StudentProfileRepository;
import com.sms.school.security.TenantContext;
import com.sms.school.service.AttendanceService;
import com.sms.school.service.FeeService;
import com.sms.school.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Student-facing portal. Every endpoint is scoped to the logged-in student,
 * resolved via User → StudentProfile → admissionNumber → legacy Student.
 */
@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student Portal", description = "Logged-in student's own dashboard, fees, attendance, assignments, notices")
public class StudentPortalController {

    private final StudentProfileRepository      profileRepo;
    private final StudentRepository             studentRepo;
    private final StudentClassMappingRepository classMappingRepo;
    private final FeeService                    feeService;
    private final AttendanceService             attendanceService;
    private final HomeworkRepository            homeworkRepo;
    private final ClassworkRepository           classworkRepo;
    private final DailyWorkRepository           dailyWorkRepo;
    private final ResultRepository              resultRepo;
    private final NotificationService           notificationService;
    private final ClassAnnouncementRepository   announcementRepo;
    private final UserRepository                userRepo;
    private final PasswordEncoder               passwordEncoder;

    // ── Identity resolution ─────────────────────────────────────────────────

    private record Ctx(Long schoolId, Long userId, StudentProfile profile, Student student,
                        Long sectionId, Long classId, String className, String sectionName,
                        String rollNumber, String academicYear) {}

    private Ctx resolve() {
        Long userId = TenantContext.getCurrentUserId();
        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentProfile profile = profileRepo.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account."));
        Student student = studentRepo.findBySchoolIdAndAdmissionNumber(schoolId, profile.getAdmissionNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Student enrolment record not found."));

        Long sectionId = null, classId = null;
        String className = null, sectionName = null, rollNumber = null, academicYear = null;
        List<StudentClassMapping> active = classMappingRepo.findActiveByStudentIds(schoolId, List.of(student.getId()));
        if (!active.isEmpty()) {
            StudentClassMapping m = active.get(0);
            sectionId = m.getSection() != null ? m.getSection().getId() : null;
            sectionName = m.getSection() != null ? m.getSection().getName() : null;
            classId = m.getSchoolClass() != null ? m.getSchoolClass().getId() : null;
            className = m.getSchoolClass() != null ? m.getSchoolClass().getName() : null;
            rollNumber = m.getRollNumber();
            academicYear = m.getAcademicYear();
        }
        if (academicYear == null && profile.getSchool() != null) {
            academicYear = profile.getSchool().getCurrentAcademicYear();
        }
        return new Ctx(schoolId, userId, profile, student, sectionId, classId,
                className, sectionName, rollNumber, academicYear);
    }

    // ── Profile ─────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @Transactional(readOnly = true)
    @Operation(summary = "Logged-in student's profile")
    public ResponseEntity<ApiResponse<StudentMeResponse>> me() {
        Ctx c = resolve();
        StudentProfile p = c.profile();
        var td = p.getTransportDetail();
        return ResponseEntity.ok(ApiResponse.success(StudentMeResponse.builder()
                .studentId(c.student().getId())
                .admissionNumber(p.getAdmissionNumber())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender() != null ? p.getGender().name() : null)
                .email(p.getEmail())
                .mobile(p.getMobile())
                .className(c.className())
                .sectionName(c.sectionName())
                .rollNumber(c.rollNumber())
                .fatherName(guardianName(p, GuardianRelation.FATHER))
                .motherName(guardianName(p, GuardianRelation.MOTHER))
                .schoolName(p.getSchool() != null ? p.getSchool().getName() : null)
                .transportRequired(td != null && td.isTransportRequired())
                .routeName(td != null ? td.getRouteName() : null)
                .stopName(td != null ? td.getStopName() : null)
                .pickupPoint(td != null ? td.getPickupPoint() : null)
                .transportType(td != null ? td.getTransportType() : null)
                .build()));
    }

    private String guardianName(StudentProfile p, GuardianRelation relation) {
        if (p.getGuardians() == null) return null;
        return p.getGuardians().stream()
                .filter(g -> !g.isDeleted() && g.getRelation() == relation)
                .findFirst()
                .map(g -> ((g.getFirstName() == null ? "" : g.getFirstName()) + " "
                        + (g.getLastName() == null ? "" : g.getLastName())).trim())
                .orElse(null);
    }

    // ── Dashboard ───────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    @Operation(summary = "Student home snapshot")
    public ResponseEntity<ApiResponse<StudentDashboardResponse>> dashboard() {
        Ctx c = resolve();
        LocalDate today = LocalDate.now();
        LocalDate yearStart = academicYearStart(c.academicYear());

        double attendance = attendanceService.getAttendancePercentage(
                c.schoolId(), c.student().getId(), yearStart, today);

        BigDecimal outstanding = feeService.getStudentFees(c.schoolId(), c.student().getId()).stream()
                .map(f -> f.getBalance() != null ? f.getBalance().max(BigDecimal.ZERO) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int todayAssignments = 0;
        if (c.sectionId() != null) {
            todayAssignments += dailyWorkRepo
                    .findBySchoolIdAndSectionIdAndWorkDateAndDeletedFalse(c.schoolId(), c.sectionId(), today).size();
        }

        int todayUpdates = (int) notificationService
                .getUserNotifications(c.userId(), PageRequest.of(0, 50)).stream()
                .filter(n -> n.getCreatedAt() != null && n.getCreatedAt().toLocalDate().isEqual(today))
                .count();

        return ResponseEntity.ok(ApiResponse.success(StudentDashboardResponse.builder()
                .studentName((c.profile().getFirstName() + " " + c.profile().getLastName()).trim())
                .schoolName(c.profile().getSchool() != null ? c.profile().getSchool().getName() : null)
                .className(c.className())
                .sectionName(c.sectionName())
                .attendanceRate(round1(attendance))
                .outstandingFee(outstanding)
                .todayAssignments(todayAssignments)
                .todayUpdates(todayUpdates)
                .build()));
    }

    // ── Fees ────────────────────────────────────────────────────────────────

    @GetMapping("/fees")
    @Transactional(readOnly = true)
    @Operation(summary = "All fees for the student (group client-side by category)")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> fees() {
        Ctx c = resolve();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFees(c.schoolId(), c.student().getId())));
    }

    // ── Attendance ──────────────────────────────────────────────────────────

    @GetMapping("/attendance")
    @Transactional(readOnly = true)
    @Operation(summary = "Attendance summary, monthly breakdown and recent days")
    public ResponseEntity<ApiResponse<StudentAttendanceResponse>> attendance() {
        Ctx c = resolve();
        LocalDate today = LocalDate.now();
        LocalDate yearStart = academicYearStart(c.academicYear());

        var records = attendanceService.getStudentAttendance(c.schoolId(), c.student().getId(), yearStart, today);

        int present = 0, absent = 0, late = 0;
        Map<java.time.YearMonth, int[]> byMonth = new TreeMap<>();   // [present, absent, total]
        for (var r : records) {
            String st = r.getStatus() != null ? r.getStatus().name() : "";
            java.time.YearMonth ym = java.time.YearMonth.from(r.getAttendanceDate());
            int[] m = byMonth.computeIfAbsent(ym, k -> new int[3]);
            m[2]++;
            if ("PRESENT".equals(st) || "HALF_DAY".equals(st)) { present++; m[0]++; }
            else if ("ABSENT".equals(st)) { absent++; m[1]++; }
            else if ("LATE".equals(st)) { late++; m[0]++; }
        }
        int total = present + absent + late;
        double pct = total == 0 ? 0 : (present * 100.0) / total;

        List<StudentAttendanceResponse.Month> months = byMonth.entrySet().stream()
                .map(e -> StudentAttendanceResponse.Month.builder()
                        .label(e.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                        .present(e.getValue()[0]).absent(e.getValue()[1]).total(e.getValue()[2])
                        .build())
                .collect(Collectors.toList());

        List<StudentAttendanceResponse.Day> recent = records.stream()
                .sorted(Comparator.comparing(com.sms.school.dto.response.AttendanceResponse::getAttendanceDate).reversed())
                .limit(30)
                .map(r -> StudentAttendanceResponse.Day.builder()
                        .date(r.getAttendanceDate())
                        .status(r.getStatus() != null ? r.getStatus().name() : null)
                        .remarks(r.getRemarks())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(StudentAttendanceResponse.builder()
                .percentage(round1(pct)).present(present).absent(absent).late(late).total(total)
                .months(months).recent(recent).build()));
    }

    // ── Assignments (homework + classwork) ──────────────────────────────────

    @GetMapping("/assignments")
    @Transactional(readOnly = true)
    @Operation(summary = "Recent homework and classwork for the student's class")
    public ResponseEntity<ApiResponse<List<StudentAssignmentResponse>>> assignments() {
        Ctx c = resolve();
        if (c.sectionId() == null) return ResponseEntity.ok(ApiResponse.success(List.of()));

        // Teachers/admins post daily homework & classwork via the DailyWork model.
        List<StudentAssignmentResponse> all = dailyWorkRepo
                .findBySchoolIdAndSectionIdAndDeletedFalseOrderByWorkDateDesc(c.schoolId(), c.sectionId()).stream()
                .filter(w -> w.getDescription() != null && !w.getDescription().isBlank())
                .map(w -> StudentAssignmentResponse.builder()
                        .id(w.getId())
                        .type(w.getType())
                        .title(w.getDescription())
                        .description(w.getDescription())
                        .date(w.getWorkDate())
                        .build())
                .limit(40)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(all));
    }

    // ── Exam results ────────────────────────────────────────────────────────

    @GetMapping("/results")
    @Transactional(readOnly = true)
    @Operation(summary = "The student's exam results (report card)")
    public ResponseEntity<ApiResponse<List<StudentResultResponse>>> results() {
        Ctx c = resolve();
        List<StudentResultResponse> results = resultRepo
                .findBySchoolIdAndStudentIdAndDeletedFalse(c.schoolId(), c.student().getId()).stream()
                .map(r -> StudentResultResponse.builder()
                        .id(r.getId())
                        .examName(r.getExam() != null ? r.getExam().getExamName() : null)
                        .subject(r.getExam() != null ? r.getExam().getSubject() : null)
                        .examDate(r.getExam() != null ? r.getExam().getExamDate() : null)
                        .totalMarks(r.getExam() != null ? r.getExam().getTotalMarks() : null)
                        .marksObtained(r.getMarksObtained())
                        .grade(r.getGrade())
                        .published(r.isPublished())
                        .build())
                .sorted(Comparator.comparing(StudentResultResponse::getExamDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // ── Circulars / notices ─────────────────────────────────────────────────

    @GetMapping("/circulars")
    @Transactional(readOnly = true)
    @Operation(summary = "Notices for the student, categorised (circular/fee/exam/attendance/general)")
    public ResponseEntity<ApiResponse<List<StudentNoticeResponse>>> circulars() {
        Ctx c = resolve();

        Stream<StudentNoticeResponse> notifs = notificationService
                .getUserNotifications(c.userId(), PageRequest.of(0, 100)).stream()
                .map(n -> StudentNoticeResponse.builder()
                        .id(n.getId())
                        .category(n.getType() != null ? n.getType().name() : "GENERAL")
                        .title(n.getTitle()).body(n.getBody())
                        .source("NOTIFICATION").read(n.isRead()).date(n.getCreatedAt())
                        .attachmentUrl(n.getAttachmentUrl()).attachmentName(n.getAttachmentName()).build());

        Stream<StudentNoticeResponse> anns = Stream.empty();
        if (c.classId() != null) {
            anns = announcementRepo.findBySectionOrClassWide(c.schoolId(), c.classId(), c.sectionId()).stream()
                    .map(a -> StudentNoticeResponse.builder()
                            .id(a.getId()).category("GENERAL")
                            .title(a.getTitle()).body(a.getContent())
                            .source("ANNOUNCEMENT").read(true)
                            .date(a.getPublishedAt() != null ? a.getPublishedAt() : a.getCreatedAt())
                            .attachmentUrl(a.getAttachmentUrl()).attachmentName(a.getAttachmentName()).build());
        }

        List<StudentNoticeResponse> all = Stream.concat(notifs, anns)
                .sorted(Comparator.comparing(StudentNoticeResponse::getDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(all));
    }

    // ── Change password ─────────────────────────────────────────────────────

    @PostMapping("/change-password")
    @Transactional
    @Operation(summary = "Change the logged-in student's password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        Long userId = TenantContext.getCurrentUserId();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private LocalDate academicYearStart(String academicYear) {
        int year = LocalDate.now().getYear();
        if (academicYear != null && academicYear.length() >= 4
                && academicYear.substring(0, 4).chars().allMatch(Character::isDigit)) {
            year = Integer.parseInt(academicYear.substring(0, 4));
        }
        return LocalDate.of(year, 4, 1);   // academic year starts in April
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
