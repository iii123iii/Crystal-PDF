package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ExtractSelectionService {

    /**
     * Extract (keep) specified pages from a PDF.
     * This is essentially the same as SplitService.extractPages - creates a new PDF with only the specified pages.
     */
    public byte[] extractSelection(byte[] pdfBytes, List<Integer> pages) throws IOException {
        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("At least one page must be selected.");
        }

        try (PDDocument sourceDoc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {

            int total = sourceDoc.getNumberOfPages();

            // Validate page numbers
            for (int p : pages) {
                if (p < 1 || p > total) {
                    throw new IllegalArgumentException(
                        "Page " + p + " is out of range. Document has " + total + " pages.");
                }
            }

            // Create new document with selected pages
            try (PDDocument destDoc = new PDDocument();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Set<Integer> keepSet = new HashSet<>(pages);
                for (int i = 1; i <= total; i++) {
                    if (keepSet.contains(i)) {
                        PDPage page = sourceDoc.getPage(i - 1);
                        destDoc.addPage(page);
                    }
                }

                destDoc.save(out);
                return out.toByteArray();
            }
        }
    }
}
