package com.sms.school.config;

import com.sms.school.entity.*;
import com.sms.school.entity.enums.Gender;
import com.sms.school.entity.enums.RoleName;
import com.sms.school.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;

/**
 * Seeds demo data when running with the "demo" profile.
 * Creates roles, a demo school, admin/teacher/parent users, and sample students.
 */
@Component
@Profile("demo")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository       roleRepository;
    private final SchoolRepository     schoolRepository;
    private final UserRepository       userRepository;
    private final TeacherRepository    teacherRepository;
    private final ParentRepository     parentRepository;
    private final StudentRepository    studentRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository    sectionRepository;
    private final PasswordEncoder      passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("=== Seeding demo data ===");

        // 1. Create roles
        Role superAdminRole = createRole(RoleName.SUPER_ADMIN, "Platform super administrator");
        Role schoolAdminRole = createRole(RoleName.SCHOOL_ADMIN, "School administrator");
        Role teacherRole     = createRole(RoleName.TEACHER,      "Teacher");
        Role parentRole      = createRole(RoleName.PARENT,       "Parent/guardian");
        Role accountantRole  = createRole(RoleName.ACCOUNTANT,   "Accountant");
        Role librarianRole   = createRole(RoleName.LIBRARIAN,    "Librarian");
        Role transportRole   = createRole(RoleName.TRANSPORT_MANAGER, "Transport manager");

        // 2. Create demo school
        School school = schoolRepository.findByCode("DPS-DEMO").orElseGet(() ->
                schoolRepository.save(School.builder()
                        .name("Demo Public School")
                        .code("DPS-DEMO")
                        .city("New Delhi")
                        .state("Delhi")
                        .country("India")
                        .email("info@dpsdemo.edu")
                        .phone("011-12345678")
                        .currentAcademicYear("2024-2025")
                        .active(true)
                        .build()));

        // 3. SUPER_ADMIN user (no school)
        createUser(null, "Super", "Admin", "superadmin@sms.com", "Admin@1234", superAdminRole, null);

        // 4. School Admin
        createUser(school, "Rajesh", "Kumar",   "admin@dpsdemo.edu",   "Admin@1234", schoolAdminRole, null);

        // 5. Teacher
        User teacherUser = createUser(school, "Priya", "Sharma", "teacher@dpsdemo.edu", "Teacher@1234", teacherRole, null);
        Teacher teacher = teacherRepository.findByUserId(teacherUser.getId()).orElseGet(() ->
                teacherRepository.save(Teacher.builder()
                        .school(school)
                        .user(teacherUser)
                        .employeeCode("EMP-001")
                        .qualification("B.Ed")
                        .specialization("Mathematics")
                        .joiningDate(LocalDate.of(2020, 6, 1))
                        .experienceYears(4)
                        .build()));

        // 6. Parent
        User parentUser = createUser(school, "Sunita", "Verma", "parent@dpsdemo.edu", "Parent@1234", parentRole, Gender.FEMALE);
        Parent parent = parentRepository.findByUserId(parentUser.getId()).orElseGet(() ->
                parentRepository.save(Parent.builder()
                        .school(school)
                        .user(parentUser)
                        .occupation("Engineer")
                        .relation("MOTHER")
                        .build()));

        // 7. Class and Section
        SchoolClass cls = classRepository.findBySchoolIdAndAcademicYearAndDeletedFalse(school.getId(), "2024-2025")
                .stream().findFirst()
                .orElseGet(() -> classRepository.save(SchoolClass.builder()
                        .school(school)
                        .name("Class 7")
                        .numericName(7)
                        .academicYear("2024-2025")
                        .build()));

        Section section = sectionRepository.findBySchoolClassIdAndDeletedFalse(cls.getId())
                .stream().findFirst()
                .orElseGet(() -> sectionRepository.save(Section.builder()
                        .school(school)
                        .schoolClass(cls)
                        .name("A")
                        .classTeacher(teacher)
                        .maxCapacity(40)
                        .build()));

        // 8. Students
        createStudent(school, "Aarav",  "Verma",  "ADM-2024-001", parent, Gender.MALE);
        createStudent(school, "Diya",   "Sharma", "ADM-2024-002", parent, Gender.FEMALE);
        createStudent(school, "Kabir",  "Singh",  "ADM-2024-003", null,   Gender.MALE);

        log.info("=== Demo data seeded successfully ===");
        log.info("Credentials:");
        log.info("  SUPER_ADMIN  → superadmin@sms.com / Admin@1234");
        log.info("  SCHOOL_ADMIN → admin@dpsdemo.edu  / Admin@1234");
        log.info("  TEACHER      → teacher@dpsdemo.edu / Teacher@1234");
        log.info("  PARENT       → parent@dpsdemo.edu  / Parent@1234");
        log.info("  School ID    → {}", school.getId());
        log.info("  Section ID   → {}", section.getId());
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private Role createRole(RoleName name, String description) {
        return roleRepository.findByName(name).orElseGet(() ->
                roleRepository.save(Role.builder().name(name).description(description).build()));
    }

    private User createUser(School school, String first, String last,
                            String email, String password, Role role, Gender gender) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = User.builder()
                    .school(school)
                    .firstName(first)
                    .lastName(last)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .roles(Set.of(role))
                    .active(true)
                    .build();
            if (gender != null) u.setGender(gender);
            return userRepository.save(u);
        });
    }

    private Student createStudent(School school, String first, String last,
                                  String admNo, Parent parent, Gender gender) {
        if (studentRepository.existsBySchoolIdAndAdmissionNumber(school.getId(), admNo)) {
            return studentRepository.findBySchoolIdAndAdmissionNumber(school.getId(), admNo).orElseThrow();
        }
        return studentRepository.save(Student.builder()
                .school(school)
                .firstName(first)
                .lastName(last)
                .admissionNumber(admNo)
                .gender(gender)
                .dateOfBirth(LocalDate.of(2012, 3, 15))
                .admissionDate(LocalDate.of(2024, 4, 1))
                .parent(parent)
                .active(true)
                .build());
    }
}
