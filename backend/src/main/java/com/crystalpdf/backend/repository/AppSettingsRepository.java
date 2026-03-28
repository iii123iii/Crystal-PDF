package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {}
