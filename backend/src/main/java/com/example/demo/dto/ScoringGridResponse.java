package com.example.demo.dto;

import java.util.List;

/**
 * The whole season's scoring as a contestant-by-episode grid, pre-sorted and pre-totalled
 * so the client renders it directly.
 *
 * <p>{@code maxPoints} is the highest single-episode score anywhere in the league — the top
 * of the grid's colour scale. It is sent rather than hard-coded because scoring magnitudes
 * differ between leagues, and it lets the legend state the scale it is actually using.
 */
public record ScoringGridResponse(
        int episodeCount,
        Integer mergeEpisode,
        int maxPoints,
        List<ScoringGridRow> rows
) {}
