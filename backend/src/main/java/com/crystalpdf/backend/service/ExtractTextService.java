package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class ExtractTextService {

    /**
     * Extract all text content from a PDF.
     * Returns the extracted text as a string.
     */
    public String extractText(byte[] pdfBytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    /**
     * Extract text from specific pages.
     */
    public String extractText(byte[] pdfBytes, int startPage, int endPage) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(startPage);
            stripper.setEndPage(endPage);
            return stripper.getText(doc);
        }
    }
}
