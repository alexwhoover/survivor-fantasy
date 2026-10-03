package com.example.demo.service;

import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dto.MergeActionResponse;
import com.example.demo.dto.RosterResponse;
import com.example.demo.entity.MergeAction;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Rosters are read by everyone and written only by the admin, on a player's behalf —
 * there is no self-service picking, so there's a single write path.
 */
@Service
public class RosterService {

    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final LeagueMemberDao leagueMemberDao;
    private final MergeActionDao mergeActionDao;

    @Autowired
    public RosterService(RosterDao rosterDao, RosterPickDao rosterPickDao,
                         LeagueMemberDao leagueMemberDao, MergeActionDao mergeActionDao) {
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.leagueMemberDao = leagueMemberDao;
        this.mergeActionDao = mergeActionDao;
    }

    public Optional<RosterResponse> getRosterForUser(Long leagueId, Long userId) {
        return rosterDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(this::toResponse);
    }

    public List<RosterResponse> getAllRostersForLeague(Long leagueId) {
        Map<Long, MergeAction> mergeActionByUser = mergeActionDao.findByLeagueId(leagueId).stream()
                .collect(Collectors.toMap(MergeAction::getUserId, Function.identity()));
        return rosterDao.findAllByLeagueId(leagueId).stream()
                .map(r -> toResponse(r, pickIds(r), mergeActionByUser.get(r.getUserId())))
                .toList();
    }

    @Transactional
    public RosterResponse setRoster(Long leagueId, Long playerId, Long mvpContestantId, List<Long> contestantIds) {
        if (!leagueMemberDao.existsByLeagueIdAndUserId(leagueId, playerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Player is not in this league");
        }

        if (mvpContestantId == null || contestantIds == null || contestantIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mvpContestantId and contestantIds are required");
        }
        if (!contestantIds.contains(mvpContestantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MVP must be one of the picked contestants");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, playerId).orElse(null);

        if (roster != null) {
            rosterPickDao.deleteByRosterId(roster.getId());
            roster.setMvpContestantId(mvpContestantId);
            roster.setSubmittedAt(LocalDateTime.now());
        } else {
            roster = new Roster(leagueId, playerId, mvpContestantId, LocalDateTime.now());
            rosterDao.save(roster);
        }

        for (Long scId : contestantIds) {
            rosterPickDao.save(new RosterPick(roster.getId(), scId));
        }

        return toResponse(roster, contestantIds, mergeActionDao.findByLeagueIdAndUserId(leagueId, playerId).orElse(null));
    }

    private RosterResponse toResponse(Roster roster) {
        MergeAction mergeAction = mergeActionDao.findByLeagueIdAndUserId(roster.getLeagueId(), roster.getUserId()).orElse(null);
        return toResponse(roster, pickIds(roster), mergeAction);
    }

    private List<Long> pickIds(Roster roster) {
        return rosterPickDao.findByRosterId(roster.getId()).stream()
                .map(RosterPick::getContestantId)
                .toList();
    }

    private RosterResponse toResponse(Roster roster, List<Long> contestantIds, MergeAction mergeAction) {
        MergeActionResponse mergeActionResponse = mergeAction == null ? null : new MergeActionResponse(
                mergeAction.getActionType().name(),
                mergeAction.getAddedContestantId(),
                mergeAction.getRemovedContestantId()
        );
        return new RosterResponse(roster.getUserId(), roster.getMvpContestantId(), contestantIds, mergeActionResponse);
    }
}
