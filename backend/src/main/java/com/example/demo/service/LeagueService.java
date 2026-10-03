package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.MergeActionDao;
import com.example.demo.dao.RosterDao;
import com.example.demo.dao.RosterPickDao;
import com.example.demo.dao.TribeDao;
import com.example.demo.dao.UserDao;
import com.example.demo.dto.ContestantSetupItem;
import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.TribeSetupItem;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.Episode;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import com.example.demo.entity.Tribe;
import com.example.demo.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LeagueService {

    private static final int DEFAULT_CONTESTANTS_PER_TRIBE = 2;

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final TribeDao tribeDao;
    private final ContestantDao contestantDao;
    private final EpisodeDao episodeDao;
    private final UserDao userDao;
    private final RosterDao rosterDao;
    private final RosterPickDao rosterPickDao;
    private final MergeActionDao mergeActionDao;

    @Autowired
    public LeagueService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao,
                         TribeDao tribeDao, ContestantDao contestantDao, EpisodeDao episodeDao,
                         UserDao userDao, RosterDao rosterDao, RosterPickDao rosterPickDao,
                         MergeActionDao mergeActionDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.tribeDao = tribeDao;
        this.contestantDao = contestantDao;
        this.episodeDao = episodeDao;
        this.userDao = userDao;
        this.rosterDao = rosterDao;
        this.rosterPickDao = rosterPickDao;
        this.mergeActionDao = mergeActionDao;
    }

    /** Leagues are global — every visitor sees every league, active and archived. */
    @Transactional(readOnly = true)
    public List<LeagueResponse> getAllLeagues() {
        return leagueDao.findAll().stream().map(this::toResponse).toList();
    }

    /**
     * Creates a fully configured league in one atomic step: the league itself, its
     * tribes, and its contestants. This is the only way season data is ever created —
     * there is no separate season-setup flow after a league exists.
     */
    @Transactional
    public LeagueResponse createLeague(String name, String seasonName, Integer contestantsPerTribe,
                                       List<TribeSetupItem> tribeItems, List<ContestantSetupItem> contestantItems) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "League name is required");
        }
        if (seasonName == null || seasonName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Season name is required");
        }

        int perTribe = contestantsPerTribe != null ? contestantsPerTribe : DEFAULT_CONTESTANTS_PER_TRIBE;
        if (perTribe < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contestants per tribe must be at least 1");
        }

        if (tribeItems == null || tribeItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one tribe is required");
        }

        Set<String> seenTribeNames = new HashSet<>();
        for (TribeSetupItem t : tribeItems) {
            if (t.name() == null || t.name().isBlank() || t.colour() == null || t.colour().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every tribe needs a name and colour");
            }
            if (!seenTribeNames.add(t.name().strip().toLowerCase())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tribe names must be unique");
            }
        }

        if (contestantItems == null || contestantItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one contestant is required");
        }

        int[] countsByTribe = new int[tribeItems.size()];
        for (ContestantSetupItem c : contestantItems) {
            if (c.firstName() == null || c.firstName().isBlank() || c.lastName() == null || c.lastName().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every contestant needs a first and last name");
            }
            if (c.tribeIndex() == null || c.tribeIndex() < 0 || c.tribeIndex() >= tribeItems.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every contestant must be assigned to a tribe");
            }
            countsByTribe[c.tribeIndex()]++;
        }

        for (int i = 0; i < tribeItems.size(); i++) {
            if (countsByTribe[i] < perTribe) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + tribeItems.get(i).name() + "\" needs at least " + perTribe + " contestant(s) assigned");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        League league = new League(name.strip(), seasonName.strip(), now);
        league.setContestantsPerTribe(perTribe);
        leagueDao.save(league);

        List<Tribe> savedTribes = new ArrayList<>();
        for (TribeSetupItem t : tribeItems) {
            Tribe tribe = new Tribe(league.getId(), t.name().strip(), t.colour().strip());
            tribeDao.save(tribe);
            savedTribes.add(tribe);
        }

        for (ContestantSetupItem c : contestantItems) {
            Tribe tribe = savedTribes.get(c.tribeIndex());
            Contestant contestant = new Contestant(league.getId(), tribe,
                    c.firstName().strip(), c.lastName().strip(), blankToNull(c.imageUrl()));
            contestantDao.save(contestant);
        }

        return toResponse(league);
    }

    @Transactional
    public LeagueResponse setArchived(Long leagueId, boolean archived) {
        League league = requireLeague(leagueId);
        league.setArchived(archived);
        return toResponse(league);
    }

    // --- Players ---
    // Players don't sign up; the admin creates them. A player is a `users` row (a name)
    // plus a membership row, so adding one creates both and the frontend only ever
    // deals with the league's player list.

    @Transactional(readOnly = true)
    public List<LeagueMemberResponse> getPlayers(Long leagueId) {
        requireLeague(leagueId);
        return leagueMemberDao.findMembersWithUsernames(leagueId);
    }

    @Transactional
    public List<LeagueMemberResponse> addPlayer(Long leagueId, String name) {
        requireLeague(leagueId);
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A player name is required");
        }

        String trimmed = name.strip();
        // Player names are globally unique (the column's own constraint), so a name used
        // in another season is reused as the same player rather than rejected.
        User player = userDao.findByUsername(trimmed)
                .orElseGet(() -> {
                    User created = new User(trimmed, LocalDateTime.now());
                    userDao.save(created);
                    return created;
                });

        if (leagueMemberDao.existsByLeagueIdAndUserId(leagueId, player.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "\"" + trimmed + "\" is already in this league");
        }

        leagueMemberDao.save(new LeagueMember(leagueId, player.getId(), LocalDateTime.now()));
        return leagueMemberDao.findMembersWithUsernames(leagueId);
    }

    /**
     * Removes a player from a league, along with the roster and merge action that only
     * meant anything inside it. The {@code users} row itself survives if the player is
     * still in another league, so removing someone from this season doesn't rewrite
     * an archived one.
     */
    @Transactional
    public List<LeagueMemberResponse> removePlayer(Long leagueId, Long playerId) {
        requireLeague(leagueId);

        LeagueMember membership = leagueMemberDao.findByLeagueIdAndUserId(leagueId, playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player is not in this league"));

        mergeActionDao.deleteByLeagueIdAndUserId(leagueId, playerId);
        rosterDao.findByLeagueIdAndUserId(leagueId, playerId).ifPresent(roster -> {
            rosterPickDao.deleteByRosterId(roster.getId());
            rosterDao.delete(roster);
        });
        leagueMemberDao.delete(membership);

        // The player row is shared across leagues, so it only goes when nothing is left
        // pointing at it. Hibernate flushes the delete above before running this query,
        // so the membership just removed isn't counted.
        if (leagueMemberDao.findByUserId(playerId).isEmpty()) {
            userDao.findById(playerId).ifPresent(userDao::delete);
        }

        return leagueMemberDao.findMembersWithUsernames(leagueId);
    }

    private League requireLeague(Long leagueId) {
        return leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.strip();
    }

    @Transactional(readOnly = true)
    public LeagueResponse getLeagueById(Long id) {
        return toResponse(requireLeague(id));
    }

    public LeagueResponse toResponse(League league) {
        return new LeagueResponse(
                league.getId(),
                league.getName(),
                league.getSeasonName(),
                league.getCreatedAt(),
                league.getContestantsPerTribe(),
                episodeDao.findMergeEpisode(league.getId()).map(Episode::getEpisodeNumber).orElse(null),
                league.isArchived()
        );
    }
}
