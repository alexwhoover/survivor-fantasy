-- Test seed: a league running fake "Season 51" with fake players.
-- The league owns its entire season configuration (name, tribes, contestants).
-- Run manually against local DB via ./seed.sh [1|2|3|4]. NOT a Flyway migration.

-- ─── Cleanup any previous seed data ───────────────────────────────────────────
-- Test users are fully disposable, so wipe every league they created (not just
-- the SURV51 seed league) plus any membership/roster rows tied to them directly —
-- they may have created or joined other leagues manually while testing the app.

CREATE TEMPORARY TABLE _seed_user_ids AS
    SELECT id FROM users WHERE username IN (
        'alex', 'reed', 'sam', 'casey',
        'alexf', 'ali', 'antony', 'christophe', 'dustin', 'hiro',
        'john', 'karen', 'marin', 'marko', 'norah', 'polina', 'reed', 'sophia'
    );

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
('reed',   '$2b$10$HQgVmAe6pvRoqGFhmEL1MuNdQnTK08U4khsM72v/VVpnXWwV5OCl6'),
('sam',    '$2b$10$l4OrCgQWYT/4B4tfGnoQqegoa0a8d.b7HQ8KpcmtdpXzAQRmSHx8e'),
('casey',  '$2b$10$NRYKi8nMQOdxvNMlrEF0XeSL4u9.RM/IdFHE3NkeI5kEaUCFikpTW');

SET @uid_alex = (SELECT id FROM users WHERE username = 'alex');
SET @uid_reed = (SELECT id FROM users WHERE username = 'reed');

-- ─── League with its own season configuration ─────────────────────────────────

INSERT INTO leagues (name, code, season_name, initial_picks_open, contestants_per_tribe, created_by)
VALUES ('Season 51 League', 'SURV51', 'Survivor: New Horizons', TRUE, 2, @uid_alex);

SET @lid = LAST_INSERT_ID();

INSERT INTO league_members (league_id, user_id, role)
SELECT @lid, id, IF(username IN ('alex', 'reed'), 'ADMIN', 'MEMBER')
FROM users WHERE username IN ('alex', 'reed', 'sam', 'casey');

-- ─── Tribes ───────────────────────────────────────────────────────────────────

INSERT INTO tribes (league_id, name, colour) VALUES
(@lid, 'Loa',  '#06B6D4'),
(@lid, 'Moku', '#EC4899'),
(@lid, 'Puna', '#10B981');

SET @tid_loa  = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Loa');
SET @tid_moku = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Moku');
SET @tid_puna = (SELECT id FROM tribes WHERE league_id = @lid AND name = 'Puna');

-- ─── Contestants ──────────────────────────────────────────────────────────────

INSERT INTO contestants (league_id, tribe_id, first_name, last_name) VALUES
-- Loa tribe
(@lid, @tid_loa,  'Maya',    'Chen'),
(@lid, @tid_loa,  'Tyler',   'Brooks'),
(@lid, @tid_loa,  'Priya',   'Patel'),
(@lid, @tid_loa,  'Danny',   'Kim'),
(@lid, @tid_loa,  'Sofia',   'Martinez'),
(@lid, @tid_loa,  'Marcus',  'Johnson'),
-- Moku tribe
(@lid, @tid_moku, 'Rachel',  'Thompson'),
(@lid, @tid_moku, 'Kevin',   'Walsh'),
(@lid, @tid_moku, 'Aisha',   'Washington'),
(@lid, @tid_moku, 'Jake',    'Morrison'),
(@lid, @tid_moku, 'Elena',   'Rivera'),
(@lid, @tid_moku, 'Noah',    'Bennett'),
-- Puna tribe
(@lid, @tid_puna, 'Zoe',     'Clarke'),
(@lid, @tid_puna, 'Carlos',  'Reyes'),
(@lid, @tid_puna, 'Hannah',  'Lee'),
(@lid, @tid_puna, 'Brandon', 'Scott'),
(@lid, @tid_puna, 'Natalie', 'Adams'),
(@lid, @tid_puna, 'Drew',    'Parker');

-- ─── Second league: "Reed's Survivor League" (Season 50) ─────────────────────
-- Modeled on the real Survivor 50: In the Hands of the Fans cast/tribes.
-- eliminated_episode/winner and the (Ep. X) tags come from the episode each
-- pick's owner recorded; episode_scores below are 0 placeholders to fill in.

