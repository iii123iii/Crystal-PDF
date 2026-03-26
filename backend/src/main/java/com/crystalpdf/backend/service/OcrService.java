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

    /**
     * Runs Tesseract OCR on the uploaded PDF and returns a searchable PDF.
     *
     * @param language Tesseract language code(s), e.g. "eng" or "eng+fra"
     */
    public byte[] ocr(MultipartFile file, String language) throws IOException, InterruptedException {
        if (language == null || language.isBlank()) {
            language = "eng";
        }

        Path tempInput      = Files.createTempFile("crystalpdf-ocr-in-",   ".pdf");
        // Tesseract appends its own extension to the output base path
        Path tempOutputBase = Files.createTempFile("crystalpdf-ocr-out-",  "");
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

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("Tesseract OCR timed out.");
            }
            if (process.exitValue() != 0) {
                throw new IOException("Tesseract exited with code " + process.exitValue());
            }

            return Files.readAllBytes(tempOutput);

        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempOutputBase);
            Files.deleteIfExists(tempOutput);
        }
    }
}
