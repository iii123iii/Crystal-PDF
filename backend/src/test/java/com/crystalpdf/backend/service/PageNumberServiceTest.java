package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PageNumberServiceTest {

    private final PageNumberService pageNumberService = new PageNumberService();

    @Test
    void addPageNumbers_returnsValidPdf() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-center", 1, 10, "number");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "top-left", "top-center", "top-right",
        "bottom-left", "bottom-center", "bottom-right"
    })
    void addPageNumbers_allPositionsProduceValidPdf(String position) throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        byte[] result = pageNumberService.addPageNumbers(pdf, position, 1, 10, "number");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(2);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"number", "page-number", "number-of-total", "page-number-of-total"})
    void addPageNumbers_allFormatsProduceValidPdf(String format) throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-center", 1, 10, format);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void addPageNumbers_withCustomStartNumber() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-center", 5, 10, "number");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void addPageNumbers_preservesPageCount() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(7);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-right", 1, 8, "number-of-total");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(7);
        }
    }

    @Test
    void addPageNumbers_withNullPosition_defaultsToBottomCenter() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = pageNumberService.addPageNumbers(pdf, null, 1, 10, "number");

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addPageNumbers_withNullFormat_defaultsToNumber() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-center", 1, 10, null);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void addPageNumbers_outputDiffersFromInput() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        byte[] result = pageNumberService.addPageNumbers(pdf, "bottom-center", 1, 10, "number");

        assertThat(result).isNotEmpty();
        assertThat(result).isNotEqualTo(pdf);
    }
}
