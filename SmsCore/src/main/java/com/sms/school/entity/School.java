package com.sms.school.entity;

import com.sms.school.entity.enums.InstitutionType;
import jakarta.persistence.*;
import lombok.*;

/**
 * TENANT ROOT ENTITY.
 *
 * Every school registered on the platform is a tenant.
 * school_id = tenant_id in all business tables.
 *
 * Status values:
 *   TRIAL       – new account, 30-day free trial
 *   ACTIVE      – paying, full access
 *   SUSPENDED   – payment lapsed / admin suspended — login blocked
 *   TERMINATED  – permanently closed — data retained for export only
 */
@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School extends BaseEntity {

    // ── Identity ───────────────────────────────────────────────────────────────

    @Column(name = "name", nullable = false)
    private String name;

    /** Legal/registered name of the institute */
    @Column(name = "legal_name")
    private String legalName;

    /** Unique short code used in tenant identification (e.g. "DPS-NOIDA") */
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    // ── Contact / Address ──────────────────────────────────────────────────────

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "phone")
    private String phone;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    @Column(name = "logo_url")
    private String logoUrl;

    // ── Tenant Status ──────────────────────────────────────────────────────────

    /**
     * Lifecycle status of this tenant account.
     * Values: TRIAL | ACTIVE | SUSPENDED | TERMINATED
     *
     * is_active is kept for backward compatibility but status is authoritative.
     */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "TRIAL";

    /** @deprecated Use {@link #status} instead. Kept for backward compat. */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    // ── Subscription ───────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_plan_id")
    private SubscriptionPlan subscriptionPlan;

    @Column(name = "subscription_expiry")
    private java.time.LocalDate subscriptionExpiry;

    // ── Institution Type ───────────────────────────────────────────────────────

    /**
     * Institution type — drives template selection, UI rendering,
     * and academic-structure logic. Nullable for backward compatibility
     * with existing school tenants (defaults to SCHOOL on read).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "institution_type", length = 30)
    @Builder.Default
    private InstitutionType institutionType = InstitutionType.SCHOOL;

    // ── Academic ───────────────────────────────────────────────────────────────

    /** Academic year e.g. "2025-26" */
    @Column(name = "current_academic_year")
    private String currentAcademicYear;

    // ── Legal identity (Phase 2) ────────────────────────────────────────────────

    /** Registration/society/trust number. */
    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "registration_date")
    private java.time.LocalDate registrationDate;

    /** Ownership type e.g. GOVERNMENT | PRIVATE | AIDED | TRUST. */
    @Column(name = "school_type")
    private String schoolType;

    /** PAN — stored as-is, masked on read for non-privileged views. */
    @Column(name = "pan", length = 20)
    private String pan;

    @Column(name = "gstin", length = 20)
    private String gstin;

    // columnDefinition carries a SQL default so ddl-auto can add this NOT NULL
    // column to the existing (non-empty) schools table without failing.
    @Column(name = "gstin_verified", nullable = false, columnDefinition = "boolean not null default false")
    @Builder.Default
    private boolean gstinVerified = false;

    // ── Affiliation ──────────────────────────────────────────────────────────────

    @Column(name = "affiliation_board")
    private String affiliationBoard;          // CBSE | ICSE | STATE | IB | ...

    @Column(name = "affiliation_number")
    private String affiliationNumber;

    @Column(name = "recognition_details")
    private String recognitionDetails;

    @Column(name = "affiliation_valid_from")
    private java.time.LocalDate affiliationValidFrom;

    @Column(name = "affiliation_valid_to")
    private java.time.LocalDate affiliationValidTo;

    // ── Operational address (registered address is the base contact block above) ──

    @Column(name = "operational_address")
    private String operationalAddress;

    @Column(name = "operational_city")
    private String operationalCity;

    @Column(name = "operational_state")
    private String operationalState;

    @Column(name = "operational_pincode")
    private String operationalPincode;

    // ── Authorized signatory ─────────────────────────────────────────────────────

    @Column(name = "signatory_name")
    private String signatoryName;

    @Column(name = "signatory_designation")
    private String signatoryDesignation;

    /** URL/attachment of the signature or seal image. */
    @Column(name = "signature_url")
    private String signatureUrl;

    // ── Receipt configuration ────────────────────────────────────────────────────

    @Column(name = "receipt_header")
    private String receiptHeader;

    @Column(name = "receipt_footer")
    private String receiptFooter;

    /** Prefix for generated receipt numbers, e.g. "DPS/2026/". */
    @Column(name = "receipt_prefix")
    private String receiptPrefix;

    // ── Communication settings ───────────────────────────────────────────────────

    /** Display name used as the sender on outgoing messages. */
    @Column(name = "sender_display_name")
    private String senderDisplayName;

    @Column(name = "notification_email")
    private String notificationEmail;

    @Column(name = "notification_phone")
    private String notificationPhone;

    // ── Helpers ────────────────────────────────────────────────────────────────

    public boolean isOperational() {
        return "ACTIVE".equals(status) || "TRIAL".equals(status);
    }

    /** Sync is_active with status for backward compatibility. */
    @PrePersist
    @PreUpdate
    private void syncActive() {
        this.active = isOperational();
    }
}
