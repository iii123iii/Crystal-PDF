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
public class PageNumberService {

    /**
     * Add page numbers to every page.
     * @param position top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
     * @param startNumber number to start from (default 1)
     * @param fontSize font size for the page number
     */
    public byte[] addPageNumbers(byte[] pdfBytes, String position, int startNumber,
                                  float fontSize, String format) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            int totalPages = doc.getNumberOfPages();
            float margin = 36; // 0.5 inch margin

            for (int i = 0; i < totalPages; i++) {
                PDPage page = doc.getPage(i);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                int pageNum = startNumber + i;
                String text = formatPageNumber(format, pageNum, totalPages);
                float textWidth = font.getStringWidth(text) / 1000 * fontSize;

                float x, y;
                String pos = position != null ? position : "bottom-center";

                switch (pos) {
                    case "top-left":
                        x = margin; y = pageHeight - margin;
                        break;
                    case "top-center":
                        x = (pageWidth - textWidth) / 2; y = pageHeight - margin;
                        break;
                    case "top-right":
                        x = pageWidth - textWidth - margin; y = pageHeight - margin;
                        break;
                    case "bottom-left":
                        x = margin; y = margin - fontSize;
                        break;
                    case "bottom-right":
                        x = pageWidth - textWidth - margin; y = margin - fontSize;
                        break;
                    default: // bottom-center
                        x = (pageWidth - textWidth) / 2; y = margin - fontSize;
                }

                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
                    cs.newLineAtOffset(x, y);
                    cs.showText(text);
                    cs.endText();
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    private String formatPageNumber(String format, int pageNum, int totalPages) {
        if (format == null) format = "number";
        return switch (format) {
            case "number-of-total" -> pageNum + " of " + totalPages;
            case "page-number" -> "Page " + pageNum;
            case "page-number-of-total" -> "Page " + pageNum + " of " + totalPages;
            default -> String.valueOf(pageNum);
        };
    }
}
