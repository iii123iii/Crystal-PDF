package com.crystalpdf.backend.service;

import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class MergeService {

    public byte[] merge(List<MultipartFile> files) throws IOException {
        if (files == null || files.size() < 2) {
            throw new IllegalArgumentException("At least two PDF files are required to merge.");
        }

        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        merger.setDestinationStream(out);

        for (MultipartFile file : files) {
            // PDFBox 3.x requires RandomAccessRead — wrap the bytes
            merger.addSource(new RandomAccessReadBuffer(file.getBytes()));
        }

        merger.mergeDocuments(null);
        return out.toByteArray();
    }
}
