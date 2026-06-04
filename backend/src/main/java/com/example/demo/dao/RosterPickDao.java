package com.example.demo.dao;

import com.example.demo.entity.RosterPick;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RosterPickDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(RosterPick pick) {
        entityManager.persist(pick);
    }

    public List<RosterPick> findByRosterId(Long rosterId) {
        return entityManager.createQuery(
                "SELECT p FROM RosterPick p WHERE p.rosterId = :rosterId", RosterPick.class)
                .setParameter("rosterId", rosterId)
                .getResultList();
    }

    public void deleteByRosterId(Long rosterId) {
        entityManager.createQuery("DELETE FROM RosterPick p WHERE p.rosterId = :rosterId")
                .setParameter("rosterId", rosterId)
                .executeUpdate();
    }

    public void deletePickByRosterIdAndSeasonContestantId(Long rosterId, Long seasonContestantId) {
        entityManager.createQuery(
                "DELETE FROM RosterPick p WHERE p.rosterId = :rosterId AND p.seasonContestantId = :scId")
                .setParameter("rosterId", rosterId)
                .setParameter("scId", seasonContestantId)
                .executeUpdate();
    }
}
