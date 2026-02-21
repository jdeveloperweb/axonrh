package com.axonrh.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_registrations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "employee_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @CreationTimestamp
    @Column(name = "registration_date", updatable = false)
    private LocalDateTime registrationDate;
}
