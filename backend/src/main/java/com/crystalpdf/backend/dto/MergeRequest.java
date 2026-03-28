package com.crystalpdf.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record MergeRequest(
        @NotEmpty(message = "At least one document to merge is required")
        List<Long> otherDocumentIds,

        String sourcePassword
) {}
