package com.fingerprint;

import com.fingerprint.service.FingerprintCryptoService;
import com.fingerprint.service.FingerprintCryptoService.EncryptedResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class FingerprintCryptoServiceTest {

    private FingerprintCryptoService cryptoService;

    @BeforeEach
    void setUp() {
        // Test with a 256-bit hex key
        String testKey = "e4b2d189a7f3c65089e1b4a37f5d92c81e6a0b4d7c8f2a1e3b5c7d9e0f2a4b6c";
        cryptoService = new FingerprintCryptoService(testKey);
    }

    @Test
    void testAes256GcmEncryptionAndDecryption() {
        byte[] sampleTemplate = "SAMPLE_OPENAFIS_MINUTIAE_TEMPLATE_BYTES_123456789".getBytes(StandardCharsets.UTF_8);

        EncryptedResult result = cryptoService.encrypt(sampleTemplate);
        assertNotNull(result);
        assertNotNull(result.cipherTextBase64());
        assertNotNull(result.ivBase64());
        assertEquals("v1", result.keyVersion());

        // Verify random IV: 12 bytes = 16 characters in standard base64
        byte[] ivBytes = Base64.getDecoder().decode(result.ivBase64());
        assertEquals(12, ivBytes.length, "IV must be 12 bytes per NIST SP 800-38D");

        // Decrypt in memory
        byte[] decrypted = cryptoService.decrypt(result.cipherTextBase64(), result.ivBase64(), result.keyVersion());
        assertArrayEquals(sampleTemplate, decrypted, "Decrypted bytes must strictly match original template");

        // Wipe buffer
        cryptoService.wipe(decrypted);
        for (byte b : decrypted) {
            assertEquals(0, b, "Decrypted buffer must be wiped to zero in memory");
        }
    }

    @Test
    void testUniqueIvPerEncryption() {
        byte[] data = "SAME_TEMPLATE".getBytes(StandardCharsets.UTF_8);
        EncryptedResult enc1 = cryptoService.encrypt(data);
        EncryptedResult enc2 = cryptoService.encrypt(data);

        assertNotEquals(enc1.ivBase64(), enc2.ivBase64(), "Each encryption must generate a unique IV");
        assertNotEquals(enc1.cipherTextBase64(), enc2.cipherTextBase64(), "Ciphertexts must differ due to unique IV");
    }

    @Test
    void testTamperDetectionInGcm() {
        byte[] data = "SENSITIVE_BIOMETRICS".getBytes(StandardCharsets.UTF_8);
        EncryptedResult enc = cryptoService.encrypt(data);

        // Tamper with ciphertext
        byte[] tamperedBytes = Base64.getDecoder().decode(enc.cipherTextBase64());
        tamperedBytes[0] = (byte) (tamperedBytes[0] ^ 0xFF);
        String tamperedBase64 = Base64.getEncoder().encodeToString(tamperedBytes);

        assertThrows(RuntimeException.class, () -> {
            cryptoService.decrypt(tamperedBase64, enc.ivBase64(), enc.keyVersion());
        }, "GCM authentication tag must reject tampered ciphertext");
    }
}
