package com.example.demo.dto;

/**
 * Contestants can return on multiple seasons, so season number is not directly stored in Contestants table.
 * This DTO merges a row from contestants with its corresponding row in season_contestants, producing a
 * single response object that includes both the contestant's identity and their placement in a specific season.
 */
public record SeasonContestantDto(
        Long id,
        String firstName,
        String lastName,
        String hometown,
        String state,
        Integer finishPlace,
        Integer eliminatedEpisode,
        boolean winner,
        String imageUrl
) {}
