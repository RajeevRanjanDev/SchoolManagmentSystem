package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.BookIssue;
import com.sms.school.entity.LibraryBook;
import com.sms.school.entity.School;
import com.sms.school.entity.Student;
import com.sms.school.entity.User;
import com.sms.school.entity.enums.BookStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
@Tag(name = "Library", description = "Book catalog and issue management")
public class LibraryController {

    private final LibraryBookRepository bookRepository;
    private final BookIssueRepository bookIssueRepository;
    private final SchoolRepository schoolRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @GetMapping("/books")
    @Operation(summary = "Get all books in the library catalog")
    public ResponseEntity<ApiResponse<Page<LibraryBook>>> getAllBooks(
            @PageableDefault(size = 20) Pageable pageable) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                bookRepository.findBySchoolIdAndDeletedFalse(schoolId, pageable)));
    }

    @PostMapping("/books")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Add a book to the catalog")
    public ResponseEntity<ApiResponse<LibraryBook>> addBook(
            @RequestParam String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String isbn,
            @RequestParam(defaultValue = "1") int copies) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        LibraryBook book = LibraryBook.builder()
                .school(school)
                .title(title)
                .author(author)
                .isbn(isbn)
                .totalCopies(copies)
                .availableCopies(copies)
                .status(BookStatus.AVAILABLE)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book added", bookRepository.save(book)));
    }

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'SCHOOL_ADMIN')")
    @Operation(summary = "Issue a book to a student")
    public ResponseEntity<ApiResponse<BookIssue>> issueBook(
            @RequestParam Long bookId,
            @RequestParam Long studentId,
            @RequestParam LocalDate dueDate) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        LibraryBook book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        User issuedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException("No copies available for this book");
        }
        if (bookIssueRepository.existsByBookIdAndStudentIdAndReturnDateIsNull(bookId, studentId)) {
            throw new BusinessException("Student already has this book issued");
        }

        // Decrement available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        if (book.getAvailableCopies() == 0) book.setStatus(BookStatus.ISSUED);
        bookRepository.save(book);

        BookIssue issue = BookIssue.builder()
                .school(book.getSchool())
                .book(book)
                .student(student)
                .issueDate(LocalDate.now())
                .dueDate(dueDate)
                .issuedBy(issuedBy)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book issued", bookIssueRepository.save(issue)));
    }

    @PatchMapping("/return/{issueId}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'SCHOOL_ADMIN')")
    @Operation(summary = "Return a book")
    public ResponseEntity<ApiResponse<BookIssue>> returnBook(@PathVariable Long issueId) {
        BookIssue issue = bookIssueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));

        if (issue.getReturnDate() != null) {
            throw new BusinessException("Book already returned");
        }

        issue.setReturnDate(LocalDate.now());
        bookIssueRepository.save(issue);

        // Increment available copies
        LibraryBook book = issue.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        book.setStatus(BookStatus.AVAILABLE);
        bookRepository.save(book);

        return ResponseEntity.ok(ApiResponse.success("Book returned", issue));
    }

    @GetMapping("/student/{studentId}/issued")
    @Operation(summary = "Get books currently issued to a student")
    public ResponseEntity<ApiResponse<List<BookIssue>>> getIssuedBooks(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(ApiResponse.success(
                bookIssueRepository.findByStudentIdAndReturnDateIsNullAndDeletedFalse(studentId)));
    }

    @GetMapping("/student/{studentId}/history")
    @Operation(summary = "Get full book issue history for a student")
    public ResponseEntity<ApiResponse<List<BookIssue>>> getIssueHistory(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(ApiResponse.success(
                bookIssueRepository.findByStudentIdAndDeletedFalse(studentId)));
    }
}
