-- Test seed: users, league, rosters, and episode scores for Season 51.
-- Run AFTER seed_season51_test.sql (this file is named to sort after it).
-- All users have password: "password"

SET @sid = (SELECT id FROM seasons WHERE season_number = 51);

-- Season 51 season_contestant IDs (Loa tribe)
SET @sc_maya    = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Maya'    AND c.last_name = 'Chen');
SET @sc_tyler   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Tyler'   AND c.last_name = 'Brooks');
SET @sc_priya   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Priya'   AND c.last_name = 'Patel');
SET @sc_danny   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Danny'   AND c.last_name = 'Kim');
SET @sc_sofia   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Sofia'   AND c.last_name = 'Martinez');
SET @sc_marcus  = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Marcus'  AND c.last_name = 'Johnson');
-- Moku tribe
SET @sc_rachel  = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Rachel'  AND c.last_name = 'Thompson');
SET @sc_kevin   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Kevin'   AND c.last_name = 'Walsh');
SET @sc_aisha   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Aisha'   AND c.last_name = 'Washington');
SET @sc_jake    = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Jake'    AND c.last_name = 'Morrison');
SET @sc_elena   = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Elena'   AND c.last_name = 'Rivera');
SET @sc_noah    = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Noah'    AND c.last_name = 'Bennett');
-- Puna tribe
SET @sc_zoe     = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Zoe'     AND c.last_name = 'Clarke');
SET @sc_carlos  = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Carlos'  AND c.last_name = 'Reyes');
SET @sc_hannah  = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Hannah'  AND c.last_name = 'Lee');
SET @sc_brandon = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Brandon' AND c.last_name = 'Scott');
SET @sc_natalie = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Natalie' AND c.last_name = 'Adams');
SET @sc_drew    = (SELECT sc.id FROM season_contestants sc JOIN contestants c ON c.id = sc.contestant_id WHERE sc.season_id = @sid AND c.first_name = 'Drew'    AND c.last_name = 'Parker');

-- ─── Users ────────────────────────────────────────────────────────────────────

INSERT INTO users (username, password_hash) VALUES
('alex',   '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('jordan', '$2b$10$HQgVmAe6pvRoqGFhmEL1MuNdQnTK08U4khsM72v/VVpnXWwV5OCl6'),
('sam',    '$2b$10$l4OrCgQWYT/4B4tfGnoQqegoa0a8d.b7HQ8KpcmtdpXzAQRmSHx8e'),
('casey',  '$2b$10$NRYKi8nMQOdxvNMlrEF0XeSL4u9.RM/IdFHE3NkeI5kEaUCFikpTW');

SET @uid_alex   = (SELECT id FROM users WHERE username = 'alex');
SET @uid_jordan = (SELECT id FROM users WHERE username = 'jordan');
SET @uid_sam    = (SELECT id FROM users WHERE username = 'sam');
SET @uid_casey  = (SELECT id FROM users WHERE username = 'casey');

-- ─── League ───────────────────────────────────────────────────────────────────

INSERT INTO leagues (name, code, season_id, pick_deadline, merge_episode, current_episode, contestants_per_tribe, created_by)
VALUES ('Season 51 League', 'SURV51', @sid, '2026-09-22 23:59:59', 7, 3, 2, @uid_alex);

SET @lid = LAST_INSERT_ID();

-- ─── League members ───────────────────────────────────────────────────────────

INSERT INTO league_members (league_id, user_id, role) VALUES
(@lid, @uid_alex,   'ADMIN'),
(@lid, @uid_jordan, 'MEMBER'),
(@lid, @uid_sam,    'MEMBER'),
(@lid, @uid_casey,  'MEMBER');

-- ─── Rosters ──────────────────────────────────────────────────────────────────
-- Each user picks 2 per tribe (contestants_per_tribe = 2) and 1 MVP.

INSERT INTO rosters (league_id, user_id, mvp_season_contestant_id, submitted_at) VALUES
(@lid, @uid_alex,   @sc_maya,   '2026-09-22 10:00:00'),
(@lid, @uid_jordan, @sc_jake,   '2026-09-22 12:30:00'),
(@lid, @uid_sam,    @sc_elena,  '2026-09-22 18:45:00'),
(@lid, @uid_casey,  @sc_priya,  '2026-09-22 22:00:00');

SET @rid_alex   = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_alex);
SET @rid_jordan = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_jordan);
SET @rid_sam    = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_sam);
SET @rid_casey  = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_casey);

