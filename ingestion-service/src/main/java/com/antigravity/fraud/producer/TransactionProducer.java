package com.antigravity.fraud.producer;

import com.antigravity.fraud.domain.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionProducer {

    private static final String TOPIC = "transactions";
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public record TransactionIngestedEvent(Map<String, Object> payload) {}

    public void sendTransaction(Transaction transaction, Map<String, Object> biometricSignal, Map<String, Object> deviceFingerprint) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("transactionId", transaction.getId());
        payload.put("biometricSignal", biometricSignal);
        payload.put("deviceFingerprint", deviceFingerprint);

        if (kafkaEnabled) {
            try {
                log.info("Sending transaction to Kafka: {}", transaction.getId());
                String key = java.util.Objects.requireNonNull(String.valueOf(transaction.getId()));
                kafkaTemplate.send(TOPIC, key, payload);
                return;
            } catch (Exception e) {
                log.warn("Failed to send transaction to Kafka broker. Falling back to in-memory event bus.", e);
            }
        }

        log.info("Kafka is disabled or offline. Publishing transaction {} internally.", transaction.getId());
        eventPublisher.publishEvent(new TransactionIngestedEvent(payload));
    }
}
