package com.sms.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponse {

    private Long id;
    private Long schoolId;

    // User account (may be null if teacher has no login yet)
    private Long userId;
    private String email;

    /** Primary role of this employee: TEACHER, ACCOUNTANT, LIBRARIAN, TRANSPORT_MANAGER, SCHOOL_ADMIN */
    private String role;

    // Profile
    private String employeeCode;
    private String loginId;          // generated login username (schoolCode-TE-year-seq)
    private String firstName;
    private String lastName;
    private String fullName;
    private String mobile;
    private String qualification;
    private String specialization;
    private LocalDate joiningDate;
    private Integer experienceYears;
    private String photoUrl;
    private String status;

    // Convenience flags
    private boolean hasLogin;
    private boolean isClassTeacher;     // true if teacher is class teacher for ANY active section

    // Current year assignments summary (populated on demand)
    private List<TeacherAssignmentResponse> assignments;

    private LocalDateTime createdAt;
}
