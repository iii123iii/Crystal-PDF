package com.crystalpdf.backend.service;

import com.crystalpdf.backend.dto.AdminUserResponse;
import com.crystalpdf.backend.dto.AppSettingsResponse;
import com.crystalpdf.backend.dto.UpdateAppSettingsRequest;
import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final AppSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${crystalpdf.storage.path}")
    private String storagePath;

    public AdminService(UserRepository userRepository, DocumentRepository documentRepository,
                        StorageService storageService, AppSettingsRepository settingsRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            List<Document> docs = documentRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId());
            long storageUsed = docs.stream().mapToLong(Document::getSizeBytes).sum();
            AppSettings settings = getSettingsEntity();
            long limitBytes = user.getStorageLimitBytes() != null ? user.getStorageLimitBytes()
                    : settings.getDefaultStorageLimitMb() * 1024L * 1024L;
            return new AdminUserResponse(
                    user.getId(), user.getEmail(), user.getDisplayUsername(),
                    user.isAdmin(), user.isPasswordChangeRequired(),
                    limitBytes, storageUsed, docs.size(),
                    user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
            );
        }).toList();
    }

    public void setStorageLimit(Long userId, Long limitBytes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setStorageLimitBytes(limitBytes);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId, User requestingAdmin) {
        if (userId.equals(requestingAdmin.getId())) {
            throw new IllegalArgumentException("Cannot delete your own admin account.");
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        List<Document> docs = documentRepository.findByOwnerIdOrderByCreatedAtDesc(target.getId());
        for (Document doc : docs) storageService.deleteFile(doc);
        documentRepository.deleteAll(docs);
        userRepository.delete(target);
    }

    public AppSettingsResponse getSettings() {
        AppSettings s = getSettingsEntity();
        return new AppSettingsResponse(s.isAllowRegistration(), s.getMaxUploadSizeMb(), s.getDefaultStorageLimitMb(), s.isMaintenanceMode());
    }

    public AppSettingsResponse updateSettings(UpdateAppSettingsRequest req) {
        AppSettings s = getSettingsEntity();
        if (req.allowRegistration() != null) s.setAllowRegistration(req.allowRegistration());
        if (req.maxUploadSizeMb() != null) s.setMaxUploadSizeMb(req.maxUploadSizeMb());
        if (req.defaultStorageLimitMb() != null) s.setDefaultStorageLimitMb(req.defaultStorageLimitMb());
        if (req.maintenanceMode() != null) s.setMaintenanceMode(req.maintenanceMode());
        settingsRepository.save(s);
        return new AppSettingsResponse(s.isAllowRegistration(), s.getMaxUploadSizeMb(), s.getDefaultStorageLimitMb(), s.isMaintenanceMode());
    }

    /** Toggle admin status of a user. Cannot demote self. */
    public void toggleAdmin(Long userId, User requestingAdmin) {
        if (userId.equals(requestingAdmin.getId())) {
            throw new IllegalArgumentException("Cannot change your own admin status.");
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        target.setAdmin(!target.isAdmin());
        userRepository.save(target);
    }

    /** Force a user to change their password on next login. Returns the plaintext temp password. */
    public String forcePasswordReset(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 12);
        target.setPassword(passwordEncoder.encode(tempPassword));
        target.setPasswordChangeRequired(true);
        userRepository.save(target);
        return tempPassword;
    }

    /** Returns platform system information. */
    public Map<String, Object> getSystemInfo() {
        Map<String, Object> info = new LinkedHashMap<>();

        // JVM
        Runtime rt = Runtime.getRuntime();
        info.put("jvmMaxMemoryMb", rt.maxMemory() / (1024 * 1024));
        info.put("jvmUsedMemoryMb", (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024));
        info.put("jvmTotalMemoryMb", rt.totalMemory() / (1024 * 1024));
        info.put("availableProcessors", rt.availableProcessors());

        // Disk
        File storage = new File(storagePath);
        info.put("diskTotalMb", storage.getTotalSpace() / (1024 * 1024));
        info.put("diskFreeMb", storage.getFreeSpace() / (1024 * 1024));
        info.put("diskUsableMb", storage.getUsableSpace() / (1024 * 1024));

        // Platform stats
        info.put("totalUsers", userRepository.count());
        info.put("totalFiles", documentRepository.count());
        info.put("totalAdmins", userRepository.findAll().stream().filter(User::isAdmin).count());
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("osName", System.getProperty("os.name"));

        return info;
    }

    private AppSettings getSettingsEntity() {
        return settingsRepository.findById(1L).orElseGet(() -> settingsRepository.save(new AppSettings()));
    }
}
