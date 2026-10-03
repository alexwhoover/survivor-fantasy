package com.example.demo.dto;

import java.util.List;

/** The player the roster belongs to comes from the path, not the body. */
public record SetRosterRequest(Long mvpContestantId, List<Long> contestantIds) {}
