package com.example.demo.dao;

import com.example.demo.entity.EpisodeScore;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class EpisodeScoreDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(EpisodeScore score) {
        entityManager.persist(score);
    }

    public Optional<EpisodeScore> findByContestantIdAndEpisodeNumber(Long contestantId, int episodeNumber) {
        return entityManager.createQuery(
                "SELECT es FROM EpisodeScore es WHERE es.contestantId = :cId AND es.episodeNumber = :ep",
                EpisodeScore.class)
                .setParameter("cId", contestantId)
                .setParameter("ep", episodeNumber)
                .getResultStream()
                .findFirst();
    }

    public List<EpisodeScore> findByLeagueIdAndEpisodeNumber(Long leagueId, int episodeNumber) {
        return entityManager.createQuery(
                "SELECT es FROM EpisodeScore es " +
                "JOIN Contestant c ON es.contestantId = c.id " +
                "WHERE c.leagueId = :leagueId AND es.episodeNumber = :ep",
                EpisodeScore.class)
                .setParameter("leagueId", leagueId)
                .setParameter("ep", episodeNumber)
                .getResultList();
    }

    public List<EpisodeScore> findAllByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT es FROM EpisodeScore es " +
                "JOIN Contestant c ON es.contestantId = c.id " +
                "WHERE c.leagueId = :leagueId",
                EpisodeScore.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public void deleteByContestantId(Long contestantId) {
        entityManager.createQuery("DELETE FROM EpisodeScore es WHERE es.contestantId = :cId")
                .setParameter("cId", contestantId)
                .executeUpdate();
    }
}
