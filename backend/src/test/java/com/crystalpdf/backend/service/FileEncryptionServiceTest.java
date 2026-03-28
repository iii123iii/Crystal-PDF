package com.crystalpdf.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileEncryptionServiceTest {

    private static final FileEncryptionService svc = new FileEncryptionService(""); // uses dev key

    @Test
    void encryptThenDecrypt_roundTripsPlaintext() {
        byte[] plain = "Hello, Crystal-PDF!".getBytes();
        byte[] encrypted = svc.encrypt(plain);
        byte[] decrypted = svc.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(plain);
    }

    @Test
    void encrypt_producesOutputLongerThanInput() {
        byte[] plain = "test".getBytes();
        byte[] encrypted = svc.encrypt(plain);
        // 12-byte IV + 16-byte GCM tag overhead
        assertThat(encrypted.length).isGreaterThan(plain.length);
    }

    @Test
    void encrypt_differentCallsProduceDifferentCiphertext() {
        byte[] plain = "same input".getBytes();
        byte[] enc1 = svc.encrypt(plain);
        byte[] enc2 = svc.encrypt(plain);
        // Random IV means ciphertext should differ
        assertThat(enc1).isNotEqualTo(enc2);
    }

    @Test
    void decrypt_throwsOnTamperedData() {
        byte[] plain = "tamper test".getBytes();
        byte[] encrypted = svc.encrypt(plain);
        encrypted[12]++; // flip a byte in the ciphertext portion
        assertThatThrownBy(() -> svc.decrypt(encrypted))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Decryption failed");
    }

    @Test
    void roundTrip_withBinaryPdfBytes() {
        // PDF magic bytes followed by random content
        byte[] pdfLike = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        assertThat(svc.decrypt(svc.encrypt(pdfLike))).isEqualTo(pdfLike);
    }

    @Test
    void constructor_acceptsExplicitKey() {
        // The key used in application.yml
        String prodKey = "a3f8c2e1d7b94f6a82e0c5d3b1f7a9e4c6d2b8f0a4e7c1d5b9f3a0e8c2d6b4f1";
        FileEncryptionService explicit = new FileEncryptionService(prodKey);
        byte[] data = "explicit key test".getBytes();
        assertThat(explicit.decrypt(explicit.encrypt(data))).isEqualTo(data);
    }
}
