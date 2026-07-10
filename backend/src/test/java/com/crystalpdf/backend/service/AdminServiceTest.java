package com.crystalpdf.backend.service;

import com.crystalpdf.backend.dto.AdminUserResponse;
import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock UserRepository userRepository;
    @Mock DocumentRepository documentRepository;
    @Mock StorageService storageService;
    @Mock AppSettingsRepository settingsRepository;
    @Mock PasswordEncoder passwordEncoder;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                documentRepository,
                storageService,
                settingsRepository,
                passwordEncoder
        );
        ReflectionTestUtils.setField(adminService, "storagePath", ".");
    }

    @Test
    void getAllUsers_usesPagedUsersAndBatchedStorageStats() {
        User alice = makeUser(1L, "alice@example.com", "alice", false);
        User bob = makeUser(2L, "bob@example.com", "bob", true);
        PageRequest pageRequest = PageRequest.of(0, 2);
        when(userRepository.findForAdminList("%example%", null, pageRequest))
                .thenReturn(new PageImpl<>(List.of(alice, bob), pageRequest, 20));

        AppSettings settings = new AppSettings();
        settings.setDefaultStorageLimitMb(100);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(documentRepository.findStorageStatsByOwnerIds(List.of(1L, 2L)))
                .thenReturn(List.of(new Stats(1L, 3L, 1_024L)));

        Page<AdminUserResponse> users = adminService.getAllUsers(0, 2, "example", "");

        assertThat(users.getTotalElements()).isEqualTo(20);
        assertThat(users.getContent()).hasSize(2);
        assertThat(users.getContent().get(0).id()).isEqualTo(1L);
        assertThat(users.getContent().get(0).fileCount()).isEqualTo(3);
        assertThat(users.getContent().get(0).storageUsedBytes()).isEqualTo(1_024L);
        assertThat(users.getContent().get(1).id()).isEqualTo(2L);
        assertThat(users.getContent().get(1).fileCount()).isZero();
        assertThat(users.getContent().get(1).storageUsedBytes()).isZero();

        verify(userRepository, never()).findAll();
        verify(documentRepository, never()).findByOwnerIdOrderByCreatedAtDesc(any());
    }

    @Test
    void getSystemInfo_countsAdminsWithoutLoadingAllUsers() {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.countByAdminTrue()).thenReturn(2L);
        when(documentRepository.count()).thenReturn(10L);

        var info = adminService.getSystemInfo();

        assertThat(info).containsEntry("totalUsers", 5L);
        assertThat(info).containsEntry("totalFiles", 10L);
        assertThat(info).containsEntry("totalAdmins", 2L);
        verify(userRepository, never()).findAll();
    }

    private User makeUser(Long id, String email, String username, boolean admin) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        ReflectionTestUtils.setField(user, "createdAt", LocalDateTime.parse("2026-01-01T00:00:00"));
        user.setEmail(email);
        user.setDisplayUsername(username);
        user.setAdmin(admin);
        return user;
    }

    private record Stats(Long ownerId, Long fileCount, Long totalSizeBytes)
            implements DocumentRepository.OwnerStorageStats {
        @Override
        public Long getOwnerId() {
            return ownerId;
        }

        @Override
        public Long getFileCount() {
            return fileCount;
        }

        @Override
        public Long getTotalSizeBytes() {
            return totalSizeBytes;
        }
    }
}
