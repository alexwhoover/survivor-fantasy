package com.example.demo.dao;

import com.example.demo.entity.MergeAction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class MergeActionDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(MergeAction mergeAction) {
        entityManager.persist(mergeAction);
    }

    public Optional<MergeAction> findByLeagueIdAndUserId(Long leagueId, Long userId) {
        return entityManager.createQuery(
                "SELECT ma FROM MergeAction ma WHERE ma.leagueId = :leagueId AND ma.userId = :userId",
                MergeAction.class)
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .getResultStream()
                .findFirst();
    }

    public List<MergeAction> findByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT ma FROM MergeAction ma WHERE ma.leagueId = :leagueId",
                MergeAction.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public boolean existsByLeagueIdAndUserId(Long leagueId, Long userId) {
        Long count = entityManager.createQuery(
                "SELECT COUNT(ma) FROM MergeAction ma WHERE ma.leagueId = :leagueId AND ma.userId = :userId",
                Long.class)
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .getSingleResult();
        return count > 0;
    }

    public void deleteByLeagueIdAndUserId(Long leagueId, Long userId) {
        entityManager.createQuery(
                "DELETE FROM MergeAction ma WHERE ma.leagueId = :leagueId AND ma.userId = :userId")
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .executeUpdate();
    }
}