-- ─── Users (password: "password") ─────────────────────────────────────────────

INSERT INTO users (username, password_hash) VALUES
('alexf',      '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('ali',        '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('antony',     '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('christophe', '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('dustin',     '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('hiro',       '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('john',       '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('karen',      '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('marin',      '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('marko',      '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('norah',      '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('polina',     '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('sophia',     '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK');

-- alexh and reed were created earlier as 'alex' and 'reed' (same real people, shared with SURV51)
SET @uid_alexf      = (SELECT id FROM users WHERE username = 'alexf');
SET @uid_ali        = (SELECT id FROM users WHERE username = 'ali');
SET @uid_antony     = (SELECT id FROM users WHERE username = 'antony');
SET @uid_christophe = (SELECT id FROM users WHERE username = 'christophe');
SET @uid_dustin     = (SELECT id FROM users WHERE username = 'dustin');
SET @uid_hiro       = (SELECT id FROM users WHERE username = 'hiro');
SET @uid_john       = (SELECT id FROM users WHERE username = 'john');
SET @uid_karen      = (SELECT id FROM users WHERE username = 'karen');
SET @uid_marin      = (SELECT id FROM users WHERE username = 'marin');
SET @uid_marko      = (SELECT id FROM users WHERE username = 'marko');
SET @uid_norah      = (SELECT id FROM users WHERE username = 'norah');
SET @uid_polina     = (SELECT id FROM users WHERE username = 'polina');
SET @uid_sophia     = (SELECT id FROM users WHERE username = 'sophia');

-- ─── League with its own season configuration ─────────────────────────────────

INSERT INTO leagues (name, code, season_name, initial_picks_open, merge_picks_open, contestants_per_tribe, created_by)
VALUES ('Reed''s Survivor League', 'SURV50', 'Season 50', FALSE, FALSE, 3, @uid_reed);

SET @lid50 = LAST_INSERT_ID();

INSERT INTO league_members (league_id, user_id, role)
SELECT @lid50, id, IF(username = 'reed', 'ADMIN', 'MEMBER')
FROM users WHERE username IN ('alexf', 'alex', 'ali', 'antony', 'christophe', 'dustin', 'hiro',
                               'john', 'karen', 'marin', 'marko', 'norah', 'polina', 'reed', 'sophia');

-- ─── Tribes ───────────────────────────────────────────────────────────────────

INSERT INTO tribes (league_id, name, colour) VALUES
(@lid50, 'Cila', '#F97316'),
(@lid50, 'Kalo', '#06B6D4'),
(@lid50, 'Vatu', '#A855F7');

SET @tid_cila = (SELECT id FROM tribes WHERE league_id = @lid50 AND name = 'Cila');
SET @tid_kalo = (SELECT id FROM tribes WHERE league_id = @lid50 AND name = 'Kalo');
SET @tid_vatu = (SELECT id FROM tribes WHERE league_id = @lid50 AND name = 'Vatu');

-- ─── Contestants (starting tribes, per Survivor 50: In the Hands of the Fans) ──

INSERT INTO contestants (league_id, tribe_id, first_name, last_name, eliminated_episode, winner) VALUES
-- Cila tribe
(@lid50, @tid_cila, 'Jenna',     'Lewis-Dougherty',   NULL, FALSE),
(@lid50, @tid_cila, 'Savannah',  'Louie',             2,    FALSE),
(@lid50, @tid_cila, 'Christian', 'Hubicki',           9,    FALSE),
(@lid50, @tid_cila, 'Emily',     'Flippen',           11,   FALSE),
(@lid50, @tid_cila, 'Ozzy',      'Lusth',             11,   FALSE),
(@lid50, @tid_cila, 'Rick',      'Devens',            12,   FALSE),
(@lid50, @tid_cila, 'Cirie',     'Fields',            12,   FALSE),
(@lid50, @tid_cila, 'Joe',       'Hunter',            NULL, FALSE),
-- Kalo tribe
(@lid50, @tid_kalo, 'Mike',      'White',             4,    FALSE),
(@lid50, @tid_kalo, 'Charlie',   'Davis',             5,    FALSE),
(@lid50, @tid_kalo, 'Kamilla',   'Karthigesu',        6,    FALSE),
(@lid50, @tid_kalo, 'Dee',       'Valladares',        7,    FALSE),
(@lid50, @tid_kalo, 'Chrissy',   'Hofbeck',           8,    FALSE),
(@lid50, @tid_kalo, 'Coach',     'Wade',              8,    FALSE),
(@lid50, @tid_kalo, 'Tiffany',   'Ervin',             13,   FALSE),
(@lid50, @tid_kalo, 'Jonathan',  'Young',             NULL, FALSE),
-- Vatu tribe
(@lid50, @tid_vatu, 'Kyle',      'Fraser',            NULL, FALSE),
(@lid50, @tid_vatu, 'Q',         'Burdette',          3,    FALSE),
(@lid50, @tid_vatu, 'Angelina',  'Keeley',            5,    FALSE),
(@lid50, @tid_vatu, 'Genevieve', 'Mushaluk',          6,    FALSE),
(@lid50, @tid_vatu, 'Colby',     'Donaldson',         6,    FALSE),
(@lid50, @tid_vatu, 'Stephenie', 'LaGrossa Kendrick', 10,   FALSE),
(@lid50, @tid_vatu, 'Rizo',      'Velovic',           13,   FALSE),
(@lid50, @tid_vatu, 'Aubry',     'Bracco',            NULL, TRUE);

SET @c_jenna     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Jenna');
SET @c_savannah  = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Savannah');
SET @c_christian = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Christian');
SET @c_emily     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Emily');
SET @c_ozzy      = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Ozzy');
SET @c_rick      = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Rick');
SET @c_cirie     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Cirie');
SET @c_joe       = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Joe');
SET @c_mike      = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Mike');
SET @c_charlie   = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Charlie');
SET @c_kamilla   = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Kamilla');
SET @c_dee       = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Dee');
SET @c_chrissy   = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Chrissy');
SET @c_coach     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Coach');
SET @c_tiffany   = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Tiffany');
SET @c_jonathan  = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Jonathan');
SET @c_kyle      = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Kyle');
SET @c_q         = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Q');
SET @c_angelina  = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Angelina');
SET @c_genevieve = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Genevieve');
SET @c_colby     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Colby');
SET @c_stephenie = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Stephenie');
SET @c_rizo      = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Rizo');
SET @c_aubry     = (SELECT id FROM contestants WHERE league_id = @lid50 AND first_name = 'Aubry');

-- ─── Episodes (merge occurred at Episode 6, "The Blood Moon") ─────────────────

INSERT INTO episodes (league_id, episode_number, is_merge_episode) VALUES
(@lid50, 1, FALSE), (@lid50, 2, FALSE), (@lid50, 3, FALSE), (@lid50, 4, FALSE),
(@lid50, 5, FALSE), (@lid50, 6, TRUE),  (@lid50, 7, FALSE), (@lid50, 8, FALSE),
(@lid50, 9, FALSE), (@lid50, 10, FALSE), (@lid50, 11, FALSE), (@lid50, 12, FALSE), (@lid50, 13, FALSE);

-- ─── Rosters (3 initial picks per tribe + MVP) ─────────────────────────────────

INSERT INTO rosters (league_id, user_id, mvp_contestant_id, submitted_at) VALUES
(@lid50, @uid_alexf,      @c_joe,       '2026-02-20 12:00:00'),
(@lid50, @uid_alex,       @c_aubry,     '2026-02-20 12:00:00'),
(@lid50, @uid_ali,        @c_christian, '2026-02-20 12:00:00'),
(@lid50, @uid_antony,     @c_charlie,   '2026-02-20 12:00:00'),
(@lid50, @uid_christophe, @c_kamilla,   '2026-02-20 12:00:00'),
(@lid50, @uid_dustin,     @c_aubry,     '2026-02-20 12:00:00'),
(@lid50, @uid_hiro,       @c_angelina,  '2026-02-20 12:00:00'),
(@lid50, @uid_john,       @c_emily,     '2026-02-20 12:00:00'),
(@lid50, @uid_karen,      @c_aubry,     '2026-02-20 12:00:00'),
(@lid50, @uid_marin,      @c_aubry,     '2026-02-20 12:00:00'),
(@lid50, @uid_marko,      @c_cirie,     '2026-02-20 12:00:00'),
(@lid50, @uid_norah,      @c_genevieve, '2026-02-20 12:00:00'),
(@lid50, @uid_polina,     @c_genevieve, '2026-02-20 12:00:00'),
(@lid50, @uid_reed,       @c_cirie,     '2026-02-20 12:00:00'),
(@lid50, @uid_sophia,     @c_aubry,     '2026-02-20 12:00:00');

SET @rid_alexf      = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_alexf);
SET @rid_alex       = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_alex);
SET @rid_ali        = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_ali);
SET @rid_antony     = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_antony);
SET @rid_christophe = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_christophe);
SET @rid_dustin     = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_dustin);
SET @rid_hiro       = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_hiro);
SET @rid_john       = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_john);
SET @rid_karen      = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_karen);
SET @rid_marin      = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_marin);
SET @rid_marko      = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_marko);
SET @rid_norah      = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_norah);
SET @rid_polina     = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_polina);
SET @rid_reed       = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_reed);
SET @rid_sophia     = (SELECT id FROM rosters WHERE league_id = @lid50 AND user_id = @uid_sophia);

