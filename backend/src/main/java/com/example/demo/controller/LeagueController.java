package com.example.demo.controller;

import com.example.demo.dto.AddPlayerRequest;
import com.example.demo.dto.CastResponse;
import com.example.demo.dto.ContestantDto;
import com.example.demo.dto.ContestantStatusRequest;
import com.example.demo.dto.CreateLeagueRequest;
import com.example.demo.dto.EpisodeDto;
import com.example.demo.dto.EpisodeScoreItem;
import com.example.demo.dto.LeaderboardEntry;
import com.example.demo.dto.LeaderboardHistoryEntry;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.LeagueStatsResponse;
import com.example.demo.dto.MergeActionRequest;
import com.example.demo.dto.RosterResponse;
import com.example.demo.dto.ScoringGridResponse;
import com.example.demo.dto.SetArchivedRequest;
import com.example.demo.dto.SetMergeEpisodeRequest;
import com.example.demo.dto.SetRosterRequest;
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

/**
 * Every GET here is public — leagues are global and the site is read-only for visitors.
 * Every other method requires the site admin's session, enforced centrally in
 * {@code SecurityConfig} rather than re-checked per endpoint, which is why none of
 * these take a caller id.
 */
@RestController
@RequestMapping("/api/leagues")
public class LeagueController {

    private final LeagueService leagueService;
    private final RosterService rosterService;
    private final EpisodeScoreService episodeScoreService;
    private final EpisodeService episodeService;
    private final MergeService mergeService;
    private final LeaderboardService leaderboardService;
    private final CastService castService;

    @Autowired
    public LeagueController(LeagueService leagueService, RosterService rosterService,
                            EpisodeScoreService episodeScoreService, EpisodeService episodeService,
                            MergeService mergeService, LeaderboardService leaderboardService,
                            CastService castService) {
        this.leagueService = leagueService;
        this.rosterService = rosterService;
        this.episodeScoreService = episodeScoreService;
        this.episodeService = episodeService;
        this.mergeService = mergeService;
        this.leaderboardService = leaderboardService;
        this.castService = castService;
    }

    @GetMapping
    public List<LeagueResponse> getLeagues() {
        return leagueService.getAllLeagues();
    }

    @GetMapping("/{id}")
    public LeagueResponse getLeague(@PathVariable Long id) {
        return leagueService.getLeagueById(id);
    }

    /** Creates a fully configured league (with its tribes and contestants) in one atomic step. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeagueResponse createLeague(@RequestBody CreateLeagueRequest request) {
        return leagueService.createLeague(request.name(), request.seasonName(),
                request.contestantsPerTribe(), request.tribes(), request.contestants());
    }

    /** Archive or unarchive the league once its season is complete. */
    @PutMapping("/{id}/archived")
    public LeagueResponse setArchived(@PathVariable Long id, @RequestBody SetArchivedRequest request) {
        return leagueService.setArchived(id, request.archived());
    }

    // --- Players ---
    // Players have no accounts: the admin names them, and the name is all visitors see.

    @GetMapping("/{id}/players")
    public List<LeagueMemberResponse> getPlayers(@PathVariable Long id) {
        return leagueService.getPlayers(id);
    }

    @PostMapping("/{id}/players")
    public List<LeagueMemberResponse> addPlayer(@PathVariable Long id, @RequestBody AddPlayerRequest request) {
        return leagueService.addPlayer(id, request.name());
    }

    @DeleteMapping("/{id}/players/{playerId}")
    public List<LeagueMemberResponse> removePlayer(@PathVariable Long id, @PathVariable Long playerId) {
        return leagueService.removePlayer(id, playerId);
    }

    // --- Season configuration: tribes & contestants (fixed by the creation wizard) ---

    @GetMapping("/{id}/cast")
    public CastResponse getCast(@PathVariable Long id) {
        return castService.getCast(id);
    }

    /** Records a contestant's elimination episode and/or winner status. */
    @PutMapping("/{id}/contestants/{contestantId}/status")
    public ContestantDto updateContestantStatus(@PathVariable Long id, @PathVariable Long contestantId,
                                                @RequestBody ContestantStatusRequest request) {
        return castService.updateContestantStatus(id, contestantId,
                request.eliminatedEpisode(), request.winner());
    }

