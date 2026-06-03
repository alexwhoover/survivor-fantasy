package com.example.demo.controller;

import com.example.demo.dto.CreateLeagueRequest;
import com.example.demo.dto.JoinLeagueRequest;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.service.LeagueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leagues")
public class LeagueController {

    private final LeagueService leagueService;

    @Autowired
    public LeagueController(LeagueService leagueService) {
        this.leagueService = leagueService;
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
}
