package com.mangaverse.config;

import org.springframework.context.annotation.Configuration;
// CORS is handled centrally in SecurityConfig.corsConfigurationSource().
// WebMvcConfigurer CORS mappings are bypassed when Spring Security is active,
// so this class is intentionally left without addCorsMappings() to avoid
// conflicts and duplicate configuration.
@Configuration
public class WebConfig {
}
