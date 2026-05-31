package com.example.demo.service;

import com.example.demo.dao.SeasonDao;
import com.example.demo.dto.SeasonContestantDto;
import com.example.demo.entity.Season;
import com.example.demo.entity.SeasonContestant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SeasonService {

    private final SeasonDao seasonDao;

    public SeasonService(SeasonDao seasonDao) {
        this.seasonDao = seasonDao;
    }

    @Transactional(readOnly = true)
    public List<Season> getAllSeasons() {
        return seasonDao.findAll();
    }

    @Transactional(readOnly = true)
    public List<SeasonContestantDto> getContestantsBySeason(Long seasonId) {
        seasonDao.findById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));

        return seasonDao.findContestantsBySeasonId(seasonId).stream()
                .map(this::toDto)
                .toList();
    }

    private SeasonContestantDto toDto(SeasonContestant sc) {
        return new SeasonContestantDto(
                sc.getContestant().getId(),
                sc.getContestant().getFirstName(),
                sc.getContestant().getLastName(),
                sc.getContestant().getHometown(),
                sc.getContestant().getState(),
                sc.getFinishPlace(),
                sc.getEliminatedEpisode(),
                sc.isWinner(),
                sc.getContestant().getImageUrl()
        );
    }
}
