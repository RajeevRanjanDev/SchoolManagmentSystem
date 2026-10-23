package com.sms.school.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Database configuration for the <b>prod</b> Spring profile.
 *
 * <p>Uses a PostgreSQL database via HikariCP connection pool.
 * Flyway manages all schema migrations ({@code ddl-auto=validate}).</p>
 *
 * <h3>Required environment variables</h3>
 * <pre>
 *   DB_HOST       PostgreSQL hostname  (e.g. db.example.com)
 *   DB_PORT       PostgreSQL port      (default: 5432)
 *   DB_NAME       Database name        (e.g. sms_db)
 *   DB_USERNAME   Database user
 *   DB_PASSWORD   Database password
 * </pre>
 *
 * <h3>Activation</h3>
 * <pre>
 *   java -jar sms-core.jar --spring.profiles.active=prod
 * </pre>
 * Or set environment variable: {@code SPRING_PROFILES_ACTIVE=prod}
 */
@Slf4j
@Configuration
@Profile("prod")
public class ProdDatabaseConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    // ── HikariCP pool tunables (with sensible defaults) ────────────

    @Value("${spring.datasource.hikari.pool-name:SmsHikariPool}")
    private String poolName;

    @Value("${spring.datasource.hikari.maximum-pool-size:20}")
    private int maxPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:5}")
    private int minIdle;

    @Value("${spring.datasource.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.idle-timeout:600000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.max-lifetime:1800000}")
    private long maxLifetime;

    @Value("${spring.datasource.hikari.keepalive-time:120000}")
    private long keepaliveTime;

    /**
     * Builds and returns a tuned {@link HikariDataSource} for production PostgreSQL.
     *
     * <p>Hikari is already Spring Boot's default pool, but we configure it
     * explicitly here so every parameter is visible, auditable, and
     * overrideable through environment variables without touching code.</p>
     */
    @Bean
    public DataSource dataSource() {
        log.info("============================================================");
        log.info("  🚀  PROD profile active — connecting to PostgreSQL");
        log.info("  JDBC URL  → {}", jdbcUrl);
        log.info("  Pool      → min={}, max={}", minIdle, maxPoolSize);
        log.info("============================================================");

        HikariConfig config = new HikariConfig();

        config.setPoolName(poolName);
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");

        // Pool sizing
        config.setMaximumPoolSize(maxPoolSize);
        config.setMinimumIdle(minIdle);

        // Timeouts
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setKeepaliveTime(keepaliveTime);

        // Validation
        config.setConnectionTestQuery("SELECT 1");

        // PostgreSQL performance properties
        config.addDataSourceProperty("cachePrepStmts",        "true");
        config.addDataSourceProperty("prepStmtCacheSize",     "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts",    "true");

        return new HikariDataSource(config);
    }
}
