package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A single stop on a transport route (ordered pickup/drop point).
 */
@Entity
@Table(name = "transport_route_stops",
        indexes = @Index(name = "idx_route_stop_route", columnList = "route_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRouteStop extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private TransportRoute route;

    @Column(name = "stop_name", nullable = false)
    private String stopName;

    /** Optional pickup/drop time, e.g. "07:45 AM" */
    @Column(name = "pickup_time")
    private String pickupTime;

    /** Display/visit order of the stop along the route */
    @Column(name = "seq_order", nullable = false)
    private Integer seqOrder;
}
