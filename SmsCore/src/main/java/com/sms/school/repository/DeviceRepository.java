package com.sms.school.repository;

import com.sms.school.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByUserIdAndActiveTrueAndDeletedFalse(Long userId);

    Optional<Device> findByFcmToken(String fcmToken);
}
