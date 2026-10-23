package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Full tenant detail returned to SUPER_ADMIN.
 */
@Data
@Builder
public class TenantResponse {

    private Long   id;
    private String name;
    private String legalName;
    private String code;

    // Contact
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String phone;
    private String mobile;
    private String email;
    private String website;
    private String logoUrl;

    // Status & subscription
    private String status;
    private String subscriptionPlan;
    private String subscriptionPlanCode;
    private LocalDate subscriptionExpiry;

    // Academic
    private String currentAcademicYear;

    // Legal & configuration (Phase 2)
    private String registrationNumber;
    private LocalDate registrationDate;
    private String schoolType;
    private String pan;              // masked, e.g. ABC****1Z
    private String gstin;
    private boolean gstinVerified;
    private String affiliationBoard;
    private String affiliationNumber;
    private String recognitionDetails;
    private LocalDate affiliationValidFrom;
    private LocalDate affiliationValidTo;
    private String operationalAddress;
    private String operationalCity;
    private String operationalState;
    private String operationalPincode;
    private String signatoryName;
    private String signatoryDesignation;
    private String signatureUrl;
    private String receiptHeader;
    private String receiptFooter;
    private String receiptPrefix;
    private String senderDisplayName;
    private String notificationEmail;
    private String notificationPhone;

    // Branding
    private String primaryColor;
    private String secondaryColor;
    private String tagline;

    // Usage stats (populated lazily or on request)
    private Long studentCount;
    private Long teacherCount;
    private Long parentCount;

    // Limits from plan
    private Integer maxStudents;
    private Integer maxTeachers;
    private Integer maxParents;

    // Usage vs plan + subscription alerts (computed)
    private Integer studentUsagePct;
    private Integer teacherUsagePct;   // teachers/staff
    private Integer parentUsagePct;
    private boolean overLimitAlert;       // any usage >= 90%
    private boolean subscriptionExpiringSoon;  // expires within 30 days
    private boolean subscriptionExpired;
    private boolean usageAlert;           // red state = overLimit OR expiring OR expired
    private Long daysToExpiry;
    private String alertReasons;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
