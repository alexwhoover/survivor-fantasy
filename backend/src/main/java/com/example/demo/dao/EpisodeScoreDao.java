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

    public Optional<EpisodeScore> findBySeasonContestantIdAndEpisodeNumber(Long seasonContestantId, int episodeNumber) {
        return entityManager.createQuery(
                "SELECT es FROM EpisodeScore es WHERE es.seasonContestantId = :scId AND es.episodeNumber = :ep",
                EpisodeScore.class)
                .setParameter("scId", seasonContestantId)
                .setParameter("ep", episodeNumber)
                .getResultStream()
                .findFirst();
    }

    public List<EpisodeScore> findBySeasonIdAndEpisodeNumber(Long seasonId, int episodeNumber) {
        return entityManager.createQuery(
                "SELECT es FROM EpisodeScore es " +
                "JOIN SeasonContestant sc ON es.seasonContestantId = sc.id " +
                "WHERE sc.seasonId = :seasonId AND es.episodeNumber = :ep",
                EpisodeScore.class)
                .setParameter("seasonId", seasonId)
                .setParameter("ep", episodeNumber)
                .getResultList();
    }
}
