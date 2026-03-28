package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ExtractImagesRequest(
        String sourcePassword,

        @NotBlank(message = "Image format is required")
        @Pattern(regexp = "png|jpg|jpeg", message = "Format must be 'png', 'jpg', or 'jpeg'")
        String format
) {}
