package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProtectRequest(
        @NotBlank(message = "User password is required")
        @Size(min = 8, message = "User password must be at least 8 characters")
        String userPassword,

        @NotBlank(message = "Owner password is required")
        @Size(min = 8, message = "Owner password must be at least 8 characters")
        String ownerPassword,

        String sourcePassword
) {}
