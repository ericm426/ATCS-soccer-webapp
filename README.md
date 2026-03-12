# OmniTrack · Soccer

A full-stack soccer tracking web app — follow live scores, league standings, UCL brackets, player stats, and build your own fantasy teams.

---

## Project Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14 or later) running locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env` file in the project root:
```
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soccer-app
FOOTBALL_API_KEY=your_football_data_org_key
API_FOOTBALL_KEY=your_api_sports_key
```

### 3. Set up the database
```sql
CREATE DATABASE "soccer-app";
```
Then run the schema file:
```bash
psql -U postgres -d soccer-app -f sql_queries/database.sql
```
Fantasy tables are created automatically on first server start via `initDb()`.

### 4. Start the server
```bash
node server.js
```
Open **http://localhost:3000** in your browser.

---

## Database Schema

### Real-data Tables

| Table | Primary Key | Description |
|---|---|---|
| `teams` | `team_id` | Club info — name, domestic league, stadium, founded year, API-Football ID |
| `players` | `player_id` | Player stats — domestic goals/assists/appearances + separate UCL columns |
| `matches` | `match_id` | Match results — date, score, status, competition name, stage |
| `match_events` | `event_id` | In-game events — goals, cards, substitutions |

### Fantasy Tables

| Table | Primary Key | Description |
|---|---|---|
| `fantasy_teams` | `team_id` (SERIAL) | User-created team names |
| `fantasy_players` | `player_id` (SERIAL) | Players on a fantasy team |
| `fantasy_matches` | `match_id` (SERIAL) | Matches between fantasy teams |
| `fantasy_match_events` | `event_id` (SERIAL) | Events logged in a fantasy match |

### Foreign Keys
- `players.team_id` → `teams.team_id`
- `matches.home_team_id / away_team_id` → `teams.team_id`
- `match_events.match_id` → `matches.match_id`
- `match_events.player_id` → `players.player_id`
- `fantasy_players.fantasy_team_id` → `fantasy_teams.team_id` (CASCADE)
- `fantasy_matches.home/away_team_id` → `fantasy_teams.team_id` (CASCADE)
- `fantasy_match_events.fantasy_match_id` → `fantasy_matches.match_id` (CASCADE)

---

## API Endpoints

### Teams
| Method | Route | Description |
|---|---|---|
| GET | `/teams` | List all teams |
| GET | `/teams/:id` | Get a single team |
| GET | `/teams/:id/matches` | Get recent matches for a team |
| POST | `/teams` | Create a new team |

### Players
| Method | Route | Description |
|---|---|---|
| GET | `/players` | List all players |
| GET | `/players/:id` | Get a single player |
| POST | `/players` | Add a player |
| DELETE | `/players/:id` | Remove a player |

### Matches
| Method | Route | Description |
|---|---|---|
| GET | `/matches` | List all matches |
| GET | `/matches/:id` | Get a single match |
| GET | `/matches/:id/events` | Get events for a match (with player names) |
| POST | `/matches` | Schedule a new match |
| PUT | `/matches/:id` | Update match score and status |

### Match Events
| Method | Route | Description |
|---|---|---|
| GET | `/match_events` | List all events |
| GET | `/match_events/:id` | Get a single event |
| POST | `/match_events` | Log an in-game event |

### Standings & Competitions
| Method | Route | Description |
|---|---|---|
| GET | `/leagues` | Distinct leagues from teams table |
| GET | `/competitions` | Distinct competitions from matches table |
| GET | `/standings/:league` | Compute standings for a league |
| GET | `/bracket/:competition` | UCL knockout bracket |

### Fantasy
| Method | Route | Description |
|---|---|---|
| GET | `/fantasy/teams` | List all fantasy teams |
| POST | `/fantasy/teams` | Create a fantasy team |
| DELETE | `/fantasy/teams/:id` | Delete a fantasy team (cascades) |
| GET | `/fantasy/teams/:id/players` | List players on a fantasy team |
| POST | `/fantasy/players` | Add a player to a fantasy team |
| DELETE | `/fantasy/players/:id` | Remove a fantasy player |
| GET | `/fantasy/matches` | List fantasy matches (with team names) |
| POST | `/fantasy/matches` | Schedule a fantasy match |
| PUT | `/fantasy/matches/:id` | Update fantasy match score and status |
| GET | `/fantasy/matches/:id/events` | List events for a fantasy match |
| POST | `/fantasy/match_events` | Log a fantasy match event |

### External API Proxies
| Method | Route | Description |
|---|---|---|
| GET | `/api-football/match/:id` | Lineups, events, stats from API-Football |
| GET | `/api-football/player/:id` | Player photo URL from API-Football |
| GET | `/api-football/status` | API-Football connection check |

---

## Features

- **Matches** — Featured cards (live → upcoming → recent), fixtures table, watchlist. Tap **+** to add a match.
- **Leagues** — Standings table with form column. Players sub-tab for top scorers. UCL bracket shows Round of 16 → QF → SF → Final.
- **Following** — Followed teams grid (form pips + standings position) and followed players list. Player photos loaded async from API-Football.
- **Explore** — Live search across teams, players, and matches.
- **Fantasy** — Create your own teams, build rosters, schedule matches between them, update scores, and log match events (goals, cards, substitutions).
- **Team pages** — Full team profile: squad with player photos, recent matches, follow button.
- **Player pages** — Stats with League/UCL tabs, player photo, team link, follow button.
- **Match detail** — Lineups, timeline events, and team stats fetched from API-Football.
- **Auto-sync** — Syncs Premier League, Bundesliga, Serie A, Ligue 1, La Liga, and UCL from football-data.org on startup and every 5 minutes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Backend | Node.js 18 + Express |
| Frontend | Vanilla HTML / CSS / JavaScript (ES modules, no bundler) |
| Data | football-data.org (auto-sync) + API-Football v3 (on-demand photos/lineups) |
| Fonts | Barlow Condensed, Inter (Google Fonts) |
