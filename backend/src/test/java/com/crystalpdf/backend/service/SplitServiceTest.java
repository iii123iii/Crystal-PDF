package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplitServiceTest {

    private final SplitService splitService = new SplitService();

    @Test
    void extractPages_extractsSinglePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(5);
        byte[] result = splitService.extractPages(pdf, List.of(2));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void extractPages_extractsMultiplePages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(5);
        byte[] result = splitService.extractPages(pdf, Arrays.asList(1, 3, 5));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void extractPages_extractsAllPages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = splitService.extractPages(pdf, Arrays.asList(1, 2, 3));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void extractPages_throwsForEmptyPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> splitService.extractPages(pdf, Collections.emptyList()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one page");
    }

    @Test
    void extractPages_throwsForNullPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> splitService.extractPages(pdf, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void extractPages_throwsForOutOfRangePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> splitService.extractPages(pdf, List.of(10)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("out of range");
    }

    @Test
    void extractPages_throwsForPageZero() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> splitService.extractPages(pdf, List.of(0)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("out of range");
    }

    @Test
    void extractPages_resultIsValidPdf() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = splitService.extractPages(pdf, List.of(1));
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }
}
