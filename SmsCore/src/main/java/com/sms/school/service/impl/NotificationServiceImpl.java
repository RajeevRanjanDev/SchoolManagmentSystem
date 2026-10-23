package com.sms.school.service.impl;

import com.sms.school.dto.request.BroadcastNotificationRequest;
import com.sms.school.entity.Device;
import com.sms.school.entity.Fee;
import com.sms.school.entity.Notification;
import com.sms.school.entity.NotificationBroadcast;
import com.sms.school.entity.School;
import com.sms.school.entity.SchoolClass;
import com.sms.school.entity.Section;
import com.sms.school.entity.Student;
import com.sms.school.entity.StudentClassMapping;
import com.sms.school.entity.User;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.entity.enums.NotificationType;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.DeviceRepository;
import com.sms.school.repository.FeeRepository;
import com.sms.school.repository.NotificationBroadcastRepository;
import com.sms.school.repository.NotificationRepository;
import com.sms.school.repository.SchoolClassRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.SectionRepository;
import com.sms.school.repository.StudentClassMappingRepository;
import com.sms.school.repository.StudentRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final SectionRepository sectionRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final NotificationBroadcastRepository broadcastRepository;
    private final StudentClassMappingRepository classMappingRepository;
    private final StudentRepository studentRepository;
    private final FeeRepository feeRepository;
    private final com.sms.school.repository.TeacherRepository teacherRepository;
    private final com.sms.school.repository.TeacherAssignmentRepository teacherAssignmentRepository;
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
    @Transactional
    public void broadcast(Long schoolId, BroadcastNotificationRequest req, String sentByName) {
        String aud = (req.getAudience() == null || req.getAudience().isBlank())
                ? "ALL_SCHOOL" : req.getAudience().trim().toUpperCase();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        String className = req.getClassId() != null
                ? schoolClassRepository.findById(req.getClassId()).map(SchoolClass::getName).orElse(null) : null;

        boolean scheduled = req.getScheduledAt() != null && req.getScheduledAt().isAfter(LocalDateTime.now());

        if (scheduled) {
            // Persist as SCHEDULED; the firing job will resolve recipients and send later.
            broadcastRepository.save(NotificationBroadcast.builder()
                    .school(school).title(req.getTitle()).body(req.getBody()).type(req.getType())
                    .audience(aud).classId(req.getClassId()).sectionId(req.getSectionId())
                    .studentId(req.getStudentId()).feeType(req.getFeeType()).className(className)
                    .recipientCount(0).sentByName(sentByName)
                    .status("SCHEDULED").scheduledAt(req.getScheduledAt())
                    .attachmentUrl(req.getAttachmentUrl()).attachmentName(req.getAttachmentName())
                    .build());
            return;
        }

        Set<Long> userIds = resolveRecipients(schoolId, aud, req.getClassId(), req.getSectionId(),
                req.getStudentId(), req.getFeeType());
        userIds.forEach(uid -> sendToUser(uid, req.getTitle(), req.getBody(), req.getType(),
                req.getAttachmentUrl(), req.getAttachmentName()));

        broadcastRepository.save(NotificationBroadcast.builder()
                .school(school).title(req.getTitle()).body(req.getBody()).type(req.getType())
                .audience(aud).classId(req.getClassId()).sectionId(req.getSectionId())
                .studentId(req.getStudentId()).feeType(req.getFeeType()).className(className)
                .recipientCount(userIds.size()).sentByName(sentByName)
                .status("SENT")
                .attachmentUrl(req.getAttachmentUrl()).attachmentName(req.getAttachmentName())
                .build());
    }

    /** Create one inbox notification (with optional attachment) for a user and push it. */
    private void sendToUser(Long uid, String title, String body, NotificationType type,
                            String attachmentUrl, String attachmentName) {
        userRepository.findById(uid).ifPresent(recipient -> {
            notificationRepository.save(Notification.builder()
                    .school(recipient.getSchool()).recipient(recipient)
                    .title(title).body(body).type(type)
                    .attachmentUrl(attachmentUrl).attachmentName(attachmentName)
                    .build());
            sendPushToUser(uid, title, body);
        });
    }

    /** Resolve the set of recipient user ids for an audience + scope. */
    private Set<Long> resolveRecipients(Long schoolId, String aud, Long classId, Long sectionId,
                                        Long studentId, String feeType) {
        Set<Long> userIds = new LinkedHashSet<>();
        switch (aud) {
            case "ALL_SCHOOL" -> userRepository.findBySchoolIdAndDeletedFalse(schoolId)
                    .forEach(u -> userIds.add(u.getId()));

            case "TEACHERS" -> teacherRepository.findBySchoolIdAndDeletedFalse(schoolId).stream()
                    .map(t -> t.getUser() != null ? t.getUser().getId() : null)
                    .filter(Objects::nonNull).forEach(userIds::add);

            case "CLASS_TEACHERS" -> teacherAssignmentRepository
                    .findBySchoolIdAndClassTeacherTrueAndDeletedFalse(schoolId).stream()
                    .map(ta -> ta.getTeacher() != null && ta.getTeacher().getUser() != null
                            ? ta.getTeacher().getUser().getId() : null)
                    .filter(Objects::nonNull).forEach(userIds::add);

            case "CLASS" -> {
                requireId(classId, "class");
                teacherAssignmentRepository
                        .findBySchoolIdAndSchoolClassIdAndClassTeacherTrueAndDeletedFalse(schoolId, classId).stream()
                        .map(ta -> ta.getTeacher() != null && ta.getTeacher().getUser() != null
                                ? ta.getTeacher().getUser().getId() : null)
                        .filter(Objects::nonNull).forEach(userIds::add);
            }

            case "CLASS_STUDENTS" -> {
                requireId(classId, "class");
                String ay = schoolClassRepository.findById(classId)
                        .map(c -> c.getSchool().getCurrentAcademicYear()).orElse(null);
                addStudentUsers(classMappingRepository.findActiveByClassAndYear(schoolId, classId, ay), userIds);
            }

            case "SECTION_STUDENTS" -> {
                requireId(sectionId, "section");
                addStudentUsers(classMappingRepository.findActiveBySection(sectionId), userIds);
            }

            case "STUDENT" -> {
                requireId(studentId, "student");
                studentRepository.findById(studentId)
                        .map(Student::getAdmissionNumber)
                        .flatMap(userRepository::findByUsername)
                        .map(User::getId).ifPresent(userIds::add);
            }

            case "FEE_DEFAULTERS" -> addFeeDefaulters(schoolId, classId, sectionId, feeType, userIds);

            default -> throw new BusinessException("Unknown audience: " + aud);
        }
        return userIds;
    }

    private void requireId(Long id, String what) {
        if (id == null) throw new BusinessException("Please select a " + what + " for this audience");
    }

    /** Map active class mappings → the students' login user ids. */
    private void addStudentUsers(List<StudentClassMapping> mappings, Set<Long> userIds) {
        mappings.stream()
                .map(StudentClassMapping::getStudent).filter(Objects::nonNull)
                .map(Student::getAdmissionNumber).filter(Objects::nonNull)
                .map(userRepository::findByUsername)
                .forEach(opt -> opt.map(User::getId).ifPresent(userIds::add));
    }

    /** Students with an unpaid fee (optionally scoped to class/section and fee type). */
    private void addFeeDefaulters(Long schoolId, Long classId, Long sectionId, String feeType, Set<Long> userIds) {
        String ft = feeType == null ? "ANY" : feeType.trim().toUpperCase();

        // Optional scope: limit to the admission numbers in the chosen class/section.
        Set<String> scopeAdmissions = null;
        if (sectionId != null) {
            scopeAdmissions = admissionsOf(classMappingRepository.findActiveBySection(sectionId));
        } else if (classId != null) {
            String ay = schoolClassRepository.findById(classId)
                    .map(c -> c.getSchool().getCurrentAcademicYear()).orElse(null);
            scopeAdmissions = admissionsOf(classMappingRepository.findActiveByClassAndYear(schoolId, classId, ay));
        }

        for (Fee fee : feeRepository.findBySchoolIdAndDeletedFalse(schoolId)) {
            if (fee.getStatus() == FeeStatus.PAID || fee.getStatus() == FeeStatus.WAIVED) continue;
            if (fee.getStudent() == null) continue;
            String category = fee.getFeeCategory() == null ? "" : fee.getFeeCategory().toLowerCase();
            if ("TUITION".equals(ft) && !category.contains("tuition")) continue;
            if ("TRANSPORT".equals(ft) && !category.contains("transport")) continue;

            String admission = fee.getStudent().getAdmissionNumber();
            if (admission == null) continue;
            if (scopeAdmissions != null && !scopeAdmissions.contains(admission)) continue;

            userRepository.findByUsername(admission).map(User::getId).ifPresent(userIds::add);
        }
    }

    private Set<String> admissionsOf(List<StudentClassMapping> mappings) {
        Set<String> set = new LinkedHashSet<>();
        mappings.stream().map(StudentClassMapping::getStudent).filter(Objects::nonNull)
                .map(Student::getAdmissionNumber).filter(Objects::nonNull).forEach(set::add);
        return set;
    }

    /** Fire scheduled notifications whose time has come. Runs once a minute. */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void fireDueScheduledBroadcasts() {
        List<NotificationBroadcast> due = broadcastRepository
                .findByStatusAndScheduledAtLessThanEqualAndDeletedFalse("SCHEDULED", LocalDateTime.now());
        for (NotificationBroadcast b : due) {
            try {
                Long schoolId = b.getSchool().getId();
                Set<Long> userIds = resolveRecipients(schoolId, b.getAudience(), b.getClassId(),
                        b.getSectionId(), b.getStudentId(), b.getFeeType());
                userIds.forEach(uid -> sendToUser(uid, b.getTitle(), b.getBody(), b.getType(),
                        b.getAttachmentUrl(), b.getAttachmentName()));
                b.setRecipientCount(userIds.size());
                b.setStatus("SENT");
                broadcastRepository.save(b);
            } catch (Exception ex) {
                log.error("Failed to fire scheduled broadcast {}: {}", b.getId(), ex.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationBroadcast> getSentBroadcasts(Long schoolId, Pageable pageable) {
        return broadcastRepository.findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(schoolId, pageable);
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
