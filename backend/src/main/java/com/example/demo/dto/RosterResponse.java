package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RosterResponse(
        Long id,
        Long leagueId,
        Long userId,
        Long mvpContestantId,
        List<Long> contestantIds,
        LocalDateTime submittedAt
) {}
