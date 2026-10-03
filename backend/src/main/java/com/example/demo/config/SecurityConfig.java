package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * The site is read-only for visitors and writable only by the single site admin.
 *
 * <p>There is exactly one credential, supplied by APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD
 * and held in memory — it is deliberately not a row in {@code users}, because those rows
 * are players now and players never sign in. "Authenticated" therefore means "is the
 * admin", which is why services no longer check a per-league role.
 */
@Configuration
@EnableWebSecurity
@EnableJdbcHttpSession
public class SecurityConfig {

    private final String adminUsername;
    private final String adminPassword;

    public SecurityConfig(@Value("${app.admin.username}") String adminUsername,
                          @Value("${app.admin.password}") String adminPassword) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                    // Allow the servlet ERROR dispatch so exceptions render proper
                    // status codes and JSON bodies instead of an empty 403
                    .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR)
                    .permitAll()
                    // Everything a visitor sees — leagues, cast, rosters, episodes,
                    // scores, standings — is a GET, and all of it is public.
                    .requestMatchers(HttpMethod.GET, "/api/leagues/**").permitAll()
                    .requestMatchers("/api/admin/login").permitAll()
                    // Every write, plus the admin's own session check, needs the session.
                    .anyRequest().authenticated()
            )
            // A missing or expired session is the only "not allowed" state left, so it
            // reports 401 across the board. The frontend reads that as "not signed in as
            // admin" and simply renders the read-only view.
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                    (request, response, authException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
            ))
            .logout(logout -> logout
                    .logoutUrl("/api/admin/logout")
                    .deleteCookies("SESSION")
                    .logoutSuccessHandler((request, response, authentication) ->
                            response.setStatus(200))
            );
        return http.build();
    }

    /**
     * The one admin account. Fails at startup if either half is blank, rather than
     * quietly standing up a site with a guessable or empty password.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException("APP_ADMIN_USERNAME and APP_ADMIN_PASSWORD must both be set");
        }
        return new InMemoryUserDetailsManager(
                User.withUsername(adminUsername)
                        .password(passwordEncoder().encode(adminPassword))
                        .roles("ADMIN")
                        .build());
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
