package com.sms.school.dto.request.admission;

import com.sms.school.entity.enums.AdmissionType;
import com.sms.school.entity.enums.Gender;
import com.sms.school.entity.enums.InstitutionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Master registration request — covers all institution types.
 * Section fields are populated selectively based on institutionType.
 */
@Data
public class RegisterStudentRequest {

    // ── Section 1: Basic Info ─────────────────────────────────────────
    @Size(max = 50)
    private String admissionNumber;

    @Size(max = 50)
    private String enrollmentNumber;

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String middleName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private String bloodGroup;
    private String category;
    private String nationality;
    private String religion;
    private String motherTongue;

    @Pattern(regexp = "^[2-9]{1}[0-9]{3}\\s[0-9]{4}\\s[0-9]{4}$|^[0-9]{12}$",
             message = "Invalid Aadhaar number")
    private String aadhaarNumber;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String mobile;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;

    private String profilePhotoUrl;

    // ── Section 2: Academic Info ──────────────────────────────────────
    @NotNull(message = "Institution type is required")
    private InstitutionType institutionType;

    @NotBlank(message = "Academic session is required")
    private String academicSession;

    @NotNull(message = "Admission date is required")
    private LocalDate admissionDate;

    private AdmissionType admissionType;
    private Long campusId;
    private String previousInstitution;
    private String previousQualification;

    /** Fee template to bill this student (required for new admissions; validated in the service). */
    private Long feeTemplateId;

    // School
    private Long classId;
    private Long sectionId;
    private String rollNumber;

    /** For school admissions, class and section are mandatory. */
    @AssertTrue(message = "Class and section are required for a school admission")
    public boolean isSchoolClassAndSectionPresent() {
        if (institutionType == InstitutionType.SCHOOL) {
            return classId != null && sectionId != null;
        }
        return true;
    }

    // College / University
    private String program;
    private String course;
    private String department;
    private String branch;
    private Integer semester;
    private Integer yearOfStudy;
    private String registrationNumber;
    private String universityRollNumber;

    // Coaching / Training
    private Long batchId;
    private String batchName;
    private LocalDate batchStartDate;
    private LocalDate batchEndDate;

    // ── Section 3: Guardians ──────────────────────────────────────────
    @Valid
    @NotEmpty(message = "At least one guardian is required")
    private List<GuardianRequest> guardians;

    // ── Section 4: Addresses ──────────────────────────────────────────
    @Valid
    @NotNull
    private AddressRequest currentAddress;

    @Valid
    private AddressRequest permanentAddress;

    /** If true, permanent = current address copy */
    private boolean permanentSameAsCurrent;

    // ── Section 5–8 (optional at registration, can be updated later) ──
    @Valid
    private MedicalInfoRequest medicalInfo;

    @Valid
    private TransportInfoRequest transportInfo;

    @Valid
    private HostelInfoRequest hostelInfo;

    // ── Nested DTOs ───────────────────────────────────────────────────
    @Data
    public static class GuardianRequest {
        @NotNull private com.sms.school.entity.enums.GuardianRelation relation;
        @NotBlank private String firstName;
        private String lastName;
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid mobile")
        private String mobile;
        @Email private String email;
        private String occupation;
        private java.math.BigDecimal annualIncome;
        private String qualification;
        private String aadhaarNumber;
        private boolean primary;
    }

    @Data
    public static class AddressRequest {
        @NotBlank private String addressLine1;
        private String addressLine2;
        @NotBlank private String city;
        @NotBlank private String state;
        private String country;
        @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Invalid pincode")
        private String pincode;
    }

    @Data
    public static class MedicalInfoRequest {
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

    @Data
    public static class TransportInfoRequest {
        private boolean transportRequired;
        private Long routeId;
        private String routeName;
        private String stopName;
        private String pickupPoint;
        private String transportType;
    }

    @Data
    public static class HostelInfoRequest {
        private boolean hostelRequired;
        private String hostelName;
        private String roomNumber;
        private String hostelType;
    }
}
