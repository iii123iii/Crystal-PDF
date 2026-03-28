package com.crystalpdf.backend.dto;

public record PageNumberRequest(
        String sourcePassword,
        String position,
        Integer startNumber,
        Float fontSize,
        String format
) {}
