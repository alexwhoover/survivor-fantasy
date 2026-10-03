package com.example.demo.dto;

import java.time.LocalDateTime;

/** A player in a league. {@code userId} keys their roster, scores and leaderboard entry. */
public record LeagueMemberResponse(Long userId, String username, LocalDateTime joinedAt) {}
