package com.sms.school.repository;

import com.sms.school.entity.User;
import com.sms.school.entity.enums.RoleName;
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

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

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
    List<User> findBySchoolIdAndRoleName(Long schoolId, RoleName roleName);

    // ── Super Admin user management ────────────────────────────────────────────

    boolean existsBySchoolIdAndEmail(Long schoolId, String email);

    /** Count users of a given type in a school (for plan quota checks) */
    @Query("""
            SELECT COUNT(u) FROM User u
            JOIN u.roles r
            WHERE u.school.id = :schoolId
              AND r.name = :roleName
              AND u.deleted = false
            """)
    long countBySchoolIdAndRoleName(Long schoolId, String roleName);

    /** Used by TenantManagementService to count school admins */
    @Query("""
            SELECT u FROM User u
            JOIN FETCH u.roles r
            WHERE u.school.id = :schoolId
              AND u.userType = 'SCHOOL_USER'
              AND u.deleted = false
            ORDER BY u.createdAt DESC
            """)
    List<User> findAllBySchoolIdWithRoles(Long schoolId);

    /** Count all users across all tenants for platform stats */
    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.userType = 'SCHOOL_USER'")
    long countAllSchoolUsers();

    Optional<User> findByEmailAndDeletedFalse(String email);
}
