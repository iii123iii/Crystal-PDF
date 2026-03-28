package com.crystalpdf.backend.service;

import com.crystalpdf.backend.dto.FlattenAnnotationsRequest;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class AnnotationFlattenService {

    public byte[] flatten(byte[] pdfBytes, FlattenAnnotationsRequest req) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            for (Map.Entry<Integer, FlattenAnnotationsRequest.PageData> entry : req.pages().entrySet()) {
                int pageIndex = entry.getKey() - 1; // 1-based → 0-based
                if (pageIndex < 0 || pageIndex >= doc.getNumberOfPages()) continue;

                PDPage page = doc.getPage(pageIndex);
                float pageWidth  = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();
                float scale = (float) req.scale();

                FlattenAnnotationsRequest.PageData pageData = entry.getValue();

                try (PDPageContentStream cs = new PDPageContentStream(doc, page, AppendMode.APPEND, true)) {

                    // ── Strokes (pen + highlight) ───────────────────────────
                    for (FlattenAnnotationsRequest.StrokeData stroke : pageData.strokes()) {
                        if (stroke.points().size() < 2) continue;

                        float pdfLineWidth = Math.max(0.5f, (float) (stroke.width() / scale));

                        // Opacity via extended graphics state
                        PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                        gs.setStrokingAlphaConstant((float) stroke.opacity());
                        cs.setGraphicsStateParameters(gs);

                        Color c = parseHex(stroke.color());
                        cs.setStrokingColor(c.getRed() / 255f, c.getGreen() / 255f, c.getBlue() / 255f);
                        cs.setLineWidth(pdfLineWidth);
                        cs.setLineCapStyle(1);  // round
                        cs.setLineJoinStyle(1); // round

                        List<List<Double>> pts = stroke.points();
                        List<Double> first = pts.get(0);
                        cs.moveTo(
                            (float) (first.get(0) * pageWidth),
                            (float) ((1.0 - first.get(1)) * pageHeight)
                        );
                        for (int i = 1; i < pts.size(); i++) {
                            List<Double> pt = pts.get(i);
                            cs.lineTo(
                                (float) (pt.get(0) * pageWidth),
                                (float) ((1.0 - pt.get(1)) * pageHeight)
                            );
                        }
                        cs.stroke();

                        // Reset opacity
                        PDExtendedGraphicsState gsReset = new PDExtendedGraphicsState();
                        gsReset.setStrokingAlphaConstant(1.0f);
                        cs.setGraphicsStateParameters(gsReset);
                    }

                    // ── Text annotations ───────────────────────────────────
                    for (FlattenAnnotationsRequest.TextData textAnnotation : pageData.texts()) {
                        if (textAnnotation.text() == null || textAnnotation.text().isBlank()) continue;

                        float pdfFontSize = Math.max(4f, (float) (textAnnotation.fontSize() / scale));
                        float pdfX = (float) (textAnnotation.x() * pageWidth);
                        // Helvetica ascent ≈ 0.718 × font size (baseline to cap-top).
                        // Subtract the ascent so the visible top of the first letter lands
                        // exactly at the annotation's y coordinate (top of the text box).
                        float pdfY = (float) ((1.0 - textAnnotation.y()) * pageHeight)
                                     - pdfFontSize * 0.718f;

                        Color c = parseHex(textAnnotation.color());
                        PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                        float lineHeight = pdfFontSize * 1.3f;

                        String[] lines = textAnnotation.text().split("\n", -1);
                        cs.beginText();
                        cs.setFont(font, pdfFontSize);
                        cs.setNonStrokingColor(c.getRed() / 255f, c.getGreen() / 255f, c.getBlue() / 255f);
                        cs.newLineAtOffset(pdfX, pdfY);
                        for (int i = 0; i < lines.length; i++) {
                            if (i > 0) {
                                cs.newLineAtOffset(0, -lineHeight);
                            }
                            cs.showText(sanitize(lines[i]));
                        }
                        cs.endText();
                    }
                }
            }

            try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                doc.save(bos);
                return bos.toByteArray();
            }
        }
    }

    private Color parseHex(String hex) {
        try {
            return Color.decode(hex);
        } catch (NumberFormatException e) {
            return Color.BLACK;
        }
    }

    /** Strip characters outside latin-1 range that PDType1Font cannot encode. */
    private String sanitize(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length());
        for (char ch : s.toCharArray()) {
            sb.append(ch < 256 ? ch : '?');
        }
        return sb.toString();
    }
}
