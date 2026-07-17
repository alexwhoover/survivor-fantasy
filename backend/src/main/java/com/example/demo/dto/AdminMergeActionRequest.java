package com.example.demo.dto;

public record AdminMergeActionRequest(
        Long adminUserId,
        Long addedContestantId,
        Long removedContestantId,
        boolean noChange
) {}
