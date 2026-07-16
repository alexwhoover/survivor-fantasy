package com.example.demo.dao;

import com.example.demo.entity.Episode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class EpisodeDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(Episode episode) {
        entityManager.persist(episode);
    }

    public Optional<Episode> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Episode.class, id));
    }

    public List<Episode> findByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT e FROM Episode e WHERE e.leagueId = :leagueId ORDER BY e.episodeNumber",
                Episode.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public Integer findMaxEpisodeNumber(Long leagueId) {
        return entityManager.createQuery(
                "SELECT MAX(e.episodeNumber) FROM Episode e WHERE e.leagueId = :leagueId",
                Integer.class)
                .setParameter("leagueId", leagueId)
                .getSingleResult();
    }

    public boolean existsByLeagueIdAndEpisodeNumber(Long leagueId, int episodeNumber) {
        Long count = entityManager.createQuery(
                "SELECT COUNT(e) FROM Episode e WHERE e.leagueId = :leagueId AND e.episodeNumber = :ep", Long.class)
                .setParameter("leagueId", leagueId)
                .setParameter("ep", episodeNumber)
                .getSingleResult();
        return count > 0;
    }

    public void delete(Episode episode) {
        entityManager.remove(episode);
    }
}
