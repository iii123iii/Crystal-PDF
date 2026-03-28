package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class SignStampService {

    /**
     * Add an image stamp/signature to specified pages at the given position.
     * Position coordinates are normalized (0-1).
     */
    public byte[] addStamp(byte[] pdfBytes, byte[] imageBytes, String imageFormat,
                            List<Integer> pages, float x, float y,
                            float width, float height) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDImageXObject image = PDImageXObject.createFromByteArray(doc, imageBytes,
                    "stamp." + (imageFormat != null ? imageFormat : "png"));

            for (int pageNum : pages) {
                int pageIdx = pageNum - 1;
                if (pageIdx < 0 || pageIdx >= doc.getNumberOfPages()) continue;

                PDPage page = doc.getPage(pageIdx);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                float imgX = x * pageWidth;
                float imgY = (1 - y - height) * pageHeight;
                float imgW = width * pageWidth;
                float imgH = height * pageHeight;

                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.drawImage(image, imgX, imgY, imgW, imgH);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