-- alexf: Rick, Emily, Joe(MVP) / Dee, Jonathan, Kamilla / Aubry, Genevieve, Rizo
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_alexf, @c_rick), (@rid_alexf, @c_emily), (@rid_alexf, @c_joe),
(@rid_alexf, @c_dee), (@rid_alexf, @c_jonathan), (@rid_alexf, @c_kamilla),
(@rid_alexf, @c_aubry), (@rid_alexf, @c_genevieve), (@rid_alexf, @c_rizo);

-- alex: Cirie, Joe, Rick / Dee, Jonathan, Tiffany / Aubry(MVP), Colby, Rizo
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_alex, @c_cirie), (@rid_alex, @c_joe), (@rid_alex, @c_rick),
(@rid_alex, @c_dee), (@rid_alex, @c_jonathan), (@rid_alex, @c_tiffany),
(@rid_alex, @c_aubry), (@rid_alex, @c_colby), (@rid_alex, @c_rizo);

-- ali: Christian(MVP), Emily, Joe / Charlie, Kamilla, Chrissy / Genevieve, Q, Aubry
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_ali, @c_christian), (@rid_ali, @c_emily), (@rid_ali, @c_joe),
(@rid_ali, @c_charlie), (@rid_ali, @c_kamilla), (@rid_ali, @c_chrissy),
(@rid_ali, @c_genevieve), (@rid_ali, @c_q), (@rid_ali, @c_aubry);

