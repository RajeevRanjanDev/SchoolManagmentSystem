package com.sms.school.service.impl;

import com.sms.school.dto.response.DashboardResponse;
import com.sms.school.entity.enums.AttendanceStatus;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.repository.*;
import com.sms.school.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final StudentRepository     studentRepository;
    private final TeacherRepository     teacherRepository;
    private final ParentRepository      parentRepository;
    private final SchoolClassRepository classRepository;
    private final AttendanceRepository  attendanceRepository;
    private final FeeRepository         feeRepository;
    private final FeePaymentRepository  feePaymentRepository;
    private final BookIssueRepository   bookIssueRepository;
    private final EventRepository       eventRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getAdminDashboard(Long schoolId) {
        LocalDate today = LocalDate.now();

        // ── Headcounts (efficient: uses COUNT queries) ────────────────────────
        long totalStudents = studentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long totalTeachers = teacherRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long totalParents  = parentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long totalClasses  = classRepository.countBySchoolIdAndDeletedFalse(schoolId);

        // ── Today's attendance ────────────────────────────────────────────────
        long presentCount = attendanceRepository
                .countBySchoolIdAndAttendanceDateAndStatusAndDeletedFalse(
                        schoolId, today, AttendanceStatus.PRESENT);
        long absentCount  = attendanceRepository
                .countBySchoolIdAndAttendanceDateAndStatusAndDeletedFalse(
                        schoolId, today, AttendanceStatus.ABSENT);

        // ── Fee summary ───────────────────────────────────────────────────────
        List<FeeStatus> pendingStatuses = List.of(FeeStatus.PENDING, FeeStatus.PARTIAL, FeeStatus.OVERDUE);
        long   pendingFeeCount  = feeRepository.countBySchoolIdAndStatusInAndDeletedFalse(schoolId, pendingStatuses);
        BigDecimal pendingTotal = feeRepository.sumPendingFeesBySchoolId(schoolId);

        // Fees collected this calendar month
        LocalDateTime startOfMonth = YearMonth.from(today).atDay(1).atStartOfDay();
        BigDecimal collectedThisMonth = feePaymentRepository.sumCollectedSince(schoolId, startOfMonth);

        // ── Library ───────────────────────────────────────────────────────────
        long booksIssued = bookIssueRepository.countBySchoolIdAndReturnDateIsNullAndDeletedFalse(schoolId);

        // ── Upcoming events ───────────────────────────────────────────────────
        long upcomingEvents = eventRepository
                .countBySchoolIdAndEventDateGreaterThanEqualAndPublishedTrueAndDeletedFalse(schoolId, today);

        return DashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalParents(totalParents)
                .totalClasses(totalClasses)
                .todayPresentCount(presentCount)
                .todayAbsentCount(absentCount)
                .pendingFeeCount(pendingFeeCount)
                .totalFeesPendingThisMonth(pendingTotal != null ? pendingTotal : BigDecimal.ZERO)
                .totalFeesCollectedThisMonth(collectedThisMonth != null ? collectedThisMonth : BigDecimal.ZERO)
                .booksIssued(booksIssued)
                .upcomingEventsCount(upcomingEvents)
                .build();
    }
}
