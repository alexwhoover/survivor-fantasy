package com.example.demo.dto;

import java.util.Map;

/** {@code contestantPoints} is what each castaway on the roster contributed to {@code totalScore}, merge-boundary aware. */
public record LeaderboardEntry(Long userId, String username, int totalScore, Map<Long, Integer> contestantPoints) {}
