package com.crystalpdf.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record FlattenAnnotationsRequest(
        @NotEmpty(message = "Pages map is required")
        @Valid
        Map<Integer, FlattenAnnotationsRequest.PageData> pages,

        @Min(value = 0, message = "Scale must be positive")
        double scale,

        String sourcePassword
) {
    public record PageData(
            List<StrokeData> strokes,
            List<TextData> texts
    ) {}

    public record StrokeData(
            @NotBlank(message = "Stroke type is required")
            String type,

            @NotBlank(message = "Stroke color is required")
            String color,

            @Min(value = 0, message = "Width must be non-negative")
            double width,

            @Min(value = 0, message = "Opacity must be non-negative")
            double opacity,

            @NotEmpty(message = "Stroke points are required")
            List<List<Double>> points
    ) {}

    public record TextData(
            @NotBlank(message = "Text ID is required")
            String id,

            @Min(value = 0, message = "X must be non-negative")
            double x,

            @Min(value = 0, message = "Y must be non-negative")
            double y,

            @Min(value = 0, message = "Width must be non-negative")
            double width,

            @Min(value = 0, message = "Font size must be positive")
            double fontSize,

            @NotBlank(message = "Text color is required")
            String color,

            @NotBlank(message = "Text content is required")
            String text
    ) {}
}
