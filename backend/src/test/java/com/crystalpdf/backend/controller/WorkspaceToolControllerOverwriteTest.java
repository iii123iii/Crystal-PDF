package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.service.FileEncryptionService;
import com.crystalpdf.backend.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WorkspaceToolControllerOverwriteTest {

    @TempDir Path tempDir;
    private DocumentRepository documents;
    private StorageService storage;
    private WorkspaceToolController controller;
    private User owner;

    @BeforeEach
    void setUp() {
        documents = mock(DocumentRepository.class);
        when(documents.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));
        storage = spy(new StorageService(documents, new FileEncryptionService(""),
                mock(AppSettingsRepository.class)));
        ReflectionTestUtils.setField(storage, "storagePath", tempDir.toString());
        owner = new User();
        ReflectionTestUtils.setField(owner, "id", 1L);
        controller = new WorkspaceToolController(documents, storage,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null);
    }

    private Document storedDocument(long id, byte[] bytes) throws Exception {
        Document doc = storage.storeProcessed(bytes, "document.pdf", "application/pdf", owner);
        ReflectionTestUtils.setField(doc, "id", id);
        when(documents.findByIdAndOwnerId(id, owner.getId())).thenReturn(Optional.of(doc));
        return doc;
    }

    private Path filePath(Document doc) {
        return tempDir.resolve(owner.getId().toString()).resolve(doc.getStoredName());
    }

    @Test
    void overwriteWith_rejectsSameDocumentWithoutDeletingItsFileOrRecord() throws Exception {
        byte[] original = {37, 80, 68, 70, 1, 2, 3};
        Document doc = storedDocument(1000L, original);
        byte[] encryptedBefore = Files.readAllBytes(filePath(doc));
        clearInvocations(documents, storage);
        Long targetId = Long.valueOf("1000");
        Long sourceId = Long.valueOf("1000");
        assertThat(targetId).isNotSameAs(sourceId);

        Throwable failure = catchThrowable(() -> controller.overwriteWith(targetId, sourceId, owner));

        assertThat(Files.exists(filePath(doc))).as("original encrypted file must survive").isTrue();
        assertThat(Files.readAllBytes(filePath(doc))).isEqualTo(encryptedBefore);
        assertThat(failure).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("different");
        verify(storage, never()).loadBytes(any());
        verify(storage, never()).replaceFile(any(), any());
        verify(storage, never()).deleteFile(any());
        verify(documents, never()).save(any());
        verify(documents, never()).delete(any());
        assertThat(storage.loadBytes(doc)).isEqualTo(original);
    }

    @Test
    void overwriteWith_distinctDocumentsReplacesTargetAndRemovesOnlySource() throws Exception {
        Document target = storedDocument(1000L, new byte[]{1, 2});
        byte[] replacement = {3, 4, 5};
        Document source = storedDocument(1001L, replacement);
        clearInvocations(documents, storage);

        var result = controller.overwriteWith(target.getId(), source.getId(), owner);

        assertThat(result.getBody().id()).isEqualTo(target.getId());
        assertThat(result.getBody().sizeBytes()).isEqualTo((long) replacement.length);
        assertThat(storage.loadBytes(target)).isEqualTo(replacement);
        assertThat(Files.exists(filePath(source))).isFalse();
        verify(documents).save(target);
        verify(documents).delete(source);
        verify(documents, never()).delete(target);
    }

    @Test
    void overwriteWith_unownedTargetIsRejectedBeforeSameIdValidation() throws Exception {
        Document target = storedDocument(1000L, new byte[]{1, 2});
        User otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 2L);
        clearInvocations(documents, storage);

        assertThatThrownBy(() -> controller.overwriteWith(target.getId(), target.getId(), otherUser))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Document not found.");

        verifyNoInteractions(storage);
        verify(documents, never()).save(any());
        verify(documents, never()).delete(any());
        assertThat(Files.exists(filePath(target))).isTrue();
    }

    @Test
    void overwriteWith_unownedSourceIsRejectedWithoutChangingTarget() throws Exception {
        Document target = storedDocument(1000L, new byte[]{1, 2});
        byte[] encryptedBefore = Files.readAllBytes(filePath(target));
        User otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 2L);
        Document source = storage.storeProcessed(new byte[]{3, 4, 5}, "other.pdf", "application/pdf", otherUser);
        ReflectionTestUtils.setField(source, "id", 1001L);
        when(documents.findByIdAndOwnerId(source.getId(), otherUser.getId())).thenReturn(Optional.of(source));
        Path sourcePath = tempDir.resolve("2").resolve(source.getStoredName());
        byte[] sourceBefore = Files.readAllBytes(sourcePath);
        clearInvocations(documents, storage);

        assertThatThrownBy(() -> controller.overwriteWith(target.getId(), source.getId(), owner))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Document not found.");

        verifyNoInteractions(storage);
        verify(documents, never()).save(any());
        verify(documents, never()).delete(any());
        assertThat(Files.readAllBytes(filePath(target))).isEqualTo(encryptedBefore);
        assertThat(Files.readAllBytes(sourcePath)).isEqualTo(sourceBefore);
    }
}
