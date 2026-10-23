package com.sms.school.payment;

import com.sms.school.entity.School;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.payment.dto.PaymentDtos.GatewayAccountRequest;
import com.sms.school.payment.dto.PaymentDtos.GatewayAccountView;
import com.sms.school.payment.entity.SchoolPaymentGatewayAccount;
import com.sms.school.payment.repository.PaymentRepositories.GatewayAccountRepo;
import com.sms.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/** Manages a school's Razorpay gateway credentials (encrypted at rest). */
@Service
@RequiredArgsConstructor
public class GatewayAccountService {

    private final GatewayAccountRepo repo;
    private final SchoolRepository schoolRepository;
    private final CryptoService crypto;

    /** The active account for checkout — prefer LIVE, fall back to TEST. */
    @Transactional(readOnly = true)
    public SchoolPaymentGatewayAccount resolveActive(Long schoolId) {
        return repo.findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(schoolId, "LIVE")
                .or(() -> repo.findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(schoolId, "TEST"))
                .orElseThrow(() -> new BusinessException(
                        "Online payment is not configured for this school yet. Ask the admin to add Razorpay keys."));
    }

    @Transactional(readOnly = true)
    public SchoolPaymentGatewayAccount requireByOrderResolution(Long schoolId) {
        return resolveActive(schoolId);
    }

    @Transactional(readOnly = true)
    public List<GatewayAccountView> list(Long schoolId) {
        return repo.findBySchoolIdAndDeletedFalse(schoolId).stream().map(this::toView).toList();
    }

    @Transactional
    public GatewayAccountView save(Long schoolId, GatewayAccountRequest req) {
        String mode = req.getMode() == null ? "TEST" : req.getMode().trim().toUpperCase();
        if (!mode.equals("TEST") && !mode.equals("LIVE")) {
            throw new BusinessException("Mode must be TEST or LIVE.");
        }
        if (!StringUtils.hasText(req.getKeyId())) throw new BusinessException("Key ID is required.");

        SchoolPaymentGatewayAccount acc = repo
                .findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(schoolId, mode)
                .orElseGet(() -> {
                    School school = schoolRepository.findById(schoolId)
                            .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
                    return SchoolPaymentGatewayAccount.builder().school(school).mode(mode).build();
                });

        acc.setKeyId(req.getKeyId().trim());
        // Only overwrite secrets when a new plaintext value is supplied.
        if (StringUtils.hasText(req.getKeySecret())) acc.setKeySecret(crypto.encrypt(req.getKeySecret().trim()));
        if (StringUtils.hasText(req.getWebhookSecret())) acc.setWebhookSecret(crypto.encrypt(req.getWebhookSecret().trim()));
        if (req.getActive() != null) acc.setActive(req.getActive());

        if (!StringUtils.hasText(acc.getKeySecret())) {
            throw new BusinessException("Key secret is required.");
        }
        return toView(repo.save(acc));
    }

    private GatewayAccountView toView(SchoolPaymentGatewayAccount a) {
        return GatewayAccountView.builder()
                .id(a.getId()).mode(a.getMode()).keyId(a.getKeyId())
                .hasSecret(StringUtils.hasText(a.getKeySecret()))
                .hasWebhookSecret(StringUtils.hasText(a.getWebhookSecret()))
                .active(a.isActive())
                .build();
    }
}
