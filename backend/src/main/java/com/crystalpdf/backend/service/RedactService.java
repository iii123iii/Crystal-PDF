package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.pdfwriter.ContentStreamWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.common.PDStream;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.stereotype.Service;

import java.awt.geom.Rectangle2D;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RedactService {

    /**
     * Surgically redact areas on specified pages.
     * <p>
     * 1) Identifies every character whose bounding box intersects a redaction zone
     *    (via PDFTextStripper).
     * 2) Rewrites each affected page's content stream, blanking out text-showing
     *    operators whose tracked position falls inside a redaction zone.
     * 3) Draws black rectangles over the zones for visual confirmation.
     * 4) Removes any PDF annotations that overlap the zones.
     * <p>
     * Text outside the zones remains fully selectable / searchable.
     */
    public byte[] redact(byte[] pdfBytes, List<RedactArea> areas) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Map<Integer, List<RedactArea>> byPage = areas.stream()
                    .collect(Collectors.groupingBy(a -> a.page() - 1));

            for (var entry : byPage.entrySet()) {
                int pageIdx = entry.getKey();
                if (pageIdx < 0 || pageIdx >= doc.getNumberOfPages()) continue;

                PDPage page = doc.getPage(pageIdx);
                PDRectangle mediaBox = page.getMediaBox();
                List<RedactArea> pageAreas = entry.getValue();

                // Convert normalised (0-1, top-left origin) → PDF points (bottom-left origin)
                List<Rectangle2D.Float> pdfRects = pageAreas.stream()
                        .map(a -> new Rectangle2D.Float(
                                a.x() * mediaBox.getWidth() + mediaBox.getLowerLeftX(),
                                (1 - a.y() - a.height()) * mediaBox.getHeight() + mediaBox.getLowerLeftY(),
                                a.width() * mediaBox.getWidth(),
                                a.height() * mediaBox.getHeight()))
                        .collect(Collectors.toList());

                // Step 1 — find character positions that fall inside redaction zones
                Set<CharLocation> charsToRemove = findCharsInAreas(doc, pageIdx, pdfRects);

                // Step 2 — rewrite the content stream, blanking matched text operators
                rewriteContentStream(doc, page, pdfRects, charsToRemove);

                // Step 3 — draw black rectangles for visual confirmation
                try (PDPageContentStream cs = new PDPageContentStream(doc, page,
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.setNonStrokingColor(0f, 0f, 0f);
                    for (Rectangle2D.Float r : pdfRects) {
                        cs.addRect(r.x, r.y, r.width, r.height);
                    }
                    cs.fill();
                }

                // Step 4 — remove annotations whose bounds overlap any redaction zone
                removeAnnotationsInAreas(page, pdfRects);
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    // ── Pass 1: identify characters inside redaction zones ────────────────────

    private record CharLocation(float x, float y) {}

    private Set<CharLocation> findCharsInAreas(PDDocument doc, int pageIdx,
                                               List<Rectangle2D.Float> rects) throws IOException {
        Set<CharLocation> hits = new HashSet<>();

        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void processTextPosition(TextPosition tp) {
                float cx = tp.getXDirAdj();
                float cy = tp.getYDirAdj();
                // TextPosition Y is top-down; convert to PDF bottom-up
                float pdfY = tp.getPageHeight() - cy;
                for (Rectangle2D.Float r : rects) {
                    if (r.contains(cx, pdfY) ||
                        r.intersects(cx, pdfY, tp.getWidthDirAdj(), tp.getHeightDir())) {
                        hits.add(new CharLocation(
                                Math.round(cx * 10f) / 10f,
                                Math.round(cy * 10f) / 10f));
                        break;
                    }
                }
                super.processTextPosition(tp);
            }
        };
        stripper.setStartPage(pageIdx + 1);
        stripper.setEndPage(pageIdx + 1);
        stripper.getText(doc);

        return hits;
    }

    // ── Pass 2: rewrite content stream, removing matched text ─────────────────

    private void rewriteContentStream(PDDocument doc, PDPage page,
                                      List<Rectangle2D.Float> rects,
                                      Set<CharLocation> charsToRemove) throws IOException {
        PDFStreamParser parser = new PDFStreamParser(page);
        List<Object> tokens = parser.parse();

        List<Object> result = new ArrayList<>(tokens.size());
        List<COSBase> operands = new ArrayList<>();

        // Track text position throughout the content stream
        boolean inText = false;
        float tmX = 0, tmY = 0;           // text matrix translation
        float lineX = 0, lineY = 0;       // text line matrix translation
        float leading = 0;

        for (Object token : tokens) {
            if (!(token instanceof Operator op)) {
                operands.add((COSBase) token);
                continue;
            }

            String name = op.getName();

            switch (name) {
                case "BT" -> {
                    inText = true;
                    tmX = tmY = lineX = lineY = 0;
                    leading = 0;
                }
                case "ET" -> inText = false;

                case "Tm" -> {
                    // a b c d e f  Tm
                    if (inText && operands.size() >= 6) {
                        tmX = toFloat(operands.get(operands.size() - 2));
                        tmY = toFloat(operands.get(operands.size() - 1));
                        lineX = tmX;
                        lineY = tmY;
                    }
                }
                case "Td" -> {
                    if (inText && operands.size() >= 2) {
                        float tx = toFloat(operands.get(operands.size() - 2));
                        float ty = toFloat(operands.get(operands.size() - 1));
                        lineX += tx;
                        lineY += ty;
                        tmX = lineX;
                        tmY = lineY;
                    }
                }
                case "TD" -> {
                    if (inText && operands.size() >= 2) {
                        float tx = toFloat(operands.get(operands.size() - 2));
                        float ty = toFloat(operands.get(operands.size() - 1));
                        lineX += tx;
                        lineY += ty;
                        tmX = lineX;
                        tmY = lineY;
                        leading = -ty;
                    }
                }
                case "TL" -> {
                    if (inText && operands.size() >= 1) {
                        leading = toFloat(operands.get(operands.size() - 1));
                    }
                }
                case "T*" -> {
                    if (inText) {
                        lineY -= leading;
                        tmX = lineX;
                        tmY = lineY;
                    }
                }
                default -> { /* nothing */ }
            }

            // Check text-showing operators and blank them if inside a redaction zone
            if (inText && isTextShowOp(name)) {
                if (textPositionInAnyRect(tmX, tmY, rects) || hasMatchingChars(tmX, tmY, charsToRemove)) {
                    blankTextOperands(operands, name);
                }
            }

            result.addAll(operands);
            result.add(op);
            operands.clear();
        }

        // Write the modified stream back to the page
        PDStream newStream = new PDStream(doc);
        try (OutputStream os = newStream.createOutputStream(COSName.FLATE_DECODE)) {
            ContentStreamWriter writer = new ContentStreamWriter(os);
            writer.writeTokens(result);
        }
        page.setContents(newStream);
    }

    private boolean isTextShowOp(String name) {
        return "Tj".equals(name) || "TJ".equals(name)
                || "'".equals(name) || "\"".equals(name);
    }

    private boolean textPositionInAnyRect(float x, float y, List<Rectangle2D.Float> rects) {
        for (Rectangle2D.Float r : rects) {
            if (x >= r.x - 1 && x <= r.x + r.width + 1 &&
                y >= r.y - 1 && y <= r.y + r.height + 1) {
                return true;
            }
        }
        return false;
    }

    private boolean hasMatchingChars(float tmX, float tmY, Set<CharLocation> chars) {
        float tolerance = 2f;
        for (CharLocation c : chars) {
            if (Math.abs(tmX - c.x) < tolerance && Math.abs(tmY - c.y) < tolerance) {
                return true;
            }
        }
        return false;
    }

    private void blankTextOperands(List<COSBase> operands, String opName) {
        if (operands.isEmpty()) return;

        switch (opName) {
            case "Tj", "'" -> {
                int last = operands.size() - 1;
                if (operands.get(last) instanceof COSString) {
                    operands.set(last, new COSString(""));
                }
            }
            case "TJ" -> {
                int last = operands.size() - 1;
                if (operands.get(last) instanceof COSArray arr) {
                    COSArray cleaned = new COSArray();
                    for (int i = 0; i < arr.size(); i++) {
                        COSBase el = arr.get(i);
                        if (el instanceof COSString) {
                            cleaned.add(new COSString(""));
                        } else {
                            cleaned.add(el);
                        }
                    }
                    operands.set(last, cleaned);
                }
            }
            case "\"" -> {
                if (operands.size() >= 3) {
                    int last = operands.size() - 1;
                    if (operands.get(last) instanceof COSString) {
                        operands.set(last, new COSString(""));
                    }
                }
            }
        }
    }

    // ── Step 4: remove overlapping annotations ───────────────────────────────

    private void removeAnnotationsInAreas(PDPage page, List<Rectangle2D.Float> rects) throws IOException {
        List<PDAnnotation> annotations = page.getAnnotations();
        if (annotations == null || annotations.isEmpty()) return;

        annotations.removeIf(annot -> {
            PDRectangle r = annot.getRectangle();
            if (r == null) return false;
            Rectangle2D.Float annotRect = new Rectangle2D.Float(
                    r.getLowerLeftX(), r.getLowerLeftY(), r.getWidth(), r.getHeight());
            return rects.stream().anyMatch(redact -> redact.intersects(annotRect));
        });
        page.setAnnotations(annotations);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static float toFloat(COSBase obj) {
        if (obj instanceof COSNumber n) return n.floatValue();
        return 0f;
    }

    public record RedactArea(int page, float x, float y, float width, float height) {}
}
