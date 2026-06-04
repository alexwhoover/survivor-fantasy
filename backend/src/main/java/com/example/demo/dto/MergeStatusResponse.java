package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MergeStatusResponse(
        boolean initiated,
        Integer mergeEpisode,
        LocalDateTime mergeDeadline,
        boolean deadlinePassed,
        List<MergeMemberStatus> memberStatuses
) {}
