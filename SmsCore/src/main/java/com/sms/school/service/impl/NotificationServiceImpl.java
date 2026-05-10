package com.sms.school.service.impl;

import com.sms.school.entity.Device;
import com.sms.school.entity.Notification;
import com.sms.school.entity.User;
import com.sms.school.entity.enums.NotificationType;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.DeviceRepository;
import com.sms.school.repository.NotificationRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    // FirebaseMessaging is injected via FirebaseConfig when credentials are provided

    @Override
    @Transactional
    @Async   // Don't block the calling thread
    public void sendNotification(Long schoolId, Long recipientUserId, String title, String body,
                                 NotificationType type, Long referenceId) {

        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", recipientUserId));

        Notification notification = Notification.builder()
                .school(recipient.getSchool())
                .recipient(recipient)
                .title(title)
                .body(body)
                .type(type)
                .referenceId(referenceId)
                .build();
        notificationRepository.save(notification);

        // Attempt FCM push for each registered device
        sendPushToUser(recipientUserId, title, body);
    }

    @Override
    @Transactional
    @Async
    public void broadcastToSchool(Long schoolId, String title, String body, NotificationType type) {
        List<User> users = userRepository.findBySchoolIdAndDeletedFalse(schoolId);
        users.forEach(user -> sendNotification(
                schoolId, user.getId(), title, body, type, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalseAndDeletedFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new com.sms.school.exception.UnauthorizedException("Not your notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void registerDevice(Long userId, String fcmToken, String deviceType, String deviceName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Optional<Device> existing = deviceRepository.findByFcmToken(fcmToken);
        if (existing.isPresent()) {
            // Token already registered – just ensure it's active
            Device device = existing.get();
            device.setActive(true);
            deviceRepository.save(device);
            return;
        }

        Device device = Device.builder()
                .user(user)
                .fcmToken(fcmToken)
                .deviceType(deviceType)
                .deviceName(deviceName)
                .build();
        deviceRepository.save(device);
    }

    // ── FCM push (fire-and-forget, errors are logged not thrown) ──────

    private void sendPushToUser(Long userId, String title, String body) {
        List<Device> devices = deviceRepository.findByUserIdAndActiveTrueAndDeletedFalse(userId);
        if (devices.isEmpty()) return;

        devices.forEach(device -> {
            try {
                // FirebaseMessaging.getInstance().send(...) would go here
                // Kept as a stub so the project compiles without the credentials file
                log.info("FCM push to token={} title='{}' body='{}'",
                        device.getFcmToken(), title, body);
            } catch (Exception ex) {
                log.warn("FCM push failed for device {}: {}", device.getId(), ex.getMessage());
            }
        });
    }
}
