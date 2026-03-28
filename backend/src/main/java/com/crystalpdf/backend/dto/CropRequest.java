package com.crystalpdf.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CropRequest(
        String sourcePassword,
        // Legacy: uniform margins applied to all pages (or pages list)
        @Min(value = 0, message = "Top margin must be non-negative")
        Float marginTop,

        @Min(value = 0, message = "Right margin must be non-negative")
        Float marginRight,

        @Min(value = 0, message = "Bottom margin must be non-negative")
        Float marginBottom,

        @Min(value = 0, message = "Left margin must be non-negative")
        Float marginLeft,

        List<Integer> pages,

        // Per-page: each entry specifies margins for a specific page
        @Valid
        List<PageCropEntry> pageCrops
) {
    public record PageCropEntry(
            @NotNull(message = "Page number is required")
            int page,

            @Min(value = 0, message = "Top margin must be non-negative")
            float marginTop,

            @Min(value = 0, message = "Right margin must be non-negative")
            float marginRight,

            @Min(value = 0, message = "Bottom margin must be non-negative")
            float marginBottom,

            @Min(value = 0, message = "Left margin must be non-negative")
            float marginLeft
    ) {}
}
