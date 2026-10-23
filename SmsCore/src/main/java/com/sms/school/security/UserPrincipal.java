package com.sms.school.security;

import com.sms.school.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetails wrapper around our User entity.
 *
 * Carries extra tenant fields (userId, schoolId, schoolCode, schoolName)
 * that are embedded in JWT claims and used for service-level authorization.
 *
 * For SUPER_ADMIN: schoolId, schoolCode, schoolName are all null.
 * For SCHOOL_USER: all four fields are populated.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long   userId;
    private final Long   schoolId;      // null for SUPER_ADMIN
    private final String schoolCode;    // e.g. "DPS-NOIDA" — null for SUPER_ADMIN
    private final String schoolName;    // e.g. "DPS Noida"  — null for SUPER_ADMIN
    private final String userType;      // "SUPER_ADMIN" | "SCHOOL_USER"
    private final String email;
    private final String password;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.userId     = user.getId();
        this.userType   = user.getUserType();
        this.email      = user.getEmail();
        this.password   = user.getPassword();
        this.active     = user.isActive();

        if (user.getSchool() != null) {
            this.schoolId   = user.getSchool().getId();
            this.schoolCode = user.getSchool().getCode();
            this.schoolName = user.getSchool().getName();
        } else {
            this.schoolId   = null;
            this.schoolCode = null;
            this.schoolName = null;
        }

        this.authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                .collect(Collectors.toSet());
    }

    /** Convenience: true only when this user has SUPER_ADMIN role. */
    public boolean isSuperAdmin() {
        return authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    @Override public String getUsername()              { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return active; }
}
