package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record OcrRequest(
        @NotBlank(message = "Language is required")
        String language,

        String sourcePassword
) {}
