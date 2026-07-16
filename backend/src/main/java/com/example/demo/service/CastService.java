package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.TribeDao;
import com.example.demo.dto.ContestantDto;
import com.example.demo.dto.TribeDto;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import com.example.demo.entity.Tribe;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Read access to a league's season configuration (tribes and contestants), plus
 * ongoing gameplay status updates (eliminations, winner). Tribe and contestant
 * identity is fixed at league creation via the setup wizard — there is no
 * separate season-setup process afterward.
 */
@Service
public class CastService {

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final TribeDao tribeDao;
    private final ContestantDao contestantDao;
    private final EpisodeScoreDao episodeScoreDao;

    @Autowired
    public CastService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao, TribeDao tribeDao,
                       ContestantDao contestantDao, EpisodeScoreDao episodeScoreDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.tribeDao = tribeDao;
        this.contestantDao = contestantDao;
        this.episodeScoreDao = episodeScoreDao;
    }

    @Transactional(readOnly = true)
    public List<TribeDto> getTribes(Long leagueId) {
        requireLeague(leagueId);
        return tribeDao.findByLeagueId(leagueId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ContestantDto> getContestants(Long leagueId) {
        requireLeague(leagueId);
        Map<Long, Integer> totals = episodeScoreDao.sumPointsByLeagueId(leagueId);
        return contestantDao.findByLeagueId(leagueId).stream()
                .map(c -> ContestantDto.from(c, totals.getOrDefault(c.getId(), 0)))
                .toList();
    }

    @Transactional
    public ContestantDto updateContestantStatus(Long leagueId, Long adminUserId, Long contestantId,
                                                Integer eliminatedEpisode, Boolean winner) {
        requireAdmin(leagueId, adminUserId);
        Contestant contestant = contestantDao.findById(contestantId)
                .filter(c -> c.getLeagueId().equals(leagueId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant not found in this league"));

        contestant.setEliminatedEpisode(eliminatedEpisode);
        contestant.setWinner(Boolean.TRUE.equals(winner));

        Map<Long, Integer> totals = episodeScoreDao.sumPointsByLeagueId(leagueId);
        return ContestantDto.from(contestant, totals.getOrDefault(contestant.getId(), 0));
    }

    private League requireLeague(Long leagueId) {
        return leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private void requireAdmin(Long leagueId, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "adminUserId is required");
        }
        leagueMemberDao.findByLeagueIdAndUserId(leagueId, userId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only league admins can update contestant status"));
    }

    private TribeDto toDto(Tribe tribe) {
        return new TribeDto(tribe.getId(), tribe.getName(), tribe.getColour());
    }
}
