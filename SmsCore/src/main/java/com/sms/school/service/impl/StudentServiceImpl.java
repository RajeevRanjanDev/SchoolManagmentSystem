package com.sms.school.service.impl;

import com.sms.school.dto.request.CreateStudentRequest;
import com.sms.school.dto.response.StudentResponse;
import com.sms.school.entity.Parent;
import com.sms.school.entity.School;
import com.sms.school.entity.Student;
import com.sms.school.entity.StudentClassMapping;
import com.sms.school.entity.TransportRoute;
import com.sms.school.entity.enums.EnrollmentStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final SchoolRepository schoolRepository;
    private final ParentRepository parentRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final StudentClassMappingRepository enrollmentRepository;

    @Override
    @Transactional
    public StudentResponse createStudent(Long schoolId, CreateStudentRequest req) {
        School school = getSchool(schoolId);

        // Admission number must be unique within the school
        if (studentRepository.existsBySchoolIdAndAdmissionNumber(schoolId, req.getAdmissionNumber())) {
            throw new BusinessException(
                    "Admission number '" + req.getAdmissionNumber() + "' already exists in this school");
        }

        Student student = Student.builder()
                .school(school)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .admissionNumber(req.getAdmissionNumber())
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .bloodGroup(req.getBloodGroup())
                .address(req.getAddress())
                .admissionDate(req.getAdmissionDate() != null ? req.getAdmissionDate() : java.time.LocalDate.now())
                .active(true)
                .status("ACTIVE")
                .build();

        if (req.getParentId() != null) {
            Parent parent = parentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent", req.getParentId()));
            student.setParent(parent);
        }

        if (req.getTransportRouteId() != null) {
            TransportRoute route = transportRouteRepository.findById(req.getTransportRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("TransportRoute", req.getTransportRouteId()));
            student.setTransportRoute(route);
        }

        return toResponse(studentRepository.save(student), null);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long schoolId, Long studentId) {
        Student student = getStudent(schoolId, studentId);
        StudentClassMapping enrollment = getActiveEnrollment(schoolId, studentId);
        return toResponse(student, enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getAllStudents(Long schoolId, Pageable pageable) {
        Page<Student> page = studentRepository.findBySchoolIdAndDeletedFalse(schoolId, pageable);

        // Batch-fetch active enrollments to avoid N+1 queries
        List<Long> studentIds = page.getContent().stream().map(Student::getId).toList();
        Map<Long, StudentClassMapping> enrollmentMap = java.util.Collections.emptyMap();
        if (!studentIds.isEmpty()) {
            enrollmentMap = enrollmentRepository.findActiveByStudentIds(schoolId, studentIds)
                    .stream()
                    .collect(Collectors.toMap(
                            e -> e.getStudent().getId(),
                            e -> e,
                            (a, b) -> a  // keep first in case of duplicates
                    ));
        }

        final Map<Long, StudentClassMapping> finalMap = enrollmentMap;
        return page.map(s -> toResponse(s, finalMap.get(s.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByParent(Long schoolId, Long parentId) {
        return studentRepository.findByParentIdAndDeletedFalse(parentId)
                .stream().map(s -> toResponse(s, null)).toList();
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long schoolId, Long studentId, CreateStudentRequest req) {
        Student student = getStudent(schoolId, studentId);

        student.setFirstName(req.getFirstName());
        student.setLastName(req.getLastName());
        student.setDateOfBirth(req.getDateOfBirth());
        student.setGender(req.getGender());
        student.setBloodGroup(req.getBloodGroup());
        student.setAddress(req.getAddress());

        StudentClassMapping enrollment = getActiveEnrollment(schoolId, studentId);
        return toResponse(studentRepository.save(student), enrollment);
    }

    @Override
    @Transactional
    public StudentResponse toggleStudentStatus(Long schoolId, Long studentId, boolean active) {
        Student student = getStudent(schoolId, studentId);
        student.setActive(active);
        student.setStatus(active ? "ACTIVE" : "INACTIVE");
        StudentClassMapping enrollment = getActiveEnrollment(schoolId, studentId);
        return toResponse(studentRepository.save(student), enrollment);
    }

    @Override
    @Transactional
    public void deleteStudent(Long schoolId, Long studentId) {
        Student student = getStudent(schoolId, studentId);
        student.setDeleted(true);
        studentRepository.save(student);
    }

    // ── Private helpers ───────────────────────────────────────────────

    private Student getStudent(Long schoolId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        if (!student.getSchool().getId().equals(schoolId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return student;
    }

    private School getSchool(Long schoolId) {
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
    }

    private StudentClassMapping getActiveEnrollment(Long schoolId, Long studentId) {
        return enrollmentRepository
                .findBySchoolIdAndStudentIdAndDeletedFalseOrderByAcademicYearDesc(schoolId, studentId)
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .findFirst()
                .orElse(null);
    }

    private StudentResponse toResponse(Student s, StudentClassMapping enrollment) {
        return StudentResponse.builder()
                .id(s.getId())
                .schoolId(s.getSchool().getId())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .fullName(s.getFirstName() + " " + s.getLastName())
                .admissionNumber(s.getAdmissionNumber())
                .dateOfBirth(s.getDateOfBirth())
                .gender(s.getGender())
                .bloodGroup(s.getBloodGroup())
                .address(s.getAddress())
                .profilePictureUrl(s.getProfilePictureUrl())
                .admissionDate(s.getAdmissionDate())
                .active(s.isActive())
                .status(s.getStatus())
                .parentId(s.getParent() != null ? s.getParent().getId() : null)
                .parentName(s.getParent() != null ? s.getParent().getUser().getFullName() : null)
                .transportRouteId(s.getTransportRoute() != null ? s.getTransportRoute().getId() : null)
                .transportRouteName(s.getTransportRoute() != null ? s.getTransportRoute().getRouteName() : null)
                .currentClassId(enrollment != null ? enrollment.getSchoolClass().getId() : null)
                .currentClass(enrollment != null ? enrollment.getSchoolClass().getName() : null)
                .currentSectionId(enrollment != null ? enrollment.getSection().getId() : null)
                .currentSection(enrollment != null ? enrollment.getSection().getName() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
