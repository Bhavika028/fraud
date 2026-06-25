package com.antigravity.fraud.controller;

import com.antigravity.fraud.domain.Transaction;
import com.antigravity.fraud.repository.TransactionRepository;
import com.antigravity.fraud.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Case Management Controller
 * Allows analysts to review, resolve, and annotate suspicious/fraud transactions.
 */
@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaseController {

    private final TransactionRepository transactionRepository;
    private final AuditService auditService;

    /** GET /api/cases — list all open cases (SUSPICIOUS + FRAUD that are still OPEN) */
    @GetMapping
    public ResponseEntity<List<Transaction>> getOpenCases() {
        List<Transaction> flagged = transactionRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(Transaction.TransactionStatus.SUSPICIOUS, Transaction.TransactionStatus.FRAUD)
        );
        return ResponseEntity.ok(flagged);
    }

    /** GET /api/cases/{id} — get full detail for a single transaction */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCaseDetail(@PathVariable Long id) {
        Optional<Transaction> tx = transactionRepository.findById(id);
        return tx.<ResponseEntity<?>>map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/cases/{id}/resolve — mark case as CONFIRMED_FRAUD or FALSE_POSITIVE */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveCase(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String resolution = body.getOrDefault("resolution", "");
        String analyst    = body.getOrDefault("analyst", "UNKNOWN");
        String note       = body.getOrDefault("note", "");

        Optional<Transaction> txOpt = transactionRepository.findById(id);
        if (txOpt.isEmpty()) return ResponseEntity.notFound().build();

        Transaction tx = txOpt.get();
        try {
            tx.setCaseStatus(Transaction.CaseStatus.valueOf(resolution));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid resolution. Use CONFIRMED_FRAUD or FALSE_POSITIVE"));
        }

        tx.setResolvedBy(analyst);
        tx.setResolvedAt(LocalDateTime.now());
        tx.setCaseNote(note);

        if (resolution.equals("FALSE_POSITIVE")) {
            tx.setStatus(Transaction.TransactionStatus.APPROVED);
        }

        transactionRepository.save(tx);
        auditService.logCaseResolution(id, resolution, analyst);

        return ResponseEntity.ok(Map.of(
            "message", "Case resolved as " + resolution,
            "transactionId", id,
            "resolvedBy", analyst
        ));
    }
}
