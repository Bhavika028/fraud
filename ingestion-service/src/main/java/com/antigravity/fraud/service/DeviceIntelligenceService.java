package com.antigravity.fraud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Device Intelligence Service
 * Analyses browser/device fingerprint to detect emulators, rooted devices,
 * headless browsers, VPN clients, and remote-access software indicators.
 */
@Service
@Slf4j
public class DeviceIntelligenceService {

    // Known headless/automation user-agent fragments
    private static final Set<String> HEADLESS_SIGNALS = Set.of(
        "headless", "phantom", "selenium", "webdriver", "playwright",
        "puppeteer", "electron", "jsdom", "nightmare", "zombie"
    );

    // Known VPN/proxy/datacenter user-agent and platform signals
    private static final Set<String> VPN_SIGNALS = Set.of(
        "nordvpn", "expressvpn", "mullvad", "protonvpn", "torguard",
        "privatevpn", "cyberghost", "ipvanish"
    );

    // Suspicious screen resolutions common in emulators
    private static final Set<String> EMULATOR_RESOLUTIONS = Set.of(
        "0x0", "1x1", "100x100", "800x600", "240x320", "320x480"
    );

    public DeviceResult analyze(Map<String, Object> fingerprint) {
        if (fingerprint == null || fingerprint.isEmpty()) {
            return new DeviceResult(0.0, "UNKNOWN", List.of());
        }

        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        String userAgent = toString(fingerprint.get("userAgent")).toLowerCase();
        String platform  = toString(fingerprint.get("platform")).toLowerCase();
        int pluginCount  = (int) toDouble(fingerprint.get("pluginCount"));
        String screenRes = toString(fingerprint.get("screenResolution"));
        boolean touchSupport = "true".equals(toString(fingerprint.get("touchSupport")));
        int colorDepth   = (int) toDouble(fingerprint.get("colorDepth"));
        String timezone  = toString(fingerprint.get("timezone"));
        String language  = toString(fingerprint.get("language"));
        boolean webdriver = "true".equals(toString(fingerprint.get("webdriver")));

        // Headless browser detection
        if (webdriver) {
            score += 0.50;
            reasons.add("DEVICE_HEADLESS: WebDriver property detected — automated browser session");
        }
        for (String sig : HEADLESS_SIGNALS) {
            if (userAgent.contains(sig)) {
                score += 0.45;
                reasons.add("DEVICE_HEADLESS: User-agent contains '" + sig + "' — automation tool detected");
                break;
            }
        }

        // VPN/proxy software indicators
        for (String sig : VPN_SIGNALS) {
            if (userAgent.contains(sig) || platform.contains(sig)) {
                score += 0.25;
                reasons.add("DEVICE_VPN: VPN software '" + sig + "' detected in device signature");
                break;
            }
        }

        // Plugin count — real browsers have >2 plugins; headless have 0
        if (pluginCount == 0) {
            score += 0.20;
            reasons.add("DEVICE_PLUGINS: Zero browser plugins — characteristic of headless/emulated browser");
        }

        // Emulator screen resolution
        if (EMULATOR_RESOLUTIONS.contains(screenRes)) {
            score += 0.30;
            reasons.add("DEVICE_SCREEN: Suspicious screen resolution " + screenRes + " matches known emulator profile");
        }

        // Color depth check — 1-bit or missing is unusual
        if (colorDepth > 0 && colorDepth < 16) {
            score += 0.15;
            reasons.add("DEVICE_DISPLAY: Abnormal color depth (" + colorDepth + "bit) — emulator or VM indicator");
        }

        // Timezone/language mismatch (basic check)
        if (!timezone.isEmpty() && !language.isEmpty()) {
            if (timezone.contains("UTC") && !language.startsWith("en")) {
                score += 0.10;
                reasons.add("DEVICE_LOCALE: UTC timezone with non-English locale — possible VPN exit-node mismatch");
            }
        }

        String riskLevel = score > 0.6 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW";
        log.info("Device intelligence: fingerprint={}, score={}, risk={}", screenRes, score, riskLevel);
        return new DeviceResult(Math.min(score, 1.0), riskLevel, reasons);
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        try { return Double.parseDouble(val.toString()); }
        catch (Exception e) { return 0.0; }
    }

    private String toString(Object val) {
        return val == null ? "" : val.toString();
    }

    public record DeviceResult(double score, String riskLevel, List<String> reasons) {}
}
