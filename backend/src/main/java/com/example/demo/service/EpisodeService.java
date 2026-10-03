package com.example.demo.service;

import com.example.demo.dao.EpisodeDao;
import com.example.demo.dao.EpisodeScoreDao;
import com.example.demo.dao.LeagueDao;
import com.example.demo.dto.EpisodeDto;
import com.example.demo.entity.Episode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Episodes are created manually by the site admin as the season progresses —
 * there's no fixed episode count decided up front. Episodes are always added in
 * sequence, and only the most recently added one can be removed (to undo a mistake).
 */
@Service
public class EpisodeService {

    private final EpisodeDao episodeDao;
    private final EpisodeScoreDao episodeScoreDao;
    private final LeagueDao leagueDao;

    @Autowired
    public EpisodeService(EpisodeDao episodeDao, EpisodeScoreDao episodeScoreDao, LeagueDao leagueDao) {
        this.episodeDao = episodeDao;
        this.episodeScoreDao = episodeScoreDao;
        this.leagueDao = leagueDao;
    }

    @Transactional(readOnly = true)
    public List<EpisodeDto> getEpisodes(Long leagueId) {
        requireLeague(leagueId);
        return episodeDao.findByLeagueId(leagueId).stream().map(this::toDto).toList();
    }

    @Transactional
    public EpisodeDto addEpisode(Long leagueId) {
        requireLeague(leagueId);

        Integer maxNumber = episodeDao.findMaxEpisodeNumber(leagueId);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;

        Episode episode = new Episode(leagueId, nextNumber, LocalDateTime.now());
        episodeDao.save(episode);
        return toDto(episode);
    }

    @Transactional
    public void deleteEpisode(Long leagueId, Long episodeId) {
        requireLeague(leagueId);
        Episode episode = episodeDao.findById(episodeId)
                .filter(e -> e.getLeagueId().equals(leagueId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found in this league"));

        Integer maxNumber = episodeDao.findMaxEpisodeNumber(leagueId);
        if (maxNumber == null || episode.getEpisodeNumber() != maxNumber) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only the most recently added episode can be removed");
        }
        if (!episodeScoreDao.findByLeagueIdAndEpisodeNumber(leagueId, episode.getEpisodeNumber()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove an episode that already has scores recorded");
        }
        if (episode.isMergeEpisode()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot remove the merge episode. Unmark it as the merge episode first.");
        }

        episodeDao.delete(episode);
    }

    /** Flags (or unflags) this episode as the season's merge episode. At most one may be flagged. */
    @Transactional
    public EpisodeDto setMergeEpisode(Long leagueId, Long episodeId, boolean isMergeEpisode) {
        requireLeague(leagueId);
        Episode episode = episodeDao.findById(episodeId)
                .filter(e -> e.getLeagueId().equals(leagueId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found in this league"));

        if (isMergeEpisode) {
            episodeDao.clearMergeFlag(leagueId);
        }
        episode.setMergeEpisode(isMergeEpisode);
        return toDto(episode);
    }

    private void requireLeague(Long leagueId) {
        leagueDao.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private EpisodeDto toDto(Episode episode) {
        return new EpisodeDto(episode.getId(), episode.getEpisodeNumber(), episode.isMergeEpisode());
    }
}
