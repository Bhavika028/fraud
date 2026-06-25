package com.antigravity.fraud.service;

import com.antigravity.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Fraud Ring Detector
 * Detects coordinated fraud rings by finding groups of different user accounts
 * sharing the same device fingerprint, indicating the same physical machine
 * is being used across multiple fraudulent identities.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FraudRingDetector {

    private final TransactionRepository transactionRepository;

    public List<FraudRing> detectRings() {
        List<Object[]> sharedDevices = transactionRepository.findSharedDeviceFingerprints();
        List<FraudRing> rings = new ArrayList<>();

        for (Object[] row : sharedDevices) {
            String fingerprint = (String) row[0];
            long userCount = (Long) row[1];

            // Get all transactions for this fingerprint
            var transactions = transactionRepository.findByDeviceFingerprint(fingerprint);

            Set<Long> userIds = new HashSet<>();
            int fraudCount = 0;
            double maxScore = 0.0;

            for (var tx : transactions) {
                if (tx.getUser() != null) userIds.add(tx.getUser().getId());
                if (tx.getStatus() == com.antigravity.fraud.domain.Transaction.TransactionStatus.FRAUD) fraudCount++;
                if (tx.getFraudScore() != null && tx.getFraudScore() > maxScore) maxScore = tx.getFraudScore();
            }

            double riskScore = Math.min(1.0, 0.3 + (userCount * 0.15) + (fraudCount * 0.10));
            String riskLevel = riskScore > 0.7 ? "CRITICAL" : riskScore > 0.4 ? "HIGH" : "MEDIUM";

            rings.add(new FraudRing(
                fingerprint,
                new ArrayList<>(userIds),
                (int) userCount,
                fraudCount,
                transactions.size(),
                maxScore,
                riskScore,
                riskLevel
            ));
        }

        rings.sort(Comparator.comparingDouble(FraudRing::riskScore).reversed());
        log.info("Detected {} fraud rings", rings.size());
        return rings;
    }

    public record FraudRing(
        String deviceFingerprint,
        List<Long> userIds,
        int userCount,
        int fraudCount,
        int transactionCount,
        double maxFraudScore,
        double riskScore,
        String riskLevel
    ) {}
}
