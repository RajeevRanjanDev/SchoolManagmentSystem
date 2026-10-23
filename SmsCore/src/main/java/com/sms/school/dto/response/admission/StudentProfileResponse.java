package com.sms.school.dto.response.admission;

import com.sms.school.entity.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StudentProfileResponse {

    private Long id;
    private String studentCode;
    private String admissionNumber;
    private String enrollmentNumber;

    // Personal
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    private String category;
    private String nationality;
    private String mobile;
    private String email;
    private String profilePhotoUrl;

    // Lifecycle
    private StudentLifecycleStatus lifecycleStatus;
    private LocalDate admissionDate;
    private AdmissionType admissionType;
    private Long campusId;

    // Academic
    private AcademicSummary academic;

    // Guardians
    private List<GuardianSummary> guardians;

    // Medical & transport
    private MedicalSummary medical;
    private TransportSummary transport;

    // Documents
    private List<DocumentSummary> documents;
    private long pendingDocuments;
    private long verifiedDocuments;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    // ── Nested ───────────────────────────────────────────────────────
    @Data @Builder
    public static class AcademicSummary {
        private InstitutionType institutionType;
        private String academicSession;
        // School
        private String className;
        private String sectionName;
        private String rollNumber;
        // College/Uni
        private String program;
        private String course;
        private String department;
        private String branch;
        private Integer semester;
        private Integer yearOfStudy;
        // Coaching
        private String batchName;
        private LocalDate batchStartDate;
        private LocalDate batchEndDate;
    }

    @Data @Builder
    public static class GuardianSummary {
        private Long id;
        private GuardianRelation relation;
        private String fullName;
        private String mobile;
        private String email;
        private String occupation;
        private boolean primary;
    }

    @Data @Builder
    public static class MedicalSummary {
        private String bloodGroup;
        private String medicalConditions;
        private String allergies;
        private String disabilityType;
        private String disabilityDetails;
        private Integer disabilityPercentage;
        private String emergencyMedicalNotes;
        private String familyDoctorName;
        private String familyDoctorMobile;
    }

    @Data @Builder
    public static class TransportSummary {
        private boolean transportRequired;
        private Long routeId;
        private String routeName;
        private String stopName;
        private String pickupPoint;
        private String transportType;
    }

    @Data @Builder
    public static class DocumentSummary {
        private Long id;
        private DocumentType documentType;
        private DocumentStatus status;
        private String fileUrl;
        private boolean mandatory;
        private LocalDateTime verifiedAt;
    }
}
