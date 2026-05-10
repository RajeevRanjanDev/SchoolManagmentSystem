package com.sms.school.repository;

import com.sms.school.entity.LibraryBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {

    Page<LibraryBook> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);

    Page<LibraryBook> findBySchoolIdAndAvailableCopiesGreaterThanAndDeletedFalse(
            Long schoolId, int minCopies, Pageable pageable);
}
