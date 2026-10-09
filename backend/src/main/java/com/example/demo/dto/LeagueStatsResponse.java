package com.example.demo.dto;

import java.util.List;

/**
 * Headline stats for the latest scored episode, shown above the Leaderboard.
 * {@code episodeNumber} is the highest episode with any score entered (0 if none). Both stats
 * need a previous week to be meaningful, so before episode 2 {@code episodeMvp} is null and
 * {@code biggestMovers} is empty. Ties are kept: every tied player is listed.
 */
public record LeagueStatsResponse(int episodeNumber, EpisodeMvp episodeMvp, List<RankMove> biggestMovers) {

    /** The player(s) who scored the most in the episode, MVP bonus excluded. */
    public record EpisodeMvp(List<String> usernames, int points) {}

    /** A player's rank before and after the episode, using shared ranks for ties (1, 1, 3). */
    public record RankMove(String username, int fromRank, int toRank) {}
}
