package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReorderRequest(
        @NotEmpty(message = "Page order is required")
        List<Integer> pageOrder,

        String sourcePassword
) {}
