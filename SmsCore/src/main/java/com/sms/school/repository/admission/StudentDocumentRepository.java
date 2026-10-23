package com.sms.school.repository.admission;

import com.sms.school.entity.admission.StudentDocument;
import com.sms.school.entity.enums.DocumentStatus;
import com.sms.school.entity.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentDocumentRepository extends JpaRepository<StudentDocument, Long> {

    List<StudentDocument> findByStudentProfileIdAndDeletedFalse(Long studentProfileId);

    List<StudentDocument> findByStudentProfileIdAndStatusAndDeletedFalse(
            Long studentProfileId, DocumentStatus status);

    Optional<StudentDocument> findByStudentProfileIdAndDocumentTypeAndDeletedFalse(
            Long studentProfileId, DocumentType documentType);

    long countByTenantIdAndStatusAndDeletedFalse(Long tenantId, DocumentStatus status);
}
