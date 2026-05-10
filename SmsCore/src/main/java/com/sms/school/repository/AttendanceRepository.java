package com.sms.school.repository;

import com.sms.school.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudentIdAndAttendanceDate(Long studentId, LocalDate date);

    List<Attendance> findByStudentIdAndAttendanceDateBetween(Long studentId, LocalDate from, LocalDate to);

    List<Attendance> findBySectionIdAndAttendanceDate(Long sectionId, LocalDate date);

    /** Attendance percentage for a student in a date range */
    @Query("""
            SELECT COUNT(a) FROM Attendance a
            WHERE a.student.id = :studentId
              AND a.attendanceDate BETWEEN :from AND :to
              AND a.status = 'PRESENT'
            """)
    long countPresentDays(Long studentId, LocalDate from, LocalDate to);
}
