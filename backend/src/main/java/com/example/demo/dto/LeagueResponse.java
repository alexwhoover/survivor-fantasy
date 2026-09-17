package com.example.demo.dto;

import java.time.LocalDateTime;

/** {@code mergeEpisode} is the number of the episode flagged as the merge, or null before one is flagged. */
public record LeagueResponse(
        Long id,
        String name,
        String code,
        String seasonName,
        Long createdBy,
        LocalDateTime createdAt,
        int contestantsPerTribe,
        boolean initialPicksOpen,
        boolean mergePicksOpen,
        Integer mergeEpisode,
        boolean archived
) {}
