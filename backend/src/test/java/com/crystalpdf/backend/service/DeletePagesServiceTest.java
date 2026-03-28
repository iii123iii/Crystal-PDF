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

class DeletePagesServiceTest {

    private final DeletePagesService deletePagesService = new DeletePagesService();

    @Test
    void deletePages_removesOnePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(4);
        byte[] result = deletePagesService.deletePages(pdf, List.of(2));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(3);
        }
    }

    @Test
    void deletePages_removesMultiplePages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(5);
        byte[] result = deletePagesService.deletePages(pdf, Arrays.asList(1, 3, 5));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(2);
        }
    }

    @Test
    void deletePages_throwsForEmptyPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> deletePagesService.deletePages(pdf, Collections.emptyList()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one page");
    }

    @Test
    void deletePages_throwsForNullPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> deletePagesService.deletePages(pdf, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deletePages_throwsForOutOfRangePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        assertThatThrownBy(() -> deletePagesService.deletePages(pdf, List.of(10)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("out of range");
    }

    @Test
    void deletePages_throwsWhenDeletingAllPages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> deletePagesService.deletePages(pdf, Arrays.asList(1, 2)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete all pages");
    }

    @Test
    void deletePages_leavesAtLeastOnePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = deletePagesService.deletePages(pdf, Arrays.asList(1, 2));

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void deletePages_resultIsValidPdf() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = deletePagesService.deletePages(pdf, List.of(1));
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getNumberOfPages()).isPositive();
        }
    }
}
