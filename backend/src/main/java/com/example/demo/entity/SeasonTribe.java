package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "season_tribes")
public class SeasonTribe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "colour", nullable = false)
    private String colour;

    public Long getId() { return id; }
    public Long getSeasonId() { return seasonId; }
    public String getName() { return name; }
    public String getColour() { return colour; }
}
