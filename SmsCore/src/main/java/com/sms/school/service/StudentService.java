package com.sms.school.service;

import com.sms.school.dto.request.CreateStudentRequest;
import com.sms.school.dto.response.StudentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StudentService {

    StudentResponse createStudent(Long schoolId, CreateStudentRequest request);

    StudentResponse getStudentById(Long schoolId, Long studentId);

    Page<StudentResponse> getAllStudents(Long schoolId, Pageable pageable);

    List<StudentResponse> getStudentsByParent(Long schoolId, Long parentId);

    StudentResponse updateStudent(Long schoolId, Long studentId, CreateStudentRequest request);

    StudentResponse toggleStudentStatus(Long schoolId, Long studentId, boolean active);

    void deleteStudent(Long schoolId, Long studentId);
}
