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
public class ReorderService {

    /**
     * Reorder pages in a PDF according to the specified order.
     * pageOrder should contain all page numbers (1-based) in the desired sequence.
     */
    public byte[] reorderPages(byte[] pdfBytes, List<Integer> pageOrder) throws IOException {
        if (pageOrder == null || pageOrder.isEmpty()) {
            throw new IllegalArgumentException("Page order list cannot be empty.");
        }

        try (PDDocument sourceDoc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {

            int total = sourceDoc.getNumberOfPages();

            // Validate page numbers
            for (int p : pageOrder) {
                if (p < 1 || p > total) {
                    throw new IllegalArgumentException(
                        "Page " + p + " is out of range. Document has " + total + " pages.");
                }
            }

            // No duplicates allowed
            Set<Integer> orderSet = new HashSet<>(pageOrder);
            if (orderSet.size() != pageOrder.size()) {
                throw new IllegalArgumentException("Duplicate page numbers in order.");
            }
            // Subset is allowed — omitted pages are deleted (combined reorder+delete)

            // Create new document with reordered pages
            try (PDDocument destDoc = new PDDocument();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                for (int pageNum : pageOrder) {
                    PDPage page = sourceDoc.getPage(pageNum - 1);
                    destDoc.addPage(page);
                }

                destDoc.save(out);
                return out.toByteArray();
            }
        }
    }
}
