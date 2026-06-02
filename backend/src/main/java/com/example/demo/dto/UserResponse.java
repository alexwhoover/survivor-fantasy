package com.example.demo.dto;

import java.time.LocalDateTime;

// Used so that password hash is not included in response
public record UserResponse(Long id, String username, LocalDateTime createdAt) {
}
