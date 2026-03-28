package com.crystalpdf.backend.service;

import com.crystalpdf.backend.helper.PdfTestHelper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RotateServiceTest {

    private final RotateService rotateService = new RotateService();

    @ParameterizedTest
    @ValueSource(ints = {90, 180, 270})
    void rotatePages_appliesValidRotation(int degrees) throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        byte[] result = rotateService.rotatePages(pdf, List.of(1), degrees);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getPage(0).getRotation()).isEqualTo(degrees);
        }
    }

    @Test
    void rotatePages_rotatesOnlySpecifiedPage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = rotateService.rotatePages(pdf, List.of(2), 90);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getPage(0).getRotation()).isEqualTo(0);   // untouched
            assertThat(doc.getPage(1).getRotation()).isEqualTo(90);  // rotated
            assertThat(doc.getPage(2).getRotation()).isEqualTo(0);   // untouched
        }
    }

    @Test
    void rotatePages_rotatesMultiplePages() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(3);
        byte[] result = rotateService.rotatePages(pdf, List.of(1, 3), 180);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(result))) {
            assertThat(doc.getPage(0).getRotation()).isEqualTo(180);
            assertThat(doc.getPage(1).getRotation()).isEqualTo(0);
            assertThat(doc.getPage(2).getRotation()).isEqualTo(180);
        }
    }

    @Test
    void rotatePages_accumulatesRotationCorrectly() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(1);
        byte[] step1 = rotateService.rotatePages(pdf, List.of(1), 90);
        byte[] step2 = rotateService.rotatePages(step1, List.of(1), 90);

        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(step2))) {
            assertThat(doc.getPage(0).getRotation()).isEqualTo(180);
        }
    }

    @Test
    void rotatePages_throwsForEmptyPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> rotateService.rotatePages(pdf, Collections.emptyList(), 90))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one page");
    }

    @Test
    void rotatePages_throwsForNullPageList() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> rotateService.rotatePages(pdf, null, 90))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rotatePages_throwsForInvalidRotation() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> rotateService.rotatePages(pdf, List.of(1), 45))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("90, 180, or 270");
    }

    @Test
    void rotatePages_throwsForNullRotation() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> rotateService.rotatePages(pdf, List.of(1), null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rotatePages_throwsForOutOfRangePage() throws Exception {
        byte[] pdf = PdfTestHelper.createPdf(2);
        assertThatThrownBy(() -> rotateService.rotatePages(pdf, List.of(5), 90))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("out of range");
    }
}
