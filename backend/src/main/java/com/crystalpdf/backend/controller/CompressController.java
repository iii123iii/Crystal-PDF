package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.service.CompressService;
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
public class CompressController {

    private static final Logger log = LoggerFactory.getLogger(CompressController.class);

    private final CompressService compressService;

    public CompressController(CompressService compressService) {
        this.compressService = compressService;
    }

    @PostMapping("/compress")
    public ResponseEntity<?> compress(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "level", defaultValue = "ebook") String level) {

        try {
            byte[] result = compressService.compress(file, level);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "compressed.pdf");
            headers.setContentLength(result.length);
            return ResponseEntity.ok().headers(headers).body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException | InterruptedException e) {
            log.error("PDF compression failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "PDF compression failed. Please try again."));
        }
    }
}
