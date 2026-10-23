package com.sms.school;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Multi-Tenant School Management System.
 *
 * <p>Annotations overview:
 * <ul>
 *   <li>{@code @SpringBootApplication} – enables auto-configuration, component scan, and config</li>
 *   <li>{@code @EnableJpaAuditing}    – auto-populates createdAt / updatedAt fields on entities</li>
 *   <li>{@code @EnableCaching}        – activates Spring Cache (backed by Redis)</li>
 *   <li>{@code @EnableAsync}          – allows {@code @Async} methods (e.g. sending notifications)</li>
 *   <li>{@code @EnableScheduling}     – activates {@code @Scheduled} tasks (e.g. fee reminders)</li>
 * </ul>
 */
@SpringBootApplication(exclude = {
        RedisAutoConfiguration.class,
        RedisRepositoriesAutoConfiguration.class
})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class SchoolManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(SchoolManagementApplication.class, args);
    }
}
