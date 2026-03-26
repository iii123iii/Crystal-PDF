package com.crystalpdf.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ImageToPdfService {

    public byte[] convert(List<MultipartFile> images) throws IOException {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("At least one image is required.");
        }

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (MultipartFile imageFile : images) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);

                PDImageXObject image = PDImageXObject.createFromByteArray(
                        doc, imageFile.getBytes(), imageFile.getOriginalFilename());

                float pageWidth  = PDRectangle.A4.getWidth();
                float pageHeight = PDRectangle.A4.getHeight();
                float scale      = Math.min(pageWidth / image.getWidth(), pageHeight / image.getHeight());
                float drawWidth  = image.getWidth()  * scale;
                float drawHeight = image.getHeight() * scale;
                float x = (pageWidth  - drawWidth)  / 2;
                float y = (pageHeight - drawHeight) / 2;

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.drawImage(image, x, y, drawWidth, drawHeight);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }
}