-- antony: Joe, Emily, Christian / Charlie(MVP), Coach, Mike / Stephenie, Colby, Genevieve
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_antony, @c_joe), (@rid_antony, @c_emily), (@rid_antony, @c_christian),
(@rid_antony, @c_charlie), (@rid_antony, @c_coach), (@rid_antony, @c_mike),
(@rid_antony, @c_stephenie), (@rid_antony, @c_colby), (@rid_antony, @c_genevieve);

-- christophe: Emily, Rick, Christian / Kamilla(MVP), Jonathan, Dee / Genevieve, Angelina, Rizo
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_christophe, @c_emily), (@rid_christophe, @c_rick), (@rid_christophe, @c_christian),
(@rid_christophe, @c_kamilla), (@rid_christophe, @c_jonathan), (@rid_christophe, @c_dee),
(@rid_christophe, @c_genevieve), (@rid_christophe, @c_angelina), (@rid_christophe, @c_rizo);

-- dustin: Christian, Cirie, Joe / Charlie, Dee, Jonathan / Aubry(MVP), Colby, Rizo
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_dustin, @c_christian), (@rid_dustin, @c_cirie), (@rid_dustin, @c_joe),
(@rid_dustin, @c_charlie), (@rid_dustin, @c_dee), (@rid_dustin, @c_jonathan),
(@rid_dustin, @c_aubry), (@rid_dustin, @c_colby), (@rid_dustin, @c_rizo);

-- hiro: Christian, Joe, Rick / Mike, Kamilla, Jonathan / Angelina(MVP), Colby, Genevieve
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_hiro, @c_christian), (@rid_hiro, @c_joe), (@rid_hiro, @c_rick),
(@rid_hiro, @c_mike), (@rid_hiro, @c_kamilla), (@rid_hiro, @c_jonathan),
(@rid_hiro, @c_angelina), (@rid_hiro, @c_colby), (@rid_hiro, @c_genevieve);

