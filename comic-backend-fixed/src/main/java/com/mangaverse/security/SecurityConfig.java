package com.mangaverse.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final UserDetailsService userDetailsService;
    private final JwtFilter          jwtFilter;
    private final RateLimitFilter    rateLimitFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtFilter jwtFilter, RateLimitFilter rateLimitFilter,
                          OAuth2SuccessHandler oAuth2SuccessHandler) {
        this.userDetailsService = userDetailsService;
        this.jwtFilter          = jwtFilter;
        this.rateLimitFilter    = rateLimitFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(passwordEncoder());
        return p;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(frontendUrl));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ─── Auth ────────────────────────────────────────────────
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
                .requestMatchers("/api/auth/me").authenticated()

                // ─── Public read-only ────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/comics/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/chapters/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/discovery/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/recommendations").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/calendar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/announcements/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/community/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/banners").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/badges").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/progress/streak").permitAll()
                .requestMatchers("/sitemap.xml", "/robots.txt").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()

                // ─── Comments ────────────────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/api/comics/*/comments").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/comics/*/comments/*").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/comments/*/report").authenticated()
                .requestMatchers("/api/comments/reports/**").hasRole("ADMIN")

                // ─── Calendar schedule (admin PUT) ───────────────────────
                // Must be declared before the public GET /api/calendar rule
                // above, and before the catch-all anyRequest() below.
                // The @PreAuthorize on CalendarController.scheduleChapter()
                // is a second layer of defence.
                .requestMatchers(HttpMethod.PUT, "/api/calendar/admin/**").hasRole("ADMIN")

                // ─── Admin ───────────────────────────────────────────────
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/banners/admin/**").hasRole("ADMIN")

                // ─── Everything else requires login ──────────────────────
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
            )
            .authenticationProvider(authProvider())
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter,       UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
