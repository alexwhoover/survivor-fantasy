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
import com.example.demo.dto.LeagueStatsResponse;
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
                entries.add(new LeaderboardEntry(userId, username, 0, Map.of()));
                continue;
            }

            List<RosterPick> picks = rosterPickDao.findByRosterId(roster.getId());
            MergeAction mergeAction = mergeActionByUser.get(userId);

            Map<Long, Integer> contestantPoints = calculateContestantPoints(
                    picks, mergeAction, mergeEpisode, scoresByContestantAndEpisode, contestantMap);
            int score = contestantPoints.values().stream().mapToInt(Integer::intValue).sum();

            if (roster.getMvpContestantId() != null) {
                Contestant mvp = contestantMap.get(roster.getMvpContestantId());
                if (mvp != null && mvp.isWinner()) {
                    score += MVP_BONUS;
                }
            }

            entries.add(new LeaderboardEntry(userId, username, score, contestantPoints));
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

    /** Cumulative total score for every member after each episode, for the Standings graph view. */
    @Transactional(readOnly = true)
    public List<LeaderboardHistoryEntry> getLeaderboardHistory(Long leagueId) {
        ScoringData data = loadScoringData(leagueId);

        Integer maxCreatedEpisode = episodeDao.findMaxEpisodeNumber(leagueId);
        // EpisodeScore.episodeNumber isn't a foreign key to Episode, so take whichever is larger —
        // otherwise a stray score entered ahead of/beyond the created Episode rows would be silently
        // dropped and the graph's final point would no longer match the Leaderboard total.
        int effectiveMaxEpisode = Math.max(maxCreatedEpisode == null ? 0 : maxCreatedEpisode, data.maxScoredEpisode());

        List<LeaderboardHistoryEntry> entries = new ArrayList<>();
        for (LeagueMemberResponse member : data.members()) {
            if (effectiveMaxEpisode == 0) {
                entries.add(new LeaderboardHistoryEntry(member.userId(), member.username(), List.of()));
                continue;
            }

            int[] perEpisode = episodePoints(data, member.userId(), effectiveMaxEpisode);
            List<EpisodePoint> history = new ArrayList<>();
            int running = 0;
            for (int ep = 1; ep <= effectiveMaxEpisode; ep++) {
                running += perEpisode[ep - 1];
                if (ep == effectiveMaxEpisode && mvpBonusApplies(data, member.userId())) {
                    running += MVP_BONUS;
                }
                history.add(new EpisodePoint(ep, running));
            }
            entries.add(new LeaderboardHistoryEntry(member.userId(), member.username(), history));
        }

        return entries;
    }

    /**
     * Episode MVP and biggest climber for the latest scored episode. "Latest" is the highest
     * episode with any score entered — not the highest created Episode row — so an episode the
     * admin has created but not yet scored doesn't show everyone at +0.
     */
    @Transactional(readOnly = true)
    public LeagueStatsResponse getLeagueStats(Long leagueId) {
        ScoringData data = loadScoringData(leagueId);
        int latest = data.maxScoredEpisode();
        if (latest < 2) {
            return new LeagueStatsResponse(latest, null, List.of());
        }

        Map<Long, Integer> latestPoints = new HashMap<>();
        Map<Long, Integer> previousTotals = new HashMap<>();
        Map<Long, Integer> latestTotals = new HashMap<>();
        for (LeagueMemberResponse member : data.members()) {
            int[] perEpisode = episodePoints(data, member.userId(), latest);
            int previous = 0;
            for (int ep = 1; ep < latest; ep++) {
                previous += perEpisode[ep - 1];
            }
            latestPoints.put(member.userId(), perEpisode[latest - 1]);
            previousTotals.put(member.userId(), previous);
            // The MVP bonus is in the current totals (as on the Leaderboard) so the "to" rank
            // matches the list below the cards, but never in the episode's own points.
            latestTotals.put(member.userId(), previous + perEpisode[latest - 1]
                    + (mvpBonusApplies(data, member.userId()) ? MVP_BONUS : 0));
        }

        LeagueStatsResponse.EpisodeMvp mvp = null;
        int bestEpisode = latestPoints.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        if (bestEpisode > 0) {
            List<String> names = data.members().stream()
                    .filter(m -> latestPoints.get(m.userId()) == bestEpisode)
                    .map(LeagueMemberResponse::username)
                    .toList();
            mvp = new LeagueStatsResponse.EpisodeMvp(names, bestEpisode);
        }

        Map<Long, Integer> previousRanks = competitionRanks(previousTotals);
        Map<Long, Integer> latestRanks = competitionRanks(latestTotals);
        int biggestClimb = data.members().stream()
                .mapToInt(m -> previousRanks.get(m.userId()) - latestRanks.get(m.userId()))
                .max().orElse(0);
        List<LeagueStatsResponse.RankMove> movers = biggestClimb <= 0 ? List.of() : data.members().stream()
                .filter(m -> previousRanks.get(m.userId()) - latestRanks.get(m.userId()) == biggestClimb)
                .map(m -> new LeagueStatsResponse.RankMove(
                        m.username(), previousRanks.get(m.userId()), latestRanks.get(m.userId())))
                .toList();

        return new LeagueStatsResponse(latest, mvp, movers);
    }

    /** Standard competition ranking: equal totals share a rank and the next rank is skipped (1, 1, 3). */
    private static Map<Long, Integer> competitionRanks(Map<Long, Integer> totals) {
        Map<Long, Integer> ranks = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : totals.entrySet()) {
            int higher = (int) totals.values().stream().filter(t -> t > entry.getValue()).count();
            ranks.put(entry.getKey(), higher + 1);
        }
        return ranks;
    }

    /** Everything the per-episode scoring paths need, loaded once per request. */
    private record ScoringData(Map<Long, Map<Integer, Integer>> scoresByContestantAndEpisode,
                               int maxScoredEpisode,
                               Map<Long, Contestant> contestantMap,
                               Map<Long, MergeAction> mergeActionByUser,
                               List<LeagueMemberResponse> members,
                               Map<Long, Roster> rosterByUser,
                               Integer mergeEpisode) {}

    private ScoringData loadScoringData(Long leagueId) {
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

        return new ScoringData(scoresByContestantAndEpisode, maxScoredEpisode, contestantMap,
                mergeActionByUser, members, rosterByUser, mergeEpisode);
    }

    /**
     * Points a member's roster earned in each episode 1..maxEpisode (index 0 is episode 1),
     * merge- and elimination-aware, MVP bonus excluded. All zeros for a member with no roster.
     */
    private int[] episodePoints(ScoringData data, Long userId, int maxEpisode) {
        int[] points = new int[maxEpisode];
        Roster roster = data.rosterByUser().get(userId);
        if (roster == null) return points;

        MergeAction mergeAction = data.mergeActionByUser().get(userId);
        Long mergeAddedId = mergeAction != null ? mergeAction.getAddedContestantId() : null;
        Long mergeRemovedId = mergeAction != null ? mergeAction.getRemovedContestantId() : null;

        Set<Long> allScoringPickIds = rosterPickDao.findByRosterId(roster.getId()).stream()
                .map(RosterPick::getContestantId)
                .collect(Collectors.toSet());
        if (mergeRemovedId != null) {
            allScoringPickIds.add(mergeRemovedId);
        }

        for (Long scId : allScoringPickIds) {
            Contestant sc = data.contestantMap().get(scId);
            if (sc == null) continue;
            Map<Integer, Integer> episodeScores = data.scoresByContestantAndEpisode().getOrDefault(scId, Map.of());
            for (int ep = 1; ep <= maxEpisode; ep++) {
                Integer pts = episodeScores.get(ep);
                if (pts != null && isPointCounted(scId, ep, sc, mergeAddedId, mergeRemovedId, data.mergeEpisode())) {
                    points[ep - 1] += pts;
                }
            }
        }
        return points;
    }

    private boolean mvpBonusApplies(ScoringData data, Long userId) {
        Roster roster = data.rosterByUser().get(userId);
        if (roster == null || roster.getMvpContestantId() == null) return false;
        Contestant mvp = data.contestantMap().get(roster.getMvpContestantId());
        return mvp != null && mvp.isWinner();
    }
}
