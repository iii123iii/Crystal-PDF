package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CompressRequest(
        @NotBlank(message = "Compression level is required")
        @Pattern(regexp = "low|medium|high", message = "Level must be 'low', 'medium', or 'high'")
        String level,

        String sourcePassword
) {}
