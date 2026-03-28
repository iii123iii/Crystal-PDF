package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class RedactService {

    /**
     * Redact areas on specified pages by drawing black rectangles over them.
     * Coordinates are normalized (0-1) relative to page dimensions.
     */
    public byte[] redact(byte[] pdfBytes, List<RedactArea> areas) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (RedactArea area : areas) {
                int pageIdx = area.page() - 1;
                if (pageIdx < 0 || pageIdx >= doc.getNumberOfPages()) continue;

                PDPage page = doc.getPage(pageIdx);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                float x = area.x() * pageWidth;
                float y = (1 - area.y() - area.height()) * pageHeight;
                float w = area.width() * pageWidth;
                float h = area.height() * pageHeight;

                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.setNonStrokingColor(0f, 0f, 0f);
                    cs.addRect(x, y, w, h);
                    cs.fill();
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    public record RedactArea(int page, float x, float y, float width, float height) {}
}
