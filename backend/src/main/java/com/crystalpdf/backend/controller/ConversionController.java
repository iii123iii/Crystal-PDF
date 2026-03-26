package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.service.ImageToPdfService;
import com.crystalpdf.backend.service.PdfToImageService;
import com.crystalpdf.backend.service.WordToPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/convert")
public class ConversionController {

    private final WordToPdfService wordToPdfService;
    private final PdfToImageService pdfToImageService;
    private final ImageToPdfService imageToPdfService;

    public ConversionController(WordToPdfService wordToPdfService,
                                PdfToImageService pdfToImageService,
                                ImageToPdfService imageToPdfService) {
        this.wordToPdfService  = wordToPdfService;
        this.pdfToImageService = pdfToImageService;
        this.imageToPdfService = imageToPdfService;
    }

    // ── Word / Excel / PowerPoint → PDF ──────────────────────────────────────

    @PostMapping("/word-to-pdf")
    public ResponseEntity<byte[]> wordToPdf(@RequestParam("file") MultipartFile file) {
        try {
            byte[] result = wordToPdfService.convert(file);
            return pdfResponse(result, "converted.pdf");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── PDF → Images (ZIP) ────────────────────────────────────────────────────

    @PostMapping("/pdf-to-image")
    public ResponseEntity<byte[]> pdfToImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "png") String format,
            @RequestParam(value = "dpi", defaultValue = "150") int dpi) {
        try {
            int safeDpi = Math.min(Math.max(dpi, 72), 300);
            byte[] result = pdfToImageService.convert(file, format, safeDpi);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/zip"));
            headers.setContentDispositionFormData("attachment", "pages.zip");
            headers.setContentLength(result.length);
            return ResponseEntity.ok().headers(headers).body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Images → PDF ──────────────────────────────────────────────────────────

    @PostMapping("/image-to-pdf")
    public ResponseEntity<byte[]> imageToPdf(@RequestParam("files") List<MultipartFile> files) {
        try {
            byte[] result = imageToPdfService.convert(files);
            return pdfResponse(result, "images.pdf");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<byte[]> pdfResponse(byte[] data, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(data.length);
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
