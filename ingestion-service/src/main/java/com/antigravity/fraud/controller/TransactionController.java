package com.antigravity.fraud.controller;

import com.antigravity.fraud.domain.Transaction;
import com.antigravity.fraud.domain.User;
import com.antigravity.fraud.producer.TransactionProducer;
import com.antigravity.fraud.repository.TransactionRepository;
import com.antigravity.fraud.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final TransactionProducer transactionProducer;

    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody TransactionRequest request) {
        log.info("Received transaction ingestion request for user ID: {}", request.getUserId());
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + request.getUserId()));

        Transaction transaction = Transaction.builder()
                .user(user)
                .amount(request.getAmount())
                .merchant(request.getMerchant())
                .location(request.getLocation())
                .ipAddress(request.getIpAddress())
                .deviceFingerprint(request.getDeviceFingerprint() != null ? String.valueOf(request.getDeviceFingerprint().get("hash")) : null)
                .status(Transaction.TransactionStatus.PENDING)
                .fraudScore(0.0)
                .build();

        // 1. Save to database as PENDING to generate the ID
        transaction = transactionRepository.save(transaction);
        log.info("Saved transaction with ID: {} and status: {}", transaction.getId(), transaction.getStatus());

        // 2. Publish to Kafka topic for asynchronous scoring
        transactionProducer.sendTransaction(transaction, request.getBiometricSignal(), request.getDeviceFingerprint());

        return ResponseEntity.ok(transaction);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        List<Transaction> all = transactionRepository.findAll();
        
        long totalProtected = all.size();
        BigDecimal totalAmountProtected = all.stream()
                .filter(t -> t.getStatus() == Transaction.TransactionStatus.APPROVED)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long threatsBlocked = all.stream()
                .filter(t -> t.getStatus() == Transaction.TransactionStatus.FRAUD || t.getStatus() == Transaction.TransactionStatus.SUSPICIOUS)
                .count();

        double trustScore = 100.0;
        if (totalProtected > 0) {
            long bad = all.stream().filter(t -> t.getStatus() == Transaction.TransactionStatus.FRAUD).count();
            trustScore = 100.0 * (totalProtected - bad) / totalProtected;
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalProtected", totalProtected);
        metrics.put("totalAmountProtected", totalAmountProtected);
        metrics.put("threatsBlocked", threatsBlocked);
        metrics.put("trustScore", Math.round(trustScore * 10.0) / 10.0);
        
        return ResponseEntity.ok(metrics);
    }

    @Data
    public static class TransactionRequest {
        private Long userId;
        private BigDecimal amount;
        private String merchant;
        private String location;
        private String ipAddress;
        private Map<String, Object> deviceFingerprint;
        private Map<String, Object> biometricSignal;
    }
}
