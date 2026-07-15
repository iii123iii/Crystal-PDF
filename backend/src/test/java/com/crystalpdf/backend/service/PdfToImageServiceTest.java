package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;

class PdfToImageServiceTest {

    private final PdfToImageService pdfToImageService = new PdfToImageService();

    @Test
    void convert_returnsZipWithDecodablePageImages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        byte[] zipBytes = pdfToImageService.convert(pdf, "png", 72);

        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry first = zip.getNextEntry();
            assertThat(first).isNotNull();
            assertThat(first.getName()).isEqualTo("page_001.png");
            assertThat(ImageIO.read(new ByteArrayInputStream(readEntry(zip)))).isNotNull();
            zip.closeEntry();

            ZipEntry second = zip.getNextEntry();
            assertThat(second).isNotNull();
            assertThat(second.getName()).isEqualTo("page_002.png");
            assertThat(ImageIO.read(new ByteArrayInputStream(readEntry(zip)))).isNotNull();
            zip.closeEntry();

            assertThat(zip.getNextEntry()).isNull();
        }
    }

    private static byte[] readEntry(ZipInputStream zip) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        zip.transferTo(out);
        return out.toByteArray();
    }
}
