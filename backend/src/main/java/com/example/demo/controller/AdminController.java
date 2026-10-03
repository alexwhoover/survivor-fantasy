package com.example.demo.controller;

import com.example.demo.dto.AdminLoginRequest;
import com.example.demo.dto.AdminSessionResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

/**
 * The site admin's session. This is the app's only authentication — players don't have
 * accounts, so there is nothing to register and nothing to reset. Logout is handled by
 * Spring Security at POST /api/admin/logout (see {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthenticationManager authenticationManager;

    @Autowired
    public AdminController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public AdminSessionResponse login(@RequestBody AdminLoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        return new AdminSessionResponse(authentication.getName());
    }

    /**
     * Confirms the caller's session is still valid. A visitor with no session never
     * reaches this method — Spring Security answers 401 first, which the frontend
     * treats as "just a visitor" rather than an error.
     */
    @GetMapping("/session")
    public AdminSessionResponse getSession(Authentication authentication) {
        return new AdminSessionResponse(authentication.getName());
    }
}
