package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.CompressRequest;
import com.crystalpdf.backend.dto.DocumentResponse;
import com.crystalpdf.backend.dto.OcrRequest;
import com.crystalpdf.backend.dto.ProtectRequest;
import com.crystalpdf.backend.dto.SplitRequest;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.service.CompressService;
import com.crystalpdf.backend.service.OcrService;
import com.crystalpdf.backend.service.ProtectService;
import com.crystalpdf.backend.service.SplitService;
import com.crystalpdf.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Tool endpoints that operate on a stored document (by ID) and save the
 * result as a new Document linked to the authenticated user.
 *
 * POST /api/documents/{id}/tools/split
 * POST /api/documents/{id}/tools/protect
 * POST /api/documents/{id}/tools/compress
 * POST /api/documents/{id}/tools/ocr
 */
@RestController
@RequestMapping("/api/documents/{id}/tools")
public class WorkspaceToolController {

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final SplitService splitService;
    private final ProtectService protectService;
    private final CompressService compressService;
    private final OcrService ocrService;

    public WorkspaceToolController(
            DocumentRepository documentRepository,
            StorageService storageService,
            SplitService splitService,
            ProtectService protectService,
            CompressService compressService,
            OcrService ocrService) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.splitService = splitService;
        this.protectService = protectService;
        this.compressService = compressService;
        this.ocrService = ocrService;
    }

    @PostMapping("/split")
    public ResponseEntity<DocumentResponse> split(
            @PathVariable Long id,
            @RequestBody SplitRequest req,
            @AuthenticationPrincipal User user) throws IOException {

        Document source = loadOwned(id, user);
        byte[] result = splitService.extractPages(storageService.loadBytes(source), req.pages());
        String name = baseName(source.getOriginalName()) + "_split.pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/protect")
    public ResponseEntity<DocumentResponse> protect(
            @PathVariable Long id,
            @RequestBody ProtectRequest req,
            @AuthenticationPrincipal User user) throws IOException {

        Document source = loadOwned(id, user);
        byte[] result = protectService.protect(
                storageService.loadBytes(source), req.userPassword(), req.ownerPassword());
        String name = baseName(source.getOriginalName()) + "_protected.pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/compress")
    public ResponseEntity<DocumentResponse> compress(
            @PathVariable Long id,
            @RequestBody CompressRequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {

        Document source = loadOwned(id, user);
        String level = (req.level() != null && !req.level().isBlank()) ? req.level() : "ebook";
        byte[] result = compressService.compress(storageService.loadBytes(source), level);
        String name = baseName(source.getOriginalName()) + "_compressed.pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/ocr")
    public ResponseEntity<DocumentResponse> ocr(
            @PathVariable Long id,
            @RequestBody OcrRequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {

        Document source = loadOwned(id, user);
        String lang = (req.language() != null && !req.language().isBlank()) ? req.language() : "eng";
        byte[] result = ocrService.ocr(storageService.loadBytes(source), lang);
        String name = baseName(source.getOriginalName()) + "_ocr.pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Document loadOwned(Long id, User user) {
        return documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found."));
    }

    private String baseName(String fileName) {
        if (fileName == null) return "document";
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }
}
