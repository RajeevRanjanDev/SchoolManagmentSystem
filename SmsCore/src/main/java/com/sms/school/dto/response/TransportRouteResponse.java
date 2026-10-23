package com.sms.school.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/** A transport route with its stops and incharge. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportRouteResponse {

    private Long id;
    private String routeName;
    private String routeNumber;
    private String startPoint;
    private String endPoint;
    private BigDecimal monthlyFee;
    private boolean active;

    private Long inchargeTeacherId;
    private String inchargeName;

    private List<StopInfo> stops;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StopInfo {
        private Long id;
        private String stopName;
        private String pickupTime;
        private Integer seqOrder;
    }
}
