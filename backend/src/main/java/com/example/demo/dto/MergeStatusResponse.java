package com.example.demo.dto;

import java.util.List;

public record MergeStatusResponse(
        boolean initiated,
        Integer mergeEpisode,
        boolean mergePicksOpen,
        List<MergeMemberStatus> memberStatuses
) {}
