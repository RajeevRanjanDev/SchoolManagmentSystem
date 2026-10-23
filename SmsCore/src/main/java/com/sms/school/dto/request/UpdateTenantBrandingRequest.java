package com.sms.school.dto.request;

import lombok.Data;

@Data
public class UpdateTenantBrandingRequest {
    private String logoUrl;
    private String faviconUrl;
    private String bannerUrl;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String tagline;
    private String customCss;
}
