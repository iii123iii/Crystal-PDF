package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.*;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.service.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    private final AnnotationFlattenService annotationFlattenService;
    private final RotateService rotateService;
    private final DeletePagesService deletePagesService;
    private final ReorderService reorderService;
    private final ExtractSelectionService extractSelectionService;
    private final SanitizeService sanitizeService;
    private final WatermarkService watermarkService;
    private final RedactService redactService;
    private final PageNumberService pageNumberService;
    private final ExtractTextService extractTextService;
    private final ExtractImagesService extractImagesService;
    private final SignStampService signStampService;
    private final CropService cropService;
    private final RepairService repairService;
    private final PdfAConvertService pdfAConvertService;
    private final HeaderFooterService headerFooterService;

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
            WordToPdfService wordToPdfService,
            AnnotationFlattenService annotationFlattenService,
            RotateService rotateService,
            DeletePagesService deletePagesService,
            ReorderService reorderService,
            ExtractSelectionService extractSelectionService,
            SanitizeService sanitizeService,
            WatermarkService watermarkService,
            RedactService redactService,
            PageNumberService pageNumberService,
            ExtractTextService extractTextService,
            ExtractImagesService extractImagesService,
            SignStampService signStampService,
            CropService cropService,
            RepairService repairService,
            PdfAConvertService pdfAConvertService,
            HeaderFooterService headerFooterService) {
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
        this.annotationFlattenService = annotationFlattenService;
        this.rotateService = rotateService;
        this.deletePagesService = deletePagesService;
        this.reorderService = reorderService;
        this.extractSelectionService = extractSelectionService;
        this.sanitizeService = sanitizeService;
        this.watermarkService = watermarkService;
        this.redactService = redactService;
        this.pageNumberService = pageNumberService;
        this.extractTextService = extractTextService;
        this.extractImagesService = extractImagesService;
        this.signStampService = signStampService;
        this.cropService = cropService;
        this.repairService = repairService;
        this.pdfAConvertService = pdfAConvertService;
        this.headerFooterService = headerFooterService;
    }

    // ── Existing endpoints ──────────────────────────────────────────────────

    @PostMapping("/split")
    public ResponseEntity<DocumentResponse> split(
            @PathVariable Long id, @RequestBody SplitRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = splitService.extractPages(prepareBytes(source, req.sourcePassword()), req.pages());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_split.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/protect")
    public ResponseEntity<DocumentResponse> protect(
            @PathVariable Long id, @RequestBody ProtectRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = protectService.protect(prepareBytes(source, req.sourcePassword()), req.userPassword(), req.ownerPassword());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_protected.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/compress")
    public ResponseEntity<DocumentResponse> compress(
            @PathVariable Long id, @RequestBody CompressRequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {
        Document source = loadOwned(id, user);
        String level = (req.level() != null && !req.level().isBlank()) ? req.level() : "ebook";
        byte[] result = compressService.compress(prepareBytes(source, req.sourcePassword()), level);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_compressed.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/ocr")
    public ResponseEntity<DocumentResponse> ocr(
            @PathVariable Long id, @RequestBody OcrRequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {
        Document source = loadOwned(id, user);
        String lang = (req.language() != null && !req.language().isBlank()) ? req.language() : "eng";
        byte[] result = ocrService.ocr(prepareBytes(source, req.sourcePassword()), lang);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_ocr.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/unlock")
    public ResponseEntity<DocumentResponse> unlock(
            @PathVariable Long id, @RequestBody UnlockRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = unlockService.unlock(storageService.loadBytes(source), req.password());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_unlocked.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/pdf-to-image")
    public ResponseEntity<DocumentResponse> pdfToImage(
            @PathVariable Long id, @RequestBody PdfToImageRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        String format = (req.format() != null && !req.format().isBlank()) ? req.format() : "png";
        int dpi = (req.dpi() != null && req.dpi() >= 72 && req.dpi() <= 300) ? req.dpi() : 150;
        byte[] result = pdfToImageService.convert(prepareBytes(source, req.sourcePassword()), format, dpi);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_images.zip", "application/zip", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/word-to-pdf")
    public ResponseEntity<DocumentResponse> wordToPdf(
            @PathVariable Long id, @AuthenticationPrincipal User user) throws IOException, InterruptedException {
        Document source = loadOwned(id, user);
        byte[] result = wordToPdfService.convert(storageService.loadBytes(source), getExtension(source.getOriginalName()));
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + ".pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/merge")
    public ResponseEntity<DocumentResponse> merge(
            @PathVariable Long id, @RequestBody MergeRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        if (req.otherDocumentIds() == null || req.otherDocumentIds().isEmpty())
            throw new IllegalArgumentException("At least one additional document must be selected.");
        Document primary = loadOwned(id, user);
        List<byte[]> allBytes = new ArrayList<>();
        allBytes.add(prepareBytes(primary, req.sourcePassword()));
        for (Long otherId : req.otherDocumentIds()) {
            Document other = documentRepository.findByIdAndOwnerId(otherId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Document " + otherId + " not found."));
            allBytes.add(storageService.loadBytes(other));
        }
        byte[] result = mergeService.mergeBytes(allBytes);
        Document out = storageService.storeProcessed(result, baseName(primary.getOriginalName()) + "_merged.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/flatten-annotations")
    public ResponseEntity<DocumentResponse> flattenAnnotations(
            @PathVariable Long id, @RequestBody FlattenAnnotationsRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = annotationFlattenService.flatten(prepareBytes(source, req.sourcePassword()), req);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_annotated.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/rotate")
    public ResponseEntity<DocumentResponse> rotate(
            @PathVariable Long id, @RequestBody RotateRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = rotateService.rotatePages(prepareBytes(source, req.sourcePassword()), req.pages(), req.rotation());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_rotated.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/delete-pages")
    public ResponseEntity<DocumentResponse> deletePages(
            @PathVariable Long id, @RequestBody DeletePagesRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = deletePagesService.deletePages(prepareBytes(source, req.sourcePassword()), req.pages());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_deleted.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/reorder")
    public ResponseEntity<DocumentResponse> reorder(
            @PathVariable Long id, @RequestBody ReorderRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = reorderService.reorderPages(prepareBytes(source, req.sourcePassword()), req.pageOrder());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_reordered.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/extract-selection")
    public ResponseEntity<DocumentResponse> extractSelection(
            @PathVariable Long id, @RequestBody ExtractSelectionRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = extractSelectionService.extractSelection(prepareBytes(source, req.sourcePassword()), req.pages());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_selection.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/sanitize")
    public ResponseEntity<DocumentResponse> sanitize(
            @PathVariable Long id, @RequestBody SanitizeRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        byte[] result = sanitizeService.sanitize(prepareBytes(source, req.sourcePassword()));
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_sanitized.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/overwrite-with/{sourceId}")
    public ResponseEntity<DocumentResponse> overwriteWith(
            @PathVariable Long id, @PathVariable Long sourceId,
            @AuthenticationPrincipal User user) throws IOException {
        Document target = loadOwned(id, user);
        Document source = loadOwned(sourceId, user);
        byte[] bytes = storageService.loadBytes(source);
        storageService.replaceFile(target, bytes);
        target.setSizeBytes((long) bytes.length);
        documentRepository.save(target);
        storageService.deleteFile(source);
        documentRepository.delete(source);
        return ResponseEntity.ok(DocumentResponse.from(target));
    }

    // ── New tool endpoints ──────────────────────────────────────────────────

    @PostMapping("/watermark")
    public ResponseEntity<DocumentResponse> watermark(
            @PathVariable Long id, @RequestBody WatermarkRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        String text = (req.text() != null && !req.text().isBlank()) ? req.text() : "CONFIDENTIAL";
        float fontSize = req.fontSize() != null ? req.fontSize() : 48f;
        float opacity = req.opacity() != null ? req.opacity() : 0.3f;
        float rotation = req.rotation() != null ? req.rotation() : -45f;
        byte[] result = watermarkService.addTextWatermark(prepareBytes(source, req.sourcePassword()),
                text, fontSize, opacity, rotation, req.position());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_watermarked.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/redact")
    public ResponseEntity<DocumentResponse> redact(
            @PathVariable Long id, @RequestBody RedactRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        if (req.areas() == null || req.areas().isEmpty())
            throw new IllegalArgumentException("At least one redaction area is required.");
        List<RedactService.RedactArea> areas = req.areas().stream()
                .map(a -> new RedactService.RedactArea(a.page(), a.x(), a.y(), a.width(), a.height()))
                .toList();
        byte[] result = redactService.redact(prepareBytes(source, req.sourcePassword()), areas);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_redacted.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/page-numbers")
    public ResponseEntity<DocumentResponse> pageNumbers(
            @PathVariable Long id, @RequestBody PageNumberRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        int startNumber = req.startNumber() != null ? req.startNumber() : 1;
        float fontSize = req.fontSize() != null ? req.fontSize() : 10f;
        byte[] result = pageNumberService.addPageNumbers(prepareBytes(source, req.sourcePassword()),
                req.position(), startNumber, fontSize, req.format());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_numbered.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/extract-text")
    public ResponseEntity<Map<String, String>> extractText(
            @PathVariable Long id, @RequestBody ExtractTextRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        String text = extractTextService.extractText(prepareBytes(source, req.sourcePassword()));
        return ResponseEntity.ok(Map.of("text", text));
    }

    @PostMapping("/extract-images")
    public ResponseEntity<DocumentResponse> extractImages(
            @PathVariable Long id, @RequestBody ExtractImagesRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        String format = (req.format() != null && !req.format().isBlank()) ? req.format() : "png";
        byte[] result = extractImagesService.extractImages(prepareBytes(source, req.sourcePassword()), format);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_images.zip", "application/zip", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/stamp")
    public ResponseEntity<DocumentResponse> stamp(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "sourcePassword", required = false) String sourcePassword,
            @RequestParam(value = "pages", defaultValue = "1") List<Integer> pages,
            @RequestParam(value = "x", defaultValue = "0.35") float x,
            @RequestParam(value = "y", defaultValue = "0.8") float y,
            @RequestParam(value = "width", defaultValue = "0.3") float width,
            @RequestParam(value = "height", defaultValue = "0.1") float height,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        String imgFormat = imageFile.getOriginalFilename() != null
                ? imageFile.getOriginalFilename().substring(imageFile.getOriginalFilename().lastIndexOf('.') + 1)
                : "png";
        byte[] result = signStampService.addStamp(prepareBytes(source, sourcePassword),
                imageFile.getBytes(), imgFormat, pages, x, y, width, height);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_stamped.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/crop")
    public ResponseEntity<DocumentResponse> crop(
            @PathVariable Long id, @RequestBody CropRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        float top = req.marginTop() != null ? req.marginTop() : 0;
        float right = req.marginRight() != null ? req.marginRight() : 0;
        float bottom = req.marginBottom() != null ? req.marginBottom() : 0;
        float left = req.marginLeft() != null ? req.marginLeft() : 0;
        byte[] result = cropService.cropPages(prepareBytes(source, req.sourcePassword()),
                top, right, bottom, left, req.pages());
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_cropped.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/repair")
    public ResponseEntity<DocumentResponse> repair(
            @PathVariable Long id, @RequestBody RepairRequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {
        Document source = loadOwned(id, user);
        byte[] result = repairService.repair(prepareBytes(source, req.sourcePassword()));
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_repaired.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/pdfa")
    public ResponseEntity<DocumentResponse> convertToPdfA(
            @PathVariable Long id, @RequestBody PdfARequest req,
            @AuthenticationPrincipal User user) throws IOException, InterruptedException {
        Document source = loadOwned(id, user);
        byte[] result = pdfAConvertService.convertToPdfA(prepareBytes(source, req.sourcePassword()));
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_pdfa.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    @PostMapping("/header-footer")
    public ResponseEntity<DocumentResponse> headerFooter(
            @PathVariable Long id, @RequestBody HeaderFooterRequest req,
            @AuthenticationPrincipal User user) throws IOException {
        Document source = loadOwned(id, user);
        float fontSize = req.fontSize() != null ? req.fontSize() : 9f;
        byte[] result = headerFooterService.addHeaderFooter(prepareBytes(source, req.sourcePassword()),
                req.headerLeft(), req.headerCenter(), req.headerRight(),
                req.footerLeft(), req.footerCenter(), req.footerRight(), fontSize);
        Document out = storageService.storeProcessed(result, baseName(source.getOriginalName()) + "_headerfooter.pdf", "application/pdf", user);
        return ResponseEntity.ok(DocumentResponse.from(out));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private byte[] prepareBytes(Document source, String sourcePassword) throws IOException {
        byte[] bytes = storageService.loadBytes(source);
        String pw = sourcePassword != null ? sourcePassword : "";
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(bytes.clone()), pw)) {
            if (!doc.isEncrypted()) return bytes;
            doc.setAllSecurityToBeRemoved(true);
            try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                doc.save(bos);
                return bos.toByteArray();
            }
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException e) {
            throw new IllegalArgumentException("This PDF is password-protected. Provide the correct open password.");
        }
    }

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
