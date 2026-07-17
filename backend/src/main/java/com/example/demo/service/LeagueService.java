package com.example.demo.service;

import com.example.demo.dao.ContestantDao;
import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dao.TribeDao;
import com.example.demo.dto.ContestantSetupItem;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.dto.TribeSetupItem;
import com.example.demo.entity.Contestant;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import com.example.demo.entity.Tribe;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LeagueService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int DEFAULT_CONTESTANTS_PER_TRIBE = 2;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;
    private final TribeDao tribeDao;
    private final ContestantDao contestantDao;
    private final EpisodeDao episodeDao;

    @Autowired
    public LeagueService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao,
                         TribeDao tribeDao, ContestantDao contestantDao, EpisodeDao episodeDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
        this.tribeDao = tribeDao;
        this.contestantDao = contestantDao;
        this.episodeDao = episodeDao;
    }

    public List<LeagueResponse> getLeaguesForUser(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        return leagueDao.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    /**
     * Creates a fully configured league in one atomic step: the league itself, its
     * tribes, and its contestants. This is the only way season data is ever created —
     * there is no separate season-setup flow after a league exists.
     */
    @Transactional
    public LeagueResponse createLeague(String name, String seasonName, Long userId, Integer contestantsPerTribe,
                                       List<TribeSetupItem> tribeItems, List<ContestantSetupItem> contestantItems) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "League name is required");
        }
        if (seasonName == null || seasonName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Season name is required");
        }
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
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

        String code = generateUniqueCode();
        LocalDateTime now = LocalDateTime.now();

        League league = new League(name.strip(), code, seasonName.strip(), userId, now);
        league.setContestantsPerTribe(perTribe);
        leagueDao.save(league);

        LeagueMember admin = new LeagueMember(league.getId(), userId, LeagueMember.Role.ADMIN, now);
        leagueMemberDao.save(admin);

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
    public LeagueResponse setInitialPicksOpen(Long leagueId, Long adminUserId, boolean open) {
        League league = requireAdminLeague(leagueId, adminUserId, "Only league admins can control picking");
        league.setInitialPicksOpen(open);
        return toResponse(league);
    }

    @Transactional
    public LeagueResponse setMergePicksOpen(Long leagueId, Long adminUserId, boolean open) {
        League league = requireAdminLeague(leagueId, adminUserId, "Only league admins can control picking");

        if (open && episodeDao.findMergeEpisode(leagueId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Flag an episode as the merge episode before opening merge picks");
        }

        league.setMergePicksOpen(open);
        return toResponse(league);
    }

    private League requireAdminLeague(Long leagueId, Long adminUserId, String forbiddenMessage) {
        if (adminUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "adminUserId is required");
        }

        League league = leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        leagueMemberDao.findByLeagueIdAndUserId(leagueId, adminUserId)
                .filter(m -> m.getRole() == LeagueMember.Role.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage));

        return league;
    }

    @Transactional
    public LeagueResponse joinLeague(String code, Long userId) {
        if (code == null || code.isBlank() || userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code and userId are required");
        }

        League league = leagueDao.findByCode(code.toUpperCase().strip())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (leagueMemberDao.existsByLeagueIdAndUserId(league.getId(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member of this league");
        }

        LeagueMember member = new LeagueMember(league.getId(), userId, LeagueMember.Role.MEMBER, LocalDateTime.now());
        leagueMemberDao.save(member);

        return toResponse(league);
    }

    private String generateUniqueCode() {
        for (int attempts = 0; attempts < 10; attempts++) {
            String code = randomCode();
            if (!leagueDao.existsByCode(code)) {
                return code;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique league code");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.strip();
    }

    public LeagueResponse getLeagueById(Long id) {
        League league = leagueDao.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
        return toResponse(league);
    }

    public LeagueResponse toResponse(League league) {
        return new LeagueResponse(
                league.getId(),
                league.getName(),
                league.getCode(),
                league.getSeasonName(),
                league.getCreatedBy(),
                league.getCreatedAt(),
                league.getContestantsPerTribe(),
                league.isInitialPicksOpen(),
                league.isMergePicksOpen()
        );
    }
}
