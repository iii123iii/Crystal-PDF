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

class MergeServiceTest {

    private final MergeService mergeService = new MergeService();

    @Test
    void mergeBytes_combinesPageCounts() throws Exception {
        byte[] pdf1 = PdfTestHelper.createPdf(2);
        byte[] pdf2 = PdfTestHelper.createPdf(3);

        byte[] merged = mergeService.mergeBytes(Arrays.asList(pdf1, pdf2));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(merged))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(5);
        }
    }

    @Test
    void mergeBytes_mergesThreeDocuments() throws Exception {
        byte[] pdf1 = PdfTestHelper.createPdf(1);
        byte[] pdf2 = PdfTestHelper.createPdf(1);
        byte[] pdf3 = PdfTestHelper.createPdf(1);

        byte[] merged = mergeService.mergeBytes(Arrays.asList(pdf1, pdf2, pdf3));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(merged))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void mergeBytes_throwsForSingleFile() {
        assertThatThrownBy(() -> mergeService.mergeBytes(Collections.singletonList(new byte[0])))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least two");
    }

    @Test
    void mergeBytes_throwsForEmptyList() {
        assertThatThrownBy(() -> mergeService.mergeBytes(Collections.emptyList()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void mergeBytes_throwsForNullList() {
        assertThatThrownBy(() -> mergeService.mergeBytes(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void mergeBytes_resultIsValidPdf() throws Exception {
        byte[] pdf1 = PdfTestHelper.createPdf(1);
        byte[] pdf2 = PdfTestHelper.createPdf(1);

        byte[] merged = mergeService.mergeBytes(List.of(pdf1, pdf2));

        // PDFBox must be able to load it without exceptions
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(merged))) {
            assertThat(doc.getNumberOfPages()).isPositive();
        }
    }
}
