package com.example.demo.service;

import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dto.RosterResponse;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RosterService {

    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final LeagueMemberDao leagueMemberDao;

    @Autowired
    public RosterService(RosterDao rosterDao, RosterPickDao rosterPickDao, LeagueMemberDao leagueMemberDao) {
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.leagueMemberDao = leagueMemberDao;
    }

    public Optional<RosterResponse> getMyRoster(Long leagueId, Long userId) {
        return rosterDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(this::toResponse);
    }

    @Transactional
    public RosterResponse submitRoster(Long leagueId, Long userId, Long mvpSeasonContestantId, List<Long> seasonContestantIds) {
        if (!leagueMemberDao.existsByLeagueIdAndUserId(leagueId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a member of this league");
        }
        if (mvpSeasonContestantId == null || seasonContestantIds == null || seasonContestantIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mvpSeasonContestantId and seasonContestantIds are required");
        }
        if (!seasonContestantIds.contains(mvpSeasonContestantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MVP must be one of the picked contestants");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, userId).orElse(null);

        if (roster != null) {
            rosterPickDao.deleteByRosterId(roster.getId());
            roster.setMvpSeasonContestantId(mvpSeasonContestantId);
            roster.setSubmittedAt(LocalDateTime.now());
        } else {
            roster = new Roster(leagueId, userId, mvpSeasonContestantId, LocalDateTime.now());
            rosterDao.save(roster);
        }

        for (Long scId : seasonContestantIds) {
            rosterPickDao.save(new RosterPick(roster.getId(), scId));
        }

        return toResponse(roster, seasonContestantIds);
    }

    private RosterResponse toResponse(Roster roster) {
        List<Long> pickIds = rosterPickDao.findByRosterId(roster.getId()).stream()
                .map(RosterPick::getSeasonContestantId)
                .toList();
        return toResponse(roster, pickIds);
    }

    private RosterResponse toResponse(Roster roster, List<Long> seasonContestantIds) {
        return new RosterResponse(
                roster.getId(),
                roster.getLeagueId(),
                roster.getUserId(),
                roster.getMvpSeasonContestantId(),
                seasonContestantIds,
                roster.getSubmittedAt()
        );
    }
}
