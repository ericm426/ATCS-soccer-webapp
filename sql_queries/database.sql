--
-- PostgreSQL database dump
--

\restrict QskVNwBnqE0Y87pDoweWcHuNBQghUSRe43I4yIrYgU4QQ5ZiGCKxKMoxHeLkDoo

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: match_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_events (
    event_id integer NOT NULL,
    match_id integer,
    player_id integer,
    event_type character varying(30),
    minute integer
);


ALTER TABLE public.match_events OWNER TO postgres;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    match_id integer NOT NULL,
    home_team_id integer,
    away_team_id integer,
    match_date date,
    home_score integer,
    away_score integer,
    status character varying(20),
    competition character varying(100)
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    player_id integer NOT NULL,
    team_id integer,
    player_name character varying(255),
    "position" character varying,
    goals integer,
    assists integer,
    appearances integer,
    nationality character varying(100)
);


ALTER TABLE public.players OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    team_id integer NOT NULL,
    team_name character varying(100),
    league character varying(100),
    stadium character varying(100),
    founded_year integer,
    logo_url character varying(255)
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (event_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (match_id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (player_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (team_id);


--
-- Name: match_events match_events_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(match_id);


--
-- Name: match_events match_events_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id);


--
-- Name: matches matches_away_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(team_id);


--
-- Name: matches matches_home_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(team_id);


--
-- Name: players players_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(team_id);


--
-- PostgreSQL database dump complete
--

-- ── Migrations ────────────────────────────────────────────────────────────────

-- 2025-03-11: Added competition and stage columns to matches (stores which cup/league the match belongs to,
-- e.g. "Premier League", "UEFA Champions League"). Populated automatically by the API sync.
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition character varying(100);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS stage      character varying(50);

-- 2025-03-11: Cleared all seed data before switching to live API data.
-- TRUNCATE public.match_events, public.matches, public.players, public.teams RESTART IDENTITY CASCADE;

\unrestrict QskVNwBnqE0Y87pDoweWcHuNBQghUSRe43I4yIrYgU4QQ5ZiGCKxKMoxHeLkDoo

