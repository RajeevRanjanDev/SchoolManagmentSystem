package com.sms.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusLocationResponse {

    private Long vehicleId;
    private String vehicleNumber;
    private Double latitude;
    private Double longitude;
    private Double speedKmh;
    private LocalDateTime recordedAt;
    private String driverName;
    private String driverPhone;
}
