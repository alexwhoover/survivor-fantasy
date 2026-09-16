package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.dto.ScoringGridResponse;
import com.example.demo.dto.ScoringGridRow;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.Episode;
import com.example.demo.entity.EpisodeScore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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


    /**
     * Orders the grid the way the season reads: everyone still in the game first, then the
     * eliminated below them in finish order (latest boot highest), alphabetical within a tie.
     */
    private static final Comparator<Contestant> GRID_ORDER =
            Comparator.comparing((Contestant c) -> c.getEliminatedEpisode() != null)
                    .thenComparing(c -> c.getEliminatedEpisode() == null ? 0 : -c.getEliminatedEpisode())
                    .thenComparing(Contestant::getFirstName)
                    .thenComparing(Contestant::getLastName);

    /**
     * The full contestant-by-episode scoring grid for a league, sorted and totalled server-side.
     *
     * <p>A contestant's entry for an episode after their elimination is null, the same as an
     * episode nobody has scored yet — the client tells the two apart from
     * {@code eliminatedEpisode}, so the grid can show "out of the game" rather than "not scored".
     */
    @Transactional(readOnly = true)
    public ScoringGridResponse getScoringGrid(Long leagueId) {
        leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        Map<Long, Map<Integer, Integer>> scoresByContestant = new HashMap<>();
        int maxScoredEpisode = 0;
        int maxPoints = 0;
        for (EpisodeScore es : episodeScoreDao.findAllByLeagueId(leagueId)) {
            scoresByContestant
                    .computeIfAbsent(es.getContestantId(), k -> new HashMap<>())
                    .put(es.getEpisodeNumber(), es.getPoints());
            maxScoredEpisode = Math.max(maxScoredEpisode, es.getEpisodeNumber());
            maxPoints = Math.max(maxPoints, es.getPoints());
        }

        // Mirrors LeaderboardService#getLeaderboardHistory: EpisodeScore.episodeNumber isn't a
        // foreign key to Episode, so a score entered beyond the created Episode rows would
        // otherwise be dropped from the grid while still counting on the leaderboard.
        Integer maxCreatedEpisode = episodeDao.findMaxEpisodeNumber(leagueId);
        int episodeCount = Math.max(maxCreatedEpisode == null ? 0 : maxCreatedEpisode, maxScoredEpisode);

        Integer mergeEpisode = episodeDao.findMergeEpisode(leagueId)
                .map(Episode::getEpisodeNumber)
                .orElse(null);

        List<ScoringGridRow> rows = new ArrayList<>();
        for (Contestant c : contestantDao.findByLeagueId(leagueId).stream().sorted(GRID_ORDER).toList()) {
            Map<Integer, Integer> episodeScores = scoresByContestant.getOrDefault(c.getId(), Map.of());

            List<Integer> points = new ArrayList<>(episodeCount);
            int total = 0;
            for (int ep = 1; ep <= episodeCount; ep++) {
                Integer pts = episodeScores.get(ep);
                points.add(pts);
                if (pts != null) {
                    total += pts;
                }
            }

            rows.add(new ScoringGridRow(
                    c.getId(),
                    c.getFirstName(),
                    c.getLastName(),
                    c.getTribe() != null ? c.getTribe().getName() : null,
                    c.getTribe() != null ? c.getTribe().getColour() : null,
                    c.getEliminatedEpisode(),
                    c.isWinner(),
                    points,
                    total));
        }

        return new ScoringGridResponse(episodeCount, mergeEpisode, maxPoints, rows);
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
