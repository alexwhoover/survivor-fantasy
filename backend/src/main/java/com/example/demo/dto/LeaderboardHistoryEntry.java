package com.example.demo.dto;

import java.util.List;

public record LeaderboardHistoryEntry(Long userId, String username, List<EpisodePoint> history) {}
