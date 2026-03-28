package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.DocumentResponse;
import com.crystalpdf.backend.dto.RenameRequest;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.service.ImageToPdfService;
import com.crystalpdf.backend.service.StorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final StorageService storageService;
    private final DocumentRepository documentRepository;
    private final ImageToPdfService imageToPdfService;

    public DocumentController(StorageService storageService,
                               DocumentRepository documentRepository,
                               ImageToPdfService imageToPdfService) {
        this.storageService = storageService;
        this.documentRepository = documentRepository;
        this.imageToPdfService = imageToPdfService;
    }

    /** Upload a file — creates a Document record and saves to disk. */
    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        Document doc = storageService.store(file, user);
        return ResponseEntity.ok(DocumentResponse.from(doc));
    }

    /** Fetch metadata for a single document. Only the owner may access it. */
    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> info(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        Document doc = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found."));
        return ResponseEntity.ok(DocumentResponse.from(doc));
    }

    /** List all documents belonging to the authenticated user, newest first. */
    @GetMapping("/my-files")
    public ResponseEntity<List<DocumentResponse>> myFiles(@AuthenticationPrincipal User user) {
        List<DocumentResponse> files = documentRepository
                .findByOwnerIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(DocumentResponse::from)
                .toList();
        return ResponseEntity.ok(files);
    }

    /** Download a document by ID. Only the owner may download it. */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) throws IOException {

        Document doc = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found."));

        byte[] bytes = storageService.loadBytes(doc);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getOriginalName() + "\"")
                .body(new ByteArrayResource(bytes));
    }

    /** Delete a document and its physical file. Only the owner may delete it. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        Document doc = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found."));

        storageService.deleteFile(doc);
        documentRepository.delete(doc);
        return ResponseEntity.noContent().build();
    }

    /** Rename a document (only the originalName display label, not the file on disk). */
    @PatchMapping("/{id}/rename")
    public ResponseEntity<DocumentResponse> rename(
            @PathVariable Long id,
            @RequestBody RenameRequest req,
            @AuthenticationPrincipal User user) {

        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Name must not be empty.");
        }
        Document doc = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found."));
        doc.setOriginalName(req.name().trim());
        documentRepository.save(doc);
        return ResponseEntity.ok(DocumentResponse.from(doc));
    }

    /** Convert uploaded images to a PDF and save to the user's library. */
    @PostMapping("/image-to-pdf")
    public ResponseEntity<DocumentResponse> imageToPdf(
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal User user) throws IOException {

        byte[] result = imageToPdfService.convert(files);
        Document doc = storageService.storeProcessed(result, "images.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(doc));
    }
}
