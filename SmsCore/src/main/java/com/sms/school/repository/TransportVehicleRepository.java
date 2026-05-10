package com.sms.school.repository;

import com.sms.school.entity.TransportVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransportVehicleRepository extends JpaRepository<TransportVehicle, Long> {

    List<TransportVehicle> findBySchoolIdAndActiveTrueAndDeletedFalse(Long schoolId);

    List<TransportVehicle> findByRouteIdAndDeletedFalse(Long routeId);
}
