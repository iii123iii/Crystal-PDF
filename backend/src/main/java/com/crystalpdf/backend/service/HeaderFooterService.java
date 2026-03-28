package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class HeaderFooterService {

    /**
     * Add header and/or footer text to every page.
     * Supports {page} and {total} placeholders.
     */
    public byte[] addHeaderFooter(byte[] pdfBytes, String headerLeft, String headerCenter,
                                    String headerRight, String footerLeft, String footerCenter,
                                    String footerRight, float fontSize) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            int totalPages = doc.getNumberOfPages();
            float margin = 36; // 0.5 inch

            for (int i = 0; i < totalPages; i++) {
                PDPage page = doc.getPage(i);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();
                int pageNum = i + 1;

                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.setFont(font, fontSize);
                    cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);

                    float headerY = pageHeight - margin + 5;
                    float footerY = margin - fontSize - 5;

                    // Header
                    drawText(cs, font, fontSize, resolve(headerLeft, pageNum, totalPages),
                            margin, headerY, pageWidth, "left");
                    drawText(cs, font, fontSize, resolve(headerCenter, pageNum, totalPages),
                            margin, headerY, pageWidth, "center");
                    drawText(cs, font, fontSize, resolve(headerRight, pageNum, totalPages),
                            margin, headerY, pageWidth, "right");

                    // Footer
                    drawText(cs, font, fontSize, resolve(footerLeft, pageNum, totalPages),
                            margin, footerY, pageWidth, "left");
                    drawText(cs, font, fontSize, resolve(footerCenter, pageNum, totalPages),
                            margin, footerY, pageWidth, "center");
                    drawText(cs, font, fontSize, resolve(footerRight, pageNum, totalPages),
                            margin, footerY, pageWidth, "right");
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    private String resolve(String template, int page, int total) {
        if (template == null || template.isBlank()) return null;
        return template.replace("{page}", String.valueOf(page)).replace("{total}", String.valueOf(total));
    }

    private void drawText(PDPageContentStream cs, PDType1Font font, float fontSize,
                           String text, float margin, float y, float pageWidth,
                           String align) throws IOException {
        if (text == null || text.isBlank()) return;
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = switch (align) {
            case "center" -> (pageWidth - textWidth) / 2;
            case "right" -> pageWidth - margin - textWidth;
            default -> margin;
        };
        cs.beginText();
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}