-- alex: Loa(Maya, Tyler), Moku(Rachel, Kevin), Puna(Zoe, Carlos)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_alex, @sc_maya), (@rid_alex, @sc_tyler),
(@rid_alex, @sc_rachel), (@rid_alex, @sc_kevin),
(@rid_alex, @sc_zoe), (@rid_alex, @sc_carlos);

-- jordan: Loa(Priya, Danny), Moku(Aisha, Jake), Puna(Hannah, Brandon)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_jordan, @sc_priya), (@rid_jordan, @sc_danny),
(@rid_jordan, @sc_aisha), (@rid_jordan, @sc_jake),
(@rid_jordan, @sc_hannah), (@rid_jordan, @sc_brandon);

-- sam: Loa(Sofia, Marcus), Moku(Elena, Noah), Puna(Natalie, Drew)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_sam, @sc_sofia), (@rid_sam, @sc_marcus),
(@rid_sam, @sc_elena), (@rid_sam, @sc_noah),
(@rid_sam, @sc_natalie), (@rid_sam, @sc_drew);

-- casey: Loa(Maya, Priya), Moku(Kevin, Aisha), Puna(Carlos, Hannah)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_casey, @sc_maya), (@rid_casey, @sc_priya),
(@rid_casey, @sc_kevin), (@rid_casey, @sc_aisha),
(@rid_casey, @sc_carlos), (@rid_casey, @sc_hannah);

-- ─── Episode scores (episodes 1–3) ───────────────────────────────────────────

INSERT INTO episode_scores (season_contestant_id, league_id, episode_number, points) VALUES
-- Episode 2
(@sc_maya,    @lid,  2,  8), (@sc_tyler,   @lid,  2,  4), (@sc_priya,   @lid,  2,  3), (@sc_danny,   @lid,  2,  6),
(@sc_sofia,   @lid,  2,  2), (@sc_marcus,  @lid,  2,  7), (@sc_rachel,  @lid,  2,  5), (@sc_kevin,   @lid,  2,  8),
(@sc_aisha,   @lid,  2,  3), (@sc_jake,    @lid,  2,  4), (@sc_elena,   @lid,  2,  9), (@sc_noah,    @lid,  2,  5),
(@sc_zoe,     @lid,  2,  2), (@sc_carlos,  @lid,  2,  7), (@sc_hannah,  @lid,  2,  6), (@sc_brandon, @lid,  2,  3),
(@sc_natalie, @lid,  2,  4), (@sc_drew,    @lid,  2,  8),
-- Episode 3
(@sc_maya,    @lid,  3,  6), (@sc_tyler,   @lid,  3,  5), (@sc_priya,   @lid,  3,  4), (@sc_danny,   @lid,  3,  8),
(@sc_sofia,   @lid,  3,  3), (@sc_marcus,  @lid,  3,  2), (@sc_rachel,  @lid,  3,  7), (@sc_kevin,   @lid,  3,  4),
(@sc_aisha,   @lid,  3,  8), (@sc_jake,    @lid,  3,  3), (@sc_elena,   @lid,  3,  5), (@sc_noah,    @lid,  3,  6),
(@sc_zoe,     @lid,  3,  9), (@sc_carlos,  @lid,  3,  2), (@sc_hannah,  @lid,  3,  5), (@sc_brandon, @lid,  3,  7),
(@sc_natalie, @lid,  3,  3), (@sc_drew,    @lid,  3,  4);
