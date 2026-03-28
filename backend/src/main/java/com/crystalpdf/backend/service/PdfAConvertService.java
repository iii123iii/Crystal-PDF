package com.crystalpdf.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PdfAConvertService {

    @Value("${crystalpdf.storage.path}")
    private String storagePath;

    /**
     * Convert a PDF to PDF/A-2b using Ghostscript.
     * PDF/A is an ISO-standardized version of PDF for long-term archival.
     */
    public byte[] convertToPdfA(byte[] pdfBytes) throws IOException, InterruptedException {
        Path tmpDir = Path.of(storagePath, "tmp");
        Files.createDirectories(tmpDir);
        Path inputFile = tmpDir.resolve("pdfa_in_" + System.nanoTime() + ".pdf");
        Path outputFile = tmpDir.resolve("pdfa_out_" + System.nanoTime() + ".pdf");

        try {
            Files.write(inputFile, pdfBytes);

            ProcessBuilder pb = new ProcessBuilder(
                    "gs",
                    "-dPDFA=2",
                    "-dBATCH",
                    "-dNOPAUSE",
                    "-dQUIET",
                    "-sColorConversionStrategy=UseDeviceIndependentColor",
                    "-sDEVICE=pdfwrite",
                    "-dPDFACompatibilityPolicy=1",
                    "-sOutputFile=" + outputFile,
                    inputFile.toString()
            );
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String output = new String(proc.getInputStream().readAllBytes());
            int exitCode = proc.waitFor();

            if (exitCode != 0) {
                throw new IOException("Ghostscript PDF/A conversion failed (exit " + exitCode + "): " + output);
            }

            return Files.readAllBytes(outputFile);
        } finally {
            Files.deleteIfExists(inputFile);
            Files.deleteIfExists(outputFile);
        }
    }
}
