package com.sms.school.repository;

import com.sms.school.entity.ClassAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassAnnouncementRepository extends JpaRepository<ClassAnnouncement, Long> {

    // Teacher's own announcements
    List<ClassAnnouncement> findBySchoolIdAndTeacherIdAndDeletedFalse(Long schoolId, Long teacherId);

    // Parent App: announcements for a specific section (includes class-wide where section is null)
    @Query("""
            SELECT a FROM ClassAnnouncement a
            WHERE a.school.id = :schoolId
              AND (a.section.id = :sectionId OR a.section IS NULL)
              AND a.schoolClass.id = :classId
              AND a.published = true
              AND a.deleted = false
            ORDER BY a.createdAt DESC
            """)
    List<ClassAnnouncement> findBySectionOrClassWide(Long schoolId, Long classId, Long sectionId);

    // Admin overview
    List<ClassAnnouncement> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId);
}
