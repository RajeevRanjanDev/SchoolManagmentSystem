package com.sms.school.service.impl;

import com.sms.school.dto.request.CreateStudentRequest;
import com.sms.school.dto.response.StudentResponse;
import com.sms.school.entity.Parent;
import com.sms.school.entity.School;
import com.sms.school.entity.Student;
import com.sms.school.entity.TransportRoute;
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

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final SchoolRepository schoolRepository;
    private final ParentRepository parentRepository;
    private final TransportRouteRepository transportRouteRepository;

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
                .admissionDate(req.getAdmissionDate())
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

        return toResponse(studentRepository.save(student));
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long schoolId, Long studentId) {
        Student student = getStudent(schoolId, studentId);
        return toResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getAllStudents(Long schoolId, Pageable pageable) {
        return studentRepository
                .findBySchoolIdAndDeletedFalse(schoolId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByParent(Long schoolId, Long parentId) {
        return studentRepository.findByParentIdAndDeletedFalse(parentId)
                .stream().map(this::toResponse).toList();
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

        return toResponse(studentRepository.save(student));
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

    private StudentResponse toResponse(Student s) {
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
                .parentId(s.getParent() != null ? s.getParent().getId() : null)
                .parentName(s.getParent() != null ? s.getParent().getUser().getFullName() : null)
                .transportRouteId(s.getTransportRoute() != null ? s.getTransportRoute().getId() : null)
                .transportRouteName(s.getTransportRoute() != null ? s.getTransportRoute().getRouteName() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
