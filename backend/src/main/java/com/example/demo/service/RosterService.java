package com.example.demo.service;

import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dto.RosterResponse;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
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
    private final LeagueDao leagueDao;

    @Autowired
    public RosterService(RosterDao rosterDao, RosterPickDao rosterPickDao, LeagueMemberDao leagueMemberDao, LeagueDao leagueDao) {
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.leagueMemberDao = leagueMemberDao;
        this.leagueDao = leagueDao;
    }

    public Optional<RosterResponse> getMyRoster(Long leagueId, Long userId) {
        return rosterDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(this::toResponse);
    }

    public Optional<RosterResponse> getRosterForUser(Long leagueId, Long userId) {
        return rosterDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(this::toResponse);
    }

    public List<RosterResponse> getAllRostersForLeague(Long leagueId) {
        return rosterDao.findAllByLeagueId(leagueId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RosterResponse submitRoster(Long leagueId, Long userId, Long mvpContestantId, List<Long> contestantIds) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        LeagueMember member = leagueMemberDao.findByLeagueIdAndUserId(leagueId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a member of this league"));

        if (member.getRole() != LeagueMember.Role.ADMIN && !league.isInitialPicksOpen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Initial picks are currently closed for this league");
        }

        validatePicksInput(mvpContestantId, contestantIds);
        return upsertRoster(leagueId, userId, mvpContestantId, contestantIds);
    }

    @Transactional
    public RosterResponse adminUpdateRoster(Long leagueId, Long adminUserId, Long targetUserId, Long mvpContestantId, List<Long> contestantIds) {
        leagueMemberDao.findByLeagueIdAndUserId(leagueId, adminUserId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only league admins can modify other users' rosters"));

        if (!leagueMemberDao.existsByLeagueIdAndUserId(leagueId, targetUserId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not a member of this league");
        }

        validatePicksInput(mvpContestantId, contestantIds);
        return upsertRoster(leagueId, targetUserId, mvpContestantId, contestantIds);
    }

    private void validatePicksInput(Long mvpContestantId, List<Long> contestantIds) {
        if (mvpContestantId == null || contestantIds == null || contestantIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mvpContestantId and contestantIds are required");
        }
        if (!contestantIds.contains(mvpContestantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MVP must be one of the picked contestants");
        }
    }

    private RosterResponse upsertRoster(Long leagueId, Long userId, Long mvpContestantId, List<Long> contestantIds) {
        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, userId).orElse(null);

        if (roster != null) {
            rosterPickDao.deleteByRosterId(roster.getId());
            roster.setMvpContestantId(mvpContestantId);
            roster.setSubmittedAt(LocalDateTime.now());
        } else {
            roster = new Roster(leagueId, userId, mvpContestantId, LocalDateTime.now());
            rosterDao.save(roster);
        }

        for (Long scId : contestantIds) {
            rosterPickDao.save(new RosterPick(roster.getId(), scId));
        }

        return toResponse(roster, contestantIds);
    }

    private RosterResponse toResponse(Roster roster) {
        List<Long> pickIds = rosterPickDao.findByRosterId(roster.getId()).stream()
                .map(RosterPick::getContestantId)
                .toList();
        return toResponse(roster, pickIds);
    }

    private RosterResponse toResponse(Roster roster, List<Long> contestantIds) {
        return new RosterResponse(
                roster.getId(),
                roster.getLeagueId(),
                roster.getUserId(),
                roster.getMvpContestantId(),
                contestantIds,
                roster.getSubmittedAt()
        );
    }
}
