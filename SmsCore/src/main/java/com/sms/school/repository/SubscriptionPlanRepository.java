package com.sms.school.repository;

import com.sms.school.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    List<SubscriptionPlan> findByStatusAndDeletedFalse(String status);

    Optional<SubscriptionPlan> findByPlanCodeAndDeletedFalse(String planCode);

    boolean existsByPlanCode(String planCode);
}
