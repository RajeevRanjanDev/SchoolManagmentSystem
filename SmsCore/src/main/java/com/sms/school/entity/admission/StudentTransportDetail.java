package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "student_transport_details",
    indexes = {
        @Index(name = "idx_std_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_std_student", columnList = "student_profile_id"),
        @Index(name = "idx_std_route",   columnList = "route_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentTransportDetail extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false, unique = true)
    private StudentProfile studentProfile;

    @Column(name = "transport_required", nullable = false)
    @Builder.Default
    private boolean transportRequired = false;

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Column(name = "stop_name", length = 100)
    private String stopName;

    @Column(name = "pickup_point", length = 200)
    private String pickupPoint;

    /** MORNING | EVENING | BOTH */
    @Column(name = "transport_type", length = 10)
    private String transportType;
}
