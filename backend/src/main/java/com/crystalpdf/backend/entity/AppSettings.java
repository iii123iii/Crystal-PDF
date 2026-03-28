package com.crystalpdf.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "app_settings")
public class AppSettings {

    @Id
    private Long id = 1L;

    @Column(nullable = false, columnDefinition = "boolean not null default true")
    private boolean allowRegistration = true;

    @Column(nullable = false, columnDefinition = "bigint not null default 200")
    private long maxUploadSizeMb = 200;

    @Column(name = "default_storage_limit_mb", nullable = false, columnDefinition = "bigint not null default 10240")
    private long defaultStorageLimitMb = 10240; // 10 GB in MB

    @Column(nullable = false, columnDefinition = "boolean not null default false")
    private boolean maintenanceMode = false;

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                   { return id; }
    public void setId(Long id)                            { this.id = id; }
    public boolean isAllowRegistration()                  { return allowRegistration; }
    public void setAllowRegistration(boolean allowRegistration) { this.allowRegistration = allowRegistration; }
    public long getMaxUploadSizeMb()                      { return maxUploadSizeMb; }
    public void setMaxUploadSizeMb(long maxUploadSizeMb)  { this.maxUploadSizeMb = maxUploadSizeMb; }
    public long getDefaultStorageLimitMb()                { return defaultStorageLimitMb; }
    public void setDefaultStorageLimitMb(long defaultStorageLimitMb) { this.defaultStorageLimitMb = defaultStorageLimitMb; }
    public boolean isMaintenanceMode()                    { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }
}
