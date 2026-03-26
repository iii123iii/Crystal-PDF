package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class PdfToImageService {

    public byte[] convert(MultipartFile file, String format, int dpi) throws IOException {
        String fmt = format.equalsIgnoreCase("jpg") ? "jpg" : "png";
        String imageioFormat = fmt.equals("jpg") ? "JPEG" : "PNG";

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(file.getBytes()));
             ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(zipOut)) {

            PDFRenderer renderer = new PDFRenderer(doc);

            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, dpi, ImageType.RGB);

                ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
                ImageIO.write(image, imageioFormat, imgOut);

                ZipEntry entry = new ZipEntry(String.format("page_%03d.%s", i + 1, fmt));
                zos.putNextEntry(entry);
                zos.write(imgOut.toByteArray());
                zos.closeEntry();
            }

            zos.finish();
            return zipOut.toByteArray();
        }
    }
}
