package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class UnlockService {

    public byte[] unlock(byte[] pdfBytes, String password) throws IOException {
        try (PDDocument doc = Loader.loadPDF(
                new RandomAccessReadBuffer(pdfBytes),
                password == null ? "" : password);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            if (!doc.isEncrypted()) {
                throw new IllegalArgumentException("This PDF is not encrypted.");
            }

            doc.setAllSecurityToBeRemoved(true);
            doc.save(out);
            return out.toByteArray();
        }
    }

    public byte[] unlock(MultipartFile file, String password) throws IOException {
        return unlock(file.getBytes(), password);
    }
}
