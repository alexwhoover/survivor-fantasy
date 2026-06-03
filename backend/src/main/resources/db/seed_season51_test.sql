-- Test seed: Survivor Season 51 with fake players
-- Run manually against local DB. NOT a Flyway migration.

INSERT INTO seasons (name, season_number, location, premiere_date, finale_date, merge_episode, status, num_episodes)
VALUES ('Survivor: New Horizons', 51, 'Mamanuca Islands, Fiji', '2026-09-23', '2026-12-16', 7, 'UPCOMING', 14);

SET @sid = LAST_INSERT_ID();

INSERT INTO contestants (first_name, last_name, hometown, state) VALUES
-- Loa tribe
('Maya',    'Chen',       'San Francisco', 'California'),
('Tyler',   'Brooks',     'Nashville',     'Tennessee'),
('Priya',   'Patel',      'Houston',       'Texas'),
('Danny',   'Kim',        'Seattle',       'Washington'),
('Sofia',   'Martinez',   'Phoenix',       'Arizona'),
('Marcus',  'Johnson',    'Chicago',       'Illinois'),
-- Moku tribe
('Rachel',  'Thompson',   'Boston',        'Massachusetts'),
('Kevin',   'Walsh',      'Portland',      'Oregon'),
('Aisha',   'Washington', 'Atlanta',       'Georgia'),
('Jake',    'Morrison',   'Denver',        'Colorado'),
('Elena',   'Rivera',     'Miami',         'Florida'),
('Noah',    'Bennett',    'Austin',        'Texas'),
-- Puna tribe
('Zoe',     'Clarke',     'Minneapolis',   'Minnesota'),
('Carlos',  'Reyes',      'Los Angeles',   'California'),
('Hannah',  'Lee',        'New York',      'New York'),
('Brandon', 'Scott',      'Philadelphia',  'Pennsylvania'),
('Natalie', 'Adams',      'Dallas',        'Texas'),
('Drew',    'Parker',     'San Diego',     'California');

SET @cid = LAST_INSERT_ID();  -- ID of the first inserted contestant (Maya Chen)

INSERT INTO season_tribes (season_id, name, colour) VALUES
(@sid, 'Loa',  '#06B6D4'),
(@sid, 'Moku', '#EC4899'),
(@sid, 'Puna', '#10B981');

INSERT INTO season_contestants (season_id, contestant_id, tribe) VALUES
(@sid, @cid +  0, 'Loa'),
(@sid, @cid +  1, 'Loa'),
(@sid, @cid +  2, 'Loa'),
(@sid, @cid +  3, 'Loa'),
(@sid, @cid +  4, 'Loa'),
(@sid, @cid +  5, 'Loa'),
(@sid, @cid +  6, 'Moku'),
(@sid, @cid +  7, 'Moku'),
(@sid, @cid +  8, 'Moku'),
(@sid, @cid +  9, 'Moku'),
(@sid, @cid + 10, 'Moku'),
(@sid, @cid + 11, 'Moku'),
(@sid, @cid + 12, 'Puna'),
(@sid, @cid + 13, 'Puna'),
(@sid, @cid + 14, 'Puna'),
(@sid, @cid + 15, 'Puna'),
(@sid, @cid + 16, 'Puna'),
(@sid, @cid + 17, 'Puna');
