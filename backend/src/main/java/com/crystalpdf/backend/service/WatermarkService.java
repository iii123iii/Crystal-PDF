package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class WatermarkService {

    public byte[] addTextWatermark(byte[] pdfBytes, String text, float fontSize, float opacity,
                                    float rotation, String position) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            for (PDPage page : doc.getPages()) {
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {

                    PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                    gs.setNonStrokingAlphaConstant(Math.max(0.01f, Math.min(1f, opacity)));
                    gs.setStrokingAlphaConstant(Math.max(0.01f, Math.min(1f, opacity)));
                    cs.setGraphicsStateParameters(gs);

                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.setNonStrokingColor(0.5f, 0.5f, 0.5f);

                    float textWidth = font.getStringWidth(text) / 1000 * fontSize;
                    float cx, cy;

                    switch (position != null ? position : "center") {
                        case "top-left":
                            cx = 50; cy = pageHeight - 50 - fontSize;
                            break;
                        case "top-right":
                            cx = pageWidth - textWidth - 50; cy = pageHeight - 50 - fontSize;
                            break;
                        case "bottom-left":
                            cx = 50; cy = 50;
                            break;
                        case "bottom-right":
                            cx = pageWidth - textWidth - 50; cy = 50;
                            break;
                        default: // center
                            cx = (pageWidth - textWidth) / 2;
                            cy = pageHeight / 2;
                    }

                    double rad = Math.toRadians(rotation);
                    Matrix matrix = new Matrix(
                            (float) Math.cos(rad), (float) Math.sin(rad),
                            (float) -Math.sin(rad), (float) Math.cos(rad),
                            cx, cy
                    );
                    cs.setTextMatrix(matrix);
                    cs.showText(text);
                    cs.endText();
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
