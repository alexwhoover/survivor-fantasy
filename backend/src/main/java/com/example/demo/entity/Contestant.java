package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contestants")
public class Contestant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "hometown")
    private String hometown;

    @Column(name = "state")
    private String state;

    @Column(name = "image_url")
    private String imageUrl;

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getHometown() { return hometown; }
    public String getState() { return state; }
    public String getImageUrl() { return imageUrl; }
}
