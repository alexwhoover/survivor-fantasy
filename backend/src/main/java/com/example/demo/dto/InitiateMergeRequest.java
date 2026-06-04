package com.example.demo.dto;

import java.time.LocalDateTime;

public record InitiateMergeRequest(Long adminUserId, int mergeEpisode, LocalDateTime mergeDeadline) {}
