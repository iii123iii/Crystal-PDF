package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.CompressRequest;
import com.crystalpdf.backend.dto.DocumentResponse;
import com.crystalpdf.backend.dto.MergeRequest;
import com.crystalpdf.backend.dto.OcrRequest;
import com.crystalpdf.backend.dto.PdfToImageRequest;
import com.crystalpdf.backend.dto.ProtectRequest;
import com.crystalpdf.backend.dto.SplitRequest;
import com.crystalpdf.backend.dto.UnlockRequest;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.service.CompressService;
import com.crystalpdf.backend.service.MergeService;
import com.crystalpdf.backend.service.OcrService;
import com.crystalpdf.backend.service.PdfToImageService;
import com.crystalpdf.backend.service.ProtectService;
import com.crystalpdf.backend.service.SplitService;
import com.crystalpdf.backend.service.StorageService;
import com.crystalpdf.backend.service.UnlockService;
import com.crystalpdf.backend.service.WordToPdfService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
    private final MergeService mergeService;
    private final UnlockService unlockService;
    private final PdfToImageService pdfToImageService;
    private final WordToPdfService wordToPdfService;

    public WorkspaceToolController(
            DocumentRepository documentRepository,
            StorageService storageService,
            SplitService splitService,
            ProtectService protectService,
            CompressService compressService,
            OcrService ocrService,
            MergeService mergeService,
            UnlockService unlockService,
            PdfToImageService pdfToImageService,
            WordToPdfService wordToPdfService) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.splitService = splitService;
        this.protectService = protectService;
        this.compressService = compressService;
        this.ocrService = ocrService;
        this.mergeService = mergeService;
        this.unlockService = unlockService;
        this.pdfToImageService = pdfToImageService;
        this.wordToPdfService = wordToPdfService;
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

    @PostMapping("/unlock")
    public ResponseEntity<DocumentResponse> unlock(
            @PathVariable Long id,
            @RequestBody UnlockRequest req,
            @AuthenticationPrincipal User user) throws IOException {

        Document source = loadOwned(id, user);
        byte[] result = unlockService.unlock(storageService.loadBytes(source), req.password());
        String name = baseName(source.getOriginalName()) + "_unlocked.pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/pdf-to-image")
    public ResponseEntity<DocumentResponse> pdfToImage(
            @PathVariable Long id,
            @RequestBody PdfToImageRequest req,
            @AuthenticationPrincipal User user) throws IOException {

        Document source = loadOwned(id, user);
        String format = (req.format() != null && !req.format().isBlank()) ? req.format() : "png";
        int dpi = (req.dpi() != null && req.dpi() >= 72 && req.dpi() <= 300) ? req.dpi() : 150;
        byte[] result = pdfToImageService.convert(storageService.loadBytes(source), format, dpi);
        String name = baseName(source.getOriginalName()) + "_images.zip";
        Document out = storageService.storeProcessed(result, name, "application/zip", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/word-to-pdf")
    public ResponseEntity<DocumentResponse> wordToPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {

        Document source = loadOwned(id, user);
        String ext = getExtension(source.getOriginalName());
        byte[] result = wordToPdfService.convert(storageService.loadBytes(source), ext);
        String name = baseName(source.getOriginalName()) + ".pdf";
        Document out = storageService.storeProcessed(result, name, "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/merge")
    public ResponseEntity<DocumentResponse> merge(
            @PathVariable Long id,
            @RequestBody MergeRequest req,
            @AuthenticationPrincipal User user) throws IOException {

        if (req.otherDocumentIds() == null || req.otherDocumentIds().isEmpty()) {
            throw new IllegalArgumentException("At least one additional document must be selected.");
        }

        Document primary = loadOwned(id, user);
        List<byte[]> allBytes = new ArrayList<>();
        allBytes.add(storageService.loadBytes(primary));

        for (Long otherId : req.otherDocumentIds()) {
            Document other = documentRepository.findByIdAndOwnerId(otherId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Document " + otherId + " not found."));
            allBytes.add(storageService.loadBytes(other));
        }

        byte[] result = mergeService.mergeBytes(allBytes);
        String name = baseName(primary.getOriginalName()) + "_merged.pdf";
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

    private String getExtension(String fileName) {
        if (fileName == null) return ".docx";
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 ? fileName.substring(dot) : ".docx";
    }
}
