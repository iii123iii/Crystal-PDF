package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class WatermarkServiceTest {

    private final WatermarkService watermarkService = new WatermarkService();

    @Test
    void addTextWatermark_returnsValidPdf() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        byte[] result = watermarkService.addTextWatermark(pdf, "CONFIDENTIAL", 48, 0.3f, -45, "center");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(2);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"center", "top-left", "top-right", "bottom-left", "bottom-right"})
    void addTextWatermark_allPositionsProduceValidPdf(String position) throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "DRAFT", 36, 0.5f, 0, position);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addTextWatermark_preservesPageCount() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(5);
        byte[] result = watermarkService.addTextWatermark(pdf, "TEST", 24, 0.2f, -45, "center");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(5);
        }
    }

    @Test
    void addTextWatermark_withPositiveRotation() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "ROTATE+", 30, 0.4f, 45, "center");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addTextWatermark_withZeroRotation() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "HORIZONTAL", 20, 0.5f, 0, "top-left");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addTextWatermark_withMaxOpacity() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "VISIBLE", 48, 1.0f, 0, "center");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addTextWatermark_withNullPosition_defaultsToCenter() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "DEFAULT", 24, 0.3f, 0, null);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addTextWatermark_outputDiffersFromInput() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = watermarkService.addTextWatermark(pdf, "MARK", 48, 0.5f, -45, "center");
        // The result must be a non-empty byte array distinct from the raw input
        assertThat(result).isNotEmpty();
        assertThat(result).isNotEqualTo(pdf);
    }
}
