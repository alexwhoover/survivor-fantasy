CREATE TABLE episode_scores (
    id                   BIGINT NOT NULL AUTO_INCREMENT,
    season_contestant_id BIGINT NOT NULL,
    episode_number       INT    NOT NULL,
    points               INT    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_episode_score (season_contestant_id, episode_number),
    CONSTRAINT fk_es_season_contestant FOREIGN KEY (season_contestant_id) REFERENCES season_contestants(id)
);
