package com.example.demo.controller;

import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dto.AddEpisodeRequest;
import com.example.demo.dto.AdminMergeActionRequest;
import com.example.demo.dto.ContestantDto;
import com.example.demo.dto.ContestantStatusRequest;
import com.example.demo.dto.CreateLeagueRequest;
import com.example.demo.dto.EpisodeDto;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.dto.JoinLeagueRequest;
import com.example.demo.dto.LeaderboardEntry;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.MergeActionRequest;
import com.example.demo.dto.MemberRoleResponse;
import com.example.demo.dto.MergeActionResponse;
import com.example.demo.dto.MergeStatusResponse;
import com.example.demo.dto.PickingRequest;
import com.example.demo.dto.RosterResponse;
import com.example.demo.dto.SetMergeEpisodeRequest;
import com.example.demo.dto.SubmitRosterRequest;
import com.example.demo.dto.TribeDto;
import com.example.demo.service.CastService;
import com.example.demo.service.EpisodeScoreService;
import com.example.demo.service.EpisodeService;
import com.example.demo.service.LeaderboardService;
import com.example.demo.service.LeagueService;
import com.example.demo.service.MergeService;
import com.example.demo.service.RosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leagues")
public class LeagueController {

    private final LeagueService leagueService;
    private final RosterService rosterService;
    private final LeagueMemberDao leagueMemberDao;
    private final EpisodeScoreService episodeScoreService;
    private final EpisodeService episodeService;
    private final MergeService mergeService;
    private final LeaderboardService leaderboardService;
    private final CastService castService;

    @Autowired
    public LeagueController(LeagueService leagueService, RosterService rosterService,
                            LeagueMemberDao leagueMemberDao, EpisodeScoreService episodeScoreService,
                            EpisodeService episodeService, MergeService mergeService,
                            LeaderboardService leaderboardService, CastService castService) {
        this.leagueService = leagueService;
        this.rosterService = rosterService;
        this.leagueMemberDao = leagueMemberDao;
        this.episodeScoreService = episodeScoreService;
        this.episodeService = episodeService;
        this.mergeService = mergeService;
        this.leaderboardService = leaderboardService;
        this.castService = castService;
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

    /** Creates a fully configured league (with its tribes and contestants) in one atomic step. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeagueResponse createLeague(@RequestBody CreateLeagueRequest request) {
        return leagueService.createLeague(request.name(), request.seasonName(), request.userId(),
                request.contestantsPerTribe(), request.tribes(), request.contestants());
    }

    @PostMapping("/join")
    public LeagueResponse joinLeague(@RequestBody JoinLeagueRequest request) {
        return leagueService.joinLeague(request.code(), request.userId());
    }

    /** Admin-only: manually open or close initial roster picking for the league. */
    @PutMapping("/{id}/initial-picking")
    public LeagueResponse setInitialPicksOpen(@PathVariable Long id, @RequestBody PickingRequest request) {
        return leagueService.setInitialPicksOpen(id, request.adminUserId(), request.open());
    }

    /** Admin-only: manually open or close merge picking for the league. */
    @PutMapping("/{id}/merge-picking")
    public LeagueResponse setMergePicksOpen(@PathVariable Long id, @RequestBody PickingRequest request) {
        return leagueService.setMergePicksOpen(id, request.adminUserId(), request.open());
    }

    // --- Season configuration: tribes & contestants (read-only after wizard setup) ---

    @GetMapping("/{id}/tribes")
    public List<TribeDto> getTribes(@PathVariable Long id) {
        return castService.getTribes(id);
    }

    @GetMapping("/{id}/contestants")
    public List<ContestantDto> getContestants(@PathVariable Long id) {
        return castService.getContestants(id);
    }

    /** Admin-only: record a contestant's elimination episode and/or winner status. */
    @PutMapping("/{id}/contestants/{contestantId}/status")
    public ContestantDto updateContestantStatus(@PathVariable Long id, @PathVariable Long contestantId,
                                                @RequestBody ContestantStatusRequest request) {
        return castService.updateContestantStatus(id, request.adminUserId(), contestantId,
                request.eliminatedEpisode(), request.winner());
    }

    // --- Episodes ---

    @GetMapping("/{id}/episodes")
    public List<EpisodeDto> getEpisodes(@PathVariable Long id) {
        return episodeService.getEpisodes(id);
    }

    /** Admin-only: adds the next episode in sequence. */
    @PostMapping("/{id}/episodes")
    @ResponseStatus(HttpStatus.CREATED)
    public EpisodeDto addEpisode(@PathVariable Long id, @RequestBody AddEpisodeRequest request) {
        return episodeService.addEpisode(id, request.adminUserId());
    }

    /** Admin-only: removes the most recently added episode, if it has no scores yet. */
    @DeleteMapping("/{id}/episodes/{episodeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEpisode(@PathVariable Long id, @PathVariable Long episodeId, @RequestParam Long adminUserId) {
        episodeService.deleteEpisode(id, adminUserId, episodeId);
    }

    /** Admin-only: flags (or unflags) an episode as the season's merge episode. */
    @PutMapping("/{id}/episodes/{episodeId}/merge-flag")
    public EpisodeDto setMergeEpisode(@PathVariable Long id, @PathVariable Long episodeId,
                                      @RequestBody SetMergeEpisodeRequest request) {
        return episodeService.setMergeEpisode(id, request.adminUserId(), episodeId, request.isMergeEpisode());
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
        return rosterService.submitRoster(id, request.userId(), request.mvpContestantId(), request.contestantIds());
    }

    @GetMapping("/{id}/rosters")
    public List<RosterResponse> getAllRosters(@PathVariable Long id) {
        return rosterService.getAllRostersForLeague(id);
    }

    /** Admin-only: modify any user's roster, bypassing the picking-open state. */
    @PutMapping("/{id}/rosters/{targetUserId}")
    public RosterResponse adminUpdateRoster(@PathVariable Long id, @PathVariable Long targetUserId,
                                            @RequestBody SubmitRosterRequest request) {
        return rosterService.adminUpdateRoster(id, request.userId(), targetUserId,
                request.mvpContestantId(), request.contestantIds());
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
                request.addedContestantId(), request.removedContestantId());
    }

    // --- Leaderboard ---

    @GetMapping("/{id}/leaderboard")
    public List<LeaderboardEntry> getLeaderboard(@PathVariable Long id) {
        return leaderboardService.getLeaderboard(id);
    }

    /** Per-contestant point contributions for a user's roster (merge-boundary aware). */
    @GetMapping("/{id}/rosters/{userId}/contestant-points")
    public Map<Long, Integer> getContestantPointsForUser(@PathVariable Long id, @PathVariable Long userId) {
        return leaderboardService.getContestantPointsForUser(id, userId);
    }
}
