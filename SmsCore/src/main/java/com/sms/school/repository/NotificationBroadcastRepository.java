package com.sms.school.repository;

import com.sms.school.entity.NotificationBroadcast;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationBroadcastRepository extends JpaRepository<NotificationBroadcast, Long> {

    Page<NotificationBroadcast> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(
            Long schoolId, Pageable pageable);

    /** Scheduled broadcasts that are due to fire. */
    java.util.List<NotificationBroadcast> findByStatusAndScheduledAtLessThanEqualAndDeletedFalse(
            String status, java.time.LocalDateTime now);
}
