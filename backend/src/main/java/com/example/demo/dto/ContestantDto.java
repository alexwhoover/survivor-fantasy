package com.example.demo.dto;

import com.example.demo.entity.Contestant;
import com.example.demo.entity.Tribe;

public record ContestantDto(
        Long id,
        String firstName,
        String lastName,
        String hometown,
        String state,
        Long tribeId,
        String tribe,
        String tribeColour,
        Integer eliminatedEpisode,
        boolean winner,
        String imageUrl,
        int totalPoints
) {
    public static ContestantDto from(Contestant c) {
        return from(c, 0);
    }

    public static ContestantDto from(Contestant c, int totalPoints) {
        Tribe tribe = c.getTribe();
        return new ContestantDto(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                c.getHometown(),
                c.getState(),
                tribe != null ? tribe.getId() : null,
                tribe != null ? tribe.getName() : null,
                tribe != null ? tribe.getColour() : null,
                c.getEliminatedEpisode(),
                c.isWinner(),
                c.getImageUrl(),
                totalPoints
        );
    }
}
