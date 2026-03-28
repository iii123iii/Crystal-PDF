package com.crystalpdf.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class SanitizeService {

    /**
     * Remove all metadata from a PDF, including info dictionary, XMP metadata,
     * creator info, and timestamps.
     * Rather than copying page content streams (which is complex), we load the
     * document in-place and strip only the metadata fields.
     *
     * @param pdfBytes the PDF bytes to sanitize
     * @return sanitized PDF bytes with all metadata removed
     * @throws IOException if PDF processing fails
     */
    public byte[] sanitize(byte[] pdfBytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Replace info dictionary with blank one (nulls all fields)
            PDDocumentInformation blankInfo = new PDDocumentInformation();
            blankInfo.setTitle(null);
            blankInfo.setAuthor(null);
            blankInfo.setSubject(null);
            blankInfo.setKeywords(null);
            blankInfo.setCreator(null);
            blankInfo.setProducer(null);
            blankInfo.setCreationDate(null);
            blankInfo.setModificationDate(null);
            doc.setDocumentInformation(blankInfo);

            // Remove XMP metadata stream
            doc.getDocumentCatalog().setMetadata(null);

            doc.save(out);
            return out.toByteArray();
        }
    }
}
