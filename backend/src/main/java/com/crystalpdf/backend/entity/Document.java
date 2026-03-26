package com.crystalpdf.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    /** Original filename as supplied by the user (e.g. "report.pdf") */
    @Column(name = "original_name", nullable = false)
    private String originalName;

    /** UUID-based name used on disk (e.g. "550e8400-e29b-41d4-a716.pdf") */
    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                          { return id; }
    public User getOwner()                       { return owner; }
    public void setOwner(User owner)             { this.owner = owner; }
    public String getOriginalName()              { return originalName; }
    public void setOriginalName(String name)     { this.originalName = name; }
    public String getStoredName()                { return storedName; }
    public void setStoredName(String name)       { this.storedName = name; }
    public String getMimeType()                  { return mimeType; }
    public void setMimeType(String mimeType)     { this.mimeType = mimeType; }
    public Long getSizeBytes()                   { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes)     { this.sizeBytes = sizeBytes; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
}
