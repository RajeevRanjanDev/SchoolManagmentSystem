package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * A named bus route serving a set of stops.
 */
@Entity
@Table(name = "transport_routes",
        indexes = @Index(name = "idx_route_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRoute extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "route_name", nullable = false)
    private String routeName;

    @Column(name = "route_code", unique = true)
    private String routeCode;

    @Column(name = "start_point")
    private String startPoint;

    @Column(name = "end_point")
    private String endPoint;

    @Column(name = "stops", columnDefinition = "TEXT")
    private String stops;   // JSON array of stop names

    /** Monthly transport fee for this route */
    @Column(name = "monthly_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
