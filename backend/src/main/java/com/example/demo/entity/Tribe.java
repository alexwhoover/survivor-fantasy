package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tribes")
public class Tribe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "colour", nullable = false)
    private String colour;

    public Tribe() {}

    public Tribe(Long leagueId, String name, String colour) {
        this.leagueId = leagueId;
        this.name = name;
        this.colour = colour;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColour() { return colour; }
    public void setColour(String colour) { this.colour = colour; }
}
