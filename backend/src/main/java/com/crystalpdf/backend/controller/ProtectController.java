package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.service.ProtectService;
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
public class ProtectController {

    private final ProtectService protectService;

    public ProtectController(ProtectService protectService) {
        this.protectService = protectService;
    }

    @PostMapping("/protect")
    public ResponseEntity<byte[]> protect(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userPassword") String userPassword,
            @RequestParam(value = "ownerPassword", required = false) String ownerPassword) {

        try {
            byte[] result = protectService.protect(file, userPassword, ownerPassword);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "protected.pdf");
            headers.setContentLength(result.length);

            return ResponseEntity.ok().headers(headers).body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
