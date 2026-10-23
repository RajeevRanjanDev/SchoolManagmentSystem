package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Per-tenant visual branding: colors, logo, banner, tagline.
 * One record per school (1:1 with School).
 * Returned by the public branding endpoint to render the login screen.
 */
@Entity
@Table(name = "tenant_branding")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantBranding extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false, unique = true)
    private School school;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "primary_color", nullable = false)
    @Builder.Default
    private String primaryColor = "#1976D2";

    @Column(name = "secondary_color", nullable = false)
    @Builder.Default
    private String secondaryColor = "#FF5722";

    @Column(name = "accent_color", nullable = false)
    @Builder.Default
    private String accentColor = "#4CAF50";

    @Column(name = "tagline")
    private String tagline;

    /** Optional custom CSS for web dashboard */
    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;
}
