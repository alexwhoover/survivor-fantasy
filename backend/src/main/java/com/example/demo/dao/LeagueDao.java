package com.example.demo.dao;

import com.example.demo.entity.League;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class LeagueDao {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(League league) {
        entityManager.persist(league);
    }

    public Optional<League> findById(Long id) {
        return Optional.ofNullable(entityManager.find(League.class, id));
    }

    /** Every league, newest first — leagues are global, so this is what visitors browse. */
    public List<League> findAll() {
        return entityManager.createQuery(
                "SELECT l FROM League l ORDER BY l.createdAt DESC, l.id DESC", League.class)
                .getResultList();
    }
}
