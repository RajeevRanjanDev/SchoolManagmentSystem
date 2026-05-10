package com.sms.school.service;

import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.FeeResponse;

import java.util.List;

public interface FeeService {

    List<FeeResponse> getStudentFees(Long schoolId, Long studentId);

    List<FeeResponse> getStudentFeesByYear(Long schoolId, Long studentId, String academicYear);

    FeeResponse recordPayment(Long schoolId, Long collectedByUserId, RecordFeePaymentRequest request);

    List<FeeResponse> getPendingFees(Long schoolId);
}
