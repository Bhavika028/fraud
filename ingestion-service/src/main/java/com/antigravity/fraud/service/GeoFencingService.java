package com.antigravity.fraud.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * GeoFencing & Impossible Travel Detection Service
 * Compares a transaction's location to the user's previous transaction location.
 * Uses great-circle distance to detect physically impossible travel speeds.
 */
@Service
@Slf4j
public class GeoFencingService {

    // Major city coordinates [lat, lon]
    private static final Map<String, double[]> CITY_COORDS = new HashMap<>();

    static {
        CITY_COORDS.put("new york",     new double[]{40.7128, -74.0060});
        CITY_COORDS.put("london",       new double[]{51.5074, -0.1278});
        CITY_COORDS.put("paris",        new double[]{48.8566, 2.3522});
        CITY_COORDS.put("tokyo",        new double[]{35.6762, 139.6503});
        CITY_COORDS.put("sydney",       new double[]{-33.8688, 151.2093});
        CITY_COORDS.put("dubai",        new double[]{25.2048, 55.2708});
        CITY_COORDS.put("singapore",    new double[]{1.3521, 103.8198});
        CITY_COORDS.put("hong kong",    new double[]{22.3193, 114.1694});
        CITY_COORDS.put("los angeles",  new double[]{34.0522, -118.2437});
        CITY_COORDS.put("chicago",      new double[]{41.8781, -87.6298});
        CITY_COORDS.put("toronto",      new double[]{43.6532, -79.3832});
        CITY_COORDS.put("berlin",       new double[]{52.5200, 13.4050});
        CITY_COORDS.put("moscow",       new double[]{55.7558, 37.6173});
        CITY_COORDS.put("mumbai",       new double[]{19.0760, 72.8777});
        CITY_COORDS.put("delhi",        new double[]{28.6139, 77.2090});
        CITY_COORDS.put("bangalore",    new double[]{12.9716, 77.5946});
        CITY_COORDS.put("shanghai",     new double[]{31.2304, 121.4737});
        CITY_COORDS.put("beijing",      new double[]{39.9042, 116.4074});
        CITY_COORDS.put("seoul",        new double[]{37.5665, 126.9780});
        CITY_COORDS.put("mexico city",  new double[]{19.4326, -99.1332});
        CITY_COORDS.put("sao paulo",    new double[]{-23.5505, -46.6333});
        CITY_COORDS.put("cairo",        new double[]{30.0444, 31.2357});
        CITY_COORDS.put("lagos",        new double[]{6.5244, 3.3792});
        CITY_COORDS.put("johannesburg", new double[]{-26.2041, 28.0473});
        CITY_COORDS.put("amsterdam",    new double[]{52.3676, 4.9041});
        CITY_COORDS.put("zurich",       new double[]{47.3769, 8.5417});
        CITY_COORDS.put("madrid",       new double[]{40.4168, -3.7038});
        CITY_COORDS.put("rome",         new double[]{41.9028, 12.4964});
        CITY_COORDS.put("istanbul",     new double[]{41.0082, 28.9784});
    }

    // Max realistic travel speed (km/h) - commercial aircraft ~900km/h
    private static final double MAX_SPEED_KMH = 900.0;

    public GeoResult analyze(String currentLocation, String previousLocation, long timeDiffSeconds) {
        List<String> reasons = new ArrayList<>();

        if (previousLocation == null || previousLocation.isBlank() || timeDiffSeconds <= 0) {
            return new GeoResult(0.0, false, reasons);
        }

        double[] curCoords  = resolveCoords(currentLocation);
        double[] prevCoords = resolveCoords(previousLocation);

        if (curCoords == null || prevCoords == null) {
            return new GeoResult(0.0, false, reasons);
        }

        double distanceKm = haversineKm(curCoords[0], curCoords[1], prevCoords[0], prevCoords[1]);
        double timeDiffHours = timeDiffSeconds / 3600.0;
        double requiredSpeedKmh = distanceKm / timeDiffHours;

        boolean impossibleTravel = requiredSpeedKmh > MAX_SPEED_KMH && distanceKm > 100;

        double score = 0.0;
        if (impossibleTravel) {
            score = Math.min(0.70, 0.35 + (requiredSpeedKmh - MAX_SPEED_KMH) / 5000.0);
            reasons.add(String.format(
                "IMPOSSIBLE_TRAVEL: %s → %s (%.0f km) in %.1f min requires %.0f km/h — physically impossible",
                capitalize(previousLocation), capitalize(currentLocation),
                distanceKm, timeDiffSeconds / 60.0, requiredSpeedKmh
            ));
        } else if (distanceKm > 5000 && timeDiffHours < 4) {
            score = 0.25;
            reasons.add(String.format(
                "SUSPICIOUS_TRAVEL: Large distance %.0f km between consecutive transactions",
                distanceKm
            ));
        }

        log.info("GeoFencing: {} -> {}, dist={}km, speed={}km/h, impossible={}",
                previousLocation, currentLocation, (int)distanceKm, (int)requiredSpeedKmh, impossibleTravel);
        return new GeoResult(score, impossibleTravel, reasons);
    }

    private double[] resolveCoords(String location) {
        if (location == null) return null;
        String lower = location.toLowerCase();
        for (Map.Entry<String, double[]> entry : CITY_COORDS.entrySet()) {
            if (lower.contains(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    public record GeoResult(double score, boolean impossibleTravel, List<String> reasons) {}
}
