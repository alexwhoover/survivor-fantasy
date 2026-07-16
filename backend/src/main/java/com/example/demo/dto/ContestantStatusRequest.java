package com.example.demo.dto;

public record ContestantStatusRequest(Long adminUserId, Integer eliminatedEpisode, Boolean winner) {}
