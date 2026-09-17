package com.example.demo.dto;

import com.example.demo.entity.Contestant;
import com.example.demo.entity.Tribe;

public record ContestantDto(
        Long id,
        String firstName,
        String lastName,
        Long tribeId,
        String tribe,
        String tribeColour,
        Integer eliminatedEpisode,
        boolean winner,
        String imageUrl
) {
    public static ContestantDto from(Contestant c) {
        Tribe tribe = c.getTribe();
        return new ContestantDto(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                tribe != null ? tribe.getId() : null,
                tribe != null ? tribe.getName() : null,
                tribe != null ? tribe.getColour() : null,
                c.getEliminatedEpisode(),
                c.isWinner(),
                c.getImageUrl()
        );
    }
}
