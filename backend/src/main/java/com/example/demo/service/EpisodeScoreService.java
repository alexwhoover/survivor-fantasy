package com.example.demo.service;

import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.SeasonDao;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.entity.EpisodeScore;
import com.example.demo.entity.League;
import com.example.demo.entity.SeasonContestant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EpisodeScoreService {

    private final EpisodeScoreDao episodeScoreDao;
    private final SeasonDao seasonDao;
    private final LeagueDao leagueDao;

    @Autowired
    public EpisodeScoreService(EpisodeScoreDao episodeScoreDao, SeasonDao seasonDao, LeagueDao leagueDao) {
        this.episodeScoreDao = episodeScoreDao;
        this.seasonDao = seasonDao;
        this.leagueDao = leagueDao;
    }

    @Transactional(readOnly = true)
    public List<EpisodeScoreItem> getScoresForEpisode(Long leagueId, int episodeNumber) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
        List<SeasonContestant> contestants = seasonDao.findContestantsBySeasonId(league.getSeasonId());
        Map<Long, Integer> scoreMap = episodeScoreDao.findBySeasonIdAndEpisodeNumberAndLeagueId(league.getSeasonId(), episodeNumber, leagueId)
                .stream()
                .collect(Collectors.toMap(EpisodeScore::getSeasonContestantId, EpisodeScore::getPoints));

        return contestants.stream()
                .map(sc -> new EpisodeScoreItem(sc.getId(), scoreMap.getOrDefault(sc.getId(), 0)))
                .toList();
    }

    @Transactional
    public List<EpisodeScoreItem> saveScoresForEpisode(Long leagueId, int episodeNumber, List<EpisodeScoreItem> scores) {
        if (episodeNumber < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episode scores cannot be entered for episode 1");
        }
        for (EpisodeScoreItem item : scores) {
            episodeScoreDao.findBySeasonContestantIdAndEpisodeNumberAndLeagueId(item.seasonContestantId(), episodeNumber, leagueId)
                    .ifPresentOrElse(
                            existing -> existing.setPoints(item.points()),
                            () -> episodeScoreDao.save(new EpisodeScore(item.seasonContestantId(), leagueId, episodeNumber, item.points()))
                    );
        }
        return getScoresForEpisode(leagueId, episodeNumber);
    }
}
