package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public record RotateRequest(
        @NotEmpty(message = "Pages list is required")
        List<Integer> pages,

        @NotNull(message = "Rotation is required")
        @Pattern(regexp = "90|180|270", message = "Rotation must be 90, 180, or 270 degrees")
        Integer rotation,

        String sourcePassword
) {}
