package com.crystalpdf.backend.dto;

public record ExtractImagesRequest(
        String sourcePassword,
        String format
) {}
