package com.sms.school.repository;

import com.sms.school.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findBySchoolClassIdAndDeletedFalse(Long classId);

    List<Section> findBySchoolIdAndDeletedFalse(Long schoolId);
}
