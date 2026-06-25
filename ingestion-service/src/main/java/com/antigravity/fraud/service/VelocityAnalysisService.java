package com.antigravity.fraud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Velocity Analysis Service
 * Tracks rolling time-window transaction counts per user.
 * Uses an in-memory ConcurrentHashMap — replaces Redis for zero-config deployments.
 */
@Service
@Slf4j
public class VelocityAnalysisService {

    // userId -> list of transaction timestamps (epoch millis)
    private final ConcurrentHashMap<Long, LinkedList<Long>> userTimestamps = new ConcurrentHashMap<>();

    private static final long ONE_MINUTE_MS = 60_000L;
    private static final long FIVE_MINUTES_MS = 300_000L;
    private static final long ONE_HOUR_MS = 3_600_000L;

    public VelocityResult analyze(Long userId) {
        long now = System.currentTimeMillis();
        userTimestamps.putIfAbsent(userId, new LinkedList<>());
        LinkedList<Long> timestamps = userTimestamps.get(userId);

        synchronized (timestamps) {
            // Add current timestamp
            timestamps.addLast(now);
            // Prune entries older than 1 hour
            timestamps.removeIf(t -> (now - t) > ONE_HOUR_MS);

            int per1min  = (int) timestamps.stream().filter(t -> (now - t) <= ONE_MINUTE_MS).count();
            int per5min  = (int) timestamps.stream().filter(t -> (now - t) <= FIVE_MINUTES_MS).count();
            int per1hour = timestamps.size();

            double score = computeVelocityScore(per1min, per5min, per1hour);
            List<String> reasons = new ArrayList<>();

            if (per1min >= 5)  reasons.add("HIGH_VELOCITY: " + per1min + " transactions in the last 60 seconds");
            if (per5min >= 10) reasons.add("HIGH_VELOCITY: " + per5min + " transactions in the last 5 minutes");
            if (per1hour >= 20) reasons.add("HIGH_VELOCITY: " + per1hour + " transactions in the last hour");

            log.info("Velocity for user {}: 1m={}, 5m={}, 1h={}, score={}", userId, per1min, per5min, per1hour, score);
            return new VelocityResult(score, per1min, per5min, per1hour, reasons);
        }
    }

    private double computeVelocityScore(int per1min, int per5min, int per1hour) {
        double score = 0.0;
        if (per1min >= 5)   score += 0.40;
        else if (per1min >= 3) score += 0.20;
        else if (per1min >= 2) score += 0.10;
        if (per5min >= 10)  score += 0.25;
        else if (per5min >= 6) score += 0.12;
        if (per1hour >= 20) score += 0.15;
        return Math.min(score, 1.0);
    }

    public record VelocityResult(double score, int per1min, int per5min, int per1hour, List<String> reasons) {}
}
