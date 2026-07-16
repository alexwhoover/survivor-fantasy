package com.example.demo.dto;

public record MergeActionRequest(Long userId, Long addedContestantId, Long removedContestantId) {}
