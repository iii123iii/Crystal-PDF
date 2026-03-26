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

    public byte[] mergeBytes(List<byte[]> pdfBytesList) throws IOException {
        if (pdfBytesList == null || pdfBytesList.size() < 2) {
            throw new IllegalArgumentException("At least two PDF files are required to merge.");
        }

        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        merger.setDestinationStream(out);

        for (byte[] pdfBytes : pdfBytesList) {
            merger.addSource(new RandomAccessReadBuffer(pdfBytes));
        }

        merger.mergeDocuments(null);
        return out.toByteArray();
    }

    public byte[] merge(List<MultipartFile> files) throws IOException {
        if (files == null || files.size() < 2) {
            throw new IllegalArgumentException("At least two PDF files are required to merge.");
        }
        List<byte[]> bytesList = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            bytesList.add(file.getBytes());
        }
        return mergeBytes(bytesList);
    }
}
