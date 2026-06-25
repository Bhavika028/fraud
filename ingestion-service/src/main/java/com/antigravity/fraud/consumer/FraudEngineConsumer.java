package com.antigravity.fraud.consumer;

import com.antigravity.fraud.controller.StreamController;
import com.antigravity.fraud.domain.Transaction;
import com.antigravity.fraud.domain.User;
import com.antigravity.fraud.producer.TransactionProducer.TransactionIngestedEvent;
import com.antigravity.fraud.repository.TransactionRepository;
import com.antigravity.fraud.repository.UserRepository;
import com.antigravity.fraud.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.event.EventListener;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Fraud Engine Consumer
 * Reads transactions from Kafka, runs all 6 intelligence layers,
 * calculates composite risk score with explainable reason codes,
 * saves result to Postgres, and auto-blocks high-risk users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FraudEngineConsumer {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final VelocityAnalysisService velocityService;
    private final BiometricAnalysisService biometricService;
    private final DeviceIntelligenceService deviceService;
    private final GeoFencingService geoService;
    private final ShadowModeService shadowService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final StreamController streamController;

    // Base scoring weights
    private static final BigDecimal HIGH_AMOUNT   = new BigDecimal("10000.00");
    private static final BigDecimal MEDIUM_AMOUNT = new BigDecimal("2000.00");
    private static final BigDecimal LOW_AMOUNT    = new BigDecimal("500.00");

    private static final Set<String> CRYPTO_MERCHANTS    = Set.of("crypto", "exchange", "coin", "xchange", "defi", "nft");
    private static final Set<String> HIGH_RISK_MERCHANTS = Set.of("darkweb", "anon", "unknown", "offshore");
    private static final Set<String> GAMBLING_MERCHANTS  = Set.of("casino", "bet", "poker", "slot");
    private static final Set<String> RISKY_LOCATIONS     = Set.of("vpn", "proxy", "tor", "offshore", "anonymous", "cayman");

    @SuppressWarnings("unchecked")
    @KafkaListener(topics = "transactions", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(record.value(), Map.class);
            processTransactionPayload(payload);
        } catch (Exception e) {
            log.error("Failed to parse transaction payload from Kafka: {}", e.getMessage(), e);
        }
    }

    @EventListener
    public void consumeInternal(TransactionIngestedEvent event) {
        log.info("Processing transaction payload internally: {}", event.payload().get("transactionId"));
        processTransactionPayload(event.payload());
    }

    @SuppressWarnings("unchecked")
    public void processTransactionPayload(Map<String, Object> payload) {
        try {
            Long txId = toLong(payload.get("transactionId"));

            Optional<Transaction> txOpt = transactionRepository.findById(txId);
            if (txOpt.isEmpty()) {
                log.warn("Transaction {} not found in DB", txId);
                return;
            }

            Transaction tx = txOpt.get();
            if (tx.getStatus() != Transaction.TransactionStatus.PENDING) {
                log.info("Transaction {} already scored: {}", txId, tx.getStatus());
                return;
            }

            log.info("Scoring transaction {}", txId);

            List<String> allReasons = new ArrayList<>();
            double compositeScore   = 0.0;
            double weightSum        = 0.0;

            // ── LAYER 1: Base Rule Engine ──────────────────────────────────────
            double baseScore = scoreBaseRules(tx.getAmount(), tx.getMerchant(), tx.getLocation(), allReasons);
            compositeScore += baseScore * 0.30;
            weightSum += 0.30;

            // ── LAYER 2: Velocity Analysis ─────────────────────────────────────
            Long userId = tx.getUser() != null ? tx.getUser().getId() : null;
            if (userId != null) {
                VelocityAnalysisService.VelocityResult vel = velocityService.analyze(userId);
                tx.setVelocityCount(vel.per1min());
                allReasons.addAll(vel.reasons());
                compositeScore += vel.score() * 0.20;
                weightSum += 0.20;
            }

            // ── LAYER 3: Biometric Analysis ────────────────────────────────────
            Map<String, Object> bioSignal = (Map<String, Object>) payload.get("biometricSignal");
            BiometricAnalysisService.BiometricResult bio = biometricService.analyze(bioSignal);
            tx.setBiometricScore(bio.score());
            allReasons.addAll(bio.reasons());
            compositeScore += bio.score() * 0.15;
            weightSum += 0.15;

            // ── LAYER 4: Device Intelligence ───────────────────────────────────
            Map<String, Object> deviceFp = (Map<String, Object>) payload.get("deviceFingerprint");
            DeviceIntelligenceService.DeviceResult device = deviceService.analyze(deviceFp);
            if (deviceFp != null) {
                tx.setDeviceFingerprint(objectMapper.writeValueAsString(deviceFp));
            }
            allReasons.addAll(device.reasons());
            compositeScore += device.score() * 0.15;
            weightSum += 0.15;

            // ── LAYER 5: Geofencing / Impossible Travel ────────────────────────
            if (userId != null) {
                List<Transaction> recentTxs = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
                if (recentTxs.size() > 1) {
                    Transaction prevTx = recentTxs.get(1); // second most recent (skip current)
                    if (prevTx.getCreatedAt() != null) {
                        long secondsDiff = ChronoUnit.SECONDS.between(prevTx.getCreatedAt(), LocalDateTime.now());
                        GeoFencingService.GeoResult geo = geoService.analyze(
                            tx.getLocation(), prevTx.getLocation(), secondsDiff);
                        allReasons.addAll(geo.reasons());
                        compositeScore += geo.score() * 0.20;
                        weightSum += 0.20;
                    }
                }
            }

            // ── Normalize by weight ────────────────────────────────────────────
            double finalScore = weightSum > 0 ? compositeScore / weightSum * (weightSum / 1.0) : compositeScore;
            finalScore = Math.min(1.0, finalScore);

            // ── Shadow Mode ────────────────────────────────────────────────────
            ShadowModeService.ShadowResult shadow = shadowService.scoreInShadow(
                tx.getAmount(), tx.getMerchant(), tx.getLocation(), finalScore);
            if (shadow.shadowScore() != null) {
                tx.setShadowScore(shadow.shadowScore());
                if (shadow.divergedFromLive()) {
                    auditService.logShadowDivergence(txId, finalScore, shadow.shadowScore());
                }
            }

            // ── Determine Status ───────────────────────────────────────────────
            Transaction.TransactionStatus status;
            if (finalScore > 0.80) {
                status = Transaction.TransactionStatus.FRAUD;
                allReasons.add(0, "COMPOSITE_SCORE: " + String.format("%.1f%%", finalScore * 100) + " — HIGH RISK");
            } else if (finalScore > 0.50) {
                status = Transaction.TransactionStatus.SUSPICIOUS;
                allReasons.add(0, "COMPOSITE_SCORE: " + String.format("%.1f%%", finalScore * 100) + " — MEDIUM RISK");
            } else {
                status = Transaction.TransactionStatus.APPROVED;
                allReasons.add(0, "COMPOSITE_SCORE: " + String.format("%.1f%%", finalScore * 100) + " — LOW RISK");
            }

            tx.setFraudScore(finalScore);
            tx.setStatus(status);
            tx.setReasonCodes(String.join("|", allReasons));
            tx = transactionRepository.save(tx);

            // ── Broadcast via SSE stream ───────────────────────────────────────
            streamController.broadcast(tx);

            // ── AUTO-BLOCK: score > 0.95 ───────────────────────────────────────
            if (finalScore > 0.95 && userId != null) {
                userRepository.findById(userId).ifPresent(user -> {
                    if (user.getStatus() != User.UserStatus.SUSPENDED) {
                        user.setStatus(User.UserStatus.SUSPENDED);
                        user.setSuspendedAt(LocalDateTime.now());
                        user.setSuspensionReason("Auto-suspended: fraud score " + String.format("%.2f", finalScore));
                        userRepository.save(user);
                        auditService.logAutoBlock(userId, txId, finalScore);
                        log.warn("AUTO-BLOCKED user {} for score {}", userId, finalScore);
                    }
                });
            }

            log.info("Transaction {} scored: status={}, score={:.3f}, reasons={}",
                     txId, status, finalScore, allReasons.size());

        } catch (Exception e) {
            log.error("Failed to process transaction payload: {}", e.getMessage(), e);
        }
    }

    private double scoreBaseRules(BigDecimal amount, String merchant, String location, List<String> reasons) {
        double score = 0.0;
        String m = merchant != null ? merchant.toLowerCase() : "";
        String l = location != null ? location.toLowerCase() : "";

        // Amount scoring
        if (amount != null) {
            if (amount.compareTo(HIGH_AMOUNT) >= 0) {
                score += 0.55;
                reasons.add("HIGH_AMOUNT: $" + amount + " exceeds high-risk threshold $10,000");
            } else if (amount.compareTo(MEDIUM_AMOUNT) >= 0) {
                score += 0.30;
                reasons.add("MEDIUM_AMOUNT: $" + amount + " exceeds medium-risk threshold $2,000");
            } else if (amount.compareTo(LOW_AMOUNT) >= 0) {
                score += 0.10;
            }
        }

        // Merchant scoring
        for (String kw : CRYPTO_MERCHANTS) {
            if (m.contains(kw)) { score += 0.25; reasons.add("CRYPTO_MERCHANT: '" + merchant + "' is a high-risk crypto/exchange entity"); break; }
        }
        for (String kw : HIGH_RISK_MERCHANTS) {
            if (m.contains(kw)) { score += 0.40; reasons.add("BLACKLISTED_MERCHANT: '" + merchant + "' matches high-risk blacklist"); break; }
        }
        for (String kw : GAMBLING_MERCHANTS) {
            if (m.contains(kw)) { score += 0.20; reasons.add("GAMBLING_MERCHANT: '" + merchant + "' is a gambling-category merchant"); break; }
        }

        // Location scoring
        if (l.isBlank()) {
            score += 0.15;
            reasons.add("MISSING_LOCATION: No location data provided — terminal or IP missing");
        } else {
            for (String kw : RISKY_LOCATIONS) {
                if (l.contains(kw)) { score += 0.25; reasons.add("RISKY_LOCATION: Location '" + location + "' matches anonymization/proxy indicator"); break; }
            }
        }

        return Math.min(score, 1.0);
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        try { return Long.parseLong(val.toString().replaceAll("\\.0$", "")); }
        catch (Exception e) { return null; }
    }
}
