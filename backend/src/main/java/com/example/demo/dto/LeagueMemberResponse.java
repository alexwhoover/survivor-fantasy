package com.example.demo.dto;

import com.example.demo.entity.LeagueMember.Role;
import java.time.LocalDateTime;

public record LeagueMemberResponse(Long userId, String username, String role, LocalDateTime joinedAt) {
    public LeagueMemberResponse(Long userId, String username, Role role, LocalDateTime joinedAt) {
        this(userId, username, role.name(), joinedAt);
    }
}
