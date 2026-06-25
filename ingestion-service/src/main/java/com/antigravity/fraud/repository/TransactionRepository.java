package com.antigravity.fraud.repository;

import com.antigravity.fraud.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findAllByOrderByCreatedAtDesc();

    List<Transaction> findByStatusInOrderByCreatedAtDesc(List<Transaction.TransactionStatus> statuses);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    List<Transaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.deviceFingerprint = :fp ORDER BY t.createdAt DESC")
    List<Transaction> findByDeviceFingerprint(@Param("fp") String fingerprint);

    @Query("SELECT t.deviceFingerprint, COUNT(DISTINCT t.user.id) as userCount FROM Transaction t " +
           "WHERE t.deviceFingerprint IS NOT NULL GROUP BY t.deviceFingerprint HAVING COUNT(DISTINCT t.user.id) > 1")
    List<Object[]> findSharedDeviceFingerprints();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId AND t.createdAt >= :since")
    int countByUserIdAndCreatedAtAfter(@Param("userId") Long userId, @Param("since") java.time.LocalDateTime since);
}
