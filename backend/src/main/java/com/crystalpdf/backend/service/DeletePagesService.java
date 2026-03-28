package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DeletePagesService {

    /**
     * Delete specified pages from the PDF.
     * Opposite of split/extract - keeps all pages EXCEPT those specified.
     */
    public byte[] deletePages(byte[] pdfBytes, List<Integer> pages) throws IOException {
        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("At least one page must be specified for deletion.");
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

            // Verify we're not deleting all pages
            if (pages.size() >= total) {
                throw new IllegalArgumentException(
                    "Cannot delete all pages. At least one page must remain.");
            }

            // Mark pages for deletion
            Set<Integer> deleteSet = new HashSet<>(pages);

            // Remove in reverse order to avoid index shifting issues
            for (int i = total; i >= 1; i--) {
                if (deleteSet.contains(i)) {
                    doc.removePage(i - 1);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