-- john: Christian, Emily(MVP), Cirie / Jonathan, Charlie, Kamilla / Genevieve, Q, Angelina
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_john, @c_christian), (@rid_john, @c_emily), (@rid_john, @c_cirie),
(@rid_john, @c_jonathan), (@rid_john, @c_charlie), (@rid_john, @c_kamilla),
(@rid_john, @c_genevieve), (@rid_john, @c_q), (@rid_john, @c_angelina);

-- karen: Cirie, Emily, Joe / Chrissy, Jonathan, Coach / Aubry(MVP), Rizo, Stephenie (no merge pick)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_karen, @c_cirie), (@rid_karen, @c_emily), (@rid_karen, @c_joe),
(@rid_karen, @c_chrissy), (@rid_karen, @c_jonathan), (@rid_karen, @c_coach),
(@rid_karen, @c_aubry), (@rid_karen, @c_rizo), (@rid_karen, @c_stephenie);

-- marin: Cirie, Joe, Christian / Jonathan, Charlie, Dee / Aubry(MVP), Rizo, Genevieve
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_marin, @c_cirie), (@rid_marin, @c_joe), (@rid_marin, @c_christian),
(@rid_marin, @c_jonathan), (@rid_marin, @c_charlie), (@rid_marin, @c_dee),
(@rid_marin, @c_aubry), (@rid_marin, @c_rizo), (@rid_marin, @c_genevieve);

-- marko: Ozzy, Cirie(MVP), Joe / Dee, Mike, Tiffany / Aubry, Angelina, Rizo
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_marko, @c_ozzy), (@rid_marko, @c_cirie), (@rid_marko, @c_joe),
(@rid_marko, @c_dee), (@rid_marko, @c_mike), (@rid_marko, @c_tiffany),
(@rid_marko, @c_aubry), (@rid_marko, @c_angelina), (@rid_marko, @c_rizo);

-- norah: Emily, Savannah, Cirie / Dee, Kamilla, Tiffany / Genevieve(MVP), Stephenie, Aubry
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_norah, @c_emily), (@rid_norah, @c_savannah), (@rid_norah, @c_cirie),
(@rid_norah, @c_dee), (@rid_norah, @c_kamilla), (@rid_norah, @c_tiffany),
(@rid_norah, @c_genevieve), (@rid_norah, @c_stephenie), (@rid_norah, @c_aubry);

-- polina: Cirie, Christian, Ozzy / Charlie, Kamilla, Coach / Colby, Stephenie, Genevieve(MVP)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_polina, @c_cirie), (@rid_polina, @c_christian), (@rid_polina, @c_ozzy),
(@rid_polina, @c_charlie), (@rid_polina, @c_kamilla), (@rid_polina, @c_coach),
(@rid_polina, @c_colby), (@rid_polina, @c_stephenie), (@rid_polina, @c_genevieve);

-- reed: Ozzy, Cirie(MVP), Joe / Tiffany, Jonathan / Aubry, Stephenie, Rizo (only 2 Kalo picks, as given)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_reed, @c_ozzy), (@rid_reed, @c_cirie), (@rid_reed, @c_joe),
(@rid_reed, @c_tiffany), (@rid_reed, @c_jonathan),
(@rid_reed, @c_aubry), (@rid_reed, @c_stephenie), (@rid_reed, @c_rizo);

-- sophia: Cirie, Ozzy, Joe / Coach, Jonathan / Aubry(MVP), Stephenie, Rizo (only 2 Kalo picks, as given)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_sophia, @c_cirie), (@rid_sophia, @c_ozzy), (@rid_sophia, @c_joe),
(@rid_sophia, @c_coach), (@rid_sophia, @c_jonathan),
(@rid_sophia, @c_aubry), (@rid_sophia, @c_stephenie), (@rid_sophia, @c_rizo);

-- ─── Merge actions (post-merge add pick; Karen made none) ─────────────────────

