package com.sms.school.repository;

import com.sms.school.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findBySchoolIdAndDeletedFalseOrderByIssueDateDesc(Long schoolId);
    long countByDeletedFalse();
}
