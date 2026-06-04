package com.example.demo.dao;

import com.example.demo.entity.Roster;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RosterDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(Roster roster) {
        entityManager.persist(roster);
    }

    public List<Roster> findAllByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT r FROM Roster r WHERE r.leagueId = :leagueId", Roster.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public Optional<Roster> findByLeagueIdAndUserId(Long leagueId, Long userId) {
        return entityManager.createQuery(
                "SELECT r FROM Roster r WHERE r.leagueId = :leagueId AND r.userId = :userId", Roster.class)
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .getResultStream()
                .findFirst();
    }
}