INSERT INTO merge_actions (league_id, user_id, action_type, added_contestant_id, removed_contestant_id) VALUES
(@lid50, @uid_alexf,      'ADD', @c_cirie,     NULL),
(@lid50, @uid_alex,       'ADD', @c_emily,     NULL),
(@lid50, @uid_ali,        'ADD', @c_cirie,     NULL),
(@lid50, @uid_antony,     'ADD', @c_rick,      NULL),
(@lid50, @uid_christophe, 'ADD', @c_stephenie, NULL),
(@lid50, @uid_dustin,     'ADD', @c_rick,      NULL),
(@lid50, @uid_hiro,       'ADD', @c_ozzy,      NULL),
(@lid50, @uid_john,       'ADD', @c_dee,       NULL),
(@lid50, @uid_marin,      'ADD', @c_emily,     NULL),
(@lid50, @uid_marko,      'ADD', @c_jonathan,  NULL),
(@lid50, @uid_norah,      'ADD', @c_chrissy,   NULL),
(@lid50, @uid_polina,     'ADD', @c_rizo,      NULL),
(@lid50, @uid_reed,       'ADD', @c_emily,     NULL),
(@lid50, @uid_sophia,     'ADD', @c_tiffany,   NULL);

INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_alexf, @c_cirie),
(@rid_alex, @c_emily),
(@rid_ali, @c_cirie),
(@rid_antony, @c_rick),
(@rid_christophe, @c_stephenie),
(@rid_dustin, @c_rick),
(@rid_hiro, @c_ozzy),
(@rid_john, @c_dee),
(@rid_marin, @c_emily),
(@rid_marko, @c_jonathan),
(@rid_norah, @c_chrissy),
(@rid_polina, @c_rizo),
(@rid_reed, @c_emily),
(@rid_sophia, @c_tiffany);

-- ─── Episode scores (placeholders — fill in points manually) ──────────────────

INSERT INTO episode_scores (contestant_id, episode_number, points) VALUES
-- Ep 1
 (@c_jenna, 1, 0), (@c_savannah, 1, 0), (@c_christian, 1, 0), (@c_emily, 1, 0),
 (@c_ozzy, 1, 0), (@c_rick, 1, 0), (@c_cirie, 1, 0), (@c_joe, 1, 0),
 (@c_mike, 1, 0), (@c_charlie, 1, 0), (@c_kamilla, 1, 0), (@c_dee, 1, 0),
 (@c_chrissy, 1, 0), (@c_coach, 1, 0), (@c_tiffany, 1, 0), (@c_jonathan, 1, 0),
 (@c_kyle, 1, 0), (@c_q, 1, 0), (@c_angelina, 1, 0), (@c_genevieve, 1, 0),
 (@c_colby, 1, 0), (@c_stephenie, 1, 0), (@c_rizo, 1, 0), (@c_aubry, 1, 0),
-- Ep 2
 (@c_jenna, 2, 0), (@c_savannah, 2, 40), (@c_christian, 2, 41), (@c_emily, 2, 6),
 (@c_ozzy, 2, 6), (@c_rick, 2, 26), (@c_cirie, 2, 11), (@c_joe, 2, 11),
 (@c_mike, 2, 11), (@c_charlie, 2, 11), (@c_kamilla, 2, 16), (@c_dee, 2, 11),
 (@c_chrissy, 2, 11), (@c_coach, 2, 26), (@c_tiffany, 2, 11), (@c_jonathan, 2, 21),
 (@c_kyle, 2, 0), (@c_q, 2, 21), (@c_angelina, 2, 6), (@c_genevieve, 2, 21),
 (@c_colby, 2, 6), (@c_stephenie, 2, 6), (@c_rizo, 2, 6), (@c_aubry, 2, 21),
-- Ep 3
 (@c_jenna, 3, 0), (@c_savannah, 3, 0), (@c_christian, 3, 6), (@c_emily, 3, 6),
 (@c_ozzy, 3, 1), (@c_rick, 3, 11), (@c_cirie, 3, 11), (@c_joe, 3, 16),
 (@c_mike, 3, 1), (@c_charlie, 3, 11), (@c_kamilla, 3, 16), (@c_dee, 3, 11),
 (@c_chrissy, 3, 16), (@c_coach, 3, 16), (@c_tiffany, 3, 11), (@c_jonathan, 3, 11),
 (@c_kyle, 3, 0), (@c_q, 3, 15), (@c_angelina, 3, 6), (@c_genevieve, 3, 11),
 (@c_colby, 3, 11), (@c_stephenie, 3, 1), (@c_rizo, 3, 11), (@c_aubry, 3, 16),
