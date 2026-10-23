package com.sms.school.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Enables nested repository interfaces (e.g. the payment repositories grouped
 * inside {@code PaymentRepositories}). Spring Boot's auto-configuration scans
 * {@code com.sms.school} but leaves considerNestedRepositories=false by default,
 * so we declare it explicitly over the same base package. Entity scanning and
 * the transaction manager remain Boot-managed.
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.sms.school", considerNestedRepositories = true)
public class JpaRepositoriesConfig {
}
