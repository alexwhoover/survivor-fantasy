package com.example.demo.service;

import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.SeasonDao;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.entity.EpisodeScore;
import com.example.demo.entity.SeasonContestant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EpisodeScoreService {

    private final EpisodeScoreDao episodeScoreDao;
    private final SeasonDao seasonDao;

    @Autowired
    public EpisodeScoreService(EpisodeScoreDao episodeScoreDao, SeasonDao seasonDao) {
        this.episodeScoreDao = episodeScoreDao;
        this.seasonDao = seasonDao;
    }

    @Transactional(readOnly = true)
    public List<EpisodeScoreItem> getScoresForEpisode(Long seasonId, int episodeNumber) {
        List<SeasonContestant> contestants = seasonDao.findContestantsBySeasonId(seasonId);
        Map<Long, Integer> scoreMap = episodeScoreDao.findBySeasonIdAndEpisodeNumber(seasonId, episodeNumber)
                .stream()
                .collect(Collectors.toMap(EpisodeScore::getSeasonContestantId, EpisodeScore::getPoints));

        return contestants.stream()
                .map(sc -> new EpisodeScoreItem(sc.getId(), scoreMap.getOrDefault(sc.getId(), 0)))
                .toList();
    }

    @Transactional
    public List<EpisodeScoreItem> saveScoresForEpisode(Long seasonId, int episodeNumber, List<EpisodeScoreItem> scores) {
        for (EpisodeScoreItem item : scores) {
            episodeScoreDao.findBySeasonContestantIdAndEpisodeNumber(item.seasonContestantId(), episodeNumber)
                    .ifPresentOrElse(
                            existing -> existing.setPoints(item.points()),
                            () -> episodeScoreDao.save(new EpisodeScore(item.seasonContestantId(), episodeNumber, item.points()))
                    );
        }
        return getScoresForEpisode(seasonId, episodeNumber);
    }
}
