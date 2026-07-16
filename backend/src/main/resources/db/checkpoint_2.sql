-- Checkpoint 2: 4 episodes aired, picking closed, no merge initiated yet.
-- Eliminations: Brandon(ep1) Natalie(ep2) Danny(ep3) Priya(ep4)
-- Scores entered for episodes 2, 3, 4.
-- Run: ./seed.sh 2

-- ─── Variables ────────────────────────────────────────────────────────────────

SET @lid = (SELECT id FROM leagues WHERE code = 'SURV51');

SET @uid_alex   = (SELECT id FROM users WHERE username = 'alex');
SET @uid_jordan = (SELECT id FROM users WHERE username = 'jordan');
SET @uid_sam    = (SELECT id FROM users WHERE username = 'sam');
SET @uid_casey  = (SELECT id FROM users WHERE username = 'casey');

SET @c_maya    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Maya');
SET @c_tyler   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Tyler');
SET @c_priya   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Priya');
SET @c_danny   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Danny');
SET @c_sofia   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Sofia');
SET @c_marcus  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Marcus');
SET @c_rachel  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Rachel');
SET @c_kevin   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Kevin');
SET @c_aisha   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Aisha');
SET @c_jake    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Jake');
SET @c_elena   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Elena');
SET @c_noah    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Noah');
SET @c_zoe     = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Zoe');
SET @c_carlos  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Carlos');
SET @c_hannah  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Hannah');
SET @c_brandon = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Brandon');
SET @c_natalie = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Natalie');
SET @c_drew    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Drew');

-- ─── Reset league state ───────────────────────────────────────────────────────

DELETE FROM merge_actions WHERE league_id = @lid;
DELETE es FROM episode_scores es JOIN contestants c ON es.contestant_id = c.id WHERE c.league_id = @lid;
DELETE FROM episodes WHERE league_id = @lid;
DELETE rp FROM roster_picks   rp JOIN rosters     r ON rp.roster_id     = r.id WHERE r.league_id = @lid;
DELETE FROM rosters WHERE league_id = @lid;
UPDATE contestants SET eliminated_episode = NULL, winner = FALSE WHERE league_id = @lid;

-- ─── League state (picking closed — season underway) ──────────────────────────

UPDATE leagues
SET initial_picks_open = FALSE, merge_picks_open = FALSE
WHERE id = @lid;

INSERT INTO episodes (league_id, episode_number) VALUES
(@lid, 1), (@lid, 2), (@lid, 3), (@lid, 4);

UPDATE contestants SET eliminated_episode = 1 WHERE id = @c_brandon;
UPDATE contestants SET eliminated_episode = 2 WHERE id = @c_natalie;
UPDATE contestants SET eliminated_episode = 3 WHERE id = @c_danny;
UPDATE contestants SET eliminated_episode = 4 WHERE id = @c_priya;

-- ─── Rosters ──────────────────────────────────────────────────────────────────
-- Each user picks 2 per tribe + MVP. Loa: Maya/Tyler/Priya/Danny/Sofia/Marcus
--                                    Moku: Rachel/Kevin/Aisha/Jake/Elena/Noah
--                                    Puna: Zoe/Carlos/Hannah/Brandon/Natalie/Drew

INSERT INTO rosters (league_id, user_id, mvp_contestant_id, submitted_at) VALUES
(@lid, @uid_alex,   @c_maya,  '2026-05-28 10:00:00'),
(@lid, @uid_jordan, @c_jake,  '2026-05-28 12:30:00'),
(@lid, @uid_sam,    @c_elena, '2026-05-28 18:45:00'),
(@lid, @uid_casey,  @c_priya, '2026-05-28 22:00:00');

SET @rid_alex   = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_alex);
SET @rid_jordan = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_jordan);
SET @rid_sam    = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_sam);
SET @rid_casey  = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_casey);

-- alex:   Loa(Maya, Tyler)    Moku(Rachel, Kevin)  Puna(Zoe, Carlos)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_alex, @c_maya), (@rid_alex, @c_tyler),
(@rid_alex, @c_rachel), (@rid_alex, @c_kevin),
(@rid_alex, @c_zoe), (@rid_alex, @c_carlos);

-- jordan: Loa(Priya, Danny)   Moku(Aisha, Jake)    Puna(Hannah, Brandon)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_jordan, @c_priya), (@rid_jordan, @c_danny),
(@rid_jordan, @c_aisha), (@rid_jordan, @c_jake),
(@rid_jordan, @c_hannah), (@rid_jordan, @c_brandon);

-- sam:    Loa(Sofia, Marcus)  Moku(Elena, Noah)    Puna(Natalie, Drew)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_sam, @c_sofia), (@rid_sam, @c_marcus),
(@rid_sam, @c_elena), (@rid_sam, @c_noah),
(@rid_sam, @c_natalie), (@rid_sam, @c_drew);

-- casey:  Loa(Maya, Priya)    Moku(Kevin, Aisha)   Puna(Carlos, Hannah)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_casey, @c_maya), (@rid_casey, @c_priya),
(@rid_casey, @c_kevin), (@rid_casey, @c_aisha),
(@rid_casey, @c_carlos), (@rid_casey, @c_hannah);

-- ─── Episode scores (eps 2–4) ─────────────────────────────────────────────────
-- Brandon excluded (eliminated ep 1, no scores).

INSERT INTO episode_scores (contestant_id, episode_number, points) VALUES
-- Ep 2
(@c_maya,    2,  8), (@c_tyler,   2,  4), (@c_priya,   2,  3), (@c_danny,   2,  2),
(@c_sofia,   2,  5), (@c_marcus,  2,  6), (@c_rachel,  2,  9), (@c_kevin,   2,  3),
(@c_aisha,   2,  7), (@c_jake,    2, 10), (@c_elena,   2,  8), (@c_noah,    2,  4),
(@c_zoe,     2,  6), (@c_carlos,  2,  5), (@c_hannah,  2,  7), (@c_natalie, 2,  2),
(@c_drew,    2,  6),
-- Ep 3 (Natalie eliminated ep 2)
(@c_maya,    3,  7), (@c_tyler,   3,  5), (@c_priya,   3,  4), (@c_danny,   3,  3),
(@c_sofia,   3,  6), (@c_marcus,  3,  5), (@c_rachel,  3,  8), (@c_kevin,   3,  4),
(@c_aisha,   3,  6), (@c_jake,    3,  8), (@c_elena,   3,  9), (@c_noah,    3,  5),
(@c_zoe,     3,  7), (@c_carlos,  3,  6), (@c_hannah,  3,  5), (@c_drew,    3,  7),
-- Ep 4 (Danny eliminated ep 3)
(@c_maya,    4,  9), (@c_tyler,   4,  4), (@c_priya,   4,  2),
(@c_sofia,   4,  5), (@c_marcus,  4,  4), (@c_rachel,  4,  7), (@c_kevin,   4,  5),
(@c_aisha,   4,  8), (@c_jake,    4,  9), (@c_elena,   4,  7), (@c_noah,    4,  6),
(@c_zoe,     4,  5), (@c_carlos,  4,  7), (@c_hannah,  4,  8), (@c_drew,    4,  5);
