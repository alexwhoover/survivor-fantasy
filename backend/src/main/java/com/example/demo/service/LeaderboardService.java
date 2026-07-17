package com.example.demo.service;

import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dao.ContestantDao;
import com.example.demo.entity.Episode;
import com.example.demo.dto.EpisodePoint;
import com.example.demo.dto.LeaderboardEntry;
import com.example.demo.dto.LeaderboardHistoryEntry;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.entity.EpisodeScore;
import com.example.demo.entity.League;
import com.example.demo.entity.MergeAction;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import com.example.demo.entity.Contestant;
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
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private static final int MVP_BONUS = 30;

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final MergeActionDao mergeActionDao;
    private final EpisodeScoreDao episodeScoreDao;
    private final ContestantDao contestantDao;
    private final EpisodeDao episodeDao;

    @Autowired
    public LeaderboardService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao,
                              RosterDao rosterDao, RosterPickDao rosterPickDao,
                              MergeActionDao mergeActionDao, EpisodeScoreDao episodeScoreDao,
                              ContestantDao contestantDao, EpisodeDao episodeDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.mergeActionDao = mergeActionDao;
        this.episodeScoreDao = episodeScoreDao;
        this.contestantDao = contestantDao;
        this.episodeDao = episodeDao;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboard(Long leagueId) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        // All episode scores for this league's season, keyed by (contestantId, episodeNumber)
        List<EpisodeScore> allScores = episodeScoreDao.findAllByLeagueId(leagueId);
        Map<Long, Map<Integer, Integer>> scoresByContestantAndEpisode = new HashMap<>();
        for (EpisodeScore es : allScores) {
            scoresByContestantAndEpisode
                    .computeIfAbsent(es.getContestantId(), k -> new HashMap<>())
                    .put(es.getEpisodeNumber(), es.getPoints());
        }

        // Contestant metadata keyed by contestantId
        Map<Long, Contestant> contestantMap = contestantDao.findByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(Contestant::getId, sc -> sc));

        // Merge actions for this league, keyed by userId
        Map<Long, MergeAction> mergeActionByUser = mergeActionDao.findByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(MergeAction::getUserId, ma -> ma));

        // Members with usernames
        List<LeagueMemberResponse> members = leagueMemberDao.findMembersWithUsernames(leagueId);
        Map<Long, String> usernameByUserId = members.stream()
                .collect(Collectors.toMap(LeagueMemberResponse::userId, LeagueMemberResponse::username));

        // Rosters keyed by userId
        Map<Long, Roster> rosterByUser = rosterDao.findAllByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(Roster::getUserId, r -> r));

        Integer mergeEpisode = episodeDao.findMergeEpisode(leagueId).map(Episode::getEpisodeNumber).orElse(null);

        List<LeaderboardEntry> entries = new ArrayList<>();
        for (LeagueMemberResponse member : members) {
            Long userId = member.userId();
            String username = usernameByUserId.get(userId);

            Roster roster = rosterByUser.get(userId);
            if (roster == null) {
                entries.add(new LeaderboardEntry(userId, username, 0, false));
                continue;
            }

            List<RosterPick> picks = rosterPickDao.findByRosterId(roster.getId());
            MergeAction mergeAction = mergeActionByUser.get(userId);

            Map<Long, Integer> contestantPoints = calculateContestantPoints(
                    picks, mergeAction, mergeEpisode, scoresByContestantAndEpisode, contestantMap);
            int score = contestantPoints.values().stream().mapToInt(Integer::intValue).sum();

            boolean mvpBonusApplied = false;
            if (roster.getMvpContestantId() != null) {
                Contestant mvp = contestantMap.get(roster.getMvpContestantId());
                if (mvp != null && mvp.isWinner()) {
                    score += MVP_BONUS;
                    mvpBonusApplied = true;
                }
            }

            entries.add(new LeaderboardEntry(userId, username, score, mvpBonusApplied));
        }

        entries.sort(Comparator.comparingInt(LeaderboardEntry::totalScore).reversed());
        return entries;
    }

    /**
     * Points contributed by each contestant on the roster (including a merge-removed
     * contestant, whose points still count up to the merge episode). Keyed by contestantId.
     */
    private Map<Long, Integer> calculateContestantPoints(List<RosterPick> picks, MergeAction mergeAction, Integer mergeEpisode,
                               Map<Long, Map<Integer, Integer>> scoresByContestantAndEpisode,
                               Map<Long, Contestant> contestantMap) {
        Long mergeAddedId = mergeAction != null ? mergeAction.getAddedContestantId() : null;
        Long mergeRemovedId = mergeAction != null ? mergeAction.getRemovedContestantId() : null;

        // Include the removed contestant in scoring calculations — it was on the roster up to merge
        Set<Long> activePickIds = picks.stream().map(RosterPick::getContestantId).collect(Collectors.toSet());
        Set<Long> allScoringPickIds = new java.util.HashSet<>(activePickIds);
        if (mergeRemovedId != null) {
            allScoringPickIds.add(mergeRemovedId);
        }

        Map<Long, Integer> pointsByContestant = new HashMap<>();
        for (Long scId : allScoringPickIds) {
            Map<Integer, Integer> episodeScores = scoresByContestantAndEpisode.getOrDefault(scId, Map.of());
            Contestant sc = contestantMap.get(scId);
            if (sc == null) continue;

            int total = 0;
            for (Map.Entry<Integer, Integer> entry : episodeScores.entrySet()) {
                int ep = entry.getKey();
                int pts = entry.getValue();

                if (isPointCounted(scId, ep, sc, mergeAddedId, mergeRemovedId, mergeEpisode)) {
                    total += pts;
                }
            }
            pointsByContestant.put(scId, total);
        }
        return pointsByContestant;
    }

    /**
     * Whether a contestant's episode score counts toward their roster owner's total —
     * shared by the final-total path ({@link #calculateContestantPoints}) and the
     * cumulative-per-episode path ({@link #getLeaderboardHistory}) so the elimination
     * and merge-boundary rules never drift between the two.
     */
    private boolean isPointCounted(Long contestantId, int ep, Contestant sc,
                                    Long mergeAddedId, Long mergeRemovedId, Integer mergeEpisode) {
        // Skip episodes after the contestant was eliminated
        if (sc.getEliminatedEpisode() != null && ep > sc.getEliminatedEpisode()) return false;

        if (mergeEpisode != null && contestantId.equals(mergeAddedId)) {
            // Merge-added: only count episodes strictly after merge
            return ep > mergeEpisode;
        } else if (mergeEpisode != null && contestantId.equals(mergeRemovedId)) {
            // Merge-removed: only count episodes up to and including merge
            return ep <= mergeEpisode;
        }
        return true;
    }

    /** Per-contestant point contributions for a single user's roster, respecting the merge boundary. */
    @Transactional(readOnly = true)
    public Map<Long, Integer> getContestantPointsForUser(Long leagueId, Long userId) {
        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, userId).orElse(null);
        if (roster == null) {
            return Map.of();
        }

        List<EpisodeScore> allScores = episodeScoreDao.findAllByLeagueId(leagueId);
        Map<Long, Map<Integer, Integer>> scoresByContestantAndEpisode = new HashMap<>();
        for (EpisodeScore es : allScores) {
            scoresByContestantAndEpisode
                    .computeIfAbsent(es.getContestantId(), k -> new HashMap<>())
                    .put(es.getEpisodeNumber(), es.getPoints());
        }

        Map<Long, Contestant> contestantMap = contestantDao.findByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(Contestant::getId, sc -> sc));

        List<RosterPick> picks = rosterPickDao.findByRosterId(roster.getId());
        MergeAction mergeAction = mergeActionDao.findByLeagueIdAndUserId(leagueId, userId).orElse(null);
        Integer mergeEpisode = episodeDao.findMergeEpisode(leagueId).map(Episode::getEpisodeNumber).orElse(null);

        return calculateContestantPoints(picks, mergeAction, mergeEpisode, scoresByContestantAndEpisode, contestantMap);
    }

    /** Cumulative total score for every member after each episode, for the Standings graph view. */
    @Transactional(readOnly = true)
    public List<LeaderboardHistoryEntry> getLeaderboardHistory(Long leagueId) {
        leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        List<EpisodeScore> allScores = episodeScoreDao.findAllByLeagueId(leagueId);
        Map<Long, Map<Integer, Integer>> scoresByContestantAndEpisode = new HashMap<>();
        int maxScoredEpisode = 0;
        for (EpisodeScore es : allScores) {
            scoresByContestantAndEpisode
                    .computeIfAbsent(es.getContestantId(), k -> new HashMap<>())
                    .put(es.getEpisodeNumber(), es.getPoints());
            maxScoredEpisode = Math.max(maxScoredEpisode, es.getEpisodeNumber());
        }

        Integer maxCreatedEpisode = episodeDao.findMaxEpisodeNumber(leagueId);
        // EpisodeScore.episodeNumber isn't a foreign key to Episode, so take whichever is larger —
        // otherwise a stray score entered ahead of/beyond the created Episode rows would be silently
        // dropped and the graph's final point would no longer match the Leaderboard total.
        int effectiveMaxEpisode = Math.max(maxCreatedEpisode == null ? 0 : maxCreatedEpisode, maxScoredEpisode);

        Map<Long, Contestant> contestantMap = contestantDao.findByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(Contestant::getId, sc -> sc));

        Map<Long, MergeAction> mergeActionByUser = mergeActionDao.findByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(MergeAction::getUserId, ma -> ma));

        List<LeagueMemberResponse> members = leagueMemberDao.findMembersWithUsernames(leagueId);

        Map<Long, Roster> rosterByUser = rosterDao.findAllByLeagueId(leagueId)
                .stream()
                .collect(Collectors.toMap(Roster::getUserId, r -> r));

        Integer mergeEpisode = episodeDao.findMergeEpisode(leagueId).map(Episode::getEpisodeNumber).orElse(null);

        List<LeaderboardHistoryEntry> entries = new ArrayList<>();
        for (LeagueMemberResponse member : members) {
            Long userId = member.userId();
            String username = member.username();

            if (effectiveMaxEpisode == 0) {
                entries.add(new LeaderboardHistoryEntry(userId, username, List.of()));
                continue;
            }

            Roster roster = rosterByUser.get(userId);
            if (roster == null) {
                List<EpisodePoint> zeroHistory = new ArrayList<>();
                for (int ep = 1; ep <= effectiveMaxEpisode; ep++) {
                    zeroHistory.add(new EpisodePoint(ep, 0));
                }
                entries.add(new LeaderboardHistoryEntry(userId, username, zeroHistory));
                continue;
            }

            List<RosterPick> picks = rosterPickDao.findByRosterId(roster.getId());
            MergeAction mergeAction = mergeActionByUser.get(userId);
            Long mergeAddedId = mergeAction != null ? mergeAction.getAddedContestantId() : null;
            Long mergeRemovedId = mergeAction != null ? mergeAction.getRemovedContestantId() : null;

            Set<Long> allScoringPickIds = picks.stream().map(RosterPick::getContestantId).collect(Collectors.toSet());
            if (mergeRemovedId != null) {
                allScoringPickIds.add(mergeRemovedId);
            }

            boolean mvpBonusApplies = false;
            if (roster.getMvpContestantId() != null) {
                Contestant mvp = contestantMap.get(roster.getMvpContestantId());
                mvpBonusApplies = mvp != null && mvp.isWinner();
            }

            List<EpisodePoint> history = new ArrayList<>();
            int running = 0;
            for (int ep = 1; ep <= effectiveMaxEpisode; ep++) {
                for (Long scId : allScoringPickIds) {
                    Contestant sc = contestantMap.get(scId);
                    if (sc == null) continue;
                    Integer pts = scoresByContestantAndEpisode.getOrDefault(scId, Map.of()).get(ep);
                    if (pts == null) continue;
                    if (isPointCounted(scId, ep, sc, mergeAddedId, mergeRemovedId, mergeEpisode)) {
                        running += pts;
                    }
                }
                if (ep == effectiveMaxEpisode && mvpBonusApplies) {
                    running += MVP_BONUS;
                }
                history.add(new EpisodePoint(ep, running));
            }
            entries.add(new LeaderboardHistoryEntry(userId, username, history));
        }

        return entries;
    }
}
