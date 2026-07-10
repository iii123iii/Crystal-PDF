package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerIdOrderByCreatedAtDesc(Long userId);
    Optional<Document> findByIdAndOwnerId(Long id, Long userId);

    @Query("""
            select d.owner.id as ownerId,
                   count(d) as fileCount,
                   coalesce(sum(d.sizeBytes), 0) as totalSizeBytes
            from Document d
            where d.owner.id in :ownerIds
            group by d.owner.id
            """)
    List<OwnerStorageStats> findStorageStatsByOwnerIds(@Param("ownerIds") Collection<Long> ownerIds);

    interface OwnerStorageStats {
        Long getOwnerId();
        Long getFileCount();
        Long getTotalSizeBytes();
    }
}
