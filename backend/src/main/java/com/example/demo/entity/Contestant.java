package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contestants")
public class Contestant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tribe_id")
    private Tribe tribe;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "hometown")
    private String hometown;

    @Column(name = "state")
    private String state;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "eliminated_episode")
    private Integer eliminatedEpisode;

    @Column(name = "winner", nullable = false)
    private boolean winner;

    public Contestant() {}

    public Contestant(Long leagueId, Tribe tribe, String firstName, String lastName,
                      String hometown, String state, String imageUrl) {
        this.leagueId = leagueId;
        this.tribe = tribe;
        this.firstName = firstName;
        this.lastName = lastName;
        this.hometown = hometown;
        this.state = state;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Tribe getTribe() { return tribe; }
    public void setTribe(Tribe tribe) { this.tribe = tribe; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getHometown() { return hometown; }
    public void setHometown(String hometown) { this.hometown = hometown; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getEliminatedEpisode() { return eliminatedEpisode; }
    public void setEliminatedEpisode(Integer eliminatedEpisode) { this.eliminatedEpisode = eliminatedEpisode; }
    public boolean isWinner() { return winner; }
    public void setWinner(boolean winner) { this.winner = winner; }
}
