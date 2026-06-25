package com.antigravity.fraud.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private BigDecimal amount;
    private String merchant;
    private String location;
    private String ipAddress;
    private String deviceFingerprint;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    private CaseStatus caseStatus;

    private Double fraudScore;
    private Double shadowScore;
    private Double biometricScore;
    private Integer velocityCount;

    @Column(length = 2000)
    private String reasonCodes; // pipe-separated reason codes

    private String caseNote;
    private String resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = TransactionStatus.PENDING;
        if (caseStatus == null) caseStatus = CaseStatus.OPEN;
    }

    public enum TransactionStatus {
        PENDING, APPROVED, SUSPICIOUS, FRAUD
    }

    public enum CaseStatus {
        OPEN, CONFIRMED_FRAUD, FALSE_POSITIVE
    }
}
