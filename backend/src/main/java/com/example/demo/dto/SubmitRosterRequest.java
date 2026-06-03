package com.example.demo.dto;

import java.util.List;

public record SubmitRosterRequest(
        Long userId,
        Long mvpSeasonContestantId,
        List<Long> seasonContestantIds
) {}
