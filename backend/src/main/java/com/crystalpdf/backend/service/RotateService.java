package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class RotateService {

    /**
     * Rotate specified pages by the given degrees.
     * Only 90, 180, and 270 are valid rotations.
     */
    public byte[] rotatePages(byte[] pdfBytes, List<Integer> pages, Integer rotation) throws IOException {
        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("At least one page must be selected.");
        }

        if (rotation == null || (rotation != 90 && rotation != 180 && rotation != 270)) {
            throw new IllegalArgumentException("Rotation must be 90, 180, or 270 degrees.");
        }

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int total = doc.getNumberOfPages();

            // Validate page numbers
            for (int p : pages) {
                if (p < 1 || p > total) {
                    throw new IllegalArgumentException(
                        "Page " + p + " is out of range. Document has " + total + " pages.");
                }
            }

            // Apply rotation to specified pages
            for (int pageNum : pages) {
                PDPage page = doc.getPage(pageNum - 1);
                int currentRotation = page.getRotation();
                int newRotation = (currentRotation + rotation) % 360;
                page.setRotation(newRotation);
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
