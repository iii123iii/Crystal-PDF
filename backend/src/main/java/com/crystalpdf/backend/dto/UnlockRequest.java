package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record UnlockRequest(
        @NotBlank(message = "Password is required")
        String password
) {}
