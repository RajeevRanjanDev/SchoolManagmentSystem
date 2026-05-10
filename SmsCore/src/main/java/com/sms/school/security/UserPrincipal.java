package com.sms.school.security;

import com.sms.school.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetails wrapper around our User entity.
 * Carries extra tenant fields (userId, schoolId) used in JWT claims and service-level auth.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long userId;
    private final Long schoolId;     // null for SUPER_ADMIN
    private final String email;
    private final String password;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.userId = user.getId();
        this.schoolId = (user.getSchool() != null) ? user.getSchool().getId() : null;
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.active = user.isActive();

        // Map each role to a Spring authority prefixed with ROLE_
        this.authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                .collect(Collectors.toSet());
    }

    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }
}
