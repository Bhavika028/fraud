package com.antigravity.fraud.repository;

import com.antigravity.fraud.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByUserIdOrderByOccurredAtDesc(Long userId);
    List<AuditEvent> findByTransactionIdOrderByOccurredAtDesc(Long transactionId);
}
