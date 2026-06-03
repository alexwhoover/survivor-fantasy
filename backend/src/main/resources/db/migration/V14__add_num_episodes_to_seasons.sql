ALTER TABLE seasons ADD COLUMN num_episodes INT NOT NULL DEFAULT 0;

UPDATE seasons SET num_episodes = 14 WHERE id = 1; -- Season 50
UPDATE seasons SET num_episodes = 13 WHERE id = 2; -- Season 49
