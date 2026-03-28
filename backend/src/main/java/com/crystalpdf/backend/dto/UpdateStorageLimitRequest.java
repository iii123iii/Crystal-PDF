package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateStorageLimitRequest(
        @NotNull(message = "Storage limit is required")
        @Min(value = 1048576, message = "Storage limit must be at least 1 MB")
        Long storageLimitBytes
) {}
