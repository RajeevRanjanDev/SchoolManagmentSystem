package com.sms.school.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;

/**
 * Configuration marker for the <b>local</b> Spring profile.
 *
 * <p>The H2 DataSource is auto-configured by Spring Boot from
 * {@code application-local.yml} — no explicit {@code @Bean} needed here.</p>
 *
 * <h3>H2 Console</h3>
 * <pre>
 *   URL:      http://localhost:8080/h2-console
 *   JDBC URL: jdbc:h2:mem:smsdb
 *   User:     sa
 *   Password: (blank)
 * </pre>
 *
 * <h3>Activation</h3>
 * Active by default (application.yml sets {@code spring.profiles.active=local}).
 * No extra flags needed for local development.
 */
@Slf4j
@Configuration
@Profile("local")
public class LocalDatabaseConfig {

    /** Print a clear banner once the app is fully started. */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info("============================================================");
        log.info("  ✅  LOCAL profile — H2 in-memory database is active");
        log.info("  H2 Console → http://localhost:8080/h2-console");
        log.info("  JDBC URL   → jdbc:h2:mem:smsdb");
        log.info("  Username   → sa   |   Password → (blank)");
        log.info("  Swagger    → http://localhost:8080/swagger-ui.html");
        log.info("============================================================");
    }
}
