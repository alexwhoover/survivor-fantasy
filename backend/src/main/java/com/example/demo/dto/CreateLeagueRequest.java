package com.example.demo.dto;

import java.util.List;

public record CreateLeagueRequest(
        String name,
        String seasonName,
        Integer contestantsPerTribe,
        List<TribeSetupItem> tribes,
        List<ContestantSetupItem> contestants
) {}
