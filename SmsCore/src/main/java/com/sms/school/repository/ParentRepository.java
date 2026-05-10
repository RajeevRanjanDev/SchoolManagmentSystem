package com.sms.school.repository;

import com.sms.school.entity.Parent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {

    Optional<Parent> findByUserId(Long userId);

    Optional<Parent> findByUserEmail(String email);

    Page<Parent> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
}
