package com.example.demo.dto;

import java.time.LocalDateTime;

public record LeagueResponse(
        Long id,
        String name,
        String code,
        String seasonName,
        Long createdBy,
        LocalDateTime createdAt,
        int contestantsPerTribe,
        boolean pickingOpen,
        Integer mergeEpisode,
        LocalDateTime mergeDeadline
) {}
