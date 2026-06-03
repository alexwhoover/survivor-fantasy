package com.example.demo.controller;

import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dto.CreateLeagueRequest;
import com.example.demo.dto.JoinLeagueRequest;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.MemberRoleResponse;
import com.example.demo.dto.RosterResponse;
import com.example.demo.dto.SubmitRosterRequest;
import com.example.demo.service.LeagueService;
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

    @Autowired
    public LeagueController(LeagueService leagueService, RosterService rosterService, LeagueMemberDao leagueMemberDao) {
        this.leagueService = leagueService;
        this.rosterService = rosterService;
        this.leagueMemberDao = leagueMemberDao;
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
        return leagueService.createLeague(request.name(), request.seasonId(), request.userId());
    }

    @PostMapping("/join")
    public LeagueResponse joinLeague(@RequestBody JoinLeagueRequest request) {
        return leagueService.joinLeague(request.code(), request.userId());
    }

    @GetMapping("/{id}/rosters/me")
    public ResponseEntity<RosterResponse> getMyRoster(@PathVariable Long id, @RequestParam Long userId) {
        return rosterService.getMyRoster(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/rosters")
    @ResponseStatus(HttpStatus.CREATED)
    public RosterResponse submitRoster(@PathVariable Long id, @RequestBody SubmitRosterRequest request) {
        return rosterService.submitRoster(id, request.userId(), request.mvpSeasonContestantId(), request.seasonContestantIds());
    }
}
