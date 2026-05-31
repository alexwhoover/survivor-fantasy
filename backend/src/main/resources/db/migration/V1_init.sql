CREATE TABLE seasons (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    name                 VARCHAR(100) NOT NULL,
    season_number        INT          NOT NULL,
    location             VARCHAR(100),
    premiere_date        DATE,
    finale_date          DATE,
    merge_episode        INT,
    status               ENUM('UPCOMING', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    winner_contestant_id BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_season_number (season_number)
);

CREATE TABLE contestants (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    first_name       VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    hometown   VARCHAR(100),
    state      VARCHAR(100),
    image_url  VARCHAR(500),
    PRIMARY KEY (id)
);

CREATE TABLE season_contestants (
    id                 BIGINT NOT NULL AUTO_INCREMENT,
    season_id          BIGINT NOT NULL,
    contestant_id      BIGINT NOT NULL,
    eliminated_episode INT,
    finish_place       INT,
    winner             BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_season_contestant (season_id, contestant_id),
    CONSTRAINT fk_sc_season     FOREIGN KEY (season_id)     REFERENCES seasons(id),
    CONSTRAINT fk_sc_contestant FOREIGN KEY (contestant_id) REFERENCES contestants(id)
);

ALTER TABLE seasons
    ADD CONSTRAINT fk_season_winner
    FOREIGN KEY (winner_contestant_id) REFERENCES contestants(id);