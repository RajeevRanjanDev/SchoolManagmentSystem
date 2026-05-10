package com.sms.school.repository;

import com.sms.school.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByRecipientIdAndReadFalseAndDeletedFalse(Long userId);
}
