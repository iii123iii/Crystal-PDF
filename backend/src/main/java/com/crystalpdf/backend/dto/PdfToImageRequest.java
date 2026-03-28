package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PdfToImageRequest(
        @NotBlank(message = "Image format is required")
        @Pattern(regexp = "png|jpg|jpeg", message = "Format must be 'png', 'jpg', or 'jpeg'")
        String format,

        @NotNull(message = "DPI is required")
        @Min(value = 72, message = "DPI must be at least 72")
        Integer dpi,

        String sourcePassword
) {}
