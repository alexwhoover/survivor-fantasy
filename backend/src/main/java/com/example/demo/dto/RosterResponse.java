package com.example.demo.dto;

import java.util.List;

/** {@code mergeAction} is null until this member has made (or been assigned) their merge move. */
public record RosterResponse(
        Long userId,
        Long mvpContestantId,
        List<Long> contestantIds,
        MergeActionResponse mergeAction
) {}
