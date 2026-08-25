package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.cache.annotation.Cacheable;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {

    /**
     * AppSettings is a single-row table queried on every upload.
     * Caching eliminates the repeated DB hit.
     */
    @Override
    @Cacheable("appSettings")
    AppSettings findById(Long id);
}
