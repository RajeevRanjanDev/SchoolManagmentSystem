package com.sms.school.service;

import com.sms.school.dto.request.CreateFeeRequest;
import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.FeePaymentResponse;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.dto.response.FeeSummaryResponse;
import com.sms.school.dto.response.StudentFeeSummaryResponse;

import java.math.BigDecimal;
import java.util.List;

public interface FeeService {

    FeeResponse createFee(Long schoolId, CreateFeeRequest request);

    List<FeeResponse> getStudentFees(Long schoolId, Long studentId);

    List<FeeResponse> getStudentFeesByYear(Long schoolId, Long studentId, String academicYear);

    FeeResponse recordPayment(Long schoolId, Long collectedByUserId, RecordFeePaymentRequest request);

    List<FeeResponse> getPendingFees(Long schoolId);

    List<FeeResponse> getAllFees(Long schoolId, String status, String academicYear);

    FeeSummaryResponse getFeeSummary(Long schoolId, String academicYear);

    /** Full payment/transaction history for a student (most recent first). */
    List<FeePaymentResponse> getStudentPayments(Long schoolId, Long studentId);

    /** Reconcile/adjust a fee (set a discount or waive the balance) — requires a reason. */
    FeeResponse adjustFee(Long schoolId, Long feeId, BigDecimal discount, boolean waiveRemaining, String remarks);

    /** Per-student fee totals for every active student in a section (optionally one academic year). */
    List<StudentFeeSummaryResponse> getSectionFeeSummary(Long schoolId, Long sectionId, String academicYear);
}
