ALTER TABLE episode_scores
    ADD COLUMN league_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_es_league FOREIGN KEY (league_id) REFERENCES leagues(id),
    DROP KEY uq_episode_score,
    ADD UNIQUE KEY uq_episode_score (season_contestant_id, episode_number, league_id);
