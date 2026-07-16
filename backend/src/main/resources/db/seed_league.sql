-- Test seed: a league running fake "Season 51" with fake players.
-- The league owns its entire season configuration (name, tribes, contestants).
-- Run manually against local DB via ./seed.sh [1|2|3|4]. NOT a Flyway migration.

-- ─── Cleanup any previous seed data ───────────────────────────────────────────
-- Test users are fully disposable, so wipe every league they created (not just
-- the SURV51 seed league) plus any membership/roster rows tied to them directly —
-- they may have created or joined other leagues manually while testing the app.

CREATE TEMPORARY TABLE _seed_user_ids AS
    SELECT id FROM users WHERE username IN ('alex', 'jordan', 'sam', 'casey');

CREATE TEMPORARY TABLE _seed_league_ids AS
    SELECT id FROM leagues WHERE created_by IN (SELECT id FROM _seed_user_ids);

DELETE FROM merge_actions
    WHERE league_id IN (SELECT id FROM _seed_league_ids)
       OR user_id   IN (SELECT id FROM _seed_user_ids);

DELETE es FROM episode_scores es JOIN contestants c ON es.contestant_id = c.id
    WHERE c.league_id IN (SELECT id FROM _seed_league_ids);

DELETE FROM episodes WHERE league_id IN (SELECT id FROM _seed_league_ids);

DELETE rp FROM roster_picks rp JOIN rosters r ON rp.roster_id = r.id
    WHERE r.league_id IN (SELECT id FROM _seed_league_ids)
       OR r.user_id   IN (SELECT id FROM _seed_user_ids);

DELETE FROM rosters
    WHERE league_id IN (SELECT id FROM _seed_league_ids)
       OR user_id   IN (SELECT id FROM _seed_user_ids);

DELETE FROM league_members
    WHERE league_id IN (SELECT id FROM _seed_league_ids)
       OR user_id   IN (SELECT id FROM _seed_user_ids);

DELETE FROM contestants WHERE league_id IN (SELECT id FROM _seed_league_ids);
DELETE FROM tribes      WHERE league_id IN (SELECT id FROM _seed_league_ids);
DELETE FROM leagues     WHERE id IN (SELECT id FROM _seed_league_ids);
DELETE FROM users       WHERE id IN (SELECT id FROM _seed_user_ids);

DROP TEMPORARY TABLE _seed_user_ids;
DROP TEMPORARY TABLE _seed_league_ids;

DELETE FROM SPRING_SESSION_ATTRIBUTES;
DELETE FROM SPRING_SESSION;

-- ─── Users (password: "password") ─────────────────────────────────────────────

INSERT INTO users (username, password_hash) VALUES
('alex',   '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('jordan', '$2b$10$HQgVmAe6pvRoqGFhmEL1MuNdQnTK08U4khsM72v/VVpnXWwV5OCl6'),
('sam',    '$2b$10$l4OrCgQWYT/4B4tfGnoQqegoa0a8d.b7HQ8KpcmtdpXzAQRmSHx8e'),
('casey',  '$2b$10$NRYKi8nMQOdxvNMlrEF0XeSL4u9.RM/IdFHE3NkeI5kEaUCFikpTW');

SET @uid_alex = (SELECT id FROM users WHERE username = 'alex');

-- ─── League with its own season configuration ─────────────────────────────────

INSERT INTO leagues (name, code, season_name, initial_picks_open, contestants_per_tribe, created_by)
VALUES ('Season 51 League', 'SURV51', 'Survivor: New Horizons', TRUE, 2, @uid_alex);

SET @lid = LAST_INSERT_ID();

INSERT INTO league_members (league_id, user_id, role)
SELECT @lid, id, IF(username = 'alex', 'ADMIN', 'MEMBER')
FROM users WHERE username IN ('alex', 'jordan', 'sam', 'casey');

-- ─── Tribes ───────────────────────────────────────────────────────────────────

INSERT INTO tribes (league_id, name, colour) VALUES
(@lid, 'Loa',  '#06B6D4'),
(@lid, 'Moku', '#EC4899'),
(@lid, 'Puna', '#10B981');

SET @tid_loa  = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Loa');
SET @tid_moku = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Moku');
SET @tid_puna = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Puna');

-- ─── Contestants ──────────────────────────────────────────────────────────────

INSERT INTO contestants (league_id, tribe_id, first_name, last_name, hometown, state) VALUES
-- Loa tribe
(@lid, @tid_loa,  'Maya',    'Chen',       'San Francisco', 'California'),
(@lid, @tid_loa,  'Tyler',   'Brooks',     'Nashville',     'Tennessee'),
(@lid, @tid_loa,  'Priya',   'Patel',      'Houston',       'Texas'),
(@lid, @tid_loa,  'Danny',   'Kim',        'Seattle',       'Washington'),
(@lid, @tid_loa,  'Sofia',   'Martinez',   'Phoenix',       'Arizona'),
(@lid, @tid_loa,  'Marcus',  'Johnson',    'Chicago',       'Illinois'),
-- Moku tribe
(@lid, @tid_moku, 'Rachel',  'Thompson',   'Boston',        'Massachusetts'),
(@lid, @tid_moku, 'Kevin',   'Walsh',      'Portland',      'Oregon'),
(@lid, @tid_moku, 'Aisha',   'Washington', 'Atlanta',       'Georgia'),
(@lid, @tid_moku, 'Jake',    'Morrison',   'Denver',        'Colorado'),
(@lid, @tid_moku, 'Elena',   'Rivera',     'Miami',         'Florida'),
(@lid, @tid_moku, 'Noah',    'Bennett',    'Austin',        'Texas'),
-- Puna tribe
(@lid, @tid_puna, 'Zoe',     'Clarke',     'Minneapolis',   'Minnesota'),
(@lid, @tid_puna, 'Carlos',  'Reyes',      'Los Angeles',   'California'),
(@lid, @tid_puna, 'Hannah',  'Lee',        'New York',      'New York'),
(@lid, @tid_puna, 'Brandon', 'Scott',      'Philadelphia',  'Pennsylvania'),
(@lid, @tid_puna, 'Natalie', 'Adams',      'Dallas',        'Texas'),
(@lid, @tid_puna, 'Drew',    'Parker',     'San Diego',     'California');
