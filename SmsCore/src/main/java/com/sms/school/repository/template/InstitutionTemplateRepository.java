package com.sms.school.repository.template;

import com.sms.school.entity.enums.InstitutionType;
import com.sms.school.entity.template.InstitutionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InstitutionTemplateRepository extends JpaRepository<InstitutionTemplate, Long> {

    Optional<InstitutionTemplate> findByInstitutionTypeAndActiveTrue(InstitutionType type);

    @Query("SELECT t FROM InstitutionTemplate t LEFT JOIN FETCH t.roles r LEFT JOIN FETCH r.permissions " +
           "LEFT JOIN FETCH t.academicStructures LEFT JOIN FETCH t.feeStructures " +
           "WHERE t.institutionType = :type AND t.active = true AND t.deleted = false")
    Optional<InstitutionTemplate> findFullTemplateByType(@Param("type") InstitutionType type);
}
