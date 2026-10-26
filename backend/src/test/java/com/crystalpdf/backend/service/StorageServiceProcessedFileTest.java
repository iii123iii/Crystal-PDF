package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StorageServiceProcessedFileTest {

    @TempDir
    Path tempDir;

    private StorageService storageService;
    private User owner;

    @BeforeEach
    void setUp() {
        DocumentRepository documents = mock(DocumentRepository.class);
        when(documents.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));
        storageService = new StorageService(documents, new FileEncryptionService(""),
                mock(AppSettingsRepository.class));
        ReflectionTestUtils.setField(storageService, "storagePath", tempDir.toString());
        owner = new User();
        ReflectionTestUtils.setField(owner, "id", 1L);
    }

    @Test
    void storeProcessed_preservesZipDownloadNameAndContent() throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("page_1.png"));
            zip.write(new byte[]{1, 2, 3});
            zip.closeEntry();
        }
        byte[] bytes = output.toByteArray();

        Document doc = storageService.storeProcessed(bytes, "report_images.zip", "application/zip", owner);

        assertThat(doc.getOriginalName()).isEqualTo("report_images.zip");
        assertThat(doc.getMimeType()).isEqualTo("application/zip");
        assertThat(doc.getSizeBytes()).isEqualTo(bytes.length);
        assertThat(storageService.loadBytes(doc)).isEqualTo(bytes);
    }

    @Test
    void storeProcessed_sanitizesZipNameWithoutTrustingItsExtension() throws Exception {
        Document doc = storageService.storeProcessed(new byte[]{1}, "../report\".exe", "application/zip", owner);

        assertThat(doc.getOriginalName()).isEqualTo("report_.zip");
    }

    @Test
    void storeProcessed_keepsPdfExtensionForPdfAndDefaultMimeType() throws Exception {
        for (String mimeType : new String[]{"application/pdf", null}) {
            Document doc = storageService.storeProcessed(new byte[]{1}, "report.zip", mimeType, owner);

            assertThat(doc.getOriginalName()).isEqualTo("report.pdf");
            assertThat(doc.getMimeType()).isEqualTo("application/pdf");
        }
    }

    @Test
    void store_keepsPdfExtensionDespiteClientZipNameAndMimeType() throws Exception {
        MockMultipartFile upload = new MockMultipartFile(
                "file", "report.zip", "application/zip", new byte[]{0x25, 0x50, 0x44, 0x46});

        Document doc = storageService.store(upload, owner);

        assertThat(doc.getOriginalName()).isEqualTo("report.pdf");
        assertThat(doc.getMimeType()).isEqualTo("application/pdf");
    }
}
