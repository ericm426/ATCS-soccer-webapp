require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     parseInt(process.env.DB_PORT),
});

// ── Teams ──────────────────────────────────────────────────────────────────
app.get('/teams', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/teams/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams WHERE team_id = $1', [req.params.id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json(null);
    }
});

app.post('/teams', async (req, res) => {
    try {
        const { team_id, team_name, league, stadium, founded_year, logo_url } = req.body;
        const result = await pool.query(
            'INSERT INTO teams (team_id, team_name, league, stadium, founded_year, logo_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [team_id, team_name, league, stadium, founded_year, logo_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Teams: all matches for a given team ────────────────────────────────────
app.get('/teams/:id/matches', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM matches WHERE home_team_id = $1 OR away_team_id = $1 ORDER BY match_date DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ── Players ────────────────────────────────────────────────────────────────
app.get('/players', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM players');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/players/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM players WHERE player_id = $1', [req.params.id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json(null);
    }
});

app.post('/players', async (req, res) => {
    try {
        const { player_id, team_id, player_name, position, nationality, goals, assists, appearances } = req.body;
        const result = await pool.query(
            'INSERT INTO players (player_id, team_id, player_name, position, nationality, goals, assists, appearances) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [player_id, team_id, player_name, position, nationality, goals, assists, appearances]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Matches ────────────────────────────────────────────────────────────────
app.get('/matches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM matches');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/matches/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM matches WHERE match_id = $1', [req.params.id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json(null);
    }
});

app.post('/matches', async (req, res) => {
    try {
        const { match_id, home_team_id, away_team_id, match_date, home_score, away_score, status } = req.body;
        const result = await pool.query(
            'INSERT INTO matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [match_id, home_team_id, away_team_id, match_date, home_score, away_score, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Match Events ───────────────────────────────────────────────────────────
app.get('/match_events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM match_events');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/match_events/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM match_events WHERE event_id = $1', [req.params.id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json(null);
    }
});

app.post('/match_events', async (req, res) => {
    try {
        const { event_id, match_id, player_id, event_type, minute } = req.body;
        const result = await pool.query(
            'INSERT INTO match_events (event_id, match_id, player_id, event_type, minute) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [event_id, match_id, player_id, event_type, minute]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Leagues — distinct leagues from teams table ────────────────────────────
app.get('/leagues', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT league, COUNT(*) as team_count FROM teams WHERE league IS NOT NULL AND league != '' GROUP BY league ORDER BY league"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ── Standings — compute standings in JS from DB data ──────────────────────
app.get('/standings/:league', async (req, res) => {
    try {
        const league = req.params.league;

        // 1. Get teams in this league
        const teamsResult = await pool.query('SELECT * FROM teams WHERE league = $1', [league]);
        const teams = teamsResult.rows;
        if (teams.length === 0) return res.json([]);

        const teamIds = teams.map(t => t.team_id);

        // 2. Get finished matches for these teams
        const matchesResult = await pool.query(
            `SELECT * FROM matches
             WHERE LOWER(status) IN ('finished','completed','ft','full_time','done')
             AND (home_team_id = ANY($1::int[]) OR away_team_id = ANY($1::int[]))
             ORDER BY match_date ASC`,
            [teamIds]
        );
        const matches = matchesResult.rows;

        // 3. Build standings map
        const standing = {};
        for (const t of teams) {
            standing[t.team_id] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
        }

        // 4. Process each match
        for (const m of matches) {
            const homeId = m.home_team_id;
            const awayId = m.away_team_id;
            const homeGoals = m.home_score ?? 0;
            const awayGoals = m.away_score ?? 0;

            // Only process if both teams are in this league's standings
            if (!standing[homeId] || !standing[awayId]) continue;

            standing[homeId].p++;
            standing[awayId].p++;
            standing[homeId].gf += homeGoals;
            standing[homeId].ga += awayGoals;
            standing[awayId].gf += awayGoals;
            standing[awayId].ga += homeGoals;

            if (homeGoals > awayGoals) {
                // Home win
                standing[homeId].w++;
                standing[homeId].pts += 3;
                standing[homeId].form.push('W');
                standing[awayId].l++;
                standing[awayId].form.push('L');
            } else if (homeGoals === awayGoals) {
                // Draw
                standing[homeId].d++;
                standing[homeId].pts++;
                standing[homeId].form.push('D');
                standing[awayId].d++;
                standing[awayId].pts++;
                standing[awayId].form.push('D');
            } else {
                // Away win
                standing[awayId].w++;
                standing[awayId].pts += 3;
                standing[awayId].form.push('W');
                standing[homeId].l++;
                standing[homeId].form.push('L');
            }
        }

        // 5. Map to array, compute GD, trim form to last 5
        const rows = Object.values(standing).map(s => ({
            team_id: s.team.team_id,
            team_name: s.team.team_name,
            league: s.team.league,
            stadium: s.team.stadium,
            founded_year: s.team.founded_year,
            p: s.p,
            w: s.w,
            d: s.d,
            l: s.l,
            gf: s.gf,
            ga: s.ga,
            gd: s.gf - s.ga,
            pts: s.pts,
            form: s.form.slice(-5),
        }));

        // 6. Sort: pts desc, gd desc, gf desc
        rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
