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

    /**
     * Compresses a PDF using Ghostscript.
     *
     * @param level Ghostscript PDF settings: screen | ebook | printer | prepress
     */
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

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("Ghostscript compression timed out.");
            }
            if (process.exitValue() != 0) {
                throw new IOException("Ghostscript exited with code " + process.exitValue());
            }

            return Files.readAllBytes(tempOutput);

        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempOutput);
        }
    }
}
