package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SplitRequest(
        @NotEmpty(message = "Pages list is required")
        List<Integer> pages,

        String sourcePassword
) {}
