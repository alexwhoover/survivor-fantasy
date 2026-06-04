package com.example.demo.service;

import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dao.SeasonDao;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.MergeActionRequest;
import com.example.demo.dto.MergeActionResponse;
import com.example.demo.dto.MergeMemberStatus;
import com.example.demo.dto.MergeStatusResponse;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import com.example.demo.entity.MergeAction;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import com.example.demo.entity.SeasonContestant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MergeService {

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final MergeActionDao mergeActionDao;
    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final SeasonDao seasonDao;
    private final LeagueService leagueService;

    @Autowired
    public MergeService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao, MergeActionDao mergeActionDao,
                        RosterDao rosterDao, RosterPickDao rosterPickDao, SeasonDao seasonDao,
                        LeagueService leagueService) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.mergeActionDao = mergeActionDao;
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.seasonDao = seasonDao;
        this.leagueService = leagueService;
    }

    @Transactional
    public LeagueResponse initiateMerge(Long leagueId, Long adminUserId, int mergeEpisode, LocalDateTime mergeDeadline) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        leagueMemberDao.findByLeagueIdAndUserId(leagueId, adminUserId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only league admins can initiate a merge"));

        if (mergeDeadline == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mergeDeadline is required");
        }

        league.setMergeEpisode(mergeEpisode);
        league.setMergeDeadline(mergeDeadline);
        return leagueService.toResponse(league);
    }

    @Transactional
    public MergeStatusResponse performMergeAction(Long leagueId, MergeActionRequest request) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (league.getMergeEpisode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Merge has not been initiated for this league");
        }

        LocalDateTime deadline = league.getMergeDeadline();
        if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Merge deadline has passed");
        }

        Long userId = request.userId();
        leagueMemberDao.findByLeagueIdAndUserId(leagueId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a member of this league"));

        if (mergeActionDao.existsByLeagueIdAndUserId(leagueId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User has already performed their merge action");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has not submitted a roster"));

        List<RosterPick> currentPicks = rosterPickDao.findByRosterId(roster.getId());
        int maxRosterSize = league.getContestantsPerTribe() * seasonDao.countTribesBySeasonId(league.getSeasonId());
        boolean isFull = currentPicks.size() >= maxRosterSize;

        if (isFull) {
            performSwap(league, roster, currentPicks, request);
        } else {
            performAdd(league, roster, currentPicks, request);
        }

        return getMergeStatus(leagueId);
    }

    private void performAdd(League league, Roster roster, List<RosterPick> currentPicks, MergeActionRequest request) {
        if (request.addedSeasonContestantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "addedSeasonContestantId is required");
        }

        SeasonContestant toAdd = seasonDao.findSeasonContestantById(request.addedSeasonContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant not found"));

        validateBelongsToLeagueSeason(toAdd, league);

        if (toAdd.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add an eliminated contestant");
        }

        Set<Long> existingIds = currentPicks.stream().map(RosterPick::getSeasonContestantId).collect(Collectors.toSet());
        if (existingIds.contains(toAdd.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant is already on this roster");
        }

        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));
        mergeActionDao.save(new MergeAction(league.getId(), roster.getUserId(), MergeAction.ActionType.ADD, toAdd.getId(), null));
    }

    private void performSwap(League league, Roster roster, List<RosterPick> currentPicks, MergeActionRequest request) {
        if (request.addedSeasonContestantId() == null || request.removedSeasonContestantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both addedSeasonContestantId and removedSeasonContestantId are required for a swap");
        }

        SeasonContestant toAdd = seasonDao.findSeasonContestantById(request.addedSeasonContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to add not found"));
        SeasonContestant toRemove = seasonDao.findSeasonContestantById(request.removedSeasonContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to remove not found"));

        validateBelongsToLeagueSeason(toAdd, league);
        validateBelongsToLeagueSeason(toRemove, league);

        if (toAdd.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add an eliminated contestant");
        }
        if (toRemove.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot swap out an eliminated contestant");
        }

        Set<Long> existingIds = currentPicks.stream().map(RosterPick::getSeasonContestantId).collect(Collectors.toSet());
        if (!existingIds.contains(toRemove.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant to remove is not on this roster");
        }
        if (existingIds.contains(toAdd.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant to add is already on this roster");
        }

        rosterPickDao.deletePickByRosterIdAndSeasonContestantId(roster.getId(), toRemove.getId());
        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));
        mergeActionDao.save(new MergeAction(league.getId(), roster.getUserId(), MergeAction.ActionType.SWAP, toAdd.getId(), toRemove.getId()));
    }

    private void validateBelongsToLeagueSeason(SeasonContestant sc, League league) {
        if (!sc.getSeasonId().equals(league.getSeasonId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant does not belong to this league's season");
        }
    }

    @Transactional(readOnly = true)
    public MergeStatusResponse getMergeStatus(Long leagueId) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        boolean initiated = league.getMergeEpisode() != null;
        LocalDateTime deadline = league.getMergeDeadline();
        boolean deadlinePassed = deadline != null && LocalDateTime.now().isAfter(deadline);

        List<MergeMemberStatus> memberStatuses = buildMemberStatuses(leagueId);

        return new MergeStatusResponse(initiated, league.getMergeEpisode(), deadline, deadlinePassed, memberStatuses);
    }

    @Transactional
    public MergeStatusResponse adminSetMergeAction(Long leagueId, Long adminUserId, Long targetUserId,
                                                   Long addedSeasonContestantId, Long removedSeasonContestantId) {
        leagueMemberDao.findByLeagueIdAndUserId(leagueId, adminUserId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only league admins can override merge actions"));

        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (league.getMergeEpisode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Merge has not been initiated for this league");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user has not submitted a roster"));

        // Revert any existing merge action for this user
        mergeActionDao.findByLeagueIdAndUserId(leagueId, targetUserId).ifPresent(existing -> {
            // Remove the previously-added contestant from the roster
            rosterPickDao.deletePickByRosterIdAndSeasonContestantId(roster.getId(), existing.getAddedSeasonContestantId());
            // For a swap, restore the previously-removed contestant
            if (existing.getRemovedSeasonContestantId() != null) {
                rosterPickDao.save(new RosterPick(roster.getId(), existing.getRemovedSeasonContestantId()));
            }
            mergeActionDao.deleteByLeagueIdAndUserId(leagueId, targetUserId);
        });

        // Validate new contestants
        SeasonContestant toAdd = seasonDao.findSeasonContestantById(addedSeasonContestantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to add not found"));
        validateBelongsToLeagueSeason(toAdd, league);

        if (removedSeasonContestantId != null) {
            SeasonContestant toRemove = seasonDao.findSeasonContestantById(removedSeasonContestantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to remove not found"));
            validateBelongsToLeagueSeason(toRemove, league);
            rosterPickDao.deletePickByRosterIdAndSeasonContestantId(roster.getId(), toRemove.getId());
        }

        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));

        MergeAction.ActionType actionType = removedSeasonContestantId != null
                ? MergeAction.ActionType.SWAP
                : MergeAction.ActionType.ADD;
        mergeActionDao.save(new MergeAction(leagueId, targetUserId, actionType, addedSeasonContestantId, removedSeasonContestantId));

        return getMergeStatus(leagueId);
    }

    @Transactional(readOnly = true)
    public Optional<MergeActionResponse> getMyMergeAction(Long leagueId, Long userId) {
        return mergeActionDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(ma -> new MergeActionResponse(
                        ma.getActionType().name(),
                        ma.getAddedSeasonContestantId(),
                        ma.getRemovedSeasonContestantId()
                ));
    }

    private List<MergeMemberStatus> buildMemberStatuses(Long leagueId) {
        List<com.example.demo.dto.LeagueMemberResponse> members = leagueMemberDao.findMembersWithUsernames(leagueId);
        Set<Long> actedUserIds = mergeActionDao.findByLeagueId(leagueId).stream()
                .map(MergeAction::getUserId)
                .collect(Collectors.toSet());

        return members.stream()
                .map(m -> new MergeMemberStatus(m.userId(), m.username(), actedUserIds.contains(m.userId())))
                .toList();
    }
}
