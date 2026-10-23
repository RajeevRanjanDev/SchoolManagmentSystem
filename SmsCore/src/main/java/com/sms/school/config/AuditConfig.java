package com.sms.school.config;

import com.sms.school.security.TenantContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/**
 * Provides the current user's email to JPA auditing (@CreatedBy / @LastModifiedBy).
 */
@Configuration
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                return Optional.of(TenantContext.getCurrentUserEmail());
            } catch (Exception e) {
                // During system processes (e.g. Flyway migration) there is no auth context
                return Optional.of("SYSTEM");
            }
        };
    }
}
