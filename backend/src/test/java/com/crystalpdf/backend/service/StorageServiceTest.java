package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.helper.PdfTestHelper;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    @TempDir
    Path tempDir;

    @Mock DocumentRepository documentRepository;
    @Mock AppSettingsRepository appSettingsRepository;
    // Mock encryption so tests don't depend on JCE key-size policy
    @Mock FileEncryptionService fileEncryptionService;

    private StorageService storageService;
    private User owner;

    @BeforeEach
    void setUp() {
        // lenient: not every test will use both encrypt and decrypt
        lenient().when(fileEncryptionService.encrypt(any(byte[].class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(fileEncryptionService.decrypt(any(byte[].class))).thenAnswer(inv -> inv.getArgument(0));

        storageService = new StorageService(documentRepository, fileEncryptionService, appSettingsRepository);
        ReflectionTestUtils.setField(storageService, "storagePath", tempDir.toString());

        owner = new User();
        ReflectionTestUtils.setField(owner, "id", 1L);
        owner.setEmail("alice@example.com");
    }

    private AppSettings defaultSettings() {
        AppSettings s = new AppSettings();
        s.setMaxUploadSizeMb(200);
        s.setDefaultStorageLimitMb(1024);
        return s;
    }

    // ── store ─────────────────────────────────────────────────────────────────

    @Test
    void store_acceptsValidPdf() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", pdfBytes);

        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(defaultSettings()));
        when(documentRepository.findByOwnerIdOrderByCreatedAtDesc(any())).thenReturn(Collections.emptyList());
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Document doc = storageService.store(file, owner);

        assertThat(doc.getMimeType()).isEqualTo("application/pdf");
        assertThat(doc.getOriginalName()).endsWith(".pdf");
        assertThat(doc.getStoredName()).endsWith(".pdf");
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    void store_rejectsNonPdfFile() {
        byte[] notPdf = "This is plaintext, not a PDF".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "malicious.pdf", "application/pdf", notPdf);

        // PDF magic-byte check happens before any repository call — no stubs needed
        assertThatThrownBy(() -> storageService.store(file, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF files");
    }

    @Test
    void store_rejectsFileExceedingUploadLimit() throws Exception {
        AppSettings tinyLimit = new AppSettings();
        tinyLimit.setMaxUploadSizeMb(0); // effectively 0 bytes — any PDF will exceed this
        tinyLimit.setDefaultStorageLimitMb(1024);

        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", pdfBytes);

        // Upload-size check runs before storage-limit check; documentRepository never called
        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(tinyLimit));

        assertThatThrownBy(() -> storageService.store(file, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maximum upload size");
    }

    @Test
    void store_sanitizesFilename() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../../etc/passwd.pdf", "application/pdf", pdfBytes);

        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(defaultSettings()));
        when(documentRepository.findByOwnerIdOrderByCreatedAtDesc(any())).thenReturn(Collections.emptyList());
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Document doc = storageService.store(file, owner);

        // Path traversal must be stripped
        assertThat(doc.getOriginalName()).doesNotContain("/").doesNotContain("..").doesNotContain("\\");
    }

    @Test
    void store_setsCorrectMimeType() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "text/plain", pdfBytes); // client sends wrong MIME

        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(defaultSettings()));
        when(documentRepository.findByOwnerIdOrderByCreatedAtDesc(any())).thenReturn(Collections.emptyList());
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Document doc = storageService.store(file, owner);

        // Must always be application/pdf regardless of client-supplied MIME
        assertThat(doc.getMimeType()).isEqualTo("application/pdf");
    }

    // ── storeProcessed / loadBytes ────────────────────────────────────────────

    @Test
    void storeProcessed_thenLoadBytes_roundTrips() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Document doc = storageService.storeProcessed(pdfBytes, "output.pdf", "application/pdf", owner);
        byte[] loaded = storageService.loadBytes(doc);

        assertThat(loaded).isEqualTo(pdfBytes);
    }

    @Test
    void storeProcessed_recordsOriginalSize() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(2);
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Document doc = storageService.storeProcessed(pdfBytes, "output.pdf", "application/pdf", owner);

        assertThat(doc.getSizeBytes()).isEqualTo(pdfBytes.length);
    }

    // ── deleteFile ────────────────────────────────────────────────────────────

    @Test
    void deleteFile_removesFileFromDisk() throws Exception {
        byte[] pdfBytes = PdfTestHelper.createPdf(1);
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Document doc = storageService.storeProcessed(pdfBytes, "output.pdf", "application/pdf", owner);

        storageService.deleteFile(doc);

        assertThatThrownBy(() -> storageService.loadBytes(doc))
                .isInstanceOf(IOException.class);
    }

    @Test
    void deleteFile_doesNotThrowForMissingFile() {
        Document doc = new Document();
        doc.setOwner(owner);
        doc.setStoredName("nonexistent-" + System.nanoTime() + ".pdf");

        // Must not throw even when file doesn't exist
        storageService.deleteFile(doc);
    }

    // ── getStorageInfo ────────────────────────────────────────────────────────

    @Test
    void getStorageInfo_returnsUsedAndLimit() {
        Document d1 = new Document();
        d1.setSizeBytes(1024L);
        Document d2 = new Document();
        d2.setSizeBytes(2048L);

        when(documentRepository.findByOwnerIdOrderByCreatedAtDesc(any())).thenReturn(java.util.List.of(d1, d2));
        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(defaultSettings()));

        long[] info = storageService.getStorageInfo(owner);

        assertThat(info[0]).isEqualTo(3072L);                        // used bytes
        assertThat(info[1]).isEqualTo(1024L * 1024L * 1024L);        // 1 GB default limit
    }
}