-- Ep 4
 (@c_jenna, 4, 0), (@c_savannah, 4, 0), (@c_christian, 4, 11), (@c_emily, 4, 1),
 (@c_ozzy, 4, 16), (@c_rick, 4, 6), (@c_cirie, 4, 6), (@c_joe, 4, 11),
 (@c_mike, 4, 10), (@c_charlie, 4, 6), (@c_kamilla, 4, 6), (@c_dee, 4, 11),
 (@c_chrissy, 4, 6), (@c_coach, 4, 16), (@c_tiffany, 4, 11), (@c_jonathan, 4, 6),
 (@c_kyle, 4, 0), (@c_q, 4, 0), (@c_angelina, 4, 6), (@c_genevieve, 4, 36),
 (@c_colby, 4, 11), (@c_stephenie, 4, 6), (@c_rizo, 4, 21), (@c_aubry, 4, 11),
-- Ep 5
 (@c_jenna, 5, 0), (@c_savannah, 5, 0), (@c_christian, 5, 6), (@c_emily, 5, 1),
 (@c_ozzy, 5, 6), (@c_rick, 5, 1), (@c_cirie, 5, 1), (@c_joe, 5, 6),
 (@c_mike, 5, 0), (@c_charlie, 5, 15), (@c_kamilla, 5, 1), (@c_dee, 5, 1),
 (@c_chrissy, 5, 6), (@c_coach, 5, 6), (@c_tiffany, 5, 6), (@c_jonathan, 5, 1),
 (@c_kyle, 5, 0), (@c_q, 5, 0), (@c_angelina, 5, 20), (@c_genevieve, 5, 6),
 (@c_colby, 5, 11), (@c_stephenie, 5, 1), (@c_rizo, 5, 6), (@c_aubry, 5, 6),
-- Ep 6
 (@c_jenna, 6, 0), (@c_savannah, 6, 0), (@c_christian, 6, 23), (@c_emily, 6, 8),
 (@c_ozzy, 6, 8), (@c_rick, 6, 3), (@c_cirie, 6, 8), (@c_joe, 6, 3),
 (@c_mike, 6, 0), (@c_charlie, 6, 0), (@c_kamilla, 6, 15), (@c_dee, 6, 23),
 (@c_chrissy, 6, 8), (@c_coach, 6, 8), (@c_tiffany, 6, 8), (@c_jonathan, 6, 8),
 (@c_kyle, 6, 0), (@c_q, 6, 0), (@c_angelina, 6, 0), (@c_genevieve, 6, 25),
 (@c_colby, 6, 15), (@c_stephenie, 6, 23), (@c_rizo, 6, 8), (@c_aubry, 6, 8),
-- Ep 7
 (@c_jenna, 7, 0), (@c_savannah, 7, 0), (@c_christian, 7, 8), (@c_emily, 7, 13),
 (@c_ozzy, 7, 23), (@c_rick, 7, 13), (@c_cirie, 7, 3), (@c_joe, 7, 8),
 (@c_mike, 7, 0), (@c_charlie, 7, 0), (@c_kamilla, 7, 0), (@c_dee, 7, 20),
 (@c_chrissy, 7, 3), (@c_coach, 7, 8), (@c_tiffany, 7, 8), (@c_jonathan, 7, 3),
 (@c_kyle, 7, 0), (@c_q, 7, 0), (@c_angelina, 7, 0), (@c_genevieve, 7, 0),
 (@c_colby, 7, 0), (@c_stephenie, 7, 23), (@c_rizo, 7, 3), (@c_aubry, 7, 8),
-- Ep 8
 (@c_jenna, 8, 0), (@c_savannah, 8, 0), (@c_christian, 8, 3), (@c_emily, 8, 3),
 (@c_ozzy, 8, 3), (@c_rick, 8, 8), (@c_cirie, 8, 13), (@c_joe, 8, 13),
 (@c_mike, 8, 0), (@c_charlie, 8, 0), (@c_kamilla, 8, 0), (@c_dee, 8, 0),
 (@c_chrissy, 8, 5), (@c_coach, 8, 10), (@c_tiffany, 8, 18), (@c_jonathan, 8, 3),
 (@c_kyle, 8, 0), (@c_q, 8, 0), (@c_angelina, 8, 0), (@c_genevieve, 8, 0),
 (@c_colby, 8, 0), (@c_stephenie, 8, 3), (@c_rizo, 8, 8), (@c_aubry, 8, 3),
