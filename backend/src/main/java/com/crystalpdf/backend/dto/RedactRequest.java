package com.crystalpdf.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RedactRequest(
        String sourcePassword,

        @NotEmpty(message = "At least one redaction area is required")
        @Valid
        List<RedactAreaDto> areas
) {
    public record RedactAreaDto(
            @NotNull(message = "Page number is required")
            int page,

            @Min(value = 0, message = "X must be non-negative")
            float x,

            @Min(value = 0, message = "Y must be non-negative")
            float y,

            @Min(value = 0, message = "Width must be positive")
            float width,

            @Min(value = 0, message = "Height must be positive")
            float height
    ) {}
}
