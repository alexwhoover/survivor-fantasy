package com.example.demo.dao;

import com.example.demo.entity.Contestant;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ContestantDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(Contestant contestant) {
        entityManager.persist(contestant);
    }

    public Optional<Contestant> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Contestant.class, id));
    }

    public List<Contestant> findByLeagueId(Long leagueId) {
        return entityManager.createQuery(
                "SELECT c FROM Contestant c LEFT JOIN FETCH c.tribe " +
                "WHERE c.leagueId = :leagueId ORDER BY c.id",
                Contestant.class)
                .setParameter("leagueId", leagueId)
                .getResultList();
    }

}
