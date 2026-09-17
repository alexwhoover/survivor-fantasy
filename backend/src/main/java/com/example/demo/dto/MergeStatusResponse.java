package com.example.demo.dto;

public record MergeStatusResponse(
        boolean initiated,
        Integer mergeEpisode,
        boolean mergePicksOpen
) {}
