package com.example.demo.dto;

public record MergeActionResponse(
        String actionType,
        Long addedContestantId,
        Long removedContestantId
) {}
