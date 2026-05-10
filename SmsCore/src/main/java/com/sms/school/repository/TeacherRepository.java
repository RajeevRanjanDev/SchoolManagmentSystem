package com.sms.school.repository;

import com.sms.school.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByUserId(Long userId);

    Optional<Teacher> findByUserEmail(String email);

    Page<Teacher> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
}
