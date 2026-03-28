package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WatermarkRequest(
        String sourcePassword,

        @NotBlank(message = "Watermark text is required")
        String text,

        @NotNull(message = "Font size is required")
        @Min(value = 8, message = "Font size must be at least 8")
        Float fontSize,

        @NotNull(message = "Opacity is required")
        Float opacity,

        @NotNull(message = "Rotation is required")
        Float rotation,

        @NotBlank(message = "Position is required")
        String position
) {}
