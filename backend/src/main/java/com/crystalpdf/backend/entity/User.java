package com.crystalpdf.backend.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "username", unique = true, columnDefinition = "varchar(255)")
    private String username;

    @Column(name = "is_admin", nullable = false, columnDefinition = "boolean not null default false")
    private boolean admin = false;

    @Column(name = "password_change_required", nullable = false, columnDefinition = "boolean not null default false")
    private boolean passwordChangeRequired = false;

    @Column(name = "storage_limit_bytes")
    private Long storageLimitBytes; // null = use default from AppSettings

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                          { return id; }
    public String getEmail()                     { return email; }
    public String getDisplayUsername()           { return username; }
    public void setDisplayUsername(String u)     { this.username = u; }
    public void setEmail(String email)           { this.email = email; }
    public void setPassword(String password)   { this.password = password; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
    public boolean isAdmin()                   { return admin; }
    public void setAdmin(boolean admin)        { this.admin = admin; }
    public boolean isPasswordChangeRequired()  { return passwordChangeRequired; }
    public void setPasswordChangeRequired(boolean passwordChangeRequired) { this.passwordChangeRequired = passwordChangeRequired; }
    public Long getStorageLimitBytes()         { return storageLimitBytes; }
    public void setStorageLimitBytes(Long storageLimitBytes) { this.storageLimitBytes = storageLimitBytes; }

    // ── UserDetails ───────────────────────────────────────────────────────────

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public String getPassword()                  { return password; }
    @Override public String getUsername()                  { return email; }
    @Override public boolean isAccountNonExpired()         { return true; }
    @Override public boolean isAccountNonLocked()          { return true; }
    @Override public boolean isCredentialsNonExpired()     { return true; }
    @Override public boolean isEnabled()                   { return true; }
}
