package com.example.demo.dto;

import java.time.LocalDateTime;

public record LeagueResponse(Long id, String name, String code, Long seasonId, Long createdBy, LocalDateTime createdAt, int contestantsPerTribe, LocalDateTime pickDeadline) {}
