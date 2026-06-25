package com.antigravity.fraud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Shadow Mode Testing Service
 * Runs an alternative model configuration on the same transaction data
 * without affecting the live scoring decision. Used to validate new
 * rule thresholds before promoting to production.
 */
@Service
@Slf4j
public class ShadowModeService {

    private volatile boolean shadowModeEnabled = false;
    private final Random random = new Random();

    // Alternative thresholds (more aggressive than live model)
    private static final BigDecimal SHADOW_HIGH_AMOUNT    = new BigDecimal("8000.00");
    private static final BigDecimal SHADOW_MEDIUM_AMOUNT  = new BigDecimal("1500.00");

    public void setShadowModeEnabled(boolean enabled) {
        this.shadowModeEnabled = enabled;
        log.info("Shadow mode {}", enabled ? "ENABLED" : "DISABLED");
    }

    public boolean isShadowModeEnabled() {
        return shadowModeEnabled;
    }

    public ShadowResult scoreInShadow(BigDecimal amount, String merchant, String location, double liveScore) {
        if (!shadowModeEnabled) {
            return new ShadowResult(null, null, false);
        }

        double score = 0.0;
        List<String> shadowReasons = new ArrayList<>();

        // Shadow model uses tighter thresholds
        if (amount.compareTo(SHADOW_HIGH_AMOUNT) >= 0) {
            score += 0.50;
            shadowReasons.add("SHADOW_HIGH_AMOUNT");
        } else if (amount.compareTo(SHADOW_MEDIUM_AMOUNT) >= 0) {
            score += 0.28;
            shadowReasons.add("SHADOW_MEDIUM_AMOUNT");
        }

        String m = merchant != null ? merchant.toLowerCase() : "";
        if (m.contains("crypto") || m.contains("exchange"))  { score += 0.30; shadowReasons.add("SHADOW_CRYPTO_MERCHANT"); }
        if (m.contains("casino") || m.contains("bet"))        { score += 0.25; shadowReasons.add("SHADOW_GAMBLING_MERCHANT"); }

        String l = location != null ? location.toLowerCase() : "";
        if (l.contains("vpn") || l.contains("proxy"))  { score += 0.20; shadowReasons.add("SHADOW_VPN_LOCATION"); }
        if (l.isEmpty())                                { score += 0.18; shadowReasons.add("SHADOW_NO_LOCATION"); }

        // Slightly different random variance
        score += random.nextDouble() * 0.08;
        score = Math.min(1.0, score);

        String shadowStatus = score > 0.75 ? "FRAUD" : score > 0.45 ? "SUSPICIOUS" : "APPROVED";
        boolean diverged = !shadowStatus.equals(liveScore > 0.8 ? "FRAUD" : liveScore > 0.5 ? "SUSPICIOUS" : "APPROVED");

        log.info("Shadow scoring: liveScore={}, shadowScore={}, shadowStatus={}, diverged={}", 
                 liveScore, score, shadowStatus, diverged);

        return new ShadowResult(score, shadowStatus, diverged);
    }

    public record ShadowResult(Double shadowScore, String shadowStatus, boolean divergedFromLive) {}
}
