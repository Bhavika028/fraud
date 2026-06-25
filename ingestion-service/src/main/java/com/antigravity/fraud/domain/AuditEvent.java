package com.antigravity.fraud.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eventType;   // AUTO_BLOCK, CASE_RESOLVED, SHADOW_RESULT, LOGIN_ATTEMPT
    private Long userId;
    private Long transactionId;
    private String details;
    private String performedBy;
    private LocalDateTime occurredAt;

    @PrePersist
    protected void onCreate() {
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }
}
