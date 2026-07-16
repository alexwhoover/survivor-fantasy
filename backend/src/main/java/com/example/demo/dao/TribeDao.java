package com.example.demo.dao;

import com.example.demo.entity.Tribe;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class TribeDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(Tribe tribe) {
        entityManager.persist(tribe);
    }

    public Optional<Tribe> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Tribe.class, id));
    }

    public List<Tribe> findByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT t FROM Tribe t WHERE t.leagueId = :leagueId ORDER BY t.id", Tribe.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public int countByLeagueId(Long leagueId) {
        Long count = entityManager.createQuery(
                "SELECT COUNT(t) FROM Tribe t WHERE t.leagueId = :leagueId", Long.class)
                .setParameter("leagueId", leagueId)
                .getSingleResult();
        return count.intValue();
    }
}
