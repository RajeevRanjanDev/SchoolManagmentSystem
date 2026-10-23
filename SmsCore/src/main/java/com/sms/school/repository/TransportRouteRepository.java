package com.sms.school.repository;

import com.sms.school.entity.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long> {

    List<TransportRoute> findBySchoolIdAndActiveTrueAndDeletedFalse(Long schoolId);

    List<TransportRoute> findBySchoolIdAndDeletedFalseOrderByRouteNumberAsc(Long schoolId);

    boolean existsBySchoolIdAndRouteNumberAndDeletedFalse(Long schoolId, String routeNumber);
}
