package com.sms.school.repository;

import com.sms.school.entity.BusTrackingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusTrackingLogRepository extends JpaRepository<BusTrackingLog, Long> {

    /** Get the most recent location for a vehicle */
    Optional<BusTrackingLog> findTopByVehicleIdOrderByRecordedAtDesc(Long vehicleId);
}
