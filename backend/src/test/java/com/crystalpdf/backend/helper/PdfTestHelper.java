package com.crystalpdf.backend.helper;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Utility that builds minimal valid in-memory PDFs for unit tests.
 * No external files required — all PDFs are generated programmatically with PDFBox.
 */
public final class PdfTestHelper {

    private PdfTestHelper() {}

    /**
     * Returns a valid multi-page PDF as a byte array.
     * Each page is a blank A4 page (595 × 842 pt).
     */
    public static byte[] createPdf(int pageCount) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (int i = 0; i < pageCount; i++) {
                doc.addPage(new PDPage(PDRectangle.A4));
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    /** Convenience overload — single-page PDF. */
    public static byte[] createPdf() throws IOException {
        return createPdf(1);
    }

    /**
     * Returns a single-page PDF with one embedded image XObject.
     */
    public static byte[] createPdfWithImage() throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            BufferedImage image = new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = image.createGraphics();
            try {
                graphics.setColor(Color.CYAN);
                graphics.fillRect(0, 0, 32, 32);
                graphics.setColor(Color.BLUE);
                graphics.fillOval(8, 8, 16, 16);
            } finally {
                graphics.dispose();
            }

            PDImageXObject ximage = LosslessFactory.createFromImage(doc, image);
            try (PDPageContentStream content = new PDPageContentStream(doc, page)) {
                content.drawImage(ximage, 72, 720, 32, 32);
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
