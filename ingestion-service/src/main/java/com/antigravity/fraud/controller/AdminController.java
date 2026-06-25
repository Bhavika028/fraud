package com.antigravity.fraud.controller;

import com.antigravity.fraud.domain.Transaction;
import com.antigravity.fraud.repository.AuditRepository;
import com.antigravity.fraud.repository.TransactionRepository;
import com.antigravity.fraud.repository.UserRepository;
import com.antigravity.fraud.service.FraudRingDetector;
import com.antigravity.fraud.service.ShadowModeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin Controller — admin-only endpoints
 * Fraud ring detection, shadow mode toggle, user management, audit log
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final FraudRingDetector fraudRingDetector;
    private final ShadowModeService shadowModeService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AuditRepository auditRepository;

    /** GET /api/admin/fraud-rings */
    @GetMapping("/fraud-rings")
    public ResponseEntity<List<FraudRingDetector.FraudRing>> getFraudRings() {
        return ResponseEntity.ok(fraudRingDetector.detectRings());
    }

    /** GET /api/admin/shadow-mode */
    @GetMapping("/shadow-mode")
    public ResponseEntity<Map<String, Boolean>> getShadowMode() {
        return ResponseEntity.ok(Map.of("enabled", shadowModeService.isShadowModeEnabled()));
    }

    /** POST /api/admin/shadow-mode */
    @PostMapping("/shadow-mode")
    public ResponseEntity<Map<String, Object>> toggleShadowMode(@RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        shadowModeService.setShadowModeEnabled(enabled);
        return ResponseEntity.ok(Map.of(
            "enabled", enabled,
            "message", "Shadow mode " + (enabled ? "activated" : "deactivated")
        ));
    }

    /** GET /api/admin/users */
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /** GET /api/admin/audit */
    @GetMapping("/audit")
    public ResponseEntity<?> getAuditLog() {
        return ResponseEntity.ok(auditRepository.findAll());
    }

    /** GET /api/admin/stats */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long total       = transactionRepository.count();
        long fraudCount  = transactionRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(Transaction.TransactionStatus.FRAUD)).size();
        long suspicious  = transactionRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(Transaction.TransactionStatus.SUSPICIOUS)).size();
        long approved    = transactionRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(Transaction.TransactionStatus.APPROVED)).size();
        long users       = userRepository.count();

        return ResponseEntity.ok(Map.of(
            "totalTransactions", total,
            "fraudCount", fraudCount,
            "suspiciousCount", suspicious,
            "approvedCount", approved,
            "totalUsers", users,
            "shadowModeEnabled", shadowModeService.isShadowModeEnabled()
        ));
    }
}
