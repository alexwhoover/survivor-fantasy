package com.example.demo.controller;

import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dto.AdminMergeActionRequest;
import com.example.demo.dto.CreateLeagueRequest;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.dto.InitiateMergeRequest;
import com.example.demo.dto.JoinLeagueRequest;
import com.example.demo.dto.LeaderboardEntry;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.MergeActionRequest;
import com.example.demo.dto.MemberRoleResponse;
import com.example.demo.dto.MergeActionResponse;
import com.example.demo.dto.MergeStatusResponse;
import com.example.demo.dto.RosterResponse;
import com.example.demo.dto.SubmitRosterRequest;
import com.example.demo.service.EpisodeScoreService;
import com.example.demo.service.LeaderboardService;
import com.example.demo.service.LeagueService;
import com.example.demo.service.MergeService;
import com.example.demo.service.RosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leagues")
public class LeagueController {

    private final LeagueService leagueService;
    private final RosterService rosterService;
    private final LeagueMemberDao leagueMemberDao;
    private final EpisodeScoreService episodeScoreService;
    private final MergeService mergeService;
    private final LeaderboardService leaderboardService;

    @Autowired
    public LeagueController(LeagueService leagueService, RosterService rosterService,
                            LeagueMemberDao leagueMemberDao, EpisodeScoreService episodeScoreService,
                            MergeService mergeService, LeaderboardService leaderboardService) {
        this.leagueService = leagueService;
        this.rosterService = rosterService;
        this.leagueMemberDao = leagueMemberDao;
        this.episodeScoreService = episodeScoreService;
        this.mergeService = mergeService;
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public List<LeagueResponse> getLeagues(@RequestParam Long userId) {
        return leagueService.getLeaguesForUser(userId);
    }

    @GetMapping("/{id}")
    public LeagueResponse getLeague(@PathVariable Long id) {
        return leagueService.getLeagueById(id);
    }

    @GetMapping("/{id}/members")
    public List<LeagueMemberResponse> getMembers(@PathVariable Long id) {
        return leagueMemberDao.findMembersWithUsernames(id);
    }

    @GetMapping("/{id}/my-role")
    public ResponseEntity<MemberRoleResponse> getMyRole(@PathVariable Long id, @RequestParam Long userId) {
        return leagueMemberDao.findByLeagueIdAndUserId(id, userId)
                .map(m -> ResponseEntity.ok(new MemberRoleResponse(m.getRole().name())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeagueResponse createLeague(@RequestBody CreateLeagueRequest request) {
        return leagueService.createLeague(request.name(), request.seasonId(), request.userId(),
                request.pickDeadline(), request.contestantsPerTribe());
    }

    @PostMapping("/join")
    public LeagueResponse joinLeague(@RequestBody JoinLeagueRequest request) {
        return leagueService.joinLeague(request.code(), request.userId());
    }

    // --- Roster endpoints ---

    @GetMapping("/{id}/rosters/me")
    public ResponseEntity<RosterResponse> getMyRoster(@PathVariable Long id, @RequestParam Long userId) {
        return rosterService.getMyRoster(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/rosters/{userId}")
    public ResponseEntity<RosterResponse> getRosterForUser(@PathVariable Long id, @PathVariable Long userId) {
        return rosterService.getRosterForUser(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/rosters")
    @ResponseStatus(HttpStatus.CREATED)
    public RosterResponse submitRoster(@PathVariable Long id, @RequestBody SubmitRosterRequest request) {
        return rosterService.submitRoster(id, request.userId(), request.mvpSeasonContestantId(), request.seasonContestantIds());
    }

    @GetMapping("/{id}/rosters")
    public List<RosterResponse> getAllRosters(@PathVariable Long id) {
        return rosterService.getAllRostersForLeague(id);
    }

    /** Admin-only: modify any user's roster, bypassing the pick deadline. */
    @PutMapping("/{id}/rosters/{targetUserId}")
    public RosterResponse adminUpdateRoster(@PathVariable Long id, @PathVariable Long targetUserId,
                                            @RequestBody SubmitRosterRequest request) {
        return rosterService.adminUpdateRoster(id, request.userId(), targetUserId,
                request.mvpSeasonContestantId(), request.seasonContestantIds());
    }

    // --- Episode score endpoints ---

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

    // --- Merge endpoints ---

    @PostMapping("/{id}/merge/initiate")
    public LeagueResponse initiateMerge(@PathVariable Long id, @RequestBody InitiateMergeRequest request) {
        return mergeService.initiateMerge(id, request.adminUserId(), request.mergeEpisode(), request.mergeDeadline());
    }

    @PostMapping("/{id}/merge/action")
    public MergeStatusResponse performMergeAction(@PathVariable Long id, @RequestBody MergeActionRequest request) {
        return mergeService.performMergeAction(id, request);
    }

    @GetMapping("/{id}/merge/status")
    public MergeStatusResponse getMergeStatus(@PathVariable Long id) {
        return mergeService.getMergeStatus(id);
    }

    @GetMapping("/{id}/merge/action/me")
    public ResponseEntity<MergeActionResponse> getMyMergeAction(@PathVariable Long id, @RequestParam Long userId) {
        return mergeService.getMyMergeAction(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/merge/action/{targetUserId}")
    public MergeStatusResponse adminSetMergeAction(@PathVariable Long id, @PathVariable Long targetUserId,
                                                   @RequestBody AdminMergeActionRequest request) {
        return mergeService.adminSetMergeAction(id, request.adminUserId(), targetUserId,
                request.addedSeasonContestantId(), request.removedSeasonContestantId());
    }

    // --- Leaderboard ---

    @GetMapping("/{id}/leaderboard")
    public List<LeaderboardEntry> getLeaderboard(@PathVariable Long id) {
        return leaderboardService.getLeaderboard(id);
    }
}
