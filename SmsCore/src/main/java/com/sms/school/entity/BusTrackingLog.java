package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * GPS location log entry for a vehicle.
 * The mobile app / GPS device sends periodic location updates that get stored here.
 * The WebSocket endpoint broadcasts the latest position to subscribed parents.
 */
@Entity
@Table(name = "bus_tracking_logs",
        indexes = @Index(name = "idx_btl_vehicle_time", columnList = "vehicle_id, recorded_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusTrackingLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private TransportVehicle vehicle;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
