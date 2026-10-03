package com.example.demo.dto;

/**
 * A player's post-merge move, set by the admin. An add leaves {@code removedContestantId}
 * null; {@code noChange} keeps a roster that was already full as-is.
 */
public record MergeActionRequest(Long addedContestantId, Long removedContestantId, boolean noChange) {}
