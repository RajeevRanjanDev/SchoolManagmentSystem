package com.sms.school.controller;

import com.sms.school.dto.response.*;
import com.sms.school.entity.School;
import com.sms.school.entity.TenantBranding;
import com.sms.school.entity.User;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.TenantBrandingRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public and authenticated branding/profile endpoints.
 *
 * GET /api/v1/public/school/{code}/branding
 *   → No auth required. Used by mobile app login screen to show school logo/name.
 *
 * GET /api/v1/me/profile
 *   → Requires auth. Returns user info + school branding in one call.
 *     Called immediately after login to render the dashboard.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Branding & Profile", description = "School branding and user profile endpoints")
public class BrandingController {

    private final SchoolRepository    schoolRepository;
    private final TenantBrandingRepository brandingRepository;
    private final UserRepository      userRepository;

    // ── Public: login screen branding (no auth needed) ────────────────────────

    /**
     * Used before login to show the school's logo, name, and colours on
     * the login screen. Returns minimal data — no sensitive info.
     *
     * Flow:
     *  1. User opens app → enters school code
     *  2. App calls this endpoint
     *  3. App renders branded login screen
     *  4. User enters credentials and logs in
     */
    @GetMapping("/api/v1/public/school/{code}/branding")
    @Operation(summary = "Get public branding for a school by code (no auth required)")
    public ResponseEntity<ApiResponse<BrandingResponse>> getPublicBranding(
            @PathVariable String code) {

        School school = schoolRepository.findByCodeWithPlan(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No school found with code: " + code));

        if ("TERMINATED".equals(school.getStatus())) {
            throw new ResourceNotFoundException("This school account is no longer active");
        }

        TenantBranding branding = brandingRepository.findBySchoolId(school.getId()).orElse(null);

        BrandingResponse response = BrandingResponse.builder()
                .schoolId(school.getId())
                .schoolName(school.getName())
                .schoolCode(school.getCode())
                .legalName(school.getLegalName())
                .logoUrl(branding != null && branding.getLogoUrl() != null
                        ? branding.getLogoUrl() : school.getLogoUrl())
                .faviconUrl(branding != null ? branding.getFaviconUrl() : null)
                .bannerUrl(branding != null ? branding.getBannerUrl() : null)
                .primaryColor(branding != null ? branding.getPrimaryColor() : "#1976D2")
                .secondaryColor(branding != null ? branding.getSecondaryColor() : "#FF5722")
                .accentColor(branding != null ? branding.getAccentColor() : "#4CAF50")
                .tagline(branding != null ? branding.getTagline() : null)
                .city(school.getCity())
                .status(school.getStatus())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Authenticated: my profile + branding ──────────────────────────────────

    /**
     * Returns the logged-in user's profile AND school branding in one response.
     *
     * Response is used by:
     *  - Admin App dashboard header (school name + logo)
     *  - Parent App dashboard header (school name + logo + child selector)
     *  - Teacher App dashboard header
     *
     * For SUPER_ADMIN: schoolId/branding fields are null.
     *
     * Front-end should call this once after login and store it in Redux/context.
     * Subsequent navigation re-reads from store — no repeated API calls needed.
     */
    @GetMapping("/api/v1/me/profile")
    @Operation(summary = "Get logged-in user's profile and school branding")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {

        Long userId = TenantContext.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .mobile(user.getPhone())
                .profilePictureUrl(user.getProfilePictureUrl())
                .userType(user.getUserType())
                .role(user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .findFirst().orElse("UNKNOWN"));

        if (user.getSchool() != null) {
            School school = user.getSchool();
            TenantBranding branding = brandingRepository.findBySchoolId(school.getId()).orElse(null);

            builder
                .schoolId(school.getId())
                .schoolName(school.getName())
                .schoolCode(school.getCode())
                .legalName(school.getLegalName())
                .currentAcademicYear(school.getCurrentAcademicYear())
                .subscriptionPlan(school.getSubscriptionPlan() != null
                        ? school.getSubscriptionPlan().getPlanName() : null)
                .tenantStatus(school.getStatus())
                .logoUrl(branding != null && branding.getLogoUrl() != null
                        ? branding.getLogoUrl() : school.getLogoUrl())
                .faviconUrl(branding != null ? branding.getFaviconUrl() : null)
                .primaryColor(branding != null ? branding.getPrimaryColor() : "#1976D2")
                .secondaryColor(branding != null ? branding.getSecondaryColor() : "#FF5722")
                .accentColor(branding != null ? branding.getAccentColor() : "#4CAF50")
                .tagline(branding != null ? branding.getTagline() : null);
        }

        return ResponseEntity.ok(ApiResponse.success(builder.build()));
    }
}
