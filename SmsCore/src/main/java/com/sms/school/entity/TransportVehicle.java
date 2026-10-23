package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A bus/vehicle assigned to transport routes.
 */
@Entity
@Table(name = "transport_vehicles",
        indexes = @Index(name = "idx_vehicle_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportVehicle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "vehicle_number", nullable = false, unique = true)
    private String vehicleNumber;

    @Column(name = "vehicle_type")
    private String vehicleType;  // BUS, MINI_BUS, VAN

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "driver_phone")
    private String driverPhone;

    @Column(name = "conductor_name")
    private String conductorName;

    @Column(name = "conductor_phone")
    private String conductorPhone;

    @Column(name = "gps_device_id")
    private String gpsDeviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private TransportRoute route;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
