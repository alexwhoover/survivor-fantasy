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
