CREATE TABLE season_tribes (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    season_id BIGINT      NOT NULL,
    name      VARCHAR(50) NOT NULL,
    colour    VARCHAR(7)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_season_tribe (season_id, name),
    CONSTRAINT fk_tribe_season FOREIGN KEY (season_id) REFERENCES seasons(id)
);

-- Season 50
INSERT INTO season_tribes (season_id, name, colour) VALUES
(1, 'Cila', '#3B82F6'),
(1, 'Vatu', '#EF4444'),
(1, 'Kalo', '#EAB308');

-- Season 49
INSERT INTO season_tribes (season_id, name, colour) VALUES
(2, 'Kele', '#22C55E'),
(2, 'Hina', '#F97316'),
(2, 'Uli',  '#8B5CF6');
