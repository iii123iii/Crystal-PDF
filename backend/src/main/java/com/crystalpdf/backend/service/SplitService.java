package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SplitService {

    /**
     * Extracts the specified pages (1-indexed) from the uploaded PDF and returns
     * a new PDF containing only those pages, in the order requested.
     */
    public byte[] extractPages(MultipartFile file, List<Integer> pages) throws IOException {
        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("At least one page must be selected.");
        }

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(file.getBytes()));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int total = doc.getNumberOfPages();

            for (int p : pages) {
                if (p < 1 || p > total) {
                    throw new IllegalArgumentException(
                        "Page " + p + " is out of range. Document has " + total + " pages.");
                }
            }

            // Remove every page NOT in the requested set (iterate in reverse to preserve indices)
            Set<Integer> keepSet = new HashSet<>(pages);
            for (int i = total; i >= 1; i--) {
                if (!keepSet.contains(i)) {
                    doc.removePage(i - 1); // PDFBox uses 0-based indices
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
