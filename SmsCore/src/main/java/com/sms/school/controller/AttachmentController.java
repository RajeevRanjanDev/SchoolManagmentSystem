package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Attachment;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.AttachmentRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * Generic file store for attachments (PDF / images) used by notifications,
 * circulars and notices. Files are kept in the database and streamed back
 * on demand. Uploads and downloads are scoped to the caller's school.
 */
@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Upload and download file attachments")
public class AttachmentController {

    private static final long MAX_BYTES = 10L * 1024 * 1024;   // 10 MB
    private static final Set<String> ALLOWED = Set.of(
            "application/pdf",
            "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");

    private final AttachmentRepository attachmentRepository;

    @Data @Builder
    public static class AttachmentResponse {
        private Long id;
        private String url;
        private String fileName;
        private String contentType;
        private long sizeBytes;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','TEACHER','ADMISSION_OFFICER')")
    @Operation(summary = "Upload a file (PDF or image), returns its download URL")
    public ResponseEntity<ApiResponse<AttachmentResponse>> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("No file was uploaded.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("File is too large. Maximum allowed size is 10 MB.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED.contains(contentType)) {
            throw new BusinessException("Only PDF and image files are allowed.");
        }

        Long tenantId = TenantContext.getCurrentSchoolId();
        Long userId = TenantContext.getCurrentUserId();
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BusinessException("Could not read the uploaded file.");
        }

        Attachment saved = attachmentRepository.save(Attachment.builder()
                .tenantId(tenantId)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment")
                .contentType(contentType)
                .sizeBytes(file.getSize())
                .data(bytes)
                .uploadedBy(userId)
                .build());

        return ResponseEntity.ok(ApiResponse.success("File uploaded", AttachmentResponse.builder()
                .id(saved.getId())
                .url("/api/v1/attachments/" + saved.getId())
                .fileName(saved.getFileName())
                .contentType(saved.getContentType())
                .sizeBytes(saved.getSizeBytes())
                .build()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Download an attachment")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        Attachment att = attachmentRepository.findByIdAndTenantIdAndDeletedFalse(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", id));

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (att.getContentType() != null && !att.getContentType().isBlank()) {
                mediaType = MediaType.parseMediaType(att.getContentType());
            }
        } catch (Exception ignored) { /* fall back to octet-stream */ }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + att.getFileName() + "\"")
                .body(new ByteArrayResource(att.getData()));
    }
}
