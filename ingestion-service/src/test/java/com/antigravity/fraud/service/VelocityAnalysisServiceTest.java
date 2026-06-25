package com.antigravity.fraud.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class VelocityAnalysisServiceTest {

    private VelocityAnalysisService velocityAnalysisService;

    @BeforeEach
    public void setUp() {
        velocityAnalysisService = new VelocityAnalysisService();
    }

    @Test
    public void testAnalyzeIncrementalVelocity() {
        Long userId = 42L;

        // 1st transaction
        VelocityAnalysisService.VelocityResult result1 = velocityAnalysisService.analyze(userId);
        assertEquals(1, result1.per1min());
        assertEquals(1, result1.per5min());
        assertEquals(1, result1.per1hour());
        assertEquals(0.0, result1.score(), 0.01);
        assertTrue(result1.reasons().isEmpty());

        // 2nd transaction
        VelocityAnalysisService.VelocityResult result2 = velocityAnalysisService.analyze(userId);
        assertEquals(2, result2.per1min());
        assertEquals(0.10, result2.score(), 0.01);

        // 3rd transaction
        VelocityAnalysisService.VelocityResult result3 = velocityAnalysisService.analyze(userId);
        assertEquals(3, result3.per1min());
        assertEquals(0.20, result3.score(), 0.01);

        // 5th transaction (High velocity trigger for 1 min)
        velocityAnalysisService.analyze(userId); // 4
        VelocityAnalysisService.VelocityResult result5 = velocityAnalysisService.analyze(userId); // 5
        assertEquals(5, result5.per1min());
        assertEquals(0.40, result5.score(), 0.01);
        assertFalse(result5.reasons().isEmpty());
        assertTrue(result5.reasons().get(0).contains("HIGH_VELOCITY: 5 transactions in the last 60 seconds"));
    }

    @Test
    public void testMultipleUsersIsolation() {
        Long userA = 100L;
        Long userB = 200L;

        velocityAnalysisService.analyze(userA);
        velocityAnalysisService.analyze(userA);

        VelocityAnalysisService.VelocityResult resultB = velocityAnalysisService.analyze(userB);
        assertEquals(1, resultB.per1min());
        assertEquals(0.0, resultB.score());
    }
}
