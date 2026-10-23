package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A binary file (PDF / image) uploaded by a user, stored in the database.
 * Referenced by its download URL from notifications, circulars and notices.
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_attachment_tenant", columnList = "tenant_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attachment extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes")
    private long sizeBytes;

    // VARBINARY → bytea on PostgreSQL / VARBINARY on H2. Avoids the PG large-object
    // (oid) mapping that @Lob would trigger, which fails to read in auto-commit mode.
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "data", nullable = false)
    private byte[] data;

    @Column(name = "uploaded_by")
    private Long uploadedBy;
}
