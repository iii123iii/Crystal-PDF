package com.crystalpdf.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class OcrService {

    private static final long TIMEOUT_SEC = 300;

    public byte[] ocr(MultipartFile file, String language) throws IOException, InterruptedException {
        if (language == null || language.isBlank()) language = "eng";

        Path tempInput      = Files.createTempFile("crystalpdf-ocr-in-",  ".pdf");
        Path tempOutputBase = Files.createTempFile("crystalpdf-ocr-out-", "");
        Path tempOutput     = tempOutputBase.resolveSibling(tempOutputBase.getFileName() + ".pdf");

        try {
            Files.write(tempInput, file.getBytes());

            ProcessBuilder pb = new ProcessBuilder(
                    "tesseract",
                    tempInput.toString(),
                    tempOutputBase.toString(),
                    "-l", language,
                    "pdf"
            );
            pb.redirectErrorStream(true);

            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                throw new IOException(
                    "Tesseract not found. Install tesseract-ocr and ensure it is on PATH.", e);
            }

            // Drain output before waitFor to prevent buffer deadlock
            String processOutput = new String(process.getInputStream().readAllBytes());

            boolean finished = process.waitFor(TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("Tesseract OCR timed out after " + TIMEOUT_SEC + "s.");
            }
            if (process.exitValue() != 0) {
                throw new IOException(
                    "Tesseract failed (exit " + process.exitValue() + "): " + processOutput.trim());
            }

            return Files.readAllBytes(tempOutput);

        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempOutputBase);
            Files.deleteIfExists(tempOutput);
        }
    }
}
