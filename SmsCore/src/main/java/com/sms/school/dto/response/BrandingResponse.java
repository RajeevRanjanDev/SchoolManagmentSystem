package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Public branding response — returned without authentication.
 *
 * Used by the mobile apps to render the login screen
 * (school logo, name, colors) before any token is issued.
 *
 * Also embedded in GET /me/profile so the dashboard immediately
 * shows correct branding after login.
 */
@Data
@Builder
public class BrandingResponse {

    private Long   schoolId;
    private String schoolName;
    private String schoolCode;
    private String legalName;
    private String logoUrl;
    private String faviconUrl;
    private String bannerUrl;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String tagline;
    private String city;
    private String status;   // TRIAL | ACTIVE — client may show "Trial" badge
}
