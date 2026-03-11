# OmniTrack · Soccer

A full-stack soccer match tracking web application. Track teams, squads, and live match scores through a clean dark-themed UI.

---

## Project Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14 or later) running locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up the database
Open `psql` (or pgAdmin) and run:
```sql
CREATE DATABASE "soccer-app";
\c soccer-app
```
Then execute the full schema + seed file:
```bash
psql -U postgres -d soccer-app -f sql_queries/database.sql
```

### 3. Start the server
```bash
node server.js
```
Open **http://localhost:3000** in your browser.

---

## Database Schema

### Tables

| Table | Primary Key | Description |
|---|---|---|
| `teams` | `team_id` | Club info — name, league, stadium, founded year |
| `players` | `player_id` | Player stats — goals, assists, appearances |
| `matches` | `match_id` | Match results — date, score, status |
| `match_events` | `event_id` | In-game events — goals, cards, substitutions |

### Relationships (Foreign Keys)
- `players.team_id` → `teams.team_id`
- `matches.home_team_id` → `teams.team_id`
- `matches.away_team_id` → `teams.team_id`
- `match_events.match_id` → `matches.match_id`
- `match_events.player_id` → `players.player_id`

---

## API Endpoints

### Teams
| Method | Route | Description |
|---|---|---|
| GET | `/teams` | List all teams |
| GET | `/teams/:id` | Get a single team |
| POST | `/teams` | Create a new team |

### Players
| Method | Route | Description |
|---|---|---|
| GET | `/players` | List all players |
| GET | `/players/:id` | Get a single player |
| POST | `/players` | Add a player to a team |
| DELETE | `/players/:id` | Remove a player from the squad |

### Matches
| Method | Route | Description |
|---|---|---|
| GET | `/matches` | List all matches |
| GET | `/matches/:id` | Get a single match |
| POST | `/matches` | Schedule a new match |
| PUT | `/matches/:id` | Update match score and status |

### Match Events
| Method | Route | Description |
|---|---|---|
| GET | `/match_events` | List all events |
| GET | `/match_events/:id` | Get a single event |
| POST | `/match_events` | Log an in-game event |

---

## Features

- **Matches view** — Featured match cards with live/upcoming/finished status, upcoming fixtures table. Tap the ✎ button on any featured card to update the score. Tap the **+** button (bottom-right) to schedule a new match.
- **Squad view** — Browse players by team with search and pagination. Add new players with the **+ Add** button; remove players with the **✕** button on each row.
- **Teams view** — Full team list with league filter, sort, and pagination. Favorite teams for quick access.
- **Explore view** — Live search across teams, players, and matches.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL |
| Backend | Node.js + Express |
| Frontend | Vanilla HTML / CSS / JavaScript (ES modules) |
| Fonts | Barlow Condensed, Inter (Google Fonts) |
