package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.EpisodeScore;
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
    private final ContestantDao contestantDao;
    private final LeagueDao leagueDao;
    private final EpisodeDao episodeDao;

    @Autowired
    public EpisodeScoreService(EpisodeScoreDao episodeScoreDao, ContestantDao contestantDao,
                               LeagueDao leagueDao, EpisodeDao episodeDao) {
        this.episodeScoreDao = episodeScoreDao;
        this.contestantDao = contestantDao;
        this.leagueDao = leagueDao;
        this.episodeDao = episodeDao;
    }

    @Transactional(readOnly = true)
    public List<EpisodeScoreItem> getScoresForEpisode(Long leagueId, int episodeNumber) {
        leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
        if (!episodeDao.existsByLeagueIdAndEpisodeNumber(leagueId, episodeNumber)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found in this league");
        }
        List<Contestant> contestants = contestantDao.findByLeagueId(leagueId);
        Map<Long, Integer> scoreMap = episodeScoreDao.findByLeagueIdAndEpisodeNumber(leagueId, episodeNumber)
                .stream()
                .collect(Collectors.toMap(EpisodeScore::getContestantId, EpisodeScore::getPoints));

        return contestants.stream()
                .map(c -> new EpisodeScoreItem(c.getId(), scoreMap.getOrDefault(c.getId(), 0)))
                .toList();
    }

    @Transactional
    public List<EpisodeScoreItem> saveScoresForEpisode(Long leagueId, int episodeNumber, List<EpisodeScoreItem> scores) {
        leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
        if (!episodeDao.existsByLeagueIdAndEpisodeNumber(leagueId, episodeNumber)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found in this league");
        }
        for (EpisodeScoreItem item : scores) {
            Contestant contestant = contestantDao.findById(item.contestantId())
                    .filter(c -> c.getLeagueId().equals(leagueId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant does not belong to this league"));
            episodeScoreDao.findByContestantIdAndEpisodeNumber(contestant.getId(), episodeNumber)
                    .ifPresentOrElse(
                            existing -> existing.setPoints(item.points()),
                            () -> episodeScoreDao.save(new EpisodeScore(contestant.getId(), episodeNumber, item.points()))
                    );
        }
        return getScoresForEpisode(leagueId, episodeNumber);
    }
}
