-- Run this migration to add the leagues table to your soccer-app database.
-- Safe to run: uses IF NOT EXISTS so it won't error on re-runs.

CREATE TABLE IF NOT EXISTS leagues (
    league_id  SERIAL PRIMARY KEY,
    league_name VARCHAR(100) NOT NULL UNIQUE,
    country     VARCHAR(100),
    season      VARCHAR(20) DEFAULT '2024/25'
);

-- Insert common leagues (skip duplicates)
INSERT INTO leagues (league_name, country, season) VALUES
    ('Premier League',   'England',   '2024/25'),
    ('La Liga',          'Spain',     '2024/25'),
    ('Bundesliga',       'Germany',   '2024/25'),
    ('Serie A',          'Italy',     '2024/25'),
    ('Ligue 1',          'France',    '2024/25'),
    ('Champions League', 'Europe',    '2024/25'),
    ('MLS',              'USA',       '2025'),
    ('Eredivisie',       'Netherlands','2024/25')
ON CONFLICT (league_name) DO NOTHING;
