package com.example.demo.dto;

import java.time.LocalDateTime;

public record CreateLeagueRequest(
        String name,
        Long seasonId,
        Long userId,
        LocalDateTime pickDeadline,
        Integer contestantsPerTribe
) {}
