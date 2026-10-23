package com.sms.school.repository.admission;

import com.sms.school.entity.admission.StudentGuardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, Long> {

    List<StudentGuardian> findByStudentProfileIdAndDeletedFalse(Long studentProfileId);

    Optional<StudentGuardian> findByStudentProfileIdAndPrimaryTrueAndDeletedFalse(Long studentProfileId);
}
