package com.example.demo.controller;

import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.dto.SeasonContestantDto;
import com.example.demo.entity.Season;
import com.example.demo.service.EpisodeScoreService;
import com.example.demo.service.SeasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
public class SeasonController {

    private final SeasonService seasonService;
    private final EpisodeScoreService episodeScoreService;

    @Autowired
    public SeasonController(SeasonService seasonService, EpisodeScoreService episodeScoreService) {
        this.seasonService = seasonService;
        this.episodeScoreService = episodeScoreService;
    }

    @GetMapping
    public List<Season> getAllSeasons() {
        return seasonService.getAllSeasons();
    }

    @GetMapping("/{id}")
    public Season getSeasonById(@PathVariable Long id) {
        return seasonService.getSeasonById(id);
    }

    @GetMapping("/{id}/contestants")
    public List<SeasonContestantDto> getContestants(@PathVariable Long id) {
        return seasonService.getContestantsBySeason(id);
    }

    @GetMapping("/{id}/episodes/{episodeNumber}/scores")
    public List<EpisodeScoreItem> getEpisodeScores(@PathVariable Long id, @PathVariable int episodeNumber) {
        return episodeScoreService.getScoresForEpisode(id, episodeNumber);
    }

    @PostMapping("/{id}/episodes/{episodeNumber}/scores")
    public List<EpisodeScoreItem> saveEpisodeScores(
            @PathVariable Long id,
            @PathVariable int episodeNumber,
            @RequestBody List<EpisodeScoreItem> scores) {
        return episodeScoreService.saveScoresForEpisode(id, episodeNumber, scores);
    }
}
