package com.crystalpdf.backend.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {}
