package com.example.demo.dto;

public record MergeActionResponse(
        String actionType,
        Long addedSeasonContestantId,
        Long removedSeasonContestantId
) {}
