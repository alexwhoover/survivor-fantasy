package com.example.demo.dao;

import com.example.demo.dto.LeagueMemberResponse;
import com.example.demo.entity.LeagueMember;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class LeagueMemberDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(LeagueMember leagueMember) {
        entityManager.persist(leagueMember);
    }

    public Optional<LeagueMember> findByLeagueIdAndUserId(Long leagueId, Long userId) {
        return entityManager.createQuery(
                "SELECT m FROM LeagueMember m WHERE m.leagueId = :leagueId AND m.userId = :userId",
                LeagueMember.class)
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .getResultStream()
                .findFirst();
    }

    public List<LeagueMemberResponse> findMembersWithUsernames(Long leagueId) {
        return entityManager.createQuery(
                "SELECT new com.example.demo.dto.LeagueMemberResponse(m.userId, u.username, m.role, m.joinedAt) " +
                "FROM LeagueMember m, User u " +
                "WHERE u.id = m.userId AND m.leagueId = :leagueId " +
                "ORDER BY m.joinedAt ASC",
                LeagueMemberResponse.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

    public boolean existsByLeagueIdAndUserId(Long leagueId, Long userId) {
        Long count = entityManager.createQuery(
                "SELECT COUNT(m) FROM LeagueMember m WHERE m.leagueId = :leagueId AND m.userId = :userId", Long.class)
                .setParameter("leagueId", leagueId)
                .setParameter("userId", userId)
                .getSingleResult();
        return count > 0;
    }
}
