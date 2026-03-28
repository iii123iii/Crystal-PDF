package com.crystalpdf.backend.dto;

public record UpdateAppSettingsRequest(
        Boolean allowRegistration,
        Long maxUploadSizeMb,
        Long defaultStorageLimitMb,
        Boolean maintenanceMode
) {}
