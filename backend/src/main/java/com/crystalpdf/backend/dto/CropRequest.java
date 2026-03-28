package com.crystalpdf.backend.dto;

import java.util.List;

public record CropRequest(
        String sourcePassword,
        Float marginTop,
        Float marginRight,
        Float marginBottom,
        Float marginLeft,
        List<Integer> pages
) {}
