package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${crystalpdf.storage.path}")
    private String storagePath;

    private final DocumentRepository documentRepository;

    public StorageService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
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
     * Files are stored at {storagePath}/{userId}/{uuid}{ext}.
     */
    public Document store(MultipartFile file, User owner) throws IOException {
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "upload";

        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) {
            ext = originalName.substring(dot); // includes the dot, e.g. ".pdf"
        }

        String storedName = UUID.randomUUID() + ext;
        Path userDir = storageRoot().resolve(String.valueOf(owner.getId()));
        Files.createDirectories(userDir);

        Path dest = userDir.resolve(storedName);
        // Use the Path overload — avoids relative-path confusion with Tomcat's working directory
        file.transferTo(dest);

        Document doc = new Document();
        doc.setOwner(owner);
        doc.setOriginalName(originalName);
        doc.setStoredName(storedName);
        doc.setMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        doc.setSizeBytes(file.getSize());
        return documentRepository.save(doc);
    }

    /**
     * Loads a document's file as a Spring Resource for streaming.
     */
    public Resource load(Document doc) throws IOException {
        Path filePath = storageRoot()
                .resolve(String.valueOf(doc.getOwner().getId()))
                .resolve(doc.getStoredName());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            throw new IOException("File not found on disk: " + doc.getStoredName());
        }
        return resource;
    }

    /**
     * Reads a document's bytes from disk for in-memory processing.
     */
    public byte[] loadBytes(Document doc) throws IOException {
        Resource resource = load(doc);
        try (InputStream in = resource.getInputStream()) {
            return in.readAllBytes();
        }
    }

    /**
     * Saves a processed byte array as a new Document record on disk.
     */
    public Document storeProcessed(byte[] bytes, String originalName, String mimeType, User owner) throws IOException {
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) ext = originalName.substring(dot);

        String storedName = UUID.randomUUID() + ext;
        Path userDir = storageRoot().resolve(String.valueOf(owner.getId()));
        Files.createDirectories(userDir);
        Files.write(userDir.resolve(storedName), bytes);

        Document doc = new Document();
        doc.setOwner(owner);
        doc.setOriginalName(originalName);
        doc.setStoredName(storedName);
        doc.setMimeType(mimeType != null ? mimeType : "application/pdf");
        doc.setSizeBytes((long) bytes.length);
        return documentRepository.save(doc);
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
}
