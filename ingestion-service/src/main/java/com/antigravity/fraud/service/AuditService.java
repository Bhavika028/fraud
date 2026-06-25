package com.antigravity.fraud.service;

import com.antigravity.fraud.domain.AuditEvent;
import com.antigravity.fraud.repository.AuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Audit Service — Compliance-ready event logging.
 * All critical actions (auto-blocks, case resolutions, logins, shadow results)
 * are persisted asynchronously for regulatory audit trails.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;

    @Async
    public void log(String eventType, Long userId, Long transactionId, String details, String performedBy) {
        try {
            AuditEvent event = AuditEvent.builder()
                    .eventType(eventType)
                    .userId(userId)
                    .transactionId(transactionId)
                    .details(details)
                    .performedBy(performedBy)
                    .build();
            auditRepository.save(event);
            log.info("AUDIT [{}] user={} tx={} by={}: {}", eventType, userId, transactionId, performedBy, details);
        } catch (Exception e) {
            log.error("Failed to write audit event", e);
        }
    }

    @Async
    public void logAutoBlock(Long userId, Long transactionId, double score) {
        log("AUTO_BLOCK", userId, transactionId,
            String.format("User automatically suspended. Fraud score %.2f exceeded threshold 0.95", score),
            "SYSTEM");
    }

    @Async
    public void logCaseResolution(Long transactionId, String resolution, String analyst) {
        log("CASE_RESOLVED", null, transactionId,
            "Case marked as: " + resolution,
            analyst);
    }

    @Async
    public void logShadowDivergence(Long transactionId, double liveScore, double shadowScore) {
        log("SHADOW_DIVERGENCE", null, transactionId,
            String.format("Live score=%.3f vs Shadow score=%.3f — models diverged", liveScore, shadowScore),
            "SHADOW_ENGINE");
    }

    @Async
    public void logLogin(Long userId, String username, boolean success, String ipAddress) {
        log(success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE", userId, null,
            String.format("Login attempt for '%s' from IP %s: %s", username, ipAddress, success ? "SUCCESS" : "FAILED"),
            username);
    }
}
