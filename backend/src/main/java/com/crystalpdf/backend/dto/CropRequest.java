package com.crystalpdf.backend.dto;

import java.util.List;

public record CropRequest(
        String sourcePassword,
        // Legacy: uniform margins applied to all pages (or pages list)
        Float marginTop,
        Float marginRight,
        Float marginBottom,
        Float marginLeft,
        List<Integer> pages,
        // Per-page: each entry specifies margins for a specific page
        List<PageCropEntry> pageCrops
) {
    public record PageCropEntry(int page, float marginTop, float marginRight, float marginBottom, float marginLeft) {}
}
