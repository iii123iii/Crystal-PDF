package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerIdOrderByCreatedAtDesc(Long userId);
    Optional<Document> findByIdAndOwnerId(Long id, Long userId);

    @Query("select coalesce(sum(d.sizeBytes), 0) from Document d where d.owner.id = :ownerId")
    long sumSizeBytesByOwnerId(@Param("ownerId") Long ownerId);
}
