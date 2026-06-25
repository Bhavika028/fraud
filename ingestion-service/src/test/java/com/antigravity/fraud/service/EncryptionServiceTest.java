package com.antigravity.fraud.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class EncryptionServiceTest {

    private EncryptionService encryptionService;
    
    // 32-byte dummy key for AES-256 encoded in Base64
    private static final String DUMMY_BASE64_KEY = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=";

    @BeforeEach
    public void setUp() {
        encryptionService = new EncryptionService();
        ReflectionTestUtils.setField(encryptionService, "base64Key", DUMMY_BASE64_KEY);
    }

    @Test
    public void testEncryptAndDecrypt() {
        String originalText = "Sensitive PII Data: +1-555-0199";
        
        String encrypted = encryptionService.encrypt(originalText);
        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);

        String decrypted = encryptionService.decrypt(encrypted);
        assertEquals(originalText, decrypted);
    }

    @Test
    public void testDecryptionFailsOnModifiedData() {
        String originalText = "Test text";
        String encrypted = encryptionService.encrypt(originalText);
        
        // Corrupt the encrypted payload slightly (e.g. modify last char)
        String corrupted = encrypted.substring(0, encrypted.length() - 1) + (encrypted.endsWith("A") ? "B" : "A");
        
        assertThrows(RuntimeException.class, () -> {
            encryptionService.decrypt(corrupted);
        });
    }
}
