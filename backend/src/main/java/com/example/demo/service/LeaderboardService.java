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
import com.example.demo.dto.LeaderboardEntry;
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

            int score = calculateScore(picks, mergeAction, mergeEpisode, scoresByContestantAndEpisode, contestantMap);

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

    private int calculateScore(List<RosterPick> picks, MergeAction mergeAction, Integer mergeEpisode,
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

        int total = 0;
        for (Long scId : allScoringPickIds) {
            Map<Integer, Integer> episodeScores = scoresByContestantAndEpisode.getOrDefault(scId, Map.of());
            Contestant sc = contestantMap.get(scId);
            if (sc == null) continue;

            for (Map.Entry<Integer, Integer> entry : episodeScores.entrySet()) {
                int ep = entry.getKey();
                int pts = entry.getValue();

                // Skip episodes after the contestant was eliminated
                if (sc.getEliminatedEpisode() != null && ep > sc.getEliminatedEpisode()) continue;

                if (mergeEpisode != null && scId.equals(mergeAddedId)) {
                    // Merge-added: only count episodes strictly after merge
                    if (ep > mergeEpisode) total += pts;
                } else if (mergeEpisode != null && scId.equals(mergeRemovedId)) {
                    // Merge-removed: only count episodes up to and including merge
                    if (ep <= mergeEpisode) total += pts;
                } else {
                    total += pts;
                }
            }
        }
        return total;
    }
}
