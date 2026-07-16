package com.example.demo.dto;

public record ContestantSetupItem(
        String firstName,
        String lastName,
        String hometown,
        String state,
        String imageUrl,
        Integer tribeIndex
) {}
