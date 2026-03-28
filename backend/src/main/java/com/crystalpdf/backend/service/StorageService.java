package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class StorageService {

    // %PDF magic bytes
    private static final byte[] PDF_MAGIC = {0x25, 0x50, 0x44, 0x46};

    @Value("${crystalpdf.storage.path}")
    private String storagePath;

    private final DocumentRepository documentRepository;
    private final FileEncryptionService fileEncryptionService;
    private final AppSettingsRepository appSettingsRepository;

    public StorageService(DocumentRepository documentRepository,
                          FileEncryptionService fileEncryptionService,
                          AppSettingsRepository appSettingsRepository) {
        this.documentRepository = documentRepository;
        this.fileEncryptionService = fileEncryptionService;
        this.appSettingsRepository = appSettingsRepository;
    }

    /**
     * Resolves the configured storage path to an absolute path so that
     * MultipartFile.transferTo() and Files operations always agree on the
     * same directory regardless of Tomcat's working directory.
     */
    private Path storageRoot() {
        return Paths.get(storagePath).toAbsolutePath().normalize();
    }

    /**
     * Saves a multipart file to disk and persists a Document record.
     * Only PDF files are accepted. MIME type is derived from content, not from the client header.
     * Files are stored at {storagePath}/{userId}/{uuid}.pdf.
     */
    public Document store(MultipartFile file, User owner) throws IOException {
        // Validate that the upload is a real PDF by checking magic bytes
        byte[] header = readHeader(file);
        if (!hasPdfMagicBytes(header)) {
            throw new IllegalArgumentException("Only PDF files are accepted.");
        }

        // Check per-file upload size limit
        AppSettings settings = appSettingsRepository.findById(1L).orElse(new AppSettings());
        long maxUploadBytes = settings.getMaxUploadSizeMb() * 1024L * 1024L;
        long fileSizeBytes = file.getSize();
        if (fileSizeBytes > maxUploadBytes) {
            throw new IllegalArgumentException("File exceeds the maximum upload size of " +
                    settings.getMaxUploadSizeMb() + " MB.");
        }

        // Check storage limit
        List<Document> existingDocs = documentRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId());
        long usedBytes = existingDocs.stream().mapToLong(Document::getSizeBytes).sum();
        long limitBytes = owner.getStorageLimitBytes() != null ? owner.getStorageLimitBytes()
                : settings.getDefaultStorageLimitMb() * 1024L * 1024L;
        if (usedBytes + fileSizeBytes > limitBytes) {
            throw new IllegalArgumentException("Storage limit exceeded. You have used " +
                    (usedBytes / (1024 * 1024)) + " MB of your " + (limitBytes / (1024 * 1024)) + " MB limit.");
        }

        // Read the full file bytes and store original size before encryption
        byte[] plainBytes;
        try (InputStream in = file.getInputStream()) {
            plainBytes = in.readAllBytes();
        }
        long originalSize = plainBytes.length;
        byte[] encryptedBytes = fileEncryptionService.encrypt(plainBytes);

        String storedName = UUID.randomUUID() + ".pdf";
        Path userDir = storageRoot().resolve(String.valueOf(owner.getId()));
        Files.createDirectories(userDir);
        Files.write(userDir.resolve(storedName), encryptedBytes);

        // Preserve the user's original display name but ensure safe extension
        String originalName = sanitizeFilename(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.pdf");

        Document doc = new Document();
        doc.setOwner(owner);
        doc.setOriginalName(originalName);
        doc.setStoredName(storedName);
        doc.setMimeType("application/pdf");  // Always PDF — never trust client Content-Type
        doc.setSizeBytes(originalSize);
        return documentRepository.save(doc);
    }

    /**
     * Loads a document's file as a Spring Resource, decrypting on the fly.
     */
    public Resource load(Document doc) throws IOException {
        return new ByteArrayResource(loadBytes(doc));
    }

    /**
     * Reads a document's bytes from disk and decrypts before returning.
     */
    public byte[] loadBytes(Document doc) throws IOException {
        Path filePath = storageRoot()
                .resolve(String.valueOf(doc.getOwner().getId()))
                .resolve(doc.getStoredName());
        if (!Files.exists(filePath)) {
            throw new IOException("File not found on disk: " + doc.getStoredName());
        }
        byte[] encryptedBytes = Files.readAllBytes(filePath);
        return fileEncryptionService.decrypt(encryptedBytes);
    }

    /**
     * Saves a processed byte array as a new Document record on disk.
     * Used for server-side operations (merge, split, OCR, etc.) where content is already validated.
     */
    public Document storeProcessed(byte[] bytes, String originalName, String mimeType, User owner) throws IOException {
        long originalSize = bytes.length;
        byte[] encryptedBytes = fileEncryptionService.encrypt(bytes);

        String storedName = UUID.randomUUID() + ".pdf";
        Path userDir = storageRoot().resolve(String.valueOf(owner.getId()));
        Files.createDirectories(userDir);
        Files.write(userDir.resolve(storedName), encryptedBytes);

        Document doc = new Document();
        doc.setOwner(owner);
        doc.setOriginalName(sanitizeFilename(originalName));
        doc.setStoredName(storedName);
        doc.setMimeType(mimeType != null ? mimeType : "application/pdf");
        doc.setSizeBytes(originalSize);
        return documentRepository.save(doc);
    }

    /**
     * Overwrites the physical file of an existing Document with new bytes.
     * Caller is responsible for updating the Document's sizeBytes and saving.
     */
    public void replaceFile(Document doc, byte[] bytes) throws IOException {
        byte[] encryptedBytes = fileEncryptionService.encrypt(bytes);
        Path filePath = storageRoot()
                .resolve(String.valueOf(doc.getOwner().getId()))
                .resolve(doc.getStoredName());
        Files.write(filePath, encryptedBytes);
    }

    /**
     * Deletes a document's physical file. Does not touch the database record.
     */
    public void deleteFile(Document doc) {
        try {
            Path filePath = storageRoot()
                    .resolve(String.valueOf(doc.getOwner().getId()))
                    .resolve(doc.getStoredName());
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // Best-effort delete — DB record deletion proceeds regardless
        }
    }

    /**
     * Returns the user's storage usage and limit in bytes.
     */
    public long[] getStorageInfo(User owner) {
        List<Document> docs = documentRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId());
        long usedBytes = docs.stream().mapToLong(Document::getSizeBytes).sum();
        AppSettings settings = appSettingsRepository.findById(1L).orElse(new AppSettings());
        long limitBytes = owner.getStorageLimitBytes() != null ? owner.getStorageLimitBytes()
                : settings.getDefaultStorageLimitMb() * 1024L * 1024L;
        return new long[]{ usedBytes, limitBytes };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Reads the first few bytes of the upload for magic-byte validation. */
    private byte[] readHeader(MultipartFile file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(PDF_MAGIC.length);
        }
    }

    /** Returns true if the header bytes match the PDF magic signature (%PDF). */
    private boolean hasPdfMagicBytes(byte[] header) {
        if (header.length < PDF_MAGIC.length) return false;
        for (int i = 0; i < PDF_MAGIC.length; i++) {
            if (header[i] != PDF_MAGIC[i]) return false;
        }
        return true;
    }

    /**
     * Strips path components and forces a .pdf extension on the display name.
     * Prevents path traversal via filename and double-extension attacks.
     */
    private String sanitizeFilename(String name) {
        // Strip any path separators
        String base = Paths.get(name).getFileName().toString();
        // Strip everything after the last dot and force .pdf
        int dot = base.lastIndexOf('.');
        String stem = dot > 0 ? base.substring(0, dot) : base;
        // Remove any characters that are not safe in a display filename
        stem = stem.replaceAll("[^a-zA-Z0-9 _\\-()]", "_");
        return stem.isBlank() ? "document.pdf" : stem + ".pdf";
    }
}
