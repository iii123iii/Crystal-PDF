package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email or username is required")
        String identifier,

        @NotBlank(message = "Password is required")
        String password
) {}
