package com.crystalpdf.backend.dto;

public record AppSettingsResponse(
        boolean allowRegistration,
        long maxUploadSizeMb,
        long defaultStorageLimitMb,
        boolean maintenanceMode
) {}
