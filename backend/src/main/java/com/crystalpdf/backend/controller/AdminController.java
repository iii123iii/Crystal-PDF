package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.AdminUserResponse;
import com.crystalpdf.backend.dto.AppSettingsResponse;
import com.crystalpdf.backend.dto.UpdateAppSettingsRequest;
import com.crystalpdf.backend.dto.UpdateStorageLimitRequest;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    private void requireAdmin(User user) {
        if (!user.isAdmin()) throw new org.springframework.security.access.AccessDeniedException("Admin access required.");
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter,
            @AuthenticationPrincipal User user) {
        requireAdmin(user);
        return ResponseEntity.ok(adminService.getAllUsers(page, pageSize, search, filter));
    }

    @PatchMapping("/users/{id}/storage-limit")
    public ResponseEntity<Void> setStorageLimit(@PathVariable Long id,
                                                 @RequestBody UpdateStorageLimitRequest req,
                                                 @AuthenticationPrincipal User user) {
        requireAdmin(user);
        adminService.setStorageLimit(id, req.storageLimitBytes());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id,
                                            @AuthenticationPrincipal User user) {
        requireAdmin(user);
        adminService.deleteUser(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/toggle-admin")
    public ResponseEntity<Void> toggleAdmin(@PathVariable Long id,
                                             @AuthenticationPrincipal User user) {
        requireAdmin(user);
        adminService.toggleAdmin(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/force-password-reset")
    public ResponseEntity<Map<String, String>> forcePasswordReset(@PathVariable Long id,
                                                                    @AuthenticationPrincipal User user) {
        requireAdmin(user);
        String tempPassword = adminService.forcePasswordReset(id);
        return ResponseEntity.ok(Map.of("temporaryPassword", tempPassword));
    }

    @GetMapping("/system-info")
    public ResponseEntity<Map<String, Object>> systemInfo(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        return ResponseEntity.ok(adminService.getSystemInfo());
    }

    @GetMapping("/settings")
    public ResponseEntity<AppSettingsResponse> getSettings(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        return ResponseEntity.ok(adminService.getSettings());
    }

    @PatchMapping("/settings")
    public ResponseEntity<AppSettingsResponse> updateSettings(@RequestBody UpdateAppSettingsRequest req,
                                                               @AuthenticationPrincipal User user) {
        requireAdmin(user);
        return ResponseEntity.ok(adminService.updateSettings(req));
    }
}
