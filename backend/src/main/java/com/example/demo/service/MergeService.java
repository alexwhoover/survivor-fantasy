package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dao.TribeDao;
import com.example.demo.dto.RosterResponse;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.League;
import com.example.demo.entity.MergeAction;
import com.example.demo.entity.Roster;
import com.example.demo.entity.RosterPick;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * The post-merge re-draft. Every move is entered by the admin on a player's behalf, and
 * setting one is idempotent: an existing action is reverted first, so the same call
 * serves both the first entry and a later correction.
 */
@Service
public class MergeService {

    private final LeagueDao leagueDao;
    private final MergeActionDao mergeActionDao;
    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final ContestantDao contestantDao;
    private final EpisodeDao episodeDao;
    private final TribeDao tribeDao;
    private final RosterService rosterService;

    @Autowired
    public MergeService(LeagueDao leagueDao, MergeActionDao mergeActionDao,
                        RosterDao rosterDao, RosterPickDao rosterPickDao, ContestantDao contestantDao,
                        EpisodeDao episodeDao, TribeDao tribeDao, RosterService rosterService) {
        this.leagueDao = leagueDao;
        this.mergeActionDao = mergeActionDao;
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.contestantDao = contestantDao;
        this.episodeDao = episodeDao;
        this.tribeDao = tribeDao;
        this.rosterService = rosterService;
    }

    /** Returns the player's roster as it stands after the move, merge action included. */
    @Transactional
    public RosterResponse setMergeAction(Long leagueId, Long playerId, Long addedContestantId,
                                         Long removedContestantId, boolean noChange) {
        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (episodeDao.findMergeEpisode(leagueId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No episode has been flagged as the merge episode yet");
        }

        Roster roster = rosterDao.findByLeagueIdAndUserId(leagueId, playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "This player has no roster yet"));

        // Revert any existing merge action for this player
        mergeActionDao.findByLeagueIdAndUserId(leagueId, playerId).ifPresent(existing -> {
            // Remove the previously-added contestant from the roster
            rosterPickDao.deletePickByRosterIdAndContestantId(roster.getId(), existing.getAddedContestantId());
            // For a swap, restore the previously-removed contestant
            if (existing.getRemovedContestantId() != null) {
                rosterPickDao.save(new RosterPick(roster.getId(), existing.getRemovedContestantId()));
            }
            mergeActionDao.deleteByLeagueIdAndUserId(leagueId, playerId);
        });

        if (noChange) {
            int maxRosterSize = league.getContestantsPerTribe() * tribeDao.countByLeagueId(league.getId());
            int rosterSize = rosterPickDao.findByRosterId(roster.getId()).size();
            if (rosterSize < maxRosterSize) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The roster can only be kept unchanged once it's full");
            }
            mergeActionDao.save(new MergeAction(leagueId, playerId, MergeAction.ActionType.NONE, null, null));
            return rosterService.getRosterForUser(leagueId, playerId).orElseThrow();
        }

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
        mergeActionDao.save(new MergeAction(leagueId, playerId, actionType, addedContestantId, removedContestantId));

        return rosterService.getRosterForUser(leagueId, playerId).orElseThrow();
    }

    private void validateBelongsToLeague(Contestant sc, League league) {
        if (!sc.getLeagueId().equals(league.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestant does not belong to this league");
        }
    }
}
