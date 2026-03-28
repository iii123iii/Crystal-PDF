package com.crystalpdf.backend.service;

import com.crystalpdf.backend.dto.CropRequest;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CropService {

    /**
     * Crop pages with per-page margins.
     * Accepts either:
     *   - pageCrops: list of per-page margin entries (preferred, supports individual page crops)
     *   - uniform marginTop/Right/Bottom/Left applied to all pages (or specific pages list)
     */
    public byte[] cropPages(byte[] pdfBytes, CropRequest req) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int totalPages = doc.getNumberOfPages();

            if (req.pageCrops() != null && !req.pageCrops().isEmpty()) {
                // Per-page mode: build a map of page -> margins
                Map<Integer, CropRequest.PageCropEntry> cropMap = req.pageCrops().stream()
                        .filter(e -> e.page() >= 1 && e.page() <= totalPages)
                        .collect(Collectors.toMap(CropRequest.PageCropEntry::page, e -> e, (a, b) -> b));

                for (int i = 0; i < totalPages; i++) {
                    int pageNum = i + 1;
                    if (!cropMap.containsKey(pageNum)) continue;
                    CropRequest.PageCropEntry e = cropMap.get(pageNum);
                    applyMargins(doc.getPage(i), e.marginTop(), e.marginRight(), e.marginBottom(), e.marginLeft(), pageNum);
                }
            } else {
                // Uniform mode (legacy): same margins for all or listed pages
                float top    = req.marginTop()    != null ? req.marginTop()    : 0;
                float right  = req.marginRight()  != null ? req.marginRight()  : 0;
                float bottom = req.marginBottom() != null ? req.marginBottom() : 0;
                float left   = req.marginLeft()   != null ? req.marginLeft()   : 0;

                List<Integer> pages = req.pages();
                for (int i = 0; i < totalPages; i++) {
                    int pageNum = i + 1;
                    if (pages != null && !pages.isEmpty() && !pages.contains(pageNum)) continue;
                    applyMargins(doc.getPage(i), top, right, bottom, left, pageNum);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    private void applyMargins(PDPage page, float top, float right, float bottom, float left, int pageNum) {
        PDRectangle mediaBox = page.getMediaBox();
        float newLLX = mediaBox.getLowerLeftX() + left;
        float newLLY = mediaBox.getLowerLeftY() + bottom;
        float newURX = mediaBox.getUpperRightX() - right;
        float newURY = mediaBox.getUpperRightY() - top;
        if (newURX <= newLLX || newURY <= newLLY)
            throw new IllegalArgumentException("Margins are too large for page " + pageNum);
        page.setCropBox(new PDRectangle(newLLX, newLLY, newURX - newLLX, newURY - newLLY));
    }
}
