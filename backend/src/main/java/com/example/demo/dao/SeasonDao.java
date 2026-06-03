package com.example.demo.dao;

import com.example.demo.entity.Season;
import com.example.demo.entity.SeasonContestant;
import com.example.demo.entity.SeasonTribe;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class SeasonDao {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Season> findAll() {
        return entityManager.createQuery(
                "SELECT s FROM Season s ORDER BY s.seasonNumber DESC",
                Season.class
        ).getResultList();
    }

    public Optional<Season> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Season.class, id));
    }

    public Map<String, String> findTribeColoursBySeasonId(Long seasonId) {
        return entityManager.createQuery(
                "SELECT t FROM SeasonTribe t WHERE t.seasonId = :seasonId", SeasonTribe.class)
                .setParameter("seasonId", seasonId)
                .getResultList()
                .stream()
                .collect(Collectors.toMap(SeasonTribe::getName, SeasonTribe::getColour));
    }

    public List<SeasonContestant> findContestantsBySeasonId(Long seasonId) {
        return entityManager.createQuery(
                "SELECT sc FROM SeasonContestant sc JOIN FETCH sc.contestant WHERE sc.seasonId = :seasonId ORDER BY sc.finishPlace",
                SeasonContestant.class
        ).setParameter("seasonId", seasonId).getResultList();
    }
}
