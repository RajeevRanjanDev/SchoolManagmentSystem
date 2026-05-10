package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * A single period entry in the weekly timetable.
 * One row = one period slot for a section on a specific day.
 */
@Entity
@Table(name = "timetables",
        indexes = @Index(name = "idx_tt_section_day", columnList = "section_id, day_of_week"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Timetable extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(name = "subject", nullable = false)
    private String subject;

    /** 1=Monday … 7=Sunday */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "period_number", nullable = false)
    private Integer periodNumber;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;
}
