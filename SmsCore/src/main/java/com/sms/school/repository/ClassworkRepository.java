package com.sms.school.repository;

import com.sms.school.entity.Classwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClassworkRepository extends JpaRepository<Classwork, Long> {

    List<Classwork> findBySectionIdAndClassworkDateBetweenAndDeletedFalse(
            Long sectionId, LocalDate from, LocalDate to);

    List<Classwork> findBySectionIdAndDeletedFalse(Long sectionId);
}
