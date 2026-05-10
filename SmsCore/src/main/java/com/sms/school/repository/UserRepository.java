package com.sms.school.repository;

import com.sms.school.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** All active users belonging to a specific school */
    Page<User> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);

    List<User> findBySchoolIdAndDeletedFalse(Long schoolId);

    /** Find users by role name (used for listing all teachers, parents etc.) */
    @Query("""
            SELECT u FROM User u
            JOIN u.roles r
            WHERE u.school.id = :schoolId
              AND r.name = :roleName
              AND u.deleted = false
            """)
    List<User> findBySchoolIdAndRoleName(Long schoolId, String roleName);
}
