package com.sms.school.service.impl;

import com.sms.school.dto.request.MarkAttendanceRequest;
import com.sms.school.dto.response.AttendanceResponse;
import com.sms.school.entity.Attendance;
import com.sms.school.entity.School;
import com.sms.school.entity.Section;
import com.sms.school.entity.Student;
import com.sms.school.entity.Teacher;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SchoolRepository schoolRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    @Override
    @Transactional
    public List<AttendanceResponse> markAttendance(Long schoolId, Long teacherId,
                                                   MarkAttendanceRequest request) {
        School school = getSchool(schoolId);
        Section section = getSection(request.getSectionId());
        Teacher teacher = (teacherId != null)
                ? teacherRepository.findById(teacherId).orElse(null)
                : null;

        List<Attendance> records = request.getEntries().stream().map(entry -> {
            Student student = studentRepository.findById(entry.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", entry.getStudentId()));

            // Upsert: update if already marked, else create new record
            Optional<Attendance> existing = attendanceRepository
                    .findByStudentIdAndAttendanceDate(entry.getStudentId(), request.getAttendanceDate());

            Attendance attendance = existing.orElseGet(() -> Attendance.builder()
                    .school(school)
                    .section(section)
                    .student(student)
                    .markedByTeacher(teacher)
                    .attendanceDate(request.getAttendanceDate())
                    .build());

            attendance.setStatus(entry.getStatus());
            attendance.setRemarks(entry.getRemarks());
            return attendanceRepository.save(attendance);
        }).toList();

        return records.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getSectionAttendance(Long schoolId, Long sectionId, LocalDate date) {
        return attendanceRepository.findBySectionIdAndAttendanceDate(sectionId, date)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getStudentAttendance(Long schoolId, Long studentId,
                                                         LocalDate from, LocalDate to) {
        return attendanceRepository.findByStudentIdAndAttendanceDateBetween(studentId, from, to)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public double getAttendancePercentage(Long schoolId, Long studentId, LocalDate from, LocalDate to) {
        long totalDays = ChronoUnit.DAYS.between(from, to) + 1;
        if (totalDays == 0) return 0.0;
        long presentDays = attendanceRepository.countPresentDays(studentId, from, to);
        return (presentDays * 100.0) / totalDays;
    }

    // ── Private helpers ───────────────────────────────────────────────

    private School getSchool(Long id) {
        return schoolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School", id));
    }

    private Section getSection(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Section", id));
    }

    private AttendanceResponse toResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFirstName() + " " + a.getStudent().getLastName())
                .sectionId(a.getSection().getId())
                .attendanceDate(a.getAttendanceDate())
                .status(a.getStatus())
                .remarks(a.getRemarks())
                .build();
    }
}
