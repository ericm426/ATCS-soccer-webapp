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
    user: 'postgres',
    host: 'localhost',
    database: 'soccer-app',
    password: '12345678',
    port: 5432
});

// Teams
app.get('/teams', async (req, res) => {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
});

app.get('/teams/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM teams WHERE team_id = $1', [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/teams', async (req, res) => {
    const { team_id, team_name, league, stadium, founded_year, logo_url } = req.body;
    const result = await pool.query(
        'INSERT INTO teams (team_id, team_name, league, stadium, founded_year, logo_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [team_id, team_name, league, stadium, founded_year, logo_url]
    );
    res.status(201).json(result.rows[0]);
});

// --- PLAYERS ---
app.get('/players', async (req, res) => {
    const result = await pool.query('SELECT * FROM players');
    res.json(result.rows);
});

app.get('/players/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM players WHERE player_id = $1', [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/players', async (req, res) => {
    const { player_id, team_id, player_name, position, nationality, goals, assists, appearances } = req.body;
    const result = await pool.query(
        'INSERT INTO players (player_id, team_id, player_name, position, nationality, goals, assists, appearances) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [player_id, team_id, player_name, position, nationality, goals, assists, appearances]
    );
    res.status(201).json(result.rows[0]);
});

// MATCHES 
app.get('/matches', async (req, res) => {
    const result = await pool.query('SELECT * FROM matches');
    res.json(result.rows);
});

app.get('/matches/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM matches WHERE match_id = $1', [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/matches', async (req, res) => {
    const { match_id, home_team_id, away_team_id, match_date, home_score, away_score, status } = req.body;
    const result = await pool.query(
        'INSERT INTO matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [match_id, home_team_id, away_team_id, match_date, home_score, away_score, status]
    );
    res.status(201).json(result.rows[0]);
});

// MATCH EVENTS
app.get('/match_events', async (req, res) => {
    const result = await pool.query('SELECT * FROM match_events');
    res.json(result.rows);
});

app.get('/match_events/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM match_events WHERE event_id = $1', [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/match_events', async (req, res) => {
    const { event_id, match_id, player_id, event_type, minute } = req.body;
    const result = await pool.query(
        'INSERT INTO match_events (event_id, match_id, player_id, event_type, minute) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [event_id, match_id, player_id, event_type, minute]
    );
    res.status(201).json(result.rows[0]);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
