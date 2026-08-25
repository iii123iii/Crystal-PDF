package com.crystalpdf.backend.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * Cache configuration for frequently accessed data.
 * AppSettings is loaded on every upload check - caching eliminates repeated DB hits.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public ConcurrentMapCacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
            Arrays.asList("appSettings", "documents", "users")
        );
    }
}
