package com.crystalpdf.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Service
public class WordToPdfService {

    private static final long TIMEOUT_MS = 60_000;

    public byte[] convert(byte[] fileBytes, String extension) throws IOException, InterruptedException {
        Path tempInput = Files.createTempFile("crystalpdf-input-", extension);
        Path tempOutputDir = Files.createTempDirectory("crystalpdf-out-");

        try {
            Files.write(tempInput, fileBytes);

            ProcessBuilder pb = new ProcessBuilder(
                    "libreoffice", "--headless", "--convert-to", "pdf",
                    "--outdir", tempOutputDir.toString(),
                    tempInput.toString()
            );
            pb.redirectErrorStream(true);

            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                throw new IOException(
                    "LibreOffice not found. Install libreoffice and ensure it is on PATH.", e);
            }

            String processOutput = new String(process.getInputStream().readAllBytes());

            boolean finished = process.waitFor(TIMEOUT_MS, TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("LibreOffice conversion timed out.");
            }
            if (process.exitValue() != 0) {
                throw new IOException(
                    "LibreOffice failed (exit " + process.exitValue() + "): " + processOutput.trim());
            }

            try (Stream<Path> files = Files.list(tempOutputDir)) {
                Path outputPdf = files
                        .filter(p -> p.toString().endsWith(".pdf"))
                        .findFirst()
                        .orElseThrow(() -> new IOException("No output PDF produced by LibreOffice."));
                return Files.readAllBytes(outputPdf);
            }

        } finally {
            Files.deleteIfExists(tempInput);
            try (Stream<Path> tree = Files.walk(tempOutputDir)) {
                tree.sorted(Comparator.reverseOrder()).forEach(p -> {
                    try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                });
            }
        }
    }

    public byte[] convert(MultipartFile file) throws IOException, InterruptedException {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".docx";
        return convert(file.getBytes(), extension);
    }
}
