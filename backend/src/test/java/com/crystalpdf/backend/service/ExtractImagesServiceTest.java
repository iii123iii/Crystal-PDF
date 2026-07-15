package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExtractImagesServiceTest {

    private final ExtractImagesService extractImagesService = new ExtractImagesService();

    @Test
    void extractImages_returnsZipWithDecodableImages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdfWithImage();
        byte[] zipBytes = extractImagesService.extractImages(pdf, "png");

        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry = zip.getNextEntry();
            assertThat(entry).isNotNull();
            assertThat(entry.getName()).isEqualTo("page1_img1.png");
            assertThat(ImageIO.read(new ByteArrayInputStream(readEntry(zip)))).isNotNull();
            zip.closeEntry();

            assertThat(zip.getNextEntry()).isNull();
        }
    }

    @Test
    void extractImages_throwsForUnsupportedFormat() throws Exception {
        byte[] pdf = PdfTestHelper.createPdfWithImage();

        assertThatThrownBy(() -> extractImagesService.extractImages(pdf, "tiff"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image output format: tiff");
    }

    private static byte[] readEntry(ZipInputStream zip) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        zip.transferTo(out);
        return out.toByteArray();
    }
}
