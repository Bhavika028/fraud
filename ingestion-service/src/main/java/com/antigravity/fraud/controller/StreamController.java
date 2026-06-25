package com.antigravity.fraud.controller;

import com.antigravity.fraud.domain.Transaction;
import com.antigravity.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Server-Sent Events Stream Controller
 * Pushes real-time transaction updates to all connected clients.
 */
@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class StreamController {

    private final TransactionRepository transactionRepository;

    // All active SSE connections
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** GET /api/stream/transactions — SSE endpoint for live feed */
    @GetMapping(value = "/transactions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTransactions() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> emitters.remove(emitter));
        emitter.onError(e      -> emitters.remove(emitter));

        emitters.add(emitter);

        // Send current state on connect
        try {
            List<Transaction> recent = transactionRepository.findAllByOrderByCreatedAtDesc();
            List<Transaction> last50 = recent.subList(0, Math.min(50, recent.size()));
            emitter.send(SseEmitter.event()
                .name("init")
                .data(last50));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        log.info("SSE client connected. Total connections: {}", emitters.size());
        return emitter;
    }

    /** Called by FraudEngineConsumer after scoring a transaction */
    public void broadcast(Transaction tx) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("transaction")
                    .data(Map.of(
                        "id",           tx.getId(),
                        "merchant",     tx.getMerchant() != null ? tx.getMerchant() : "",
                        "location",     tx.getLocation() != null ? tx.getLocation() : "",
                        "amount",       tx.getAmount(),
                        "status",       tx.getStatus().name(),
                        "fraudScore",   tx.getFraudScore() != null ? tx.getFraudScore() : 0,
                        "reasonCodes",  tx.getReasonCodes() != null ? tx.getReasonCodes() : "",
                        "createdAt",    tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : ""
                    )));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }
}
