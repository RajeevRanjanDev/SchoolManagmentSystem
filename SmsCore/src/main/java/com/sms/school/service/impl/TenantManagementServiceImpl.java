package com.sms.school.service.impl;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.RoleName;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.security.TenantContext;
import com.sms.school.security.TenantStatusChecker;
import com.sms.school.service.TenantManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.Set;

/**
 * Platform-level tenant management.
 *
 * SECURITY: Every public method is called only from SuperAdminController,
 * which is guarded by @PreAuthorize("hasRole('SUPER_ADMIN')").
 * No school_id is taken from TenantContext here — it always comes from the
 * explicit schoolId path parameter passed by the controller.
 *
 * AUDIT: Every mutation method writes to tenant_audit_log.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantManagementServiceImpl implements TenantManagementService {

    private final SchoolRepository            schoolRepository;
    private final SubscriptionPlanRepository  planRepository;
    private final TenantBrandingRepository    brandingRepository;
    private final TenantAuditLogRepository    auditRepository;
    private final UserRepository              userRepository;
    private final RoleRepository              roleRepository;
    private final StudentRepository           studentRepository;
    private final TeacherRepository           teacherRepository;
    private final ParentRepository            parentRepository;
    private final TenantStatusChecker         tenantStatusChecker;
    private final PasswordEncoder             passwordEncoder;
    private final com.sms.school.service.EmailService emailService;
    private final InvoiceRepository           invoiceRepository;

    // ── Tenant CRUD ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TenantResponse createTenant(CreateTenantRequest req) {
        // 1. Guards. School code must be unique. The school admin (who logs in with
        // the admin email) is mandatory, so admin email + mobile and the academic
        // year are required. The school's own contact email is NOT required to be
        // unique — it may repeat or match the admin email.
        if (schoolRepository.existsByCode(req.getCode())) {
            throw new BusinessException("School code '" + req.getCode() + "' already exists");
        }
        if (!StringUtils.hasText(req.getAdminEmail())) {
            throw new BusinessException("Admin email is required — the school admin logs in with it.");
        }
        if (!StringUtils.hasText(req.getAdminMobile())) {
            throw new BusinessException("Admin mobile number is required.");
        }
        if (!StringUtils.hasText(req.getCurrentAcademicYear())) {
            throw new BusinessException("Academic year is required.");
        }
        if (userRepository.findByEmail(req.getAdminEmail().trim()).isPresent()) {
            throw new BusinessException("This admin email is already registered. Use a different email.");
        }

        // 2. Resolve subscription plan
        SubscriptionPlan plan = resolvePlan(req.getPlanCode());

        // 3. Create school
        School school = School.builder()
                .name(req.getName())
                .legalName(req.getLegalName())
                .code(req.getCode().toUpperCase())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .country(req.getCountry())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .mobile(req.getMobile())
                .email(req.getEmail())
                .website(req.getWebsite())
                .logoUrl(req.getLogoUrl())
                .status(req.getStatus() != null ? req.getStatus() : "TRIAL")
                .subscriptionPlan(plan)
                .subscriptionExpiry(
                        plan != null && plan.getTrialDays() > 0
                                ? LocalDate.now().plusDays(plan.getTrialDays())
                                : LocalDate.now().plusYears(1))
                .currentAcademicYear(req.getCurrentAcademicYear())
                .build();
        school = schoolRepository.save(school);

        // 4. Initialize branding
        TenantBranding branding = TenantBranding.builder()
                .school(school)
                .logoUrl(req.getLogoUrl())
                .primaryColor(req.getPrimaryColor() != null ? req.getPrimaryColor() : "#1976D2")
                .secondaryColor(req.getSecondaryColor() != null ? req.getSecondaryColor() : "#FF5722")
                .tagline(req.getTagline())
                .build();
        brandingRepository.save(branding);

        // 5. Create school admin if provided
        if (StringUtils.hasText(req.getAdminEmail())) {
            createAdminUser(school,
                    req.getAdminFirstName(), req.getAdminLastName(),
                    req.getAdminEmail(), req.getAdminPassword(), req.getAdminMobile());
        }

        // 6. Audit
        audit(null, school, "CREATE_SCHOOL", "School", school.getId(),
                null, toJson("code", school.getCode(), "status", school.getStatus()));

        log.info("Tenant created: {} ({})", school.getName(), school.getCode());
        return toTenantResponse(school, 0L, 0L, 0L);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getTenant(Long schoolId) {
        School school = requireSchool(schoolId);
        long students = studentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long teachers = teacherRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long parents  = parentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        return toTenantResponse(school, students, teachers, parents);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantResponse> listTenants(String status, String search, Pageable pageable) {
        // A null String bound into lower('%'||:search||'%') makes PostgreSQL infer it
        // as bytea ("function lower(bytea) does not exist"). Pass empty string instead;
        // the query then matches all rows, i.e. no search filter.
        String safeStatus = (status == null || status.isBlank()) ? null : status;
        String safeSearch = (search == null) ? "" : search;
        return schoolRepository.findAllByFilter(safeStatus, safeSearch, pageable)
                .map(s -> {
                    long students = studentRepository.countBySchoolIdAndDeletedFalse(s.getId());
                    long teachers = teacherRepository.countBySchoolIdAndDeletedFalse(s.getId());
                    long parents  = parentRepository.countBySchoolIdAndDeletedFalse(s.getId());
                    return toTenantResponse(s, students, teachers, parents);
                });
    }

    @Override
    @Transactional
    public TenantResponse updateTenant(Long schoolId, CreateTenantRequest req) {
        School school = requireSchool(schoolId);
        String oldJson = toJson("name", school.getName(), "status", school.getStatus());

        if (StringUtils.hasText(req.getName()))       school.setName(req.getName());
        if (StringUtils.hasText(req.getLegalName()))  school.setLegalName(req.getLegalName());
        if (StringUtils.hasText(req.getAddress()))    school.setAddress(req.getAddress());
        if (StringUtils.hasText(req.getCity()))       school.setCity(req.getCity());
        if (StringUtils.hasText(req.getState()))      school.setState(req.getState());
        if (StringUtils.hasText(req.getCountry()))    school.setCountry(req.getCountry());
        if (StringUtils.hasText(req.getPincode()))    school.setPincode(req.getPincode());
        if (StringUtils.hasText(req.getPhone()))      school.setPhone(req.getPhone());
        if (StringUtils.hasText(req.getMobile()))     school.setMobile(req.getMobile());
        if (StringUtils.hasText(req.getEmail()))      school.setEmail(req.getEmail());
        if (StringUtils.hasText(req.getWebsite()))    school.setWebsite(req.getWebsite());
        if (StringUtils.hasText(req.getLogoUrl()))    school.setLogoUrl(req.getLogoUrl());
        if (StringUtils.hasText(req.getCurrentAcademicYear()))
            school.setCurrentAcademicYear(req.getCurrentAcademicYear());

        school = schoolRepository.save(school);
        audit(null, school, "UPDATE_SCHOOL", "School", schoolId, oldJson,
                toJson("name", school.getName()));
        return toTenantResponse(school, null, null, null);
    }

    @Override
    @Transactional
    public TenantResponse updateSchoolConfig(Long schoolId, UpdateSchoolConfigRequest req) {
        School s = requireSchool(schoolId);

        if (StringUtils.hasText(req.getLegalName()))          s.setLegalName(req.getLegalName());
        if (StringUtils.hasText(req.getRegistrationNumber())) s.setRegistrationNumber(req.getRegistrationNumber());
        if (req.getRegistrationDate() != null)                s.setRegistrationDate(req.getRegistrationDate());
        if (StringUtils.hasText(req.getSchoolType()))         s.setSchoolType(req.getSchoolType());
        if (StringUtils.hasText(req.getPan()))                s.setPan(req.getPan().trim().toUpperCase());
        if (StringUtils.hasText(req.getGstin()))              s.setGstin(req.getGstin().trim().toUpperCase());
        if (req.getGstinVerified() != null)                   s.setGstinVerified(req.getGstinVerified());
        if (StringUtils.hasText(req.getAffiliationBoard()))   s.setAffiliationBoard(req.getAffiliationBoard());
        if (StringUtils.hasText(req.getAffiliationNumber()))  s.setAffiliationNumber(req.getAffiliationNumber());
        if (StringUtils.hasText(req.getRecognitionDetails())) s.setRecognitionDetails(req.getRecognitionDetails());
        if (req.getAffiliationValidFrom() != null)            s.setAffiliationValidFrom(req.getAffiliationValidFrom());
        if (req.getAffiliationValidTo() != null)              s.setAffiliationValidTo(req.getAffiliationValidTo());
        if (StringUtils.hasText(req.getOperationalAddress())) s.setOperationalAddress(req.getOperationalAddress());
        if (StringUtils.hasText(req.getOperationalCity()))    s.setOperationalCity(req.getOperationalCity());
        if (StringUtils.hasText(req.getOperationalState()))   s.setOperationalState(req.getOperationalState());
        if (StringUtils.hasText(req.getOperationalPincode())) s.setOperationalPincode(req.getOperationalPincode());
        if (StringUtils.hasText(req.getSignatoryName()))      s.setSignatoryName(req.getSignatoryName());
        if (StringUtils.hasText(req.getSignatoryDesignation())) s.setSignatoryDesignation(req.getSignatoryDesignation());
        if (StringUtils.hasText(req.getSignatureUrl()))       s.setSignatureUrl(req.getSignatureUrl());
        if (StringUtils.hasText(req.getReceiptHeader()))      s.setReceiptHeader(req.getReceiptHeader());
        if (StringUtils.hasText(req.getReceiptFooter()))      s.setReceiptFooter(req.getReceiptFooter());
        if (StringUtils.hasText(req.getReceiptPrefix()))      s.setReceiptPrefix(req.getReceiptPrefix());
        if (StringUtils.hasText(req.getSenderDisplayName()))  s.setSenderDisplayName(req.getSenderDisplayName());
        if (StringUtils.hasText(req.getNotificationEmail()))  s.setNotificationEmail(req.getNotificationEmail());
        if (StringUtils.hasText(req.getNotificationPhone()))  s.setNotificationPhone(req.getNotificationPhone());
        if (StringUtils.hasText(req.getCurrentAcademicYear())) s.setCurrentAcademicYear(req.getCurrentAcademicYear());
        if (StringUtils.hasText(req.getLogoUrl()))            s.setLogoUrl(req.getLogoUrl());

        s = schoolRepository.save(s);
        audit(null, s, "UPDATE_CONFIG", "School", schoolId, null, toJson("code", s.getCode()));
        return toTenantResponse(s, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<TenantAuditResponse> getSchoolHistory(Long schoolId) {
        requireSchool(schoolId);
        return auditRepository.findBySchoolIdOrderByCreatedAtDesc(
                        schoolId, org.springframework.data.domain.PageRequest.of(0, 100))
                .map(a -> TenantAuditResponse.builder()
                        .id(a.getId())
                        .action(a.getAction())
                        .entityType(a.getEntityType())
                        .description(a.getDescription())
                        .oldValue(a.getOldValue())
                        .newValue(a.getNewValue())
                        .performedBy(a.getPerformedBy() != null
                                ? (a.getPerformedBy().getFirstName() + " " + a.getPerformedBy().getLastName()).trim()
                                : null)
                        .createdAt(a.getCreatedAt())
                        .build())
                .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> exportSchool(Long schoolId) {
        School s = requireSchool(schoolId);
        long students = studentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long teachers = teacherRepository.countBySchoolIdAndDeletedFalse(schoolId);
        long parents  = parentRepository.countBySchoolIdAndDeletedFalse(schoolId);
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("exportedAt", java.time.LocalDateTime.now().toString());
        out.put("school", toTenantResponse(s, students, teachers, parents));
        out.put("usage", java.util.Map.of("students", students, "teachers", teachers, "parents", parents));
        out.put("history", getSchoolHistory(schoolId));
        return out;
    }

    @Override
    @Transactional
    public TenantResponse updateStatus(Long schoolId, UpdateTenantStatusRequest req) {
        School school = requireSchool(schoolId);
        String oldStatus = school.getStatus();

        school.setStatus(req.getStatus());
        schoolRepository.save(school);

        // Evict cache so the filter picks up the new status immediately
        tenantStatusChecker.evict(schoolId);

        audit(null, school, req.getStatus().equals("SUSPENDED") ? "SUSPEND_SCHOOL" : "UPDATE_SCHOOL_STATUS",
                "School", schoolId,
                toJson("status", oldStatus),
                toJson("status", req.getStatus(), "reason", req.getReason()));

        log.info("Tenant {} status changed: {} → {}", school.getCode(), oldStatus, req.getStatus());
        return toTenantResponse(school, null, null, null);
    }

    // ── School Admin creation ─────────────────────────────────────────────────

    @Override
    @Transactional
    public void createSchoolAdmin(Long schoolId, CreateSchoolAdminRequest req) {
        School school = requireSchool(schoolId);

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("Email already registered: " + req.getEmail());
        }

        createAdminUser(school, req.getFirstName(), req.getLastName(),
                req.getEmail(), req.getPassword(), req.getMobile());

        audit(null, school, "CREATE_ADMIN", "User", schoolId, null,
                toJson("email", req.getEmail()));
    }

    // ── Subscription management ───────────────────────────────────────────────

    @Override
    @Transactional
    public TenantResponse assignSubscription(Long schoolId, AssignSubscriptionRequest req) {
        School school = requireSchool(schoolId);
        SubscriptionPlan plan = planRepository.findByPlanCodeAndDeletedFalse(req.getPlanCode())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + req.getPlanCode()));

        String oldPlan = school.getSubscriptionPlan() != null
                ? school.getSubscriptionPlan().getPlanCode() : "none";

        school.setSubscriptionPlan(plan);
        school.setSubscriptionExpiry(
                req.getExpiryDate() != null ? req.getExpiryDate() : LocalDate.now().plusYears(1));
        if ("TRIAL".equals(school.getStatus())) school.setStatus("ACTIVE");
        schoolRepository.save(school);
        tenantStatusChecker.evict(schoolId);

        audit(null, school, "ASSIGN_SUBSCRIPTION", "School", schoolId,
                toJson("plan", oldPlan),
                toJson("plan", req.getPlanCode(), "expiry", school.getSubscriptionExpiry().toString()));

        return toTenantResponse(school, null, null, null);
    }

    // ── Subscription renewal / billing / plans (Phase 4) ────────────────────────

    @Override
    @Transactional
    public TenantResponse renewSubscription(Long schoolId, int months) {
        School school = requireSchool(schoolId);
        LocalDate base = school.getSubscriptionExpiry() != null && school.getSubscriptionExpiry().isAfter(LocalDate.now())
                ? school.getSubscriptionExpiry() : LocalDate.now();
        school.setSubscriptionExpiry(base.plusMonths(Math.max(1, months)));
        if (!"TERMINATED".equals(school.getStatus())) school.setStatus("ACTIVE");
        schoolRepository.save(school);
        tenantStatusChecker.evict(schoolId);
        audit(null, school, "RENEW_SUBSCRIPTION", "School", schoolId, null,
                toJson("expiry", school.getSubscriptionExpiry().toString()));
        return toTenantResponse(school, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<InvoiceResponse> listInvoices(Long schoolId) {
        requireSchool(schoolId);
        return invoiceRepository.findBySchoolIdAndDeletedFalseOrderByIssueDateDesc(schoolId).stream()
                .map(this::toInvoiceResponse).toList();
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(Long schoolId, CreateInvoiceRequest req) {
        School school = requireSchool(schoolId);
        SubscriptionPlan plan = req.getPlanCode() != null
                ? planRepository.findByPlanCodeAndDeletedFalse(req.getPlanCode()).orElse(null)
                : school.getSubscriptionPlan();
        Invoice inv = invoiceRepository.save(Invoice.builder()
                .school(school)
                .invoiceNumber("INV-" + school.getCode() + "-" + System.currentTimeMillis())
                .planCode(plan != null ? plan.getPlanCode() : req.getPlanCode())
                .planName(plan != null ? plan.getPlanName() : null)
                .billingPeriod(req.getBillingPeriod())
                .amount(req.getAmount())
                .issueDate(req.getIssueDate() != null ? req.getIssueDate() : LocalDate.now())
                .dueDate(req.getDueDate())
                .notes(req.getNotes())
                .status("PENDING")
                .build());
        audit(null, school, "CREATE_INVOICE", "Invoice", inv.getId(), null,
                toJson("amount", String.valueOf(req.getAmount())));
        return toInvoiceResponse(inv);
    }

    @Override
    @Transactional
    public InvoiceResponse markInvoicePaid(Long schoolId, Long invoiceId) {
        School school = requireSchool(schoolId);
        Invoice inv = invoiceRepository.findById(invoiceId)
                .filter(i -> i.getSchool() != null && i.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));
        inv.setStatus("PAID");
        inv.setPaidDate(LocalDate.now());
        invoiceRepository.save(inv);
        audit(null, school, "INVOICE_PAID", "Invoice", invoiceId, null, null);
        return toInvoiceResponse(inv);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PlanResponse> listAllPlans() {
        return planRepository.findAll().stream()
                .filter(p -> !p.isDeleted())
                .sorted(java.util.Comparator.comparing(SubscriptionPlan::getMonthlyPrice))
                .map(this::toPlanResponse).toList();
    }

    @Override
    @Transactional
    public PlanResponse upsertPlan(UpsertPlanRequest req) {
        String code = req.getPlanCode().trim().toUpperCase();
        SubscriptionPlan byCode = planRepository.findByPlanCodeAndDeletedFalse(code).orElse(null);

        SubscriptionPlan plan;
        boolean isNew;
        if (req.getId() != null) {
            // Edit an existing plan; its code must stay unique to it.
            plan = planRepository.findById(req.getId())
                    .filter(p -> !p.isDeleted())
                    .orElseThrow(() -> new ResourceNotFoundException("Plan", req.getId()));
            if (byCode != null && !byCode.getId().equals(plan.getId())) {
                throw new BusinessException("Plan code '" + code + "' is already used by another plan.");
            }
            isNew = false;
        } else {
            // Create — the code must be unique.
            if (byCode != null) {
                throw new BusinessException("Plan code '" + code + "' already exists. Choose a different code.");
            }
            plan = new SubscriptionPlan();
            isNew = true;
        }
        plan.setPlanCode(code);
        plan.setPlanName(req.getPlanName());
        if (req.getDescription() != null)   plan.setDescription(req.getDescription());
        if (req.getMaxStudents() != null)   plan.setMaxStudents(req.getMaxStudents());
        if (req.getMaxTeachers() != null)   plan.setMaxTeachers(req.getMaxTeachers());
        if (req.getMaxParents() != null)    plan.setMaxParents(req.getMaxParents());
        if (req.getMaxStorageGb() != null)  plan.setMaxStorageGb(req.getMaxStorageGb());
        if (req.getFeatures() != null)      plan.setFeatures(req.getFeatures());
        if (req.getMonthlyPrice() != null)  plan.setMonthlyPrice(req.getMonthlyPrice());
        if (req.getAnnualPrice() != null)   plan.setAnnualPrice(req.getAnnualPrice());
        if (req.getTrialDays() != null)     plan.setTrialDays(req.getTrialDays());
        if (req.getStatus() != null)        plan.setStatus(req.getStatus());
        else if (isNew)                     plan.setStatus("ACTIVE");
        plan = planRepository.save(plan);
        return toPlanResponse(plan);
    }

    private InvoiceResponse toInvoiceResponse(Invoice i) {
        return InvoiceResponse.builder()
                .id(i.getId()).schoolId(i.getSchool().getId()).invoiceNumber(i.getInvoiceNumber())
                .planCode(i.getPlanCode()).planName(i.getPlanName()).billingPeriod(i.getBillingPeriod())
                .amount(i.getAmount()).issueDate(i.getIssueDate()).dueDate(i.getDueDate())
                .paidDate(i.getPaidDate()).status(i.getStatus()).notes(i.getNotes())
                .build();
    }

    private PlanResponse toPlanResponse(SubscriptionPlan p) {
        return PlanResponse.builder()
                .id(p.getId()).planCode(p.getPlanCode()).planName(p.getPlanName())
                .description(p.getDescription())
                .maxStudents(p.getMaxStudents()).maxTeachers(p.getMaxTeachers())
                .maxParents(p.getMaxParents()).maxStorageGb(p.getMaxStorageGb())
                .features(p.getFeatures())
                .monthlyPrice(p.getMonthlyPrice()).annualPrice(p.getAnnualPrice())
                .trialDays(p.getTrialDays()).status(p.getStatus())
                .build();
    }

    /**
     * Daily maintenance (SA-047 / SA-050): email renewal reminders for subscriptions
     * expiring within 7 days, and suspend ACTIVE schools whose subscription has been
     * expired beyond the grace period.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 30 6 * * *")
    @Transactional
    public void runSubscriptionMaintenance() {
        LocalDate today = LocalDate.now();
        for (School s : schoolRepository.findAll()) {
            if (s.isDeleted() || s.getSubscriptionExpiry() == null) continue;
            LocalDate exp = s.getSubscriptionExpiry();
            long daysToExpiry = java.time.temporal.ChronoUnit.DAYS.between(today, exp);

            if (("ACTIVE".equals(s.getStatus()) || "TRIAL".equals(s.getStatus())) && daysToExpiry >= 0 && daysToExpiry <= 7) {
                // Renewal reminder in the last 7 days before expiry.
                String to = s.getNotificationEmail() != null ? s.getNotificationEmail() : s.getEmail();
                if (to != null && !to.isBlank()) {
                    emailService.send(to, "Subscription renewal reminder",
                            "Your " + s.getName() + " subscription expires on " + exp
                                    + ". Please renew to avoid interruption.");
                }
            } else if (("ACTIVE".equals(s.getStatus()) || "TRIAL".equals(s.getStatus())) && daysToExpiry < 0) {
                // Subscription has ended → suspend the account.
                s.setStatus("SUSPENDED");
                schoolRepository.save(s);
                tenantStatusChecker.evict(s.getId());
                audit(null, s, "AUTO_SUSPEND_EXPIRED", "School", s.getId(), null,
                        toJson("expiredOn", exp.toString()));
            }
        }
    }

    // ── Branding management ───────────────────────────────────────────────────

    @Override
    @Transactional
    public BrandingResponse updateBranding(Long schoolId, UpdateTenantBrandingRequest req) {
        School school = requireSchool(schoolId);
        TenantBranding branding = brandingRepository.findBySchoolId(schoolId)
                .orElseGet(() -> TenantBranding.builder().school(school).build());

        if (req.getLogoUrl()       != null) branding.setLogoUrl(req.getLogoUrl());
        if (req.getFaviconUrl()    != null) branding.setFaviconUrl(req.getFaviconUrl());
        if (req.getBannerUrl()     != null) branding.setBannerUrl(req.getBannerUrl());
        if (req.getPrimaryColor()  != null) branding.setPrimaryColor(req.getPrimaryColor());
        if (req.getSecondaryColor()!= null) branding.setSecondaryColor(req.getSecondaryColor());
        if (req.getAccentColor()   != null) branding.setAccentColor(req.getAccentColor());
        if (req.getTagline()       != null) branding.setTagline(req.getTagline());
        if (req.getCustomCss()     != null) branding.setCustomCss(req.getCustomCss());

        brandingRepository.save(branding);
        audit(null, school, "UPDATE_BRANDING", "TenantBranding", schoolId, null, null);
        return toBrandingResponse(school, branding);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandingResponse getBranding(Long schoolId) {
        School school = requireSchool(schoolId);
        TenantBranding branding = brandingRepository.findBySchoolId(schoolId).orElse(null);
        return toBrandingResponse(school, branding);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PlatformStatsResponse getPlatformStats() {
        return PlatformStatsResponse.builder()
                .totalTenants(schoolRepository.countAll())
                .activeTenants(schoolRepository.countByStatus("ACTIVE"))
                .trialTenants(schoolRepository.countByStatus("TRIAL"))
                .suspendedTenants(schoolRepository.countByStatus("SUSPENDED"))
                .terminatedTenants(schoolRepository.countByStatus("TERMINATED"))
                .totalStudents(studentRepository.countAll())
                .totalTeachers(teacherRepository.countAll())
                .totalParents(parentRepository.countAll())
                .totalUsers(userRepository.countAllSchoolUsers())
                .alertSchools(listAlertSchools().size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<TenantResponse> listAlertSchools() {
        return schoolRepository.findAll().stream()
                .filter(s -> !s.isDeleted())
                .map(s -> toTenantResponse(s,
                        studentRepository.countBySchoolIdAndDeletedFalse(s.getId()),
                        teacherRepository.countBySchoolIdAndDeletedFalse(s.getId()),
                        parentRepository.countBySchoolIdAndDeletedFalse(s.getId())))
                .filter(TenantResponse::isUsageAlert)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PlanResponse> listPlans() {
        return planRepository.findByStatusAndDeletedFalse("ACTIVE").stream()
                .sorted(java.util.Comparator.comparing(com.sms.school.entity.SubscriptionPlan::getMonthlyPrice))
                .map(p -> PlanResponse.builder()
                        .id(p.getId()).planCode(p.getPlanCode()).planName(p.getPlanName())
                        .description(p.getDescription())
                        .maxStudents(p.getMaxStudents()).maxTeachers(p.getMaxTeachers())
                        .maxParents(p.getMaxParents()).maxStorageGb(p.getMaxStorageGb())
                        .features(p.getFeatures())
                        .monthlyPrice(p.getMonthlyPrice()).annualPrice(p.getAnnualPrice())
                        .trialDays(p.getTrialDays()).status(p.getStatus())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getTenantStats(Long schoolId) {
        return getTenant(schoolId);  // getTenant already includes counts
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private School requireSchool(Long schoolId) {
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
    }

    private SubscriptionPlan resolvePlan(String planCode) {
        String code = StringUtils.hasText(planCode) ? planCode : "TRIAL";
        return planRepository.findByPlanCodeAndDeletedFalse(code).orElse(null);
    }

    private void createAdminUser(School school, String firstName, String lastName,
                                  String email, String rawPassword, String mobile) {
        Role adminRole = roleRepository.findByName(RoleName.SCHOOL_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Role SCHOOL_ADMIN not found"));

        String pwd = StringUtils.hasText(rawPassword)
                ? passwordEncoder.encode(rawPassword)
                : passwordEncoder.encode("School@123");  // default, must be changed

        User admin = User.builder()
                .school(school)
                .firstName(firstName != null ? firstName : "Admin")
                .lastName(lastName != null ? lastName : school.getName())
                .email(email)
                .phone(mobile)
                .password(pwd)
                .userType("SCHOOL_USER")
                .active(true)
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(admin);
        log.info("School admin created: {} for school {}", email, school.getCode());
    }

    // ── School admin account management (Phase 3) ───────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public java.util.List<SchoolAdminResponse> listSchoolAdmins(Long schoolId) {
        requireSchool(schoolId);
        return userRepository.findBySchoolIdAndRoleName(schoolId, RoleName.SCHOOL_ADMIN).stream()
                .filter(u -> !u.isDeleted())
                .map(this::toAdminResponse)
                .toList();
    }

    @Override
    @Transactional
    public String resetAdminPassword(Long schoolId, Long userId) {
        School school = requireSchool(schoolId);
        User user = requireSchoolUser(schoolId, userId);
        String temp = com.sms.school.util.PasswordUtils.generateTempPassword();
        user.setPassword(passwordEncoder.encode(temp));
        userRepository.save(user);
        emailService.sendTempPassword(user.getEmail(),
                (user.getFirstName() + " " + user.getLastName()).trim(), user.getEmail(), temp);
        audit(null, school, "RESET_ADMIN_PASSWORD", "User", userId, null, null);
        return user.getEmail();
    }

    @Override
    @Transactional
    public SchoolAdminResponse setAdminActive(Long schoolId, Long userId, boolean active) {
        School school = requireSchool(schoolId);
        User user = requireSchoolUser(schoolId, userId);
        user.setActive(active);
        userRepository.save(user);
        audit(null, school, active ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN", "User", userId, null, null);
        return toAdminResponse(user);
    }

    private User requireSchoolUser(Long schoolId, Long userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getSchool() != null && u.getSchool().getId().equals(schoolId) && !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Admin", userId));
    }

    private SchoolAdminResponse toAdminResponse(User u) {
        return SchoolAdminResponse.builder()
                .id(u.getId()).firstName(u.getFirstName()).lastName(u.getLastName())
                .email(u.getEmail()).mobile(u.getPhone()).active(u.isActive())
                .status(u.isActive() ? "ACTIVE" : "DEACTIVATED").createdAt(u.getCreatedAt())
                .build();
    }

    private void audit(School school, School targetSchool, String action,
                       String entityType, Long entityId,
                       String oldValue, String newValue) {
        Long actorId = TenantContext.getCurrentUserId();
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalStateException("Audit: actor not found: " + actorId));

        auditRepository.save(TenantAuditLog.builder()
                .school(targetSchool)
                .performedBy(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .build());
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private TenantResponse toTenantResponse(School s, Long students, Long teachers, Long parents) {
        SubscriptionPlan plan = s.getSubscriptionPlan();
        TenantBranding branding = brandingRepository.findBySchoolId(s.getId()).orElse(null);

        // ── Usage vs plan + subscription alerts ──
        Integer studentPct = pct(students, plan != null ? plan.getMaxStudents() : null);
        Integer teacherPct = pct(teachers, plan != null ? plan.getMaxTeachers() : null);
        Integer parentPct  = pct(parents,  plan != null ? plan.getMaxParents()  : null);
        boolean overLimit = max3(studentPct, teacherPct, parentPct) >= 90;
        Long daysToExpiry = s.getSubscriptionExpiry() != null
                ? java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), s.getSubscriptionExpiry()) : null;
        boolean expired = daysToExpiry != null && daysToExpiry < 0;
        boolean expiringSoon = daysToExpiry != null && daysToExpiry >= 0 && daysToExpiry <= 30;
        boolean alert = overLimit || expired || expiringSoon;
        java.util.List<String> reasons = new java.util.ArrayList<>();
        if (overLimit) reasons.add("Login usage at/over 90% of plan limit");
        if (expired) reasons.add("Subscription expired");
        else if (expiringSoon) reasons.add("Subscription expires in " + daysToExpiry + " day(s)");

        return TenantResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .legalName(s.getLegalName())
                .code(s.getCode())
                .address(s.getAddress())
                .city(s.getCity())
                .state(s.getState())
                .country(s.getCountry())
                .pincode(s.getPincode())
                .phone(s.getPhone())
                .mobile(s.getMobile())
                .email(s.getEmail())
                .website(s.getWebsite())
                .logoUrl(s.getLogoUrl())
                .status(s.getStatus())
                .subscriptionPlan(plan != null ? plan.getPlanName() : null)
                .subscriptionPlanCode(plan != null ? plan.getPlanCode() : null)
                .subscriptionExpiry(s.getSubscriptionExpiry())
                .currentAcademicYear(s.getCurrentAcademicYear())
                .primaryColor(branding != null ? branding.getPrimaryColor() : "#1976D2")
                .secondaryColor(branding != null ? branding.getSecondaryColor() : "#FF5722")
                .tagline(branding != null ? branding.getTagline() : null)
                .studentCount(students)
                .teacherCount(teachers)
                .parentCount(parents)
                .maxStudents(plan != null ? plan.getMaxStudents() : null)
                .maxTeachers(plan != null ? plan.getMaxTeachers() : null)
                .maxParents(plan != null ? plan.getMaxParents() : null)
                .studentUsagePct(studentPct).teacherUsagePct(teacherPct).parentUsagePct(parentPct)
                .overLimitAlert(overLimit).subscriptionExpired(expired)
                .subscriptionExpiringSoon(expiringSoon).usageAlert(alert)
                .daysToExpiry(daysToExpiry)
                .alertReasons(String.join("; ", reasons))
                // Legal & configuration (PAN masked)
                .registrationNumber(s.getRegistrationNumber())
                .registrationDate(s.getRegistrationDate())
                .schoolType(s.getSchoolType())
                .pan(maskPan(s.getPan()))
                .gstin(s.getGstin())
                .gstinVerified(s.isGstinVerified())
                .affiliationBoard(s.getAffiliationBoard())
                .affiliationNumber(s.getAffiliationNumber())
                .recognitionDetails(s.getRecognitionDetails())
                .affiliationValidFrom(s.getAffiliationValidFrom())
                .affiliationValidTo(s.getAffiliationValidTo())
                .operationalAddress(s.getOperationalAddress())
                .operationalCity(s.getOperationalCity())
                .operationalState(s.getOperationalState())
                .operationalPincode(s.getOperationalPincode())
                .signatoryName(s.getSignatoryName())
                .signatoryDesignation(s.getSignatoryDesignation())
                .signatureUrl(s.getSignatureUrl())
                .receiptHeader(s.getReceiptHeader())
                .receiptFooter(s.getReceiptFooter())
                .receiptPrefix(s.getReceiptPrefix())
                .senderDisplayName(s.getSenderDisplayName())
                .notificationEmail(s.getNotificationEmail())
                .notificationPhone(s.getNotificationPhone())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    /** Usage percentage (count/limit), or null when the limit is unknown. */
    private Integer pct(Long count, Integer max) {
        if (count == null || max == null || max <= 0) return null;
        return (int) Math.round(count * 100.0 / max);
    }

    private int max3(Integer a, Integer b, Integer c) {
        int m = 0;
        if (a != null) m = Math.max(m, a);
        if (b != null) m = Math.max(m, b);
        if (c != null) m = Math.max(m, c);
        return m;
    }

    /** Mask a PAN for display: keep first 3 and last 1, mask the rest (ABC****1Z). */
    private String maskPan(String pan) {
        if (pan == null || pan.isBlank()) return null;
        String p = pan.trim();
        if (p.length() <= 4) return "****";
        return p.substring(0, 3) + "****" + p.substring(p.length() - 1);
    }

    private BrandingResponse toBrandingResponse(School s, TenantBranding b) {
        return BrandingResponse.builder()
                .schoolId(s.getId())
                .schoolName(s.getName())
                .schoolCode(s.getCode())
                .legalName(s.getLegalName())
                .logoUrl(b != null ? b.getLogoUrl() : s.getLogoUrl())
                .faviconUrl(b != null ? b.getFaviconUrl() : null)
                .bannerUrl(b != null ? b.getBannerUrl() : null)
                .primaryColor(b != null ? b.getPrimaryColor() : "#1976D2")
                .secondaryColor(b != null ? b.getSecondaryColor() : "#FF5722")
                .accentColor(b != null ? b.getAccentColor() : "#4CAF50")
                .tagline(b != null ? b.getTagline() : null)
                .city(s.getCity())
                .status(s.getStatus())
                .build();
    }

    /** Compact JSON string for audit log — avoids pulling in Jackson dependency here. */
    private String toJson(String... keyValues) {
        if (keyValues.length % 2 != 0) return "{}";
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < keyValues.length; i += 2) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(keyValues[i]).append("\":\"")
              .append(keyValues[i + 1] != null ? keyValues[i + 1] : "").append("\"");
        }
        return sb.append("}").toString();
    }
}
