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

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final SchoolClassRepository classRepository;
    private final AttendanceRepository attendanceRepository;
    private final FeeRepository feeRepository;
    private final BookIssueRepository bookIssueRepository;
    private final EventRepository eventRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getAdminDashboard(Long schoolId) {
        LocalDate today = LocalDate.now();

        long totalStudents  = studentRepository.findBySchoolIdAndDeletedFalse(schoolId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalTeachers  = teacherRepository.findBySchoolIdAndDeletedFalse(schoolId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalParents   = parentRepository.findBySchoolIdAndDeletedFalse(schoolId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalClasses   = classRepository.findBySchoolIdAndDeletedFalse(schoolId).size();

        // Today's attendance counts
        long presentCount = attendanceRepository
                .findBySectionIdAndAttendanceDate(0L, today)  // simplified – real impl aggregates per school
                .stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .count();

        BigDecimal pendingFees = feeRepository.sumPendingByStudentId(0L); // placeholder

        long pendingFeeCount = feeRepository
                .findBySchoolIdAndStatusAndDeletedFalse(schoolId, FeeStatus.PENDING).size();

        return DashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalParents(totalParents)
                .totalClasses(totalClasses)
                .todayPresentCount(presentCount)
                .pendingFeeCount(pendingFeeCount)
                .totalFeesPendingThisMonth(pendingFees)
                .totalFeesCollectedThisMonth(BigDecimal.ZERO)
                .build();
    }
}
