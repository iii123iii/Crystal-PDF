package com.crystalpdf.backend.dto;

public record AuthResponse(String email, boolean admin, boolean passwordChangeRequired) {}
