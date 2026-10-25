package com.crystalpdf.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;

@Service
public class FileEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;

    // Static reusable SecureRandom to avoid expensive re-seeding on every encrypt call
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Fallback dev key: 32-byte hex string (AES-256)  — "crystalpdfencrypt1234567890abcde"
    private static final String DEV_KEY_HEX = "6372797374616c706466656e6372797074313233343536373839306162636465";

    private final byte[] keyBytes;

    public FileEncryptionService(@Value("${crystalpdf.storage.encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            this.keyBytes = hexToBytes(DEV_KEY_HEX);
        } else {
            this.keyBytes = hexToBytes(encryptionKey.trim());
        }
    }

    /**
     * Encrypts plaintext using AES-256-GCM.
     * Returns [12-byte IV] + [ciphertext + 16-byte GCM tag].
     */
    public byte[] encrypt(byte[] plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(GCM_TAG_BITS, iv));

            byte[] ciphertextAndTag = cipher.doFinal(plaintext);

            byte[] result = new byte[IV_LENGTH_BYTES + ciphertextAndTag.length];
            System.arraycopy(iv, 0, result, 0, IV_LENGTH_BYTES);
            System.arraycopy(ciphertextAndTag, 0, result, IV_LENGTH_BYTES, ciphertextAndTag.length);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypts data produced by {@link #encrypt(byte[])}.
     * Reads the first 12 bytes as IV, then decrypts the remainder.
     */
    public byte[] decrypt(byte[] data) {
        try {
            if (data == null || data.length < IV_LENGTH_BYTES + (GCM_TAG_BITS / 8)) {
                throw new IllegalArgumentException("Encrypted data is too short to be valid.");
            }

            byte[] iv = new byte[IV_LENGTH_BYTES];
            System.arraycopy(data, 0, iv, 0, IV_LENGTH_BYTES);

            int ciphertextLen = data.length - IV_LENGTH_BYTES;
            byte[] ciphertextAndTag = new byte[ciphertextLen];
            System.arraycopy(data, IV_LENGTH_BYTES, ciphertextAndTag, 0, ciphertextLen);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(GCM_TAG_BITS, iv));

            return cipher.doFinal(ciphertextAndTag);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    private static byte[] hexToBytes(String hex) {
        int len = hex.length();
        if (len % 2 != 0) {
            throw new IllegalArgumentException("Invalid hex key length: " + len);
        }
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
