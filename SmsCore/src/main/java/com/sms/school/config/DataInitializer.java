package com.sms.school.config;

import com.sms.school.dto.request.admission.LifecycleTransitionRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest.AddressRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest.GuardianRequest;
import com.sms.school.dto.response.admission.StudentProfileResponse;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.*;
import com.sms.school.repository.*;
import com.sms.school.service.admission.AdmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Seeds demo data when running with the "demo" profile.
 * Creates roles, a demo school, admin/teacher/parent users, sample students,
 * and master data: classes 1–10, sections A–C per class, and 12 subjects.
 */
@Component
@Profile({"demo", "local", "pg"})
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository          roleRepository;
    private final SchoolRepository        schoolRepository;
    private final UserRepository          userRepository;
    private final TeacherRepository       teacherRepository;
    private final ParentRepository        parentRepository;
    private final StudentRepository       studentRepository;
    private final SchoolClassRepository   classRepository;
    private final SectionRepository       sectionRepository;
    private final SubjectRepository       subjectRepository;
    private final CampusRepository        campusRepository;
    private final PasswordEncoder         passwordEncoder;
    private final AdmissionService        admissionService;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final TimetableRepository         timetableRepository;
    private final FeeTemplateRepository       feeTemplateRepository;
    private final FeeRepository               feeRepository;
    private final JdbcTemplate                jdbcTemplate;

    private static final String ACADEMIC_YEAR = "2024-2025";

    @Override
    public void run(String... args) {
        log.info("=== Seeding demo data ===");

        // 0. Drop stale enum CHECK constraints. Postgres keeps a
        // CHECK (name IN (...old roles...)) created before new RoleName values
        // (e.g. STUDENT) existed; ddl-auto=update never updates it, so seeding a
        // new role would fail. Safe to run every startup (IF EXISTS / ignored on H2).
        try {
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check");
        } catch (Exception ex) {
            log.warn("Could not drop roles_name_check (ignored): {}", ex.getMessage());
        }

        // Migration V5 created tenant_audit_log.old_value/new_value and
        // subscription_plans.features as jsonb, but the entities map them as plain
        // String. Inserting a varchar into a jsonb column fails on PostgreSQL, so
        // convert them to text (idempotent; ignored on H2). The entities declare
        // these columns as text to match.
        for (String ddl : new String[]{
                "ALTER TABLE tenant_audit_log ALTER COLUMN old_value TYPE text USING old_value::text",
                "ALTER TABLE tenant_audit_log ALTER COLUMN new_value TYPE text USING new_value::text",
                "ALTER TABLE subscription_plans ALTER COLUMN features TYPE text USING features::text",
        }) {
            try {
                jdbcTemplate.execute(ddl);
            } catch (Exception ex) {
                log.warn("jsonb→text migration skipped ({}): {}", ddl, ex.getMessage());
            }
        }

        // 1. Create roles
        Role superAdminRole  = createRole(RoleName.SUPER_ADMIN,        "Platform super administrator");
        Role schoolAdminRole = createRole(RoleName.SCHOOL_ADMIN,       "School administrator");
        Role teacherRole     = createRole(RoleName.TEACHER,            "Teacher");
        Role parentRole      = createRole(RoleName.PARENT,             "Parent/guardian");
        createRole(RoleName.ACCOUNTANT,        "Accountant");
        createRole(RoleName.LIBRARIAN,         "Librarian");
        createRole(RoleName.TRANSPORT_MANAGER, "Transport manager");
        createRole(RoleName.SUPPORT_STAFF,     "Support staff (all modules except fees & reconciliation)");
        createRole(RoleName.STUDENT,           "Student");

        // 2. Create demo school (DPS tenant)
        School school = schoolRepository.findByCode("DPS-DEMO").orElseGet(() ->
                schoolRepository.save(School.builder()
                        .name("Demo Public School")
                        .code("DPS-DEMO")
                        .city("New Delhi")
                        .state("Delhi")
                        .country("India")
                        .email("info@dpsdemo.edu")
                        .phone("011-12345678")
                        .currentAcademicYear(ACADEMIC_YEAR)
                        .institutionType(InstitutionType.SCHOOL)
                        .active(true)
                        .build()));

        // 2a. Seed default main campus for DPS (idempotent)
        if (!campusRepository.existsByTenantIdAndCode(school.getId(), "DPS-MAIN")) {
            campusRepository.save(Campus.builder()
                    .tenant(school)
                    .name("Demo Public School - Main Campus")
                    .code("DPS-MAIN")
                    .city(school.getCity())
                    .state(school.getState())
                    .phone(school.getPhone())
                    .email(school.getEmail())
                    .institutionType(InstitutionType.SCHOOL)
                    .mainCampus(true)
                    .active(true)
                    .currentAcademicYear(ACADEMIC_YEAR)
                    .build());
        }

        // 3. SUPER_ADMIN user (no school)
        createUser(null, "Super", "Admin", "superadmin@sms.com", "Admin@1234", superAdminRole, null);

        // 4. School Admin
        createUser(school, "Rajesh", "Kumar", "admin@dpsdemo.edu", "Admin@1234", schoolAdminRole, null);

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
                        .status("ACTIVE")
                        .build()));

        // 6. Parent
        User parentUser = createUser(school, "Sunita", "Verma", "parent@dpsdemo.edu", "Parent@1234", parentRole, Gender.FEMALE);
        parentRepository.findByUserId(parentUser.getId()).orElseGet(() ->
                parentRepository.save(Parent.builder()
                        .school(school)
                        .user(parentUser)
                        .occupation("Engineer")
                        .relation("MOTHER")
                        .build()));

        // 7. Master Data: Classes 1–10 with Sections A, B, C
        List<SchoolClass> allClasses = seedClasses(school);

        // 8. Assign the demo teacher as class teacher for Class 7-A
        SchoolClass class7 = allClasses.stream()
                .filter(c -> c.getNumericName() != null && c.getNumericName() == 7)
                .findFirst().orElse(allClasses.get(6));

        Section section7A = sectionRepository.findBySchoolClassIdAndDeletedFalse(class7.getId())
                .stream().filter(s -> "A".equals(s.getName())).findFirst()
                .orElseGet(() -> sectionRepository.save(Section.builder()
                        .school(school).schoolClass(class7)
                        .name("A").classTeacher(teacher).maxCapacity(40).build()));

        // 9. Subjects master data
        seedSubjects(school);

        // 10. Seed teacher assignments: Priya Sharma → Class 7 → Section A → 3 subjects
        seedTeacherAssignments(school, teacher, class7, section7A);

        // 10a. Seed demo timetable for Class 7-A (Mon–Fri, 6 periods)
        seedTimetable(school, teacher, section7A);

        // 11. Students — registered through the admission service
        AddressRequest demoAddress = new AddressRequest();
        demoAddress.setAddressLine1("123 Demo Street");
        demoAddress.setCity("New Delhi");
        demoAddress.setState("Delhi");
        demoAddress.setPincode("110001");

        // Guardian for students 1 & 2 (Sunita Verma – MOTHER)
        GuardianRequest guardian1 = new GuardianRequest();
        guardian1.setFirstName("Sunita");
        guardian1.setLastName("Verma");
        guardian1.setMobile("9999999999");
        guardian1.setRelation(GuardianRelation.MOTHER);
        guardian1.setPrimary(true);

        // Guardian for student 3 (Ramesh Singh – FATHER)
        GuardianRequest guardian3 = new GuardianRequest();
        guardian3.setFirstName("Ramesh");
        guardian3.setLastName("Singh");
        guardian3.setMobile("9888888888");
        guardian3.setRelation(GuardianRelation.FATHER);
        guardian3.setPrimary(true);

        registerStudent(school.getId(), buildRequest(
                "Aarav", "Verma", Gender.MALE, "ADM-2024-001", "01",
                class7.getId(), section7A.getId(), demoAddress, List.of(guardian1)));

        registerStudent(school.getId(), buildRequest(
                "Diya", "Sharma", Gender.FEMALE, "ADM-2024-002", "02",
                class7.getId(), section7A.getId(), demoAddress, List.of(guardian1)));

        registerStudent(school.getId(), buildRequest(
                "Kabir", "Singh", Gender.MALE, "ADM-2024-003", "03",
                class7.getId(), section7A.getId(), demoAddress, List.of(guardian3)));

        // 12. Default fee template + monthly tuition fee for each enrolled Class 7-A student
        seedFees(school, section7A);

        log.info("=== Demo data seeded successfully ===");
        log.info("Credentials:");
        log.info("  SUPER_ADMIN  → superadmin@sms.com  / Admin@1234");
        log.info("  SCHOOL_ADMIN → admin@dpsdemo.edu   / Admin@1234");
        log.info("  TEACHER      → teacher@dpsdemo.edu / Teacher@1234");
        log.info("  PARENT       → parent@dpsdemo.edu  / Parent@1234");
        log.info("  School ID    → {}", school.getId());
        log.info("  Classes seeded: 1–10, each with sections A, B, C");
        log.info("  Subjects seeded: 12 subjects");
    }

    // ── Admission helpers ─────────────────────────────────────────────────────

    private RegisterStudentRequest buildRequest(
            String firstName, String lastName, Gender gender,
            String admissionNumber, String rollNumber,
            Long classId, Long sectionId,
            AddressRequest address, List<GuardianRequest> guardians) {

        RegisterStudentRequest req = new RegisterStudentRequest();
        req.setFirstName(firstName);
        req.setLastName(lastName);
        req.setGender(gender);
        req.setDateOfBirth(LocalDate.of(2012, 3, 15));
        req.setAdmissionNumber(admissionNumber);
        req.setInstitutionType(InstitutionType.SCHOOL);
        req.setAcademicSession(ACADEMIC_YEAR);
        req.setAdmissionDate(LocalDate.of(2024, 4, 1));
        req.setAdmissionType(AdmissionType.FRESH);
        req.setClassId(classId);
        req.setSectionId(sectionId);
        req.setRollNumber(rollNumber);
        req.setCurrentAddress(address);
        req.setGuardians(guardians);
        return req;
    }

    private void registerStudent(Long tenantId, RegisterStudentRequest req) {
        try {
            // School students with a class + section are auto-enrolled by register(),
            // so no separate admit/enroll step is needed.
            admissionService.register(tenantId, req);
        } catch (Exception e) {
            log.warn("Skipping student {} {} — already exists or error: {}",
                    req.getFirstName(), req.getLastName(), e.getMessage());
        }
    }

    // ── Class & Section seeding ───────────────────────────────────────────────

    private List<SchoolClass> seedClasses(School school) {
        List<SchoolClass> classes = new ArrayList<>();
        String[] sectionNames = {"A", "B", "C"};

        for (int i = 1; i <= 10; i++) {
            final int classNum = i;
            String className = "Class " + classNum;

            SchoolClass cls = classRepository
                    .findBySchoolIdAndAcademicYearAndDeletedFalse(school.getId(), ACADEMIC_YEAR)
                    .stream()
                    .filter(c -> c.getNumericName() != null && c.getNumericName() == classNum)
                    .findFirst()
                    .orElseGet(() -> classRepository.save(SchoolClass.builder()
                            .school(school)
                            .name(className)
                            .numericName(classNum)
                            .academicYear(ACADEMIC_YEAR)
                            .build()));
            classes.add(cls);

            // Create sections A, B, C for each class
            for (String sec : sectionNames) {
                final String secName = sec;
                boolean exists = sectionRepository
                        .findBySchoolClassIdAndDeletedFalse(cls.getId())
                        .stream().anyMatch(s -> secName.equals(s.getName()));
                if (!exists) {
                    sectionRepository.save(Section.builder()
                            .school(school)
                            .schoolClass(cls)
                            .name(secName)
                            .maxCapacity(40)
                            .build());
                }
            }
        }
        return classes;
    }

    // ── Teacher Assignment seeding ────────────────────────────────────────────

    private void seedTeacherAssignments(School school, Teacher teacher,
                                         SchoolClass class7, Section section7A) {
        String[] subjectNames = {"Mathematics", "Science", "English"};
        for (String subjectName : subjectNames) {
            subjectRepository.findBySchoolIdAndSubjectNameAndDeletedFalse(school.getId(), subjectName)
                    .ifPresent(subject -> {
                        boolean exists = teacherAssignmentRepository
                                .existsBySchoolIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
                                        school.getId(), section7A.getId(), subject.getId(), ACADEMIC_YEAR);
                        if (!exists) {
                            teacherAssignmentRepository.save(TeacherAssignment.builder()
                                    .school(school)
                                    .teacher(teacher)
                                    .schoolClass(class7)
                                    .section(section7A)
                                    .subject(subject)
                                    .academicYear(ACADEMIC_YEAR)
                                    .classTeacher("Mathematics".equals(subjectName))
                                    .status("ACTIVE")
                                    .build());
                        }
                    });
        }
    }

    // ── Timetable seeding ────────────────────────────────────────────────────

    private void seedTimetable(School school, Teacher teacher, Section section7A) {
        // 6 periods per day, Mon–Fri (dayOfWeek 1–5)
        // subjects cycle: Math, English, Science, Hindi, SS, CS
        String[] subjects = {"Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"};
        java.time.LocalTime[] starts = {
            java.time.LocalTime.of(8, 0), java.time.LocalTime.of(9, 0),
            java.time.LocalTime.of(10, 0), java.time.LocalTime.of(11, 0),
            java.time.LocalTime.of(12, 0), java.time.LocalTime.of(13, 0)
        };
        for (int day = 1; day <= 5; day++) {
            for (int period = 1; period <= 6; period++) {
                final int d = day; final int p = period;
                String subjectName = subjects[(period - 1) % subjects.length];
                boolean exists = timetableRepository
                        .findBySectionIdAndAcademicYearAndDeletedFalse(section7A.getId(), ACADEMIC_YEAR)
                        .stream().anyMatch(t -> t.getDayOfWeek() == d && t.getPeriodNumber() == p);
                if (!exists) {
                    timetableRepository.save(Timetable.builder()
                            .school(school).section(section7A).teacher(teacher)
                            .subject(subjectName).dayOfWeek(day).periodNumber(period)
                            .startTime(starts[period - 1])
                            .endTime(starts[period - 1].plusHours(1))
                            .academicYear(ACADEMIC_YEAR).build());
                }
            }
        }
    }

    // ── Fee seeding ───────────────────────────────────────────────────────────

    private void seedFees(School school, Section section7A) {
        // A reusable default template so the Fee Templates page has something.
        if (feeTemplateRepository.findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(school.getId()).isEmpty()) {
            feeTemplateRepository.save(FeeTemplate.builder()
                    .school(school)
                    .name("Monthly Tuition")
                    .feeType("TUITION")
                    .amount(new BigDecimal("2000"))
                    .frequency("MONTHLY")
                    .dueDayOfMonth(10)
                    .graceDays(5)
                    .lateFeeEnabled(true)
                    .lateFeeAmount(new BigDecimal("100"))
                    .partialAllowed(false)
                    .concessionType("NONE")
                    .academicYear(ACADEMIC_YEAR)
                    .status("ACTIVE")
                    .build());
        }

        // A pending tuition fee for each enrolled student in 7-A (idempotent).
        for (Student student : studentRepository.findBySectionId(section7A.getId())) {
            boolean exists = feeRepository.findByStudentIdAndAcademicYearAndDeletedFalse(student.getId(), ACADEMIC_YEAR)
                    .stream().anyMatch(f -> "TUITION".equals(f.getFeeCategory()) && "October 2024".equals(f.getFeePeriod()));
            if (!exists) {
                feeRepository.save(Fee.builder()
                        .school(school)
                        .student(student)
                        .feeCategory("TUITION")
                        .academicYear(ACADEMIC_YEAR)
                        .feePeriod("October 2024")
                        .amount(new BigDecimal("2000"))
                        .discount(BigDecimal.ZERO)
                        .fine(BigDecimal.ZERO)
                        .dueDate(LocalDate.of(2024, 10, 10))
                        .status(FeeStatus.PENDING)
                        .remarks("Seeded demo fee")
                        .build());
            }
        }
    }

    // ── Subject seeding ───────────────────────────────────────────────────────

    private void seedSubjects(School school) {
        String[][] subjects = {
            {"MATH",    "Mathematics"},
            {"SCI",     "Science"},
            {"ENG",     "English"},
            {"HIN",     "Hindi"},
            {"SS",      "Social Studies"},
            {"CS",      "Computer Science"},
            {"PHY",     "Physics"},
            {"CHEM",    "Chemistry"},
            {"BIO",     "Biology"},
            {"GEO",     "Geography"},
            {"PE",      "Physical Education"},
            {"ART",     "Art & Craft"},
        };

        for (String[] s : subjects) {
            String code = s[0];
            String name = s[1];
            if (!subjectRepository.existsBySchoolIdAndSubjectNameAndDeletedFalse(school.getId(), name)) {
                subjectRepository.save(Subject.builder()
                        .school(school)
                        .subjectCode(code)
                        .subjectName(name)
                        .status("ACTIVE")
                        .build());
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
}
