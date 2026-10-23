package com.sms.school.repository;

import com.sms.school.entity.FeeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeTemplateRepository extends JpaRepository<FeeTemplate, Long> {

    List<FeeTemplate> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId);
}
