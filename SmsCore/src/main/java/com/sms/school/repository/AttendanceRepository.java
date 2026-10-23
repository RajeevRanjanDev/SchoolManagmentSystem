package com.sms.school.repository;

import com.sms.school.entity.Attendance;
import com.sms.school.entity.enums.AttendanceStatus;
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

    /** Count attendance records for a whole school on a given date by status — used by admin dashboard */
    long countBySchoolIdAndAttendanceDateAndStatusAndDeletedFalse(
            Long schoolId, LocalDate date, AttendanceStatus status);

    /** Attendance percentage for a student in a date range */
    @Query("""
            SELECT COUNT(a) FROM Attendance a
            WHERE a.student.id = :studentId
              AND a.attendanceDate BETWEEN :from AND :to
              AND a.status = 'PRESENT'
            """)
    long countPresentDays(Long studentId, LocalDate from, LocalDate to);

    /** All attendance records for a student in a specific month — used by Parent App */
    @Query("""
            SELECT a FROM Attendance a
            WHERE a.school.id      = :schoolId
              AND a.student.id     = :studentId
              AND YEAR(a.attendanceDate)  = :year
              AND MONTH(a.attendanceDate) = :month
              AND a.deleted        = false
            ORDER BY a.attendanceDate
            """)
    List<Attendance> findBySchoolIdAndStudentIdAndMonth(
            Long schoolId, Long studentId, int year, int month);

    List<Attendance> findBySchoolIdAndStudentIdAndDeletedFalse(Long schoolId, Long studentId);
}
