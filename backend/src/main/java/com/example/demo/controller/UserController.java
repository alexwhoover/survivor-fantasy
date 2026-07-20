package com.example.demo.controller;

import com.example.demo.dto.UserRequest;
import com.example.demo.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;

    @Autowired
    public UserController(UserService userService, AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@RequestBody UserRequest request, HttpServletRequest httpRequest) {
        userService.register(request.username(), request.password(), request.inviteCode());
        return authenticateAndCreateSession(request.username(), request.password(), httpRequest);
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody UserRequest request, HttpServletRequest httpRequest) {
        return authenticateAndCreateSession(request.username(), request.password(), httpRequest);
    }

    /**
     * Validates the caller's session against the server and returns the current user.
     * Unauthenticated/expired/invalid sessions never reach this method — Spring
     * Security's entry point rejects them with 401 first.
     */
    @GetMapping("/me")
    public UserResponse getCurrentUser(Authentication authentication) {
        return userService.findByUsername(authentication.getName());
    }

    private UserResponse authenticateAndCreateSession(String username, String password, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        return userService.findByUsername(authentication.getName());
    }
}
