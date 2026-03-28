package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.service.OcrService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OcrController {

    private static final Logger log = LoggerFactory.getLogger(OcrController.class);

    private final OcrService ocrService;

    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping("/ocr")
    public ResponseEntity<?> ocr(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", defaultValue = "eng") String language) {

        // Whitelist Tesseract language codes: letters, digits, '+' for combined (e.g. "eng+fra"), max 32 chars
        if (!language.matches("[a-zA-Z0-9+]{1,32}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid language code."));
        }

        try {
            byte[] result = ocrService.ocr(file, language);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "ocr.pdf");
            headers.setContentLength(result.length);
            return ResponseEntity.ok().headers(headers).body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException | InterruptedException e) {
            log.error("OCR processing failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "OCR processing failed. Please try again."));
        }
    }
}
