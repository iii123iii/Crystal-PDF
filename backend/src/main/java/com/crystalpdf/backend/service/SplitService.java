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

    public byte[] extractPages(byte[] pdfBytes, List<Integer> pages) throws IOException {
        if (pages == null || pages.isEmpty()) {
            throw new IllegalArgumentException("At least one page must be selected.");
        }

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int total = doc.getNumberOfPages();

            for (int p : pages) {
                if (p < 1 || p > total) {
                    throw new IllegalArgumentException(
                        "Page " + p + " is out of range. Document has " + total + " pages.");
                }
            }

            Set<Integer> keepSet = new HashSet<>(pages);
            for (int i = total; i >= 1; i--) {
                if (!keepSet.contains(i)) {
                    doc.removePage(i - 1);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    public byte[] extractPages(MultipartFile file, List<Integer> pages) throws IOException {
        return extractPages(file.getBytes(), pages);
    }
}
