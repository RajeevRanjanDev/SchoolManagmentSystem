package com.sms.school.service.employee.impl;

import com.sms.school.dto.request.employee.AssignEmployeeRequest;
import com.sms.school.dto.request.employee.CreateEmployeeRequest;
import com.sms.school.dto.request.employee.UpdateEmployeeRequest;
import com.sms.school.dto.response.employee.EmployeeResponse;
import com.sms.school.dto.response.employee.EmployeeSummaryResponse;
import com.sms.school.entity.School;
import com.sms.school.entity.academic.AcademicBatch;
import com.sms.school.entity.academic.AcademicProgram;
import com.sms.school.entity.academic.AcademicSemester;
import com.sms.school.entity.employee.*;
import com.sms.school.exception.BadRequestException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.academic.AcademicBatchRepository;
import com.sms.school.repository.academic.AcademicProgramRepository;
import com.sms.school.repository.employee.*;
import com.sms.school.service.employee.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final EmployeeDepartmentRepository deptRepo;
    private final EmployeeAssignmentRepository assignmentRepo;
    private final AcademicProgramRepository programRepo;
    private final AcademicBatchRepository batchRepo;
    private final SchoolRepository schoolRepo;

    // Simple in-memory sequence per tenant — replace with DB sequence for prod
    private final AtomicLong seq = new AtomicLong(1);

    @Override
    @Transactional
    public EmployeeResponse create(Long tenantId, CreateEmployeeRequest req, String createdBy) {
        School tenant = schoolRepo.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        if (req.getAadhaarNumber() != null && employeeRepo.existsByTenantIdAndAadhaarNumber(tenantId, req.getAadhaarNumber()))
            throw new BadRequestException("Aadhaar already registered in this institution");

        if (req.getOfficialEmail() != null && employeeRepo.existsByTenantIdAndOfficialEmail(tenantId, req.getOfficialEmail()))
            throw new BadRequestException("Official email already registered");

        String code = generateCode(tenantId);

        EmployeeDepartment dept = req.getDepartmentId() != null
                ? deptRepo.findById(req.getDepartmentId()).orElse(null) : null;

        Employee employee = Employee.builder()
                .tenant(tenant)
                .employeeCode(code)
                .firstName(req.getFirstName())
                .middleName(req.getMiddleName())
                .lastName(req.getLastName())
                .gender(req.getGender())
                .dateOfBirth(req.getDateOfBirth())
                .bloodGroup(req.getBloodGroup())
                .aadhaarNumber(req.getAadhaarNumber())
                .panNumber(req.getPanNumber())
                .mobile(req.getMobile())
                .email(req.getEmail())
                .officialEmail(req.getOfficialEmail())
                .employeeType(req.getEmployeeType() != null ? req.getEmployeeType() : "FULL_TIME")
                .joiningDate(req.getJoiningDate() != null ? req.getJoiningDate() : LocalDate.now())
                .department(dept)
                .currentAddress(req.getCurrentAddress())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .build();

        return toResponse(employeeRepo.save(employee));
    }

    @Override
    @Transactional
    public void assignToAcademic(Long tenantId, Long employeeId, AssignEmployeeRequest req, String assignedBy) {
        Employee employee = employeeRepo.findByTenantIdAndIdAndDeletedFalse(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        School tenant = employee.getTenant();

        EmployeeAssignment.EmployeeAssignmentBuilder builder = EmployeeAssignment.builder()
                .tenant(tenant)
                .employee(employee)
                .assignmentType(req.getAssignmentType())
                .academicSession(req.getAcademicSession())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate());

        switch (req.getAssignmentType()) {
            case "CLASS_SECTION" -> {
                builder.assignmentType("CLASS_SECTION");
            }
            case "PROGRAM_SEMESTER" -> {
                AcademicProgram program = programRepo.findById(req.getProgramId())
                        .orElseThrow(() -> new ResourceNotFoundException("Program not found"));
                builder.program(program);
                if (req.getSemesterId() != null) {
                    AcademicSemester sem = program.getSemesters().stream()
                            .filter(s -> s.getId().equals(req.getSemesterId()))
                            .findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("Semester not found in program"));
                    builder.semester(sem);
                }
            }
            case "BATCH_COURSE" -> {
                AcademicBatch batch = batchRepo.findById(req.getBatchId())
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
                builder.batch(batch);
            }
        }

        assignmentRepo.save(builder.build());
    }

    @Override
    @Transactional
    public void uploadDocument(Long tenantId, Long employeeId, String documentType,
                               MultipartFile file, String uploadedBy) {
        Employee employee = employeeRepo.findByTenantIdAndIdAndDeletedFalse(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // TODO: upload file to S3/storage and get URL
        String fileUrl = "/uploads/employees/" + employeeId + "/" + documentType + "_" + System.currentTimeMillis();

        EmployeeDocument doc = EmployeeDocument.builder()
                .tenant(employee.getTenant())
                .employee(employee)
                .documentType(documentType)
                .fileUrl(fileUrl)
                .fileName(file.getOriginalFilename())
                .status("PENDING")
                .build();

        employee.getDocuments().add(doc);
        employeeRepo.save(employee);
    }

    @Override
    @Transactional
    public void terminate(Long tenantId, Long employeeId, String reason, String terminatedBy) {
        Employee employee = employeeRepo.findByTenantIdAndIdAndDeletedFalse(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        employee.setEmploymentStatus("TERMINATED");
        employee.setLastWorkingDate(LocalDate.now());
        employeeRepo.save(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long tenantId, Long employeeId) {
        return toResponse(employeeRepo.findByTenantIdAndIdAndDeletedFalse(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found")));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeSummaryResponse> list(Long tenantId, String status, String search, Pageable pageable) {
        return employeeRepo.search(tenantId, status, search, pageable).map(this::toSummary);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long tenantId, Long employeeId, UpdateEmployeeRequest req, String updatedBy) {
        Employee e = employeeRepo.findByTenantIdAndIdAndDeletedFalse(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (req.getMobile() != null) e.setMobile(req.getMobile());
        if (req.getCurrentAddress() != null) e.setCurrentAddress(req.getCurrentAddress());
        if (req.getCity() != null) e.setCity(req.getCity());
        if (req.getState() != null) e.setState(req.getState());
        return toResponse(employeeRepo.save(e));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String generateCode(Long tenantId) {
        long count = employeeRepo.countByTenantIdAndEmploymentStatusAndDeletedFalse(tenantId, "ACTIVE") + seq.getAndIncrement();
        return String.format("EMP-%d-%06d", Year.now().getValue(), count);
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .employeeCode(e.getEmployeeCode())
                .fullName(e.getFullName())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .gender(e.getGender())
                .mobile(e.getMobile())
                .email(e.getEmail())
                .officialEmail(e.getOfficialEmail())
                .employeeType(e.getEmployeeType())
                .employmentStatus(e.getEmploymentStatus())
                .joiningDate(e.getJoiningDate())
                .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                .designationName(e.getDesignation() != null ? e.getDesignation().getName() : null)
                .profilePhotoUrl(e.getProfilePhotoUrl())
                .build();
    }

    private EmployeeSummaryResponse toSummary(Employee e) {
        return EmployeeSummaryResponse.builder()
                .id(e.getId())
                .employeeCode(e.getEmployeeCode())
                .fullName(e.getFullName())
                .employeeType(e.getEmployeeType())
                .employmentStatus(e.getEmploymentStatus())
                .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                .designationName(e.getDesignation() != null ? e.getDesignation().getName() : null)
                .build();
    }
}
