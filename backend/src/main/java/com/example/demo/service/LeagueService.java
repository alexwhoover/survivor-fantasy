package com.example.demo.service;

import com.example.demo.dao.LeagueDao;
import com.example.demo.dao.LeagueMemberDao;
import com.example.demo.dto.LeagueResponse;
import com.example.demo.entity.League;
import com.example.demo.entity.LeagueMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeagueService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final LeagueDao leagueDao;
    private final LeagueMemberDao leagueMemberDao;

    @Autowired
    public LeagueService(LeagueDao leagueDao, LeagueMemberDao leagueMemberDao) {
        this.leagueDao = leagueDao;
        this.leagueMemberDao = leagueMemberDao;
    }

    public List<LeagueResponse> getLeaguesForUser(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        return leagueDao.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public LeagueResponse createLeague(String name, Long seasonId, Long userId) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "League name is required");
        }
        if (seasonId == null || userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "seasonId and userId are required");
        }

        String code = generateUniqueCode();
        LocalDateTime now = LocalDateTime.now();

        League league = new League(name.strip(), code, seasonId, userId, now);
        leagueDao.save(league);

        LeagueMember admin = new LeagueMember(league.getId(), userId, LeagueMember.Role.ADMIN, now);
        leagueMemberDao.save(admin);

        return toResponse(league);
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

    public LeagueResponse getLeagueById(Long id) {
        League league = leagueDao.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
        return toResponse(league);
    }

    private LeagueResponse toResponse(League league) {
        return new LeagueResponse(
                league.getId(),
                league.getName(),
                league.getCode(),
                league.getSeasonId(),
                league.getCreatedBy(),
                league.getCreatedAt(),
                league.getContestantsPerTribe(),
                league.getPickDeadline()
        );
    }
}
