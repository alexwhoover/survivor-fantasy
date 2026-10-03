package com.example.demo.dto;

import java.time.LocalDateTime;

/** {@code mergeEpisode} is the number of the episode flagged as the merge, or null before one is flagged. */
public record LeagueResponse(
        Long id,
        String name,
        String seasonName,
        LocalDateTime createdAt,
        int contestantsPerTribe,
        Integer mergeEpisode,
        boolean archived
) {}
