package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ProtectService {

    public byte[] protect(MultipartFile file, String userPassword, String ownerPassword) throws IOException {
        if (userPassword == null || userPassword.isBlank()) {
            throw new IllegalArgumentException("User password must not be empty.");
        }
        // Default owner password to user password if not provided
        String resolvedOwner = (ownerPassword != null && !ownerPassword.isBlank())
                ? ownerPassword : userPassword;

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(file.getBytes()));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            AccessPermission ap = new AccessPermission();
            StandardProtectionPolicy policy =
                    new StandardProtectionPolicy(resolvedOwner, userPassword, ap);
            policy.setEncryptionKeyLength(128);

            doc.protect(policy);
            doc.save(out);
            return out.toByteArray();
        }
    }
}
