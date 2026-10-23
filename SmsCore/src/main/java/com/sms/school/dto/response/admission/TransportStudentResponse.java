package com.sms.school.dto.response.admission;

import lombok.Builder;
import lombok.Data;

/** A student row for the transport screen: identity + class/section + route/stop. */
@Data
@Builder
public class TransportStudentResponse {
    private Long profileId;
    private String fullName;
    private String admissionNumber;
    private Long classId;
    private String className;
    private Long sectionId;
    private String sectionName;
    private boolean transportRequired;
    private Long routeId;
    private String routeName;
    private String stopName;
    private String pickupPoint;     // pickup time from the stop
    private String transportType;
}
