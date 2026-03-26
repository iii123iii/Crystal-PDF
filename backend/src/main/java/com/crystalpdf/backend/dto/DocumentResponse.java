package com.crystalpdf.backend.dto;

import com.crystalpdf.backend.entity.Document;

import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        String originalName,
        String mimeType,
        Long sizeBytes,
        LocalDateTime createdAt
) {
    public static DocumentResponse from(Document doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getOriginalName(),
                doc.getMimeType(),
                doc.getSizeBytes(),
                doc.getCreatedAt()
        );
    }
}
