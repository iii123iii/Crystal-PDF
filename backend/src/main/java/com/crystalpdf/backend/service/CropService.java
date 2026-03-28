package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class CropService {

    /**
     * Crop pages by setting a new crop box. Margins are in points (1 inch = 72 points).
     * Applies to all pages if pageNumbers is null/empty, otherwise only to specified pages.
     */
    public byte[] cropPages(byte[] pdfBytes, float marginTop, float marginRight,
                             float marginBottom, float marginLeft,
                             List<Integer> pageNumbers) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                if (pageNumbers != null && !pageNumbers.isEmpty() && !pageNumbers.contains(i + 1)) {
                    continue;
                }

                PDPage page = doc.getPage(i);
                PDRectangle mediaBox = page.getMediaBox();

                float newLowerLeftX = mediaBox.getLowerLeftX() + marginLeft;
                float newLowerLeftY = mediaBox.getLowerLeftY() + marginBottom;
                float newUpperRightX = mediaBox.getUpperRightX() - marginRight;
                float newUpperRightY = mediaBox.getUpperRightY() - marginTop;

                if (newUpperRightX <= newLowerLeftX || newUpperRightY <= newLowerLeftY) {
                    throw new IllegalArgumentException("Margins are too large for page " + (i + 1));
                }

                page.setCropBox(new PDRectangle(newLowerLeftX, newLowerLeftY,
                        newUpperRightX - newLowerLeftX, newUpperRightY - newLowerLeftY));
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
