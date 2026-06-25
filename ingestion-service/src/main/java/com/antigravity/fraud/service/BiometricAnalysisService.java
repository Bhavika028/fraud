package com.antigravity.fraud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Behavioral Biometrics Analysis Service
 * Scores a biometric signal payload (mouse velocity, typing cadence, click patterns)
 * against expected human behavior baselines.
 */
@Service
@Slf4j
public class BiometricAnalysisService {

    public BiometricResult analyze(Map<String, Object> signal) {
        if (signal == null || signal.isEmpty()) {
            return new BiometricResult(0.0, List.of());
        }

        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        // Mouse movement analysis
        double mouseVelocity = toDouble(signal.get("mouseVelocityAvg"));
        double mouseStdDev   = toDouble(signal.get("mouseVelocityStdDev"));
        if (mouseVelocity > 3000) {
            score += 0.30;
            reasons.add("BIOMETRIC_MOUSE: Abnormally high mouse velocity (" + (int)mouseVelocity + "px/s) — possible bot");
        } else if (mouseVelocity < 1) {
            score += 0.20;
            reasons.add("BIOMETRIC_MOUSE: No mouse movement detected — possible scripted session");
        }
        if (mouseStdDev < 5 && mouseVelocity > 100) {
            score += 0.15;
            reasons.add("BIOMETRIC_MOUSE: Suspiciously uniform mouse movement — robotic pattern");
        }

        // Typing cadence analysis (inter-keystroke timing in ms)
        double typingCadenceAvg = toDouble(signal.get("typingCadenceAvg"));
        double typingCadenceStdDev = toDouble(signal.get("typingCadenceStdDev"));
        if (typingCadenceAvg > 0 && typingCadenceAvg < 20) {
            score += 0.30;
            reasons.add("BIOMETRIC_TYPING: Typing speed " + (int)typingCadenceAvg + "ms/key — superhuman, likely automated");
        }
        if (typingCadenceStdDev < 2 && typingCadenceAvg > 0) {
            score += 0.15;
            reasons.add("BIOMETRIC_TYPING: Zero variance in keystroke timing — robotic input pattern");
        }

        // Session interaction analysis
        int clickCount    = (int) toDouble(signal.get("clickCount"));
        double sessionMs  = toDouble(signal.get("sessionDurationMs"));
        if (sessionMs > 0 && clickCount == 0) {
            score += 0.10;
            reasons.add("BIOMETRIC_INTERACTION: Form submitted with zero mouse clicks — potential script injection");
        }
        if (sessionMs < 800 && sessionMs > 0) {
            score += 0.20;
            reasons.add("BIOMETRIC_SESSION: Form filled in " + (int)sessionMs + "ms — humanly impossible speed");
        }

        log.info("Biometric score: {}, reasons: {}", score, reasons);
        return new BiometricResult(Math.min(score, 1.0), reasons);
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        try { return Double.parseDouble(val.toString()); }
        catch (Exception e) { return 0.0; }
    }

    public record BiometricResult(double score, List<String> reasons) {}
}
