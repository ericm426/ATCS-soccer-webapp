-- Run this migration to add the leagues table to your soccer-app database.
-- Safe to run: uses IF NOT EXISTS so it won't error on re-runs.

CREATE TABLE IF NOT EXISTS leagues (
    league_id  SERIAL PRIMARY KEY,
    league_name VARCHAR(100) NOT NULL UNIQUE,
    country     VARCHAR(100),
    season      VARCHAR(20) DEFAULT '2024/25'
);

