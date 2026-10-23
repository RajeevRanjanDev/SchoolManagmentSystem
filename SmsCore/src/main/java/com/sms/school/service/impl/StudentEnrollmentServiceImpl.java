package com.sms.school.service.impl;

import com.sms.school.dto.request.EnrollStudentRequest;
import com.sms.school.dto.request.LinkParentRequest;
import com.sms.school.dto.request.PromoteStudentRequest;
import com.sms.school.dto.response.EnrollmentResponse;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.EnrollmentStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.StudentEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentEnrollmentServiceImpl implements StudentEnrollmentService {

    private final StudentRepository               studentRepository;
    private final SchoolClassRepository           classRepository;
    private final SectionRepository               sectionRepository;
    private final SchoolRepository                schoolRepository;
    private final StudentClassMappingRepository   enrollmentRepository;
    private final ParentRepository                parentRepository;
    private final StudentParentMappingRepository  studentParentMappingRepository;

    // ── Enroll ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public EnrollmentResponse enrollStudent(Long schoolId, Long studentId, EnrollStudentRequest req) {
        Student student = getStudent(schoolId, studentId);
        SchoolClass clazz = getClass(schoolId, req.getClassId());
        Section section = getSection(schoolId, req.getSectionId());

        // Guard: only one ACTIVE enrollment per student per year
        if (enrollmentRepository.existsBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                schoolId, studentId, req.getAcademicYear(), EnrollmentStatus.ACTIVE)) {
            throw new BusinessException(
                    "Student is already enrolled for academic year " + req.getAcademicYear()
                    + ". Use promote or transfer instead.");
        }

        StudentClassMapping mapping = StudentClassMapping.builder()
                .school(student.getSchool())
                .student(student)
                .schoolClass(clazz)
                .section(section)
                .academicYear(req.getAcademicYear())
                .rollNumber(req.getRollNumber())
                .current(true)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        StudentClassMapping saved = enrollmentRepository.save(mapping);
        return toResponse(saved);
    }

    // ── Promote ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public EnrollmentResponse promoteStudent(Long schoolId, Long studentId, PromoteStudentRequest req) {
        Student student = getStudent(schoolId, studentId);

        // Step 1: Find and close the current active enrollment
        StudentClassMapping current = enrollmentRepository
                .findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, req.getFromYear(), EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        "No active enrollment found for year " + req.getFromYear()));

        current.setCurrent(false);
        current.setStatus(EnrollmentStatus.PROMOTED);
        current.setRemarks(req.getRemarks() != null ? req.getRemarks() : "Promoted to " + req.getToYear());
        enrollmentRepository.save(current);

        // Step 2: Create new enrollment for the target year
        SchoolClass newClass   = getClass(schoolId,   req.getToClassId());
        Section     newSection = getSection(schoolId, req.getToSectionId());

        StudentClassMapping next = StudentClassMapping.builder()
                .school(student.getSchool())
                .student(student)
                .schoolClass(newClass)
                .section(newSection)
                .academicYear(req.getToYear())
                .rollNumber(req.getRollNumber())
                .current(true)
                .status(EnrollmentStatus.ACTIVE)
                .remarks("Promoted from " + req.getFromYear())
                .build();

        StudentClassMapping saved = enrollmentRepository.save(next);
        return toResponse(saved);
    }

    // ── Transfer ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public EnrollmentResponse transferSection(Long schoolId, Long studentId, EnrollStudentRequest req) {
        Student student = getStudent(schoolId, studentId);

        // Close existing ACTIVE enrollment for the SAME year
        StudentClassMapping current = enrollmentRepository
                .findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, req.getAcademicYear(), EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        "No active enrollment found for year " + req.getAcademicYear()));

        current.setCurrent(false);
        current.setStatus(EnrollmentStatus.TRANSFERRED);
        current.setRemarks("Transferred to new section");
        enrollmentRepository.save(current);

        // Open new enrollment for same year / new section
        SchoolClass clazz  = getClass(schoolId,   req.getClassId());
        Section     section = getSection(schoolId, req.getSectionId());

        StudentClassMapping next = StudentClassMapping.builder()
                .school(student.getSchool())
                .student(student)
                .schoolClass(clazz)
                .section(section)
                .academicYear(req.getAcademicYear())
                .rollNumber(req.getRollNumber())
                .current(true)
                .status(EnrollmentStatus.ACTIVE)
                .remarks("Transferred section")
                .build();

        return toResponse(enrollmentRepository.save(next));
    }

    // ── History & Active Enrollment ───────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentHistory(Long schoolId, Long studentId) {
        return enrollmentRepository
                .findBySchoolIdAndStudentIdAndDeletedFalseOrderByAcademicYearDesc(schoolId, studentId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EnrollmentResponse getActiveEnrollment(Long schoolId, Long studentId, String year) {
        return enrollmentRepository
                .findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
                        schoolId, studentId, year, EnrollmentStatus.ACTIVE)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Active enrollment not found for student " + studentId + " in " + year));
    }

    // ── Parent Linking ────────────────────────────────────────────────

    @Override
    @Transactional
    public void linkParent(Long schoolId, Long studentId, LinkParentRequest req) {
        Student student = getStudent(schoolId, studentId);
        Parent  parent  = parentRepository.findById(req.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent", req.getParentId()));

        if (!parent.getSchool().getId().equals(schoolId)) {
            throw new BusinessException("Parent does not belong to this school");
        }

        if (studentParentMappingRepository.existsBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(
                schoolId, studentId, req.getParentId())) {
            throw new BusinessException("Parent is already linked to this student");
        }

        StudentParentMapping mapping = StudentParentMapping.builder()
                .school(student.getSchool())
                .student(student)
                .parent(parent)
                .relationshipType(req.getRelationshipType())
                .primaryContact(req.isPrimaryContact())
                .emergencyContact(req.isEmergencyContact())
                .canPickup(req.isCanPickup())
                .build();

        studentParentMappingRepository.save(mapping);

        // Also set the legacy parent_id for backward compat (only if not set yet)
        if (student.getParent() == null) {
            student.setParent(parent);
            studentRepository.save(student);
        }
    }

    @Override
    @Transactional
    public void unlinkParent(Long schoolId, Long studentId, Long parentId) {
        StudentParentMapping mapping = studentParentMappingRepository
                .findBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(schoolId, studentId, parentId)
                .orElseThrow(() -> new BusinessException("Parent-student link not found"));

        mapping.setDeleted(true);
        studentParentMappingRepository.save(mapping);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private Student getStudent(Long schoolId, Long studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        if (!s.getSchool().getId().equals(schoolId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return s;
    }

    private SchoolClass getClass(Long schoolId, Long classId) {
        SchoolClass c = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        if (!c.getSchool().getId().equals(schoolId)) {
            throw new ResourceNotFoundException("Class", classId);
        }
        return c;
    }

    private Section getSection(Long schoolId, Long sectionId) {
        Section sec = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        if (!sec.getSchool().getId().equals(schoolId)) {
            throw new ResourceNotFoundException("Section", sectionId);
        }
        return sec;
    }

    private EnrollmentResponse toResponse(StudentClassMapping m) {
        return EnrollmentResponse.builder()
                .id(m.getId())
                .studentId(m.getStudent().getId())
                .studentName(m.getStudent().getFirstName() + " " + m.getStudent().getLastName())
                .classId(m.getSchoolClass().getId())
                .className(m.getSchoolClass().getName())
                .sectionId(m.getSection().getId())
                .sectionName(m.getSection().getName())
                .academicYear(m.getAcademicYear())
                .rollNumber(m.getRollNumber())
                .status(m.getStatus().name())
                .remarks(m.getRemarks())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
