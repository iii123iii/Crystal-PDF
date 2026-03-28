package com.crystalpdf.backend.helper;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

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
}
