package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Student;
import com.sms.school.entity.admission.StudentProfile;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.payment.PaymentService;
import com.sms.school.payment.dto.PaymentDtos.*;
import com.sms.school.repository.StudentRepository;
import com.sms.school.repository.admission.StudentProfileRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Student self-pay: create a Razorpay order for selected fees, verify, history, receipt. */
@RestController
@RequestMapping("/api/v1/student/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student Payments", description = "Pay outstanding fees online via Razorpay")
public class StudentPaymentController {

    private final PaymentService paymentService;
    private final StudentProfileRepository profileRepo;
    private final StudentRepository studentRepo;

    private record Ctx(Long schoolId, Long userId, Long studentId, String name, String email, String mobile) {}

    private Ctx resolve() {
        Long userId = TenantContext.getCurrentUserId();
        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentProfile p = profileRepo.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account."));
        Student s = studentRepo.findBySchoolIdAndAdmissionNumber(schoolId, p.getAdmissionNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Student enrolment record not found."));
        return new Ctx(schoolId, userId, s.getId(),
                (p.getFirstName() + " " + p.getLastName()).trim(), p.getEmail(), p.getMobile());
    }

    @PostMapping("/orders")
    @Operation(summary = "Create a Razorpay order for the selected fees")
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(@RequestBody CreateOrderRequest req) {
        Ctx c = resolve();
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.createOrder(c.schoolId(), c.studentId(), c.userId(), c.name(), c.email(), c.mobile(),
                        req.getFeeIds())));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify the Checkout response and allocate to fees")
    public ResponseEntity<ApiResponse<PaymentView>> verify(@RequestBody VerifyPaymentRequest req) {
        Ctx c = resolve();
        return ResponseEntity.ok(ApiResponse.success("Payment successful",
                paymentService.verify(c.schoolId(), c.studentId(), req)));
    }

    @GetMapping("/history")
    @Operation(summary = "The student's own online payment history")
    public ResponseEntity<ApiResponse<List<PaymentView>>> history() {
        Ctx c = resolve();
        return ResponseEntity.ok(ApiResponse.success(paymentService.history(c.schoolId(), c.studentId())));
    }

    @GetMapping("/{txnId}/receipt")
    @Operation(summary = "Receipt for a completed online payment")
    public ResponseEntity<ApiResponse<ReceiptView>> receipt(@PathVariable Long txnId) {
        Ctx c = resolve();
        return ResponseEntity.ok(ApiResponse.success(paymentService.receipt(c.schoolId(), txnId)));
    }
}
