package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PageNumberRequest(
        String sourcePassword,

        @NotBlank(message = "Position is required")
        String position,

        @NotNull(message = "Start number is required")
        @Min(value = 1, message = "Start number must be at least 1")
        Integer startNumber,

        @NotNull(message = "Font size is required")
        @Min(value = 6, message = "Font size must be at least 6")
        Float fontSize,

        @NotBlank(message = "Format is required")
        String format
) {}
