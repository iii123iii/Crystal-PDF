package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HeaderFooterRequest(
        String sourcePassword,
        String headerLeft,
        String headerCenter,
        String headerRight,
        String footerLeft,
        String footerCenter,
        String footerRight,

        @NotNull(message = "Font size is required")
        @Min(value = 6, message = "Font size must be at least 6")
        Float fontSize
) {}
