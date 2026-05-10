package com.sms.school.repository;

import com.sms.school.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findBySchoolIdAndPublishedTrueAndDeletedFalse(Long schoolId, Pageable pageable);

    Page<Event> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
}
