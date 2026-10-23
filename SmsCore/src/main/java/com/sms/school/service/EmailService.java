package com.sms.school.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (e.g. temporary passwords).
 *
 * The {@link JavaMailSender} bean only exists when {@code spring.mail.host} is
 * configured. Until SMTP is set up this service logs the message instead of
 * failing, so the app runs fine without mail credentials.
 */
@Service
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:no-reply@school.local}")
    private String fromAddress;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    /** Send a plain-text email. No-op (logged) when SMTP is not configured. */
    public void send(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Email skipped — no recipient address. Subject='{}'", subject);
            return;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("SMTP not configured — email NOT sent. To='{}' Subject='{}'. Body:\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.info("Email sent to {} (subject='{}')", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    /** Email a freshly generated login/temporary password to a user. */
    public void sendTempPassword(String to, String fullName, String loginId, String tempPassword) {
        String subject = "Your login details";
        String body = String.format("""
                Hello %s,

                A password has been set for your school account.

                Login ID: %s
                Temporary password: %s

                Please log in and change your password as soon as possible.

                — School Administration
                """,
                fullName == null ? "" : fullName,
                loginId == null ? "(use your registered email)" : loginId,
                tempPassword);
        send(to, subject, body);
    }
}
