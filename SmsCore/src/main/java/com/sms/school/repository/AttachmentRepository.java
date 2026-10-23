package com.sms.school.repository;

import com.sms.school.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    Optional<Attachment> findByIdAndTenantIdAndDeletedFalse(Long id, Long tenantId);
}
