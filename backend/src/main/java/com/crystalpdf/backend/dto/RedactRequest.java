package com.crystalpdf.backend.dto;

import java.util.List;

public record RedactRequest(
        String sourcePassword,
        List<RedactAreaDto> areas
) {
    public record RedactAreaDto(int page, float x, float y, float width, float height) {}
}
