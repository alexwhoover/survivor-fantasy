package com.example.demo.dto;

public record LeaderboardEntry(Long userId, String username, int totalScore, boolean mvpBonusApplied) {}