    // --- Episodes ---

    @GetMapping("/{id}/episodes")
    public List<EpisodeDto> getEpisodes(@PathVariable Long id) {
        return episodeService.getEpisodes(id);
    }

    /** Adds the next episode in sequence. */
    @PostMapping("/{id}/episodes")
    @ResponseStatus(HttpStatus.CREATED)
    public EpisodeDto addEpisode(@PathVariable Long id) {
        return episodeService.addEpisode(id);
    }

    /** Removes the most recently added episode, if it has no scores yet. */
    @DeleteMapping("/{id}/episodes/{episodeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEpisode(@PathVariable Long id, @PathVariable Long episodeId) {
        episodeService.deleteEpisode(id, episodeId);
    }

    /** Flags (or unflags) an episode as the season's merge episode. */
    @PutMapping("/{id}/episodes/{episodeId}/merge-flag")
    public EpisodeDto setMergeEpisode(@PathVariable Long id, @PathVariable Long episodeId,
                                      @RequestBody SetMergeEpisodeRequest request) {
        return episodeService.setMergeEpisode(id, episodeId, request.isMergeEpisode());
    }

    // --- Rosters ---

    @GetMapping("/{id}/rosters")
    public List<RosterResponse> getAllRosters(@PathVariable Long id) {
        return rosterService.getAllRostersForLeague(id);
    }

    @GetMapping("/{id}/rosters/{playerId}")
    public ResponseEntity<RosterResponse> getRoster(@PathVariable Long id, @PathVariable Long playerId) {
        return rosterService.getRosterForUser(id, playerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Sets a player's picks, creating the roster if they didn't have one. */
    @PutMapping("/{id}/rosters/{playerId}")
    public RosterResponse setRoster(@PathVariable Long id, @PathVariable Long playerId,
                                    @RequestBody SetRosterRequest request) {
        return rosterService.setRoster(id, playerId, request.mvpContestantId(), request.contestantIds());
    }

    // --- Episode scores ---

    @GetMapping("/{id}/episodes/{episodeNumber}/scores")
    public List<EpisodeScoreItem> getEpisodeScores(@PathVariable Long id, @PathVariable int episodeNumber) {
        return episodeScoreService.getScoresForEpisode(id, episodeNumber);
    }

    /** The whole season's scores as a contestant-by-episode grid, for the Standings "Scoring" view. */
    @GetMapping("/{id}/scoring-grid")
    public ScoringGridResponse getScoringGrid(@PathVariable Long id) {
        return episodeScoreService.getScoringGrid(id);
    }

    @PostMapping("/{id}/episodes/{episodeNumber}/scores")
    public List<EpisodeScoreItem> saveEpisodeScores(
            @PathVariable Long id,
            @PathVariable int episodeNumber,
            @RequestBody List<EpisodeScoreItem> scores) {
        return episodeScoreService.saveScoresForEpisode(id, episodeNumber, scores);
    }

    // --- Merge ---

    /** Sets (or corrects) a player's post-merge move. */
    @PutMapping("/{id}/merge/action/{playerId}")
    public RosterResponse setMergeAction(@PathVariable Long id, @PathVariable Long playerId,
                                         @RequestBody MergeActionRequest request) {
        return mergeService.setMergeAction(id, playerId, request.addedContestantId(),
                request.removedContestantId(), request.noChange());
    }

    // --- Leaderboard ---

    @GetMapping("/{id}/leaderboard")
    public List<LeaderboardEntry> getLeaderboard(@PathVariable Long id) {
        return leaderboardService.getLeaderboard(id);
    }

    @GetMapping("/{id}/leaderboard/history")
    public List<LeaderboardHistoryEntry> getLeaderboardHistory(@PathVariable Long id) {
        return leaderboardService.getLeaderboardHistory(id);
    }

    @GetMapping("/{id}/leaderboard/stats")
    public LeagueStatsResponse getLeagueStats(@PathVariable Long id) {
        return leaderboardService.getLeagueStats(id);
    }
}
