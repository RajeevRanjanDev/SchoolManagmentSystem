package com.sms.school.service.impl;

import com.sms.school.dto.request.CreateFeeRequest;
import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.dto.response.FeeSummaryResponse;
import com.sms.school.dto.response.StudentFeeSummaryResponse;
import com.sms.school.entity.Fee;
import com.sms.school.entity.FeePayment;
import com.sms.school.entity.School;
import com.sms.school.entity.Student;
import com.sms.school.entity.StudentClassMapping;
import com.sms.school.entity.User;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.FeePaymentRepository;
import com.sms.school.repository.FeeRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.StudentClassMappingRepository;
import com.sms.school.repository.StudentRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeeServiceImpl implements FeeService {

    private final FeeRepository        feeRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final UserRepository       userRepository;
    private final SchoolRepository     schoolRepository;
    private final StudentRepository    studentRepository;
    private final StudentClassMappingRepository classMappingRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FeeResponse createFee(Long schoolId, CreateFeeRequest req) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        Student student = studentRepository.findById(req.getStudentId())
                .filter(s -> s.getSchool().getId().equals(schoolId) && !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Student", req.getStudentId()));

        Fee fee = Fee.builder()
                .school(school)
                .student(student)
                .feeCategory(req.getFeeCategory())
                .academicYear(req.getAcademicYear())
                .feePeriod(req.getFeePeriod())
                .amount(req.getAmount())
                .discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
                .fine(req.getFine() != null ? req.getFine() : BigDecimal.ZERO)
                .dueDate(req.getDueDate())
                .status(FeeStatus.PENDING)
                .remarks(req.getRemarks())
                .build();

        return toResponse(feeRepository.save(fee));
    }

    // ── Read ──────────────────────────────────────────────────────────────────

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
    @Transactional(readOnly = true)
    public List<StudentFeeSummaryResponse> getSectionFeeSummary(Long schoolId, Long sectionId, String academicYear) {
        boolean filterYear = academicYear != null && !academicYear.isBlank() && !"ALL".equalsIgnoreCase(academicYear);
        List<StudentFeeSummaryResponse> result = new ArrayList<>();

        for (StudentClassMapping m : classMappingRepository.findActiveBySection(sectionId)) {
            Student st = m.getStudent();
            if (st == null) continue;

            List<Fee> fees = filterYear
                    ? feeRepository.findByStudentIdAndAcademicYearAndDeletedFalse(st.getId(), academicYear)
                    : feeRepository.findByStudentIdAndDeletedFalse(st.getId());

            BigDecimal billed = BigDecimal.ZERO, paid = BigDecimal.ZERO, balance = BigDecimal.ZERO;
            for (Fee f : fees) {
                FeeResponse r = toResponse(f);
                billed  = billed.add(nz(r.getNetAmount()));
                paid    = paid.add(nz(r.getPaidAmount()));
                balance = balance.add(nz(r.getBalance()).max(BigDecimal.ZERO));
            }

            result.add(StudentFeeSummaryResponse.builder()
                    .studentId(st.getId())
                    .studentName((st.getFirstName() + " " + st.getLastName()).trim())
                    .admissionNumber(st.getAdmissionNumber())
                    .rollNumber(m.getRollNumber())
                    .totalBilled(billed)
                    .totalPaid(paid)
                    .totalBalance(balance)
                    .feeCount(fees.size())
                    .build());
        }

        result.sort((a, b) -> rollSort(a.getRollNumber()) - rollSort(b.getRollNumber()));
        return result;
    }

    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    private static int rollSort(String roll) {
        if (roll == null) return Integer.MAX_VALUE;
        String digits = roll.replaceAll("\\D", "");
        try { return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits); }
        catch (NumberFormatException e) { return Integer.MAX_VALUE; }
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getPendingFees(Long schoolId) {
        return feeRepository.findBySchoolIdAndStatusAndDeletedFalse(schoolId, FeeStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getAllFees(Long schoolId, String status, String academicYear) {
        List<Fee> fees;
        if (status != null && !status.isBlank()) {
            FeeStatus feeStatus = FeeStatus.valueOf(status.toUpperCase());
            fees = feeRepository.findBySchoolIdAndStatusAndDeletedFalse(schoolId, feeStatus);
        } else if (academicYear != null && !academicYear.isBlank()) {
            fees = feeRepository.findBySchoolIdAndAcademicYearAndDeletedFalse(schoolId, academicYear);
        } else {
            fees = feeRepository.findBySchoolIdAndDeletedFalse(schoolId);
        }
        return fees.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FeeSummaryResponse getFeeSummary(Long schoolId, String academicYear) {
        List<Fee> fees = academicYear != null && !academicYear.isBlank()
                ? feeRepository.findBySchoolIdAndAcademicYearAndDeletedFalse(schoolId, academicYear)
                : feeRepository.findBySchoolIdAndDeletedFalse(schoolId);

        BigDecimal totalBilled    = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal totalPending   = BigDecimal.ZERO;
        BigDecimal totalOverdue   = BigDecimal.ZERO;
        long countPaid = 0, countPending = 0, countPartial = 0, countOverdue = 0;

        for (Fee fee : fees) {
            BigDecimal net = net(fee);
            totalBilled = totalBilled.add(net);

            switch (fee.getStatus()) {
                case PAID    -> { totalCollected = totalCollected.add(net); countPaid++; }
                case PENDING -> { totalPending   = totalPending.add(net);   countPending++; }
                case PARTIAL -> { totalPending   = totalPending.add(net);   countPartial++;
                                  BigDecimal paid = paidAmount(fee.getId());
                                  totalCollected  = totalCollected.add(paid); }
                default      -> { totalOverdue   = totalOverdue.add(net);   countOverdue++; }
            }
        }

        return FeeSummaryResponse.builder()
                .totalBilled(totalBilled)
                .totalCollected(totalCollected)
                .totalPending(totalPending)
                .totalOverdue(totalOverdue)
                .countPaid(countPaid)
                .countPending(countPending)
                .countPartial(countPartial)
                .countOverdue(countOverdue)
                .build();
    }

    // ── Payment ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FeeResponse recordPayment(Long schoolId, Long collectedByUserId,
                                     RecordFeePaymentRequest request) {
        if (request.getRemarks() == null || request.getRemarks().isBlank())
            throw new com.sms.school.exception.BusinessException(
                    "A comment is required (e.g. how and why this payment was reconciled).");

        Fee fee = feeRepository.findById(request.getFeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee", request.getFeeId()));

        User collectedBy = userRepository.findById(collectedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", collectedByUserId));

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

        BigDecimal totalPaid = paidAmount(fee.getId());
        BigDecimal netAmount = net(fee);

        fee.setStatus(totalPaid.compareTo(netAmount) >= 0 ? FeeStatus.PAID : FeeStatus.PARTIAL);
        feeRepository.save(fee);

        return toResponse(fee);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal net(Fee fee) {
        return fee.getAmount()
                .subtract(fee.getDiscount() != null ? fee.getDiscount() : BigDecimal.ZERO)
                .add(fee.getFine() != null ? fee.getFine() : BigDecimal.ZERO);
    }

    private BigDecimal paidAmount(Long feeId) {
        return feePaymentRepository.findByFeeIdAndDeletedFalse(feeId)
                .stream().map(FeePayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FeeResponse toResponse(Fee fee) {
        BigDecimal paid = paidAmount(fee.getId());
        BigDecimal net = net(fee);
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
                .paidAmount(paid)
                .balance(net.subtract(paid))
                .dueDate(fee.getDueDate())
                .status(fee.getStatus())
                .remarks(fee.getRemarks())
                .build();
    }

    // ── Payment history + reconciliation ───────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<com.sms.school.dto.response.FeePaymentResponse> getStudentPayments(Long schoolId, Long studentId) {
        return feePaymentRepository.findByFeeStudentIdAndDeletedFalse(studentId).stream()
                .sorted(java.util.Comparator.comparing(FeePayment::getPaymentDate).reversed())
                .map(p -> com.sms.school.dto.response.FeePaymentResponse.builder()
                        .id(p.getId())
                        .feeId(p.getFee().getId())
                        .feeCategory(p.getFee().getFeeCategory())
                        .feePeriod(p.getFee().getFeePeriod())
                        .academicYear(p.getFee().getAcademicYear())
                        .amountPaid(p.getAmountPaid())
                        .paymentDate(p.getPaymentDate())
                        .paymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : null)
                        .transactionReference(p.getTransactionReference())
                        .receiptNumber(p.getReceiptNumber())
                        .collectedByName(p.getCollectedBy() != null
                                ? p.getCollectedBy().getFirstName() + " " + p.getCollectedBy().getLastName() : "—")
                        .remarks(p.getRemarks())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public FeeResponse adjustFee(Long schoolId, Long feeId, BigDecimal discount, boolean waiveRemaining, String remarks) {
        if (remarks == null || remarks.isBlank())
            throw new com.sms.school.exception.BusinessException("A reason/comment is required for any fee adjustment.");

        Fee fee = feeRepository.findById(feeId)
                .filter(f -> f.getSchool().getId().equals(schoolId) && !f.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Fee", feeId));

        if (waiveRemaining) {
            // Discount exactly the outstanding balance so nothing is due.
            BigDecimal paid = paidAmount(feeId);
            BigDecimal outstanding = net(fee).subtract(paid);
            BigDecimal extra = outstanding.max(BigDecimal.ZERO);
            fee.setDiscount((fee.getDiscount() != null ? fee.getDiscount() : BigDecimal.ZERO).add(extra));
        } else if (discount != null) {
            fee.setDiscount(discount);
        }

        // Append the reason to the fee remarks for an audit trail.
        String prev = fee.getRemarks() != null && !fee.getRemarks().isBlank() ? fee.getRemarks() + " | " : "";
        fee.setRemarks(prev + "Adjustment: " + remarks);

        // Recompute status against the new net amount.
        BigDecimal paid = paidAmount(feeId);
        BigDecimal net = net(fee);
        fee.setStatus(paid.compareTo(net) >= 0 ? FeeStatus.PAID
                : paid.compareTo(BigDecimal.ZERO) > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING);

        return toResponse(feeRepository.save(fee));
    }
}
