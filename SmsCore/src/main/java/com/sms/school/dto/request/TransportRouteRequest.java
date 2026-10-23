package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Create/update payload for a transport route. */
@Data
public class TransportRouteRequest {

    @NotBlank(message = "Route name is required")
    private String routeName;

    @NotBlank(message = "Route number is required")
    private String routeNumber;

    private String startPoint;
    private String endPoint;
    private BigDecimal monthlyFee;

    /** Teacher/employee id of the route incharge (optional). */
    private Long inchargeTeacherId;

    private List<StopEntry> stops = new ArrayList<>();

    @Data
    public static class StopEntry {
        private String stopName;
        private String pickupTime;
    }
}
