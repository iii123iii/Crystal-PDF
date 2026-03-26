package com.crystalpdf.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class CompressService {

    private static final Set<String> VALID_LEVELS = Set.of("screen", "ebook", "printer", "prepress");
    private static final long TIMEOUT_SEC = 120;

    public byte[] compress(MultipartFile file, String level) throws IOException, InterruptedException {
        if (!VALID_LEVELS.contains(level)) {
            throw new IllegalArgumentException("Invalid compression level: " + level);
        }

        Path tempInput  = Files.createTempFile("crystalpdf-compress-in-",  ".pdf");
        Path tempOutput = Files.createTempFile("crystalpdf-compress-out-", ".pdf");

        try {
            Files.write(tempInput, file.getBytes());

            ProcessBuilder pb = new ProcessBuilder(
                    "gs",
                    "-sDEVICE=pdfwrite",
                    "-dCompatibilityLevel=1.4",
                    "-dPDFSETTINGS=/" + level,
                    "-dNOPAUSE",
                    "-dQUIET",
                    "-dBATCH",
                    "-sOutputFile=" + tempOutput,
                    tempInput.toString()
            );
            pb.redirectErrorStream(true);

            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                throw new IOException(
                    "Ghostscript not found. Install ghostscript and ensure it is on PATH.", e);
            }

            // Drain output before waitFor to prevent buffer deadlock
            String processOutput = new String(process.getInputStream().readAllBytes());

            boolean finished = process.waitFor(TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("Ghostscript timed out after " + TIMEOUT_SEC + "s.");
            }
            if (process.exitValue() != 0) {
                throw new IOException(
                    "Ghostscript failed (exit " + process.exitValue() + "): " + processOutput.trim());
            }

            return Files.readAllBytes(tempOutput);

        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempOutput);
        }
    }
}
