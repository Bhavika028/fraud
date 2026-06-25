package com.antigravity.fraud.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    private String encryptedEmail;
    private String encryptedPhone;
    private String homeBase;       // User's known home city/location
    private String lastDeviceFingerprint;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    private LocalDateTime suspendedAt;
    private String suspensionReason;

    public enum Role {
        USER, ADMIN
    }

    public enum UserStatus {
        ACTIVE, SUSPENDED, UNDER_REVIEW
    }
}
