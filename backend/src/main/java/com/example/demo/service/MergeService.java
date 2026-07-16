package com.example.demo.service;

import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.TribeDao;
import com.example.demo.dto.MergeActionRequest;
import com.example.demo.dto.MergeActionResponse;
import com.example.demo.dto.MergeMemberStatus;
import com.example.demo.dto.MergeStatusResponse;
import com.example.demo.entity.Episode;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import com.example.demo.entity.MergeAction;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import com.example.demo.entity.Contestant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MergeService {

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final MergeActionDao mergeActionDao;
    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final ContestantDao contestantDao;
    private final EpisodeDao episodeDao;
    private final TribeDao tribeDao;

    @Autowired
    public MergeService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao, MergeActionDao mergeActionDao,
                        RosterDao rosterDao, RosterPickDao rosterPickDao, ContestantDao contestantDao,
                        EpisodeDao episodeDao, TribeDao tribeDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.mergeActionDao = mergeActionDao;
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.contestantDao = contestantDao;
        this.episodeDao = episodeDao;
        this.tribeDao = tribeDao;
    }

    @Transactional
    public MergeStatusResponse performMergeAction(Long leagueId, MergeActionRequest request) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (episodeDao.findMergeEpisode(leagueId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No episode has been flagged as the merge episode yet");
        }
        if (!league.isMergePicksOpen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Merge picks are currently closed for this league");
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
        int maxRosterSize = league.getContestantsPerTribe() * tribeDao.countByLeagueId(league.getId());
        boolean isFull = currentPicks.size() >= maxRosterSize;

        if (request.noChange()) {
            if (!isFull) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "You can only keep your current roster once it's full");
            }
            mergeActionDao.save(new MergeAction(league.getId(), userId, MergeAction.ActionType.NONE, null, null));
        } else if (isFull) {
            performSwap(league, roster, currentPicks, request);
        } else {
            performAdd(league, roster, currentPicks, request);
        }

        return getMergeStatus(leagueId);
    }

    private void performAdd(League league, Roster roster, List<RosterPick> currentPicks, MergeActionRequest request) {
        if (request.addedContestantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "addedContestantId is required");
        }

        Contestant toAdd = contestantDao.findById(request.addedContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant not found"));

        validateBelongsToLeague(toAdd, league);

        if (toAdd.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add an eliminated contestant");
        }

        Set<Long> existingIds = currentPicks.stream().map(RosterPick::getContestantId).collect(Collectors.toSet());
        if (existingIds.contains(toAdd.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant is already on this roster");
        }

        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));
        mergeActionDao.save(new MergeAction(league.getId(), roster.getUserId(), MergeAction.ActionType.ADD, toAdd.getId(), null));
    }

    private void performSwap(League league, Roster roster, List<RosterPick> currentPicks, MergeActionRequest request) {
        if (request.addedContestantId() == null || request.removedContestantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both addedContestantId and removedContestantId are required for a swap");
        }

        Contestant toAdd = contestantDao.findById(request.addedContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to add not found"));
        Contestant toRemove = contestantDao.findById(request.removedContestantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to remove not found"));

        validateBelongsToLeague(toAdd, league);
        validateBelongsToLeague(toRemove, league);

        if (toAdd.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add an eliminated contestant");
        }
        if (toRemove.getEliminatedEpisode() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot swap out an eliminated contestant");
        }

        Set<Long> existingIds = currentPicks.stream().map(RosterPick::getContestantId).collect(Collectors.toSet());
        if (!existingIds.contains(toRemove.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant to remove is not on this roster");
        }
        if (existingIds.contains(toAdd.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant to add is already on this roster");
        }

        rosterPickDao.deletePickByRosterIdAndContestantId(roster.getId(), toRemove.getId());
        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));
        mergeActionDao.save(new MergeAction(league.getId(), roster.getUserId(), MergeAction.ActionType.SWAP, toAdd.getId(), toRemove.getId()));
    }

    private void validateBelongsToLeague(Contestant sc, League league) {
        if (!sc.getLeagueId().equals(league.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant does not belong to this league");
        }
    }

    @Transactional(readOnly = true)
    public MergeStatusResponse getMergeStatus(Long leagueId) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        Optional<Episode> mergeEpisode = episodeDao.findMergeEpisode(leagueId);
        boolean initiated = mergeEpisode.isPresent();

        List<MergeMemberStatus> memberStatuses = buildMemberStatuses(leagueId);

        return new MergeStatusResponse(
                initiated,
                mergeEpisode.map(Episode::getEpisodeNumber).orElse(null),
                league.isMergePicksOpen(),
                memberStatuses
        );
    }

    @Transactional
    public MergeStatusResponse adminSetMergeAction(Long leagueId, Long adminUserId, Long targetUserId,
                                                   Long addedContestantId, Long removedContestantId) {
        leagueMemberDao.findByLeagueIdAndUserId(leagueId, adminUserId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only league admins can override merge actions"));

        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (episodeDao.findMergeEpisode(leagueId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No episode has been flagged as the merge episode yet");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user has not submitted a roster"));

        // Revert any existing merge action for this user
        mergeActionDao.findByLeagueIdAndUserId(leagueId, targetUserId).ifPresent(existing -> {
            // Remove the previously-added contestant from the roster
            rosterPickDao.deletePickByRosterIdAndContestantId(roster.getId(), existing.getAddedContestantId());
            // For a swap, restore the previously-removed contestant
            if (existing.getRemovedContestantId() != null) {
                rosterPickDao.save(new RosterPick(roster.getId(), existing.getRemovedContestantId()));
            }
            mergeActionDao.deleteByLeagueIdAndUserId(leagueId, targetUserId);
        });

        // Validate new contestants
        Contestant toAdd = contestantDao.findById(addedContestantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to add not found"));
        validateBelongsToLeague(toAdd, league);

        if (removedContestantId != null) {
            Contestant toRemove = contestantDao.findById(removedContestantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contestant to remove not found"));
            validateBelongsToLeague(toRemove, league);
            rosterPickDao.deletePickByRosterIdAndContestantId(roster.getId(), toRemove.getId());
        }

        rosterPickDao.save(new RosterPick(roster.getId(), toAdd.getId()));

        MergeAction.ActionType actionType = removedContestantId != null
                ? MergeAction.ActionType.SWAP
                : MergeAction.ActionType.ADD;
        mergeActionDao.save(new MergeAction(leagueId, targetUserId, actionType, addedContestantId, removedContestantId));

        return getMergeStatus(leagueId);
    }

    @Transactional(readOnly = true)
    public Optional<MergeActionResponse> getMyMergeAction(Long leagueId, Long userId) {
        return mergeActionDao.findByLeagueIdAndUserId(leagueId, userId)
                .map(ma -> new MergeActionResponse(
                        ma.getActionType().name(),
                        ma.getAddedContestantId(),
                        ma.getRemovedContestantId()
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
