package com.crystalpdf.backend.dto;

import java.util.List;
import java.util.Map;

public record FlattenAnnotationsRequest(
        Map<Integer, FlattenAnnotationsRequest.PageData> pages,
        double scale,
        String sourcePassword
) {
    public record PageData(
            List<StrokeData> strokes,
            List<TextData> texts
    ) {}

    public record StrokeData(
            String type,
            String color,
            double width,
            double opacity,
            List<List<Double>> points
    ) {}

    public record TextData(
            String id,
            double x,
            double y,
            double width,
            double fontSize,
            String color,
            String text
    ) {}
}
