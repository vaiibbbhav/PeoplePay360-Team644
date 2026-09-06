package com.fingerprint.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * High-security AES-256-GCM encryption service for biometric fingerprint templates.
 * Plaintext templates are never stored in NeonDB and exist in memory solely during matching.
 */
@Service
public class FingerprintCryptoService {

    private static final Logger logger = LoggerFactory.getLogger(FingerprintCryptoService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // 128-bit authentication tag
    private static final int IV_LENGTH_BYTES = 12; // 12-byte (96-bit) IV recommended by NIST for GCM
    private static final String DEFAULT_KEY_VERSION = "v1";

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public record EncryptedResult(String cipherTextBase64, String ivBase64, String keyVersion) {}

    public FingerprintCryptoService(@Value("${FINGERPRINT_ENCRYPTION_KEY:${fingerprint.encryption.key:}}") String rawKey) {
        String key = rawKey;
        if (key == null || key.trim().isEmpty()) {
            key = System.getenv("FINGERPRINT_ENCRYPTION_KEY");
        }
        if (key == null || key.trim().isEmpty()) {
            key = System.getProperty("FINGERPRINT_ENCRYPTION_KEY");
        }
        if (key == null || key.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL SECURITY CONFIGURATION ERROR: 'FINGERPRINT_ENCRYPTION_KEY' is missing. " +
                "Please configure a 256-bit AES hex or base64 key in your environment or .env file."
            );
        }

        this.secretKey = deriveAesKey(key.trim());
        logger.info("Initialized AES-256-GCM encryption with configured master key (version: {})", DEFAULT_KEY_VERSION);
    }

    /**
     * Encrypts a serialized OpenAFIS template using AES-256-GCM with a newly generated random IV.
     */
    public EncryptedResult encrypt(byte[] plaintextTemplate) {
        if (plaintextTemplate == null || plaintextTemplate.length == 0) {
            throw new IllegalArgumentException("Cannot encrypt empty template data");
        }

        byte[] iv = new byte[IV_LENGTH_BYTES];
        secureRandom.nextBytes(iv);

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintextTemplate);

            String cipherTextBase64 = Base64.getEncoder().encodeToString(cipherText);
            String ivBase64 = Base64.getEncoder().encodeToString(iv);

            return new EncryptedResult(cipherTextBase64, ivBase64, DEFAULT_KEY_VERSION);
        } catch (Exception e) {
            logger.error("Failed to encrypt biometric template: {}", e.getMessage());
            throw new RuntimeException("Cryptographic failure during template encryption", e);
        }
    }

    /**
     * Decrypts an encrypted template in-memory for immediate matching.
     */
    public byte[] decrypt(String cipherTextBase64, String ivBase64, String keyVersion) {
        if (cipherTextBase64 == null || cipherTextBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("Ciphertext cannot be empty");
        }
        if (ivBase64 == null || ivBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("IV cannot be empty for AES-GCM");
        }

        byte[] cipherText = Base64.getDecoder().decode(cipherTextBase64.trim());
        byte[] iv = Base64.getDecoder().decode(ivBase64.trim());

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);
            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            logger.error("Failed to decrypt biometric template: {}", e.getMessage());
            throw new RuntimeException("Cryptographic failure during template decryption", e);
        }
    }

    /**
     * Securely clears sensitive byte array from memory.
     */
    public void wipe(byte[] buffer) {
        if (buffer != null) {
            Arrays.fill(buffer, (byte) 0);
        }
    }

    private SecretKey deriveAesKey(String keyString) {
        try {
            // Check if 64-char hex string (32 bytes = 256 bits)
            if (keyString.length() == 64 && keyString.matches("^[0-9a-fA-F]+$")) {
                byte[] bytes = hexToBytes(keyString);
                return new SecretKeySpec(bytes, "AES");
            }

            // Check if 44-char base64 string
            if (keyString.length() == 44) {
                try {
                    byte[] bytes = Base64.getDecoder().decode(keyString);
                    if (bytes.length == 32) {
                        return new SecretKeySpec(bytes, "AES");
                    }
                } catch (Exception ignored) {}
            }

            // Standard fallback: SHA-256 digest guaranteed 32 bytes (256 bits)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(keyString.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Could not derive 256-bit AES key from supplied key string", e);
        }
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
