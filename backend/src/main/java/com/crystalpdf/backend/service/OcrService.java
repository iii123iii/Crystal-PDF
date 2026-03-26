package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class OcrService {

    private static final long TIMEOUT_SEC = 300;
    private static final int RENDER_DPI   = 200;

    public byte[] ocr(byte[] pdfBytes, String language) throws IOException, InterruptedException {
        if (language == null || language.isBlank()) language = "eng";

        Path tempDir = Files.createTempDirectory("crystalpdf-ocr-");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {

            PDFRenderer renderer = new PDFRenderer(doc);
            List<Path> pageImages = new ArrayList<>();

            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage img = renderer.renderImageWithDPI(i, RENDER_DPI, ImageType.RGB);
                Path imgPath = tempDir.resolve(String.format("page_%04d.png", i + 1));
                ImageIO.write(img, "PNG", imgPath.toFile());
                pageImages.add(imgPath);
            }

            Path listFile = tempDir.resolve("pages.txt");
            Files.write(listFile, pageImages.stream()
                    .map(Path::toString)
                    .collect(Collectors.toList()));

            Path outputBase = tempDir.resolve("output");
            ProcessBuilder pb = new ProcessBuilder(
                    "tesseract",
                    listFile.toString(),
                    outputBase.toString(),
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

            Path outputPdf = tempDir.resolve("output.pdf");
            return Files.readAllBytes(outputPdf);

        } finally {
            try (Stream<Path> tree = Files.walk(tempDir)) {
                tree.sorted(Comparator.reverseOrder())
                    .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
            }
        }
    }

    public byte[] ocr(MultipartFile file, String language) throws IOException, InterruptedException {
        return ocr(file.getBytes(), language);
    }
}
