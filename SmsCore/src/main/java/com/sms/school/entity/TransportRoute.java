package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A named bus route serving an ordered set of stops, with an optional
 * route-incharge (an employee/teacher).
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

    /** Route number, e.g. "R-01". Unique within a school. */
    @Column(name = "route_number")
    private String routeNumber;

    @Column(name = "route_code", unique = true)
    private String routeCode;

    @Column(name = "start_point")
    private String startPoint;

    @Column(name = "end_point")
    private String endPoint;

    /** Route incharge — an employee (teacher/staff). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incharge_teacher_id")
    private Teacher incharge;

    @Builder.Default
    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("seqOrder ASC")
    private List<TransportRouteStop> stops = new ArrayList<>();

    /** Monthly transport fee for this route */
    @Column(name = "monthly_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
