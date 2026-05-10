package com.sms.school.service.impl;

import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.entity.Fee;
import com.sms.school.entity.FeePayment;
import com.sms.school.entity.User;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.FeePaymentRepository;
import com.sms.school.repository.FeeRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeeServiceImpl implements FeeService {

    private final FeeRepository feeRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getStudentFees(Long schoolId, Long studentId) {
        return feeRepository.findByStudentIdAndDeletedFalse(studentId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getStudentFeesByYear(Long schoolId, Long studentId, String academicYear) {
        return feeRepository.findByStudentIdAndAcademicYearAndDeletedFalse(studentId, academicYear)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public FeeResponse recordPayment(Long schoolId, Long collectedByUserId,
                                     RecordFeePaymentRequest request) {
        Fee fee = feeRepository.findById(request.getFeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee", request.getFeeId()));

        User collectedBy = userRepository.findById(collectedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", collectedByUserId));

        // Save the payment record
        FeePayment payment = FeePayment.builder()
                .school(fee.getSchool())
                .fee(fee)
                .amountPaid(request.getAmountPaid())
                .paymentDate(request.getPaymentDate() != null
                        ? request.getPaymentDate() : LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .receiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .collectedBy(collectedBy)
                .remarks(request.getRemarks())
                .build();
        feePaymentRepository.save(payment);

        // Update fee status based on total payments so far
        BigDecimal netAmount = fee.getAmount()
                .subtract(fee.getDiscount() != null ? fee.getDiscount() : BigDecimal.ZERO)
                .add(fee.getFine() != null ? fee.getFine() : BigDecimal.ZERO);

        BigDecimal totalPaid = feePaymentRepository.findByFeeIdAndDeletedFalse(fee.getId())
                .stream().map(FeePayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(netAmount) >= 0) {
            fee.setStatus(FeeStatus.PAID);
        } else {
            fee.setStatus(FeeStatus.PARTIAL);
        }
        feeRepository.save(fee);

        return toResponse(fee);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getPendingFees(Long schoolId) {
        return feeRepository.findBySchoolIdAndStatusAndDeletedFalse(schoolId, FeeStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    // ── Private helpers ───────────────────────────────────────────────

    private FeeResponse toResponse(Fee fee) {
        BigDecimal net = fee.getAmount()
                .subtract(fee.getDiscount() != null ? fee.getDiscount() : BigDecimal.ZERO)
                .add(fee.getFine() != null ? fee.getFine() : BigDecimal.ZERO);

        return FeeResponse.builder()
                .id(fee.getId())
                .studentId(fee.getStudent().getId())
                .studentName(fee.getStudent().getFirstName() + " " + fee.getStudent().getLastName())
                .feeCategory(fee.getFeeCategory())
                .academicYear(fee.getAcademicYear())
                .feePeriod(fee.getFeePeriod())
                .amount(fee.getAmount())
                .discount(fee.getDiscount())
                .fine(fee.getFine())
                .netAmount(net)
                .dueDate(fee.getDueDate())
                .status(fee.getStatus())
                .remarks(fee.getRemarks())
                .build();
    }
}
