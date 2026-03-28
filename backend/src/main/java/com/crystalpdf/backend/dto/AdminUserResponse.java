package com.crystalpdf.backend.dto;

public record AdminUserResponse(
        Long id,
        String email,
        String username,
        boolean admin,
        boolean passwordChangeRequired,
        long storageLimitBytes,
        long storageUsedBytes,
        int fileCount,
        String createdAt
) {}
