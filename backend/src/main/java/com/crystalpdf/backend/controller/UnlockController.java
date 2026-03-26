package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.service.UnlockService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1")
public class UnlockController {

    private final UnlockService unlockService;

    public UnlockController(UnlockService unlockService) {
        this.unlockService = unlockService;
    }

    @PostMapping("/unlock")
    public ResponseEntity<byte[]> unlock(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) {

        try {
            byte[] result = unlockService.unlock(file, password);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "unlocked.pdf");
            headers.setContentLength(result.length);

            return ResponseEntity.ok().headers(headers).body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            // IOException from PDFBox when password is wrong
            return ResponseEntity.status(403).build();
        }
    }
}
