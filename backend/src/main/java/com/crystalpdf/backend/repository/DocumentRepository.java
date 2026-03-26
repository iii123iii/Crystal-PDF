package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerIdOrderByCreatedAtDesc(Long userId);
    Optional<Document> findByIdAndOwnerId(Long id, Long userId);
}
