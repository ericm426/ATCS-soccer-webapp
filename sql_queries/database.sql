-- ══════════════════════════════════════════════════════════════════════════════
-- OmniTrack Soccer App — Full Database Schema
-- PostgreSQL 16
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE public.teams (
    team_id         INTEGER         NOT NULL,
    team_name       VARCHAR(100),
    league          VARCHAR(100),           -- domestic league name (e.g. "Premier League")
    stadium         VARCHAR(100),
    founded_year    INTEGER,
    logo_url        VARCHAR(255),
    api_football_id INTEGER,                -- v3.football.api-sports.io team ID (cached)
    CONSTRAINT teams_pkey PRIMARY KEY (team_id)
);

CREATE TABLE public.players (
    player_id           INTEGER         NOT NULL,
    team_id             INTEGER,
    player_name         VARCHAR(255),
    position            VARCHAR(100),
    nationality         VARCHAR(100),
    goals               INTEGER DEFAULT 0,  -- domestic league goals
    assists             INTEGER DEFAULT 0,  -- domestic league assists
    appearances         INTEGER DEFAULT 0,  -- domestic league appearances
    ucl_goals           INTEGER DEFAULT 0,  -- UEFA Champions League goals
    ucl_assists         INTEGER DEFAULT 0,  -- UEFA Champions League assists
    ucl_appearances     INTEGER DEFAULT 0,  -- UEFA Champions League appearances
    api_football_id     INTEGER,            -- v3.football.api-sports.io player ID (cached)
    CONSTRAINT players_pkey PRIMARY KEY (player_id),
    CONSTRAINT players_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(team_id)
);

CREATE TABLE public.matches (
    match_id        INTEGER         NOT NULL,
    home_team_id    INTEGER,
    away_team_id    INTEGER,
    match_date      TIMESTAMP WITH TIME ZONE,
    home_score      INTEGER,
    away_score      INTEGER,
    status          VARCHAR(20),            -- e.g. "scheduled", "finished", "live"
    competition     VARCHAR(100),           -- competition name (e.g. "Premier League", "UEFA Champions League")
    stage           VARCHAR(50),            -- e.g. "REGULAR_SEASON", "LAST_16", "QUARTER_FINALS"
    api_football_id INTEGER,                -- v3.football.api-sports.io fixture ID (cached)
    CONSTRAINT matches_pkey PRIMARY KEY (match_id),
    CONSTRAINT matches_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(team_id),
    CONSTRAINT matches_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(team_id)
);

CREATE TABLE public.match_events (
    event_id    INTEGER         NOT NULL,
    match_id    INTEGER,
    player_id   INTEGER,
    event_type  VARCHAR(30),               -- e.g. "goal", "yellow_card", "red_card", "substitution"
    minute      INTEGER,
    CONSTRAINT match_events_pkey PRIMARY KEY (event_id),
    CONSTRAINT match_events_match_id_fkey  FOREIGN KEY (match_id)  REFERENCES public.matches(match_id),
    CONSTRAINT match_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_players_team_id   ON public.players (team_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team  ON public.matches  (home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team  ON public.matches  (away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date       ON public.matches  (match_date);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON public.match_events (match_id);

-- ── Migration history (ALTER TABLE statements applied to existing DB) ─────────

-- 2026-03-11: Added competition and stage columns to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition     VARCHAR(100);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS stage           VARCHAR(50);

-- 2026-03-11: Added API-Football ID caching columns for cross-referencing v3.football.api-sports.io
ALTER TABLE public.teams   ADD COLUMN IF NOT EXISTS api_football_id INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS api_football_id INTEGER;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS api_football_id INTEGER;

-- 2026-03-11: Added separate UCL stats columns so domestic and Champions League
--             stats are stored independently (prevents CL scorers sync from overwriting
--             a player's domestic league goals/assists/appearances)
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS ucl_goals       INTEGER DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS ucl_assists     INTEGER DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS ucl_appearances INTEGER DEFAULT 0;

-- ── Fantasy tables (created by initDb() on first server start) ────────────────
-- User-created teams, rosters, matches, and match events for the Fantasy feature.
-- SERIAL primary keys (auto-increment) so users don't supply IDs.
-- ON DELETE CASCADE ensures deleting a team cleans up all its players and matches.

CREATE TABLE IF NOT EXISTS public.fantasy_teams (
    team_id     SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fantasy_players (
    player_id       SERIAL      PRIMARY KEY,
    fantasy_team_id INTEGER     REFERENCES public.fantasy_teams(team_id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    position        VARCHAR(50),
    goals           INTEGER     DEFAULT 0,
    assists         INTEGER     DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.fantasy_matches (
    match_id     SERIAL      PRIMARY KEY,
    home_team_id INTEGER     REFERENCES public.fantasy_teams(team_id) ON DELETE CASCADE,
    away_team_id INTEGER     REFERENCES public.fantasy_teams(team_id) ON DELETE CASCADE,
    match_date   DATE,
    home_score   INTEGER     DEFAULT 0,
    away_score   INTEGER     DEFAULT 0,
    status       VARCHAR(20) DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS public.fantasy_match_events (
    event_id          SERIAL  PRIMARY KEY,
    fantasy_match_id  INTEGER REFERENCES public.fantasy_matches(match_id) ON DELETE CASCADE,
    fantasy_player_id INTEGER REFERENCES public.fantasy_players(player_id) ON DELETE SET NULL,
    event_type        VARCHAR(30),
    minute            INTEGER
);
