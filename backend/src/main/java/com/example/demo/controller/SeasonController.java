package com.example.demo.controller;

import com.example.demo.dto.SeasonContestantDto;
import com.example.demo.entity.Season;
import com.example.demo.service.SeasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
public class SeasonController {

    private final SeasonService seasonService;

    @Autowired
    public SeasonController(SeasonService seasonService) {
        this.seasonService = seasonService;
    }

    @GetMapping
    public List<Season> getAllSeasons() {
        return seasonService.getAllSeasons();
    }

    @GetMapping("/{id}/contestants")
    public List<SeasonContestantDto> getContestants(@PathVariable Long id) {
        return seasonService.getContestantsBySeason(id);
    }
}
