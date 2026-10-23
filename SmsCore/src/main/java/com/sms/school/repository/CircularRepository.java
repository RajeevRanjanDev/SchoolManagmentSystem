package com.sms.school.repository;

import com.sms.school.entity.Circular;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CircularRepository extends JpaRepository<Circular, Long> {

    Page<Circular> findBySchoolIdAndPublishedTrueAndDeletedFalse(Long schoolId, Pageable pageable);

    Page<Circular> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
}