-- Ep 9
 (@c_jenna, 9, 0), (@c_savannah, 9, 0), (@c_christian, 9, 20), (@c_emily, 9, 3),
 (@c_ozzy, 9, 8), (@c_rick, 9, 8), (@c_cirie, 9, 3), (@c_joe, 9, 23),
 (@c_mike, 9, 0), (@c_charlie, 9, 0), (@c_kamilla, 9, 0), (@c_dee, 9, 0),
 (@c_chrissy, 9, 0), (@c_coach, 9, 0), (@c_tiffany, 9, 3), (@c_jonathan, 9, 3),
 (@c_kyle, 9, 0), (@c_q, 9, 0), (@c_angelina, 9, 0), (@c_genevieve, 9, 0),
 (@c_colby, 9, 0), (@c_stephenie, 9, 8), (@c_rizo, 9, 3), (@c_aubry, 9, 3),
-- Ep 10
 (@c_jenna, 10, 0), (@c_savannah, 10, 0), (@c_christian, 10, 0), (@c_emily, 10, 8),
 (@c_ozzy, 10, 8), (@c_rick, 10, 33), (@c_cirie, 10, 8), (@c_joe, 10, 3),
 (@c_mike, 10, 0), (@c_charlie, 10, 0), (@c_kamilla, 10, 0), (@c_dee, 10, 0),
 (@c_chrissy, 10, 0), (@c_coach, 10, 0), (@c_tiffany, 10, 23), (@c_jonathan, 10, 3),
 (@c_kyle, 10, 0), (@c_q, 10, 0), (@c_angelina, 10, 0), (@c_genevieve, 10, 0),
 (@c_colby, 10, 0), (@c_stephenie, 10, 20), (@c_rizo, 10, 8), (@c_aubry, 10, 8),
-- Ep 11
 (@c_jenna, 11, 0), (@c_savannah, 11, 0), (@c_christian, 11, 0), (@c_emily, 11, 5),
 (@c_ozzy, 11, 40), (@c_rick, 11, 13), (@c_cirie, 11, 8), (@c_joe, 11, 3),
 (@c_mike, 11, 0), (@c_charlie, 11, 0), (@c_kamilla, 11, 0), (@c_dee, 11, 0),
 (@c_chrissy, 11, 0), (@c_coach, 11, 0), (@c_tiffany, 11, 3), (@c_jonathan, 11, 23),
 (@c_kyle, 11, 0), (@c_q, 11, 0), (@c_angelina, 11, 0), (@c_genevieve, 11, 0),
 (@c_colby, 11, 0), (@c_stephenie, 11, 0), (@c_rizo, 11, 3), (@c_aubry, 11, 3),
-- Ep 12 - checked
 (@c_jenna, 12, 0), (@c_savannah, 12, 0), (@c_christian, 12, 0), (@c_emily, 12, 0),
 (@c_ozzy, 12, 0), (@c_rick, 12, 25), (@c_cirie, 12, 20), (@c_joe, 12, 28),
 (@c_mike, 12, 0), (@c_charlie, 12, 0), (@c_kamilla, 12, 0), (@c_dee, 12, 0),
 (@c_chrissy, 12, 0), (@c_coach, 12, 0), (@c_tiffany, 12, 23), (@c_jonathan, 12, 3),
 (@c_kyle, 12, 0), (@c_q, 12, 0), (@c_angelina, 12, 0), (@c_genevieve, 12, 0),
 (@c_colby, 12, 0), (@c_stephenie, 12, 0), (@c_rizo, 12, 13), (@c_aubry, 12, 13),
-- Ep 13 - checked
 (@c_jenna, 13, 0), (@c_savannah, 13, 0), (@c_christian, 13, 0), (@c_emily, 13, 0),
 (@c_ozzy, 13, 0), (@c_rick, 13, 0), (@c_cirie, 13, 0), (@c_joe, 13, 23),
 (@c_mike, 13, 0), (@c_charlie, 13, 0), (@c_kamilla, 13, 0), (@c_dee, 13, 0),
 (@c_chrissy, 13, 0), (@c_coach, 13, 0), (@c_tiffany, 13, 15), (@c_jonathan, 13, 53),
 (@c_kyle, 13, 0), (@c_q, 13, 0), (@c_angelina, 13, 0), (@c_genevieve, 13, 0),
 (@c_colby, 13, 0), (@c_stephenie, 13, 0), (@c_rizo, 13, 10), (@c_aubry, 13, 58);
