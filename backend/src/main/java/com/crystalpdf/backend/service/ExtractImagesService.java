package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ExtractImagesService {

    /**
     * Extract all images from a PDF and return them as a ZIP file.
     */
    public byte[] extractImages(byte[] pdfBytes, String format) throws IOException {
        String imgFormat = (format != null && !format.isBlank()) ? format : "png";

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(zipOut)) {

            int imgIndex = 1;

            for (int pageIdx = 0; pageIdx < doc.getNumberOfPages(); pageIdx++) {
                PDPage page = doc.getPage(pageIdx);
                PDResources resources = page.getResources();
                if (resources == null) continue;

                for (COSName name : resources.getXObjectNames()) {
                    PDXObject xobj = resources.getXObject(name);
                    if (xobj instanceof PDImageXObject image) {
                        BufferedImage bimg = image.getImage();
                        ByteArrayOutputStream imgBytes = new ByteArrayOutputStream();
                        ImageIO.write(bimg, imgFormat, imgBytes);

                        String entryName = String.format("page%d_img%d.%s", pageIdx + 1, imgIndex++, imgFormat);
                        zos.putNextEntry(new ZipEntry(entryName));
                        zos.write(imgBytes.toByteArray());
                        zos.closeEntry();
                    }
                }
            }

            if (imgIndex == 1) {
                throw new IllegalArgumentException("No images found in this PDF.");
            }

            zos.finish();
            return zipOut.toByteArray();
        }
    }
}
