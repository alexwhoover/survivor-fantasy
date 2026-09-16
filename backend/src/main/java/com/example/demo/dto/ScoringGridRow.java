package com.example.demo.dto;

import java.util.List;

/**
 * One castaway's line in the scoring grid. {@code points} has exactly
 * {@link ScoringGridResponse#episodeCount()} entries, in episode order starting at
 * episode 1; an entry is null where no score was entered for that episode, which the
 * grid renders differently from a scored zero.
 */
public record ScoringGridRow(
        Long contestantId,
        String firstName,
        String lastName,
        String tribe,
        String tribeColour,
        Integer eliminatedEpisode,
        boolean winner,
        List<Integer> points,
        int total
) {}
