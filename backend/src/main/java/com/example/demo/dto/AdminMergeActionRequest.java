package com.example.demo.dto;

public record AdminMergeActionRequest(
        Long adminUserId,
        Long addedSeasonContestantId,
        Long removedSeasonContestantId
) {}
