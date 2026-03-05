# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A soccer match tracking web application that provides REST APIs for managing teams, players, matches, and match events. The backend is built with Express.js and PostgreSQL, with a frontend using vanilla HTML/CSS.

## Development Commands

### Start the Server
```bash
node server.js
```
The server runs on port 3000. Access the frontend at http://localhost:3000/

### Install Dependencies
```bash
npm install
```

## Database Configuration

### PostgreSQL Connection
The application connects to a local PostgreSQL database with these settings (server.js:11-17):
- Database: `soccer-app`
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `12345678`

**Important**: The database credentials are hardcoded in server.js. When working with database configuration, consider using environment variables for security.

### Database Schema
The application expects the following tables in PostgreSQL:
- `teams` (team_id, team_name, league, stadium, founded_year, logo_url)
- `players` (player_id, team_id, player_name, position, nationality, goals, assists, appearances)
- `matches` (match_id, home_team_id, away_team_id, match_date, home_score, away_score, status)
- `match_events` (event_id, match_id, player_id, event_type, minute)

## API Architecture

The server.js file implements a RESTful API with the following pattern for each resource:
- GET /resource - List all
- GET /resource/:id - Get single item
- POST /resource - Create new item

### Available Endpoints

**Teams**: `/teams`, `/teams/:id`
**Players**: `/players`, `/players/:id`
**Matches**: `/matches`, `/matches/:id`
**Match Events**: `/match_events`, `/match_events/:id`

All POST requests expect JSON body with the appropriate fields matching the database schema.

## Frontend Structure

- `src/index.html` - Minimal HTML shell
- `src/style.css` - Complete styling system with design tokens and component styles
- Static files served from the `src` directory via Express static middleware (server.js:9)

## Code Patterns

### Database Queries
All database operations use parameterized queries to prevent SQL injection:
```javascript
pool.query('SELECT * FROM table WHERE id = $1', [req.params.id])
```

### Error Handling
Currently, the API endpoints do not implement error handling. When adding features or modifying endpoints, wrap async operations in try-catch blocks and return appropriate HTTP status codes.

### CORS
CORS is enabled globally for all routes (server.js:7), allowing cross-origin requests.

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""