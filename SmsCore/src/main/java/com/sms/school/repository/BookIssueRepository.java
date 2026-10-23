package com.sms.school.repository;

import com.sms.school.entity.BookIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookIssueRepository extends JpaRepository<BookIssue, Long> {

    List<BookIssue> findByStudentIdAndReturnDateIsNullAndDeletedFalse(Long studentId);

    List<BookIssue> findByStudentIdAndDeletedFalse(Long studentId);

    boolean existsByBookIdAndStudentIdAndReturnDateIsNull(Long bookId, Long studentId);

    /** Count currently-issued books for a school — used by admin dashboard */
    long countBySchoolIdAndReturnDateIsNullAndDeletedFalse(Long schoolId);
}
