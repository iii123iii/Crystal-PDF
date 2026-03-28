package com.crystalpdf.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class RepairService {

    @Value("${crystalpdf.storage.path}")
    private String storagePath;

    /**
     * Repair a PDF using QPDF's --replace-input mode.
     * QPDF reconstructs the PDF cross-reference table and fixes structural issues.
     */
    public byte[] repair(byte[] pdfBytes) throws IOException, InterruptedException {
        Path tmpDir = Path.of(storagePath, "tmp");
        Files.createDirectories(tmpDir);
        Path inputFile = tmpDir.resolve("repair_" + System.nanoTime() + ".pdf");
        Path outputFile = tmpDir.resolve("repaired_" + System.nanoTime() + ".pdf");

        try {
            Files.write(inputFile, pdfBytes);

            ProcessBuilder pb = new ProcessBuilder(
                    "qpdf", "--linearize", inputFile.toString(), outputFile.toString()
            );
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String output = new String(proc.getInputStream().readAllBytes());
            int exitCode = proc.waitFor();

            // QPDF exit code 0 = success, 3 = warnings (still produces output)
            if (exitCode != 0 && exitCode != 3) {
                throw new IOException("QPDF repair failed (exit " + exitCode + "): " + output);
            }

            return Files.readAllBytes(outputFile);
        } finally {
            Files.deleteIfExists(inputFile);
            Files.deleteIfExists(outputFile);
        }
    }
}
