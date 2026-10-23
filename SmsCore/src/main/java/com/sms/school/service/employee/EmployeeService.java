package com.sms.school.service.employee;

import com.sms.school.dto.request.employee.CreateEmployeeRequest;
import com.sms.school.dto.request.employee.AssignEmployeeRequest;
import com.sms.school.dto.request.employee.UpdateEmployeeRequest;
import com.sms.school.dto.response.employee.EmployeeResponse;
import com.sms.school.dto.response.employee.EmployeeSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {
    EmployeeResponse create(Long tenantId, CreateEmployeeRequest request, String createdBy);
    EmployeeResponse update(Long tenantId, Long employeeId, UpdateEmployeeRequest request, String updatedBy);
    EmployeeResponse getById(Long tenantId, Long employeeId);
    Page<EmployeeSummaryResponse> list(Long tenantId, String status, String search, Pageable pageable);
    void assignToAcademic(Long tenantId, Long employeeId, AssignEmployeeRequest request, String assignedBy);
    void uploadDocument(Long tenantId, Long employeeId, String documentType, MultipartFile file, String uploadedBy);
    void terminate(Long tenantId, Long employeeId, String reason, String terminatedBy);
}
