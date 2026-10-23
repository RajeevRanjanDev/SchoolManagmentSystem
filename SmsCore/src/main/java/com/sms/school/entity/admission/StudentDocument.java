package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.DocumentStatus;
import com.sms.school.entity.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_documents",
    indexes = {
        @Index(name = "idx_sd_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_sd_student", columnList = "student_profile_id"),
        @Index(name = "idx_sd_status",  columnList = "status")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentDocument extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 40)
    private DocumentType documentType;

    @Column(name = "document_name", length = 200)
    private String documentName;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_size_kb")
    private Long fileSizeKb;

    @Column(name = "mime_type", length = 80)
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    /** True = this document is mandatory for the institution */
    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private boolean mandatory = false;
}
