package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;

public record UpdateAppSettingsRequest(
        Boolean allowRegistration,

        @Min(value = 1, message = "Max upload size must be at least 1 MB")
        Long maxUploadSizeMb,

        @Min(value = 1, message = "Default storage limit must be at least 1 MB")
        Long defaultStorageLimitMb,

        Boolean maintenanceMode
) {}
