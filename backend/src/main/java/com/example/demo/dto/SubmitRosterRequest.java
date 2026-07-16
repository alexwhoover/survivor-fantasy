package com.example.demo.dto;

import java.util.List;

public record SubmitRosterRequest(
        Long userId,
        Long mvpContestantId,
        List<Long> contestantIds
) {}
