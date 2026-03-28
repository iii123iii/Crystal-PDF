package com.crystalpdf.backend.dto;

public record WatermarkRequest(
        String sourcePassword,
        String text,
        Float fontSize,
        Float opacity,
        Float rotation,
        String position
) {}
