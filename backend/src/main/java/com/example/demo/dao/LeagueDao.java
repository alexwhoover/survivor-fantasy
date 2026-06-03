package com.example.demo.dao;

import com.example.demo.entity.League;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class LeagueDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(League league) {
        entityManager.persist(league);
    }

    public boolean existsByCode(String code) {
        return !entityManager.createQuery(
                "SELECT l FROM League l WHERE l.code = :code", League.class)
                .setParameter("code", code)
                .getResultStream()
                .findFirst()
                .isEmpty();
    }

    public Optional<League> findByCode(String code) {
        return entityManager.createQuery(
                "SELECT l FROM League l WHERE l.code = :code", League.class)
                .setParameter("code", code)
                .getResultStream()
                .findFirst();
    }
}
