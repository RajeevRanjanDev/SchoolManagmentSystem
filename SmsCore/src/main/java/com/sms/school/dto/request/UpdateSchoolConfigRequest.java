package com.sms.school.dto.request;

import lombok.Data;

import java.time.LocalDate;

/**
 * SUPER_ADMIN updates a school's legal identity, affiliation, operational
 * address, signatory, receipt and communication configuration (Phase 2).
 * All fields optional — only non-null values are applied.
 */
@Data
public class UpdateSchoolConfigRequest {

    // Legal identity
    private String legalName;
    private String registrationNumber;
    private LocalDate registrationDate;
    private String schoolType;

    // Tax
    private String pan;
    private String gstin;
    private Boolean gstinVerified;

    // Affiliation
    private String affiliationBoard;
    private String affiliationNumber;
    private String recognitionDetails;
    private LocalDate affiliationValidFrom;
    private LocalDate affiliationValidTo;

    // Operational address
    private String operationalAddress;
    private String operationalCity;
    private String operationalState;
    private String operationalPincode;

    // Signatory
    private String signatoryName;
    private String signatoryDesignation;
    private String signatureUrl;

    // Receipt
    private String receiptHeader;
    private String receiptFooter;
    private String receiptPrefix;

    // Communication
    private String senderDisplayName;
    private String notificationEmail;
    private String notificationPhone;

    // Academic session
    private String currentAcademicYear;

    // Logo
    private String logoUrl;
}
