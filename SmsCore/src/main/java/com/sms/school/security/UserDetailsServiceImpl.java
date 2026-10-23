package com.sms.school.security;

import com.sms.school.entity.User;
import com.sms.school.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads a user during authentication.
 *
 * The submitted identifier may be a generated login ID (students → admission
 * number, teachers → schoolCode+TE+year+seq) or an email (admins/super-admins).
 * We match by username first, then fall back to email.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(loginId)
                .or(() -> userRepository.findByEmail(loginId))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No account found for: " + loginId));

        return new UserPrincipal(user);
    }
}
