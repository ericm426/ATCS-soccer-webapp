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

        // 1. Get teams — by domestic league name OR by participation in competition matches.
        //    This handles cup competitions (e.g. CL) where teams keep their domestic league field.
        const teamsResult = await pool.query(
            `SELECT DISTINCT t.* FROM teams t
             WHERE t.league = $1
                OR t.team_id IN (
                     SELECT home_team_id FROM matches WHERE competition = $1
                     UNION
                     SELECT away_team_id FROM matches WHERE competition = $1
                   )`,
            [league]
        );
        const teams = teamsResult.rows;
        if (teams.length === 0) return res.json([]);

        // 2. Get finished matches scoped to this competition
        const matchesResult = await pool.query(
            `SELECT * FROM matches
             WHERE LOWER(status) IN ('finished','completed','ft','full_time','done')
             AND competition = $1
             ORDER BY match_date ASC`,
            [league]
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

// ── Knockout bracket ───────────────────────────────────────────────────────
const KNOCKOUT_STAGE_ORDER = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
const KNOCKOUT_STAGE_LABELS = {
    LAST_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter Finals',
    SEMI_FINALS: 'Semi Finals',
    FINAL: 'Final',
};

app.get('/bracket/:competition', async (req, res) => {
    try {
        const comp = decodeURIComponent(req.params.competition);
        const result = await pool.query(
            `SELECT m.match_id, m.home_team_id, m.away_team_id, m.match_date,
                    m.home_score, m.away_score, m.status, m.stage,
                    ht.team_name AS home_team_name,
                    at.team_name AS away_team_name
             FROM matches m
             JOIN teams ht ON ht.team_id = m.home_team_id
             JOIN teams at ON at.team_id = m.away_team_id
             WHERE m.competition = $1 AND m.stage = ANY($2::text[])
             ORDER BY m.match_date ASC`,
            [comp, KNOCKOUT_STAGE_ORDER]
        );

        // Group by stage, then pair 2-legged ties by sorted team pair
        const stages = {};
        for (const m of result.rows) {
            if (!stages[m.stage]) stages[m.stage] = {};
            const tieKey = [m.home_team_id, m.away_team_id].sort((a, b) => a - b).join('-');
            if (!stages[m.stage][tieKey]) stages[m.stage][tieKey] = [];
            stages[m.stage][tieKey].push(m);
        }

        // Shape into ordered array
        const bracket = KNOCKOUT_STAGE_ORDER
            .filter(s => stages[s])
            .map(s => ({
                stage: s,
                label: KNOCKOUT_STAGE_LABELS[s],
                ties: Object.values(stages[s]).map(legs => {
                    const teamA = legs[0].home_team_id < legs[0].away_team_id ? legs[0].home_team_name : legs[0].away_team_name;
                    const teamB = legs[0].home_team_id < legs[0].away_team_id ? legs[0].away_team_name : legs[0].home_team_name;
                    const aggA = legs.reduce((sum, l) => sum + (l.home_team_id < l.away_team_id ? (l.home_score ?? 0) : (l.away_score ?? 0)), 0);
                    const aggB = legs.reduce((sum, l) => sum + (l.home_team_id < l.away_team_id ? (l.away_score ?? 0) : (l.home_score ?? 0)), 0);
                    return { teamA, teamB, aggA, aggB, legs, done: legs.every(l => l.status === 'finished') };
                }),
            }));

        res.json(bracket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Football-data.org sync ─────────────────────────────────────────────────

// Domestic leagues: teams get their league field updated + stale cleanup runs
// Cup competitions: teams keep their domestic league field, no stale cleanup
const DOMESTIC_COMPETITIONS = new Set(['PL', 'BL1', 'SA', 'FL1', 'PD', 'DED', 'PPL', 'ELC']);
const SYNC_COMPETITIONS = ['PL', 'BL1', 'SA', 'FL1', 'PD', 'CL']; // order matters — domestics first
const SYNC_INTERVAL_MS  = 5 * 60 * 1000;

function mapStatus(s) {
    if (!s) return 'scheduled';
    const u = s.toUpperCase();
    if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(u)) return 'live';
    if (['FINISHED', 'AWARDED'].includes(u)) return 'finished';
    return 'scheduled';
}

// Rate-limited fetch — stays under the free tier 10 req/min cap
let _lastCall = 0;
async function apiFetch(url) {
    const gap = 7000; // 7 s between calls ≈ 8.5 req/min, safely under 10
    const wait = gap - (Date.now() - _lastCall);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    _lastCall = Date.now();
    return fetch(url, { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY } });
}

async function syncCompetition(code) {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') throw new Error('FOOTBALL_API_KEY not set');

    const base = 'https://api.football-data.org/v4';
    const isDomestic = DOMESTIC_COMPETITIONS.has(code);

    // ── 1. Teams ──────────────────────────────────────────────────────────────
    const teamsRes = await apiFetch(`${base}/competitions/${code}/teams`);
    if (!teamsRes.ok) {
        const err = await teamsRes.json().catch(() => ({}));
        throw new Error(err.message || `Teams fetch failed (${teamsRes.status})`);
    }
    const teamsData = await teamsRes.json();
    const competitionName = teamsData.competition?.name || code;
    const apiTeamIds = teamsData.teams.map(t => t.id);

    for (const t of teamsData.teams) {
        if (isDomestic) {
            // Update everything including the league field
            await pool.query(
                `INSERT INTO teams (team_id, team_name, league, stadium, founded_year, logo_url)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (team_id) DO UPDATE SET
                   team_name=EXCLUDED.team_name, league=EXCLUDED.league,
                   stadium=EXCLUDED.stadium, founded_year=EXCLUDED.founded_year, logo_url=EXCLUDED.logo_url`,
                [t.id, t.name, competitionName, t.venue || null, t.founded || null, t.crest || null]
            );
        } else {
            // Cup competition — insert if new, but don't overwrite domestic league
            await pool.query(
                `INSERT INTO teams (team_id, team_name, league, stadium, founded_year, logo_url)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (team_id) DO UPDATE SET
                   team_name=EXCLUDED.team_name,
                   stadium=EXCLUDED.stadium, founded_year=EXCLUDED.founded_year, logo_url=EXCLUDED.logo_url`,
                [t.id, t.name, competitionName, t.venue || null, t.founded || null, t.crest || null]
            );
        }

        // ── Squad / players ──────────────────────────────────────────────────
        for (const p of t.squad || []) {
            await pool.query(
                `INSERT INTO players (player_id, team_id, player_name, position, nationality, goals, assists, appearances)
                 VALUES ($1,$2,$3,$4,$5,0,0,0)
                 ON CONFLICT (player_id) DO UPDATE SET
                   team_id=EXCLUDED.team_id, player_name=EXCLUDED.player_name,
                   position=EXCLUDED.position, nationality=EXCLUDED.nationality`,
                [p.id, t.id, p.name, p.position || null, p.nationality || null]
            );
        }
    }

    // ── Stale cleanup (domestic only) ─────────────────────────────────────────
    if (isDomestic) {
        await pool.query(
            `DELETE FROM players WHERE team_id IN (
               SELECT team_id FROM teams WHERE league=$1 AND NOT (team_id = ANY($2::int[])))`,
            [competitionName, apiTeamIds]
        );
        await pool.query(
            `DELETE FROM matches
             WHERE home_team_id IN (SELECT team_id FROM teams WHERE league=$1 AND NOT (team_id = ANY($2::int[])))
                OR away_team_id IN (SELECT team_id FROM teams WHERE league=$1 AND NOT (team_id = ANY($2::int[])))`,
            [competitionName, apiTeamIds]
        );
        await pool.query(
            `DELETE FROM teams WHERE league=$1 AND NOT (team_id = ANY($2::int[]))`,
            [competitionName, apiTeamIds]
        );
    }

    // ── 2. Matches ────────────────────────────────────────────────────────────
    const matchesRes = await apiFetch(`${base}/competitions/${code}/matches`);
    if (!matchesRes.ok) {
        const err = await matchesRes.json().catch(() => ({}));
        throw new Error(err.message || `Matches fetch failed (${matchesRes.status})`);
    }
    const matchesData = await matchesRes.json();

    for (const m of matchesData.matches) {
        const status = mapStatus(m.status);
        const homeScore = m.score?.fullTime?.home ?? null;
        const awayScore = m.score?.fullTime?.away ?? null;
        await pool.query(
            `INSERT INTO matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, status, competition, stage)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (match_id) DO UPDATE SET
               home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score,
               status=EXCLUDED.status, match_date=EXCLUDED.match_date,
               competition=EXCLUDED.competition, stage=EXCLUDED.stage`,
            [m.id, m.homeTeam.id, m.awayTeam.id, m.utcDate, homeScore, awayScore, status, competitionName, m.stage || null]
        );
    }

    // ── 3. Scorers (goals + assists) ──────────────────────────────────────────
    const scorersRes = await apiFetch(`${base}/competitions/${code}/scorers?limit=100`);
    if (scorersRes.ok) {
        const scorersData = await scorersRes.json();
        for (const s of scorersData.scorers || []) {
            await pool.query(
                `UPDATE players SET goals=$1, assists=$2, appearances=$3 WHERE player_id=$4`,
                [s.goals || 0, s.assists || 0, s.playedMatches || 0, s.player.id]
            );
        }
    }

    return { competition: competitionName, teams: apiTeamIds.length, matches: matchesData.matches.length };
}

// ── Match events with player names ─────────────────────────────────────────
app.get('/matches/:id/events', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT me.*, p.player_name
             FROM match_events me
             LEFT JOIN players p ON p.player_id = me.player_id
             WHERE me.match_id = $1
             ORDER BY me.minute ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ── API-Football proxy: lineups, events, stats ─────────────────────────────
const _afCache = {};   // matchId → {lineups, events, stats, found}
const _afPlayerCache = {};  // playerId → { photoUrl, afPlayerId }

async function _afFetch(path) {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) { console.warn('[af] API_FOOTBALL_KEY not set'); return null; }
    try {
        const r = await fetch(`https://v3.football.api-sports.io${path}`, {
            headers: { 'x-apisports-key': key },
        });
        if (!r.ok) { console.warn(`[af] ${path} → HTTP ${r.status}`); return null; }
        return r.json();
    } catch (e) {
        console.warn('[af] fetch error:', e.message);
        return null;
    }
}

// ── API-Football connection status check ───────────────────────────────────
app.get('/api-football/status', async (req, res) => {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) return res.json({ ok: false, error: 'API_FOOTBALL_KEY not set in .env' });
    try {
        const r = await fetch('https://v3.football.api-sports.io/status', {
            headers: { 'x-apisports-key': key },
        });
        const body = await r.json();
        res.json({ ok: r.ok, status: r.status, body });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.get('/api-football/match/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    const apiKey  = process.env.API_FOOTBALL_KEY;
    const empty   = { lineups: [], events: [], stats: [], found: false };
    if (!apiKey) return res.json(empty);
    if (_afCache[matchId]) return res.json(_afCache[matchId]);

    try {
        // 1. Get our match + team data
        const mRes = await pool.query(
            `SELECT m.*,
                    ht.team_name AS home_team_name, ht.api_football_id AS home_af_id,
                    at.team_name AS away_team_name, at.api_football_id AS away_af_id,
                    m.api_football_id AS fixture_id
             FROM matches m
             JOIN teams ht ON ht.team_id = m.home_team_id
             JOIN teams at ON at.team_id = m.away_team_id
             WHERE m.match_id = $1`, [matchId]
        );
        const match = mRes.rows[0];
        if (!match) { _afCache[matchId] = empty; return res.json(empty); }

        let fixtureId  = match.fixture_id;
        let homeAfId   = match.home_af_id;
        let awayAfId   = match.away_af_id;

        // 2. Resolve API-Football team IDs if missing
        if (!homeAfId) {
            const d = await _afFetch(`/teams?search=${encodeURIComponent(match.home_team_name)}`);
            if (d?.response?.[0]) {
                homeAfId = d.response[0].team.id;
                await pool.query('UPDATE teams SET api_football_id=$1 WHERE team_id=$2', [homeAfId, match.home_team_id]);
            }
        }
        if (!awayAfId) {
            const d = await _afFetch(`/teams?search=${encodeURIComponent(match.away_team_name)}`);
            if (d?.response?.[0]) {
                awayAfId = d.response[0].team.id;
                await pool.query('UPDATE teams SET api_football_id=$1 WHERE team_id=$2', [awayAfId, match.away_team_id]);
            }
        }

        // 3. Find the fixture by team + date
        if (!fixtureId && homeAfId) {
            const date = new Date(match.match_date).toISOString().split('T')[0];
            const d    = await _afFetch(`/fixtures?team=${homeAfId}&date=${date}`);
            const fix  = d?.response?.find(f =>
                (f.teams.home.id === homeAfId && f.teams.away.id === awayAfId) ||
                (f.teams.away.id === homeAfId && f.teams.home.id === awayAfId)
            );
            if (fix) {
                fixtureId = fix.fixture.id;
                await pool.query('UPDATE matches SET api_football_id=$1 WHERE match_id=$2', [fixtureId, matchId]);
            }
        }

        if (!fixtureId) { _afCache[matchId] = empty; return res.json(empty); }

        // 4. Fetch lineups, events, stats in parallel
        const [ld, ed, sd] = await Promise.all([
            _afFetch(`/fixtures/lineups?fixture=${fixtureId}`),
            _afFetch(`/fixtures/events?fixture=${fixtureId}`),
            _afFetch(`/fixtures/statistics?fixture=${fixtureId}`),
        ]);

        const result = {
            lineups:   ld?.response || [],
            events:    ed?.response || [],
            stats:     sd?.response || [],
            found:     true,
            fixtureId,
        };
        _afCache[matchId] = result;
        res.json(result);
    } catch (err) {
        res.status(500).json({ ...empty, error: err.message });
    }
});

// ── API-Football: player photo + ID lookup ─────────────────────────────────
app.get('/api-football/player/:playerId', async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    const apiKey   = process.env.API_FOOTBALL_KEY;
    const empty    = { photoUrl: null };
    if (!apiKey) return res.json(empty);
    if (_afPlayerCache[playerId]) return res.json(_afPlayerCache[playerId]);

    try {
        const pRes = await pool.query(
            `SELECT p.*, p.api_football_id as af_player_id,
                    t.api_football_id as team_af_id
             FROM players p
             LEFT JOIN teams t ON t.team_id = p.team_id
             WHERE p.player_id = $1`, [playerId]
        );
        const player = pRes.rows[0];
        if (!player) { _afPlayerCache[playerId] = empty; return res.json(empty); }

        let afPlayerId = player.af_player_id;

        if (!afPlayerId) {
            let d = null;
            if (player.team_af_id) {
                d = await _afFetch(`/players?search=${encodeURIComponent(player.player_name)}&team=${player.team_af_id}&season=2024`);
            }
            if (!d?.response?.[0]) {
                // fallback: search by name only
                d = await _afFetch(`/players?search=${encodeURIComponent(player.player_name)}&season=2024`);
            }
            if (d?.response?.[0]) {
                afPlayerId = d.response[0].player.id;
                await pool.query('UPDATE players SET api_football_id=$1 WHERE player_id=$2', [afPlayerId, playerId]);
            }
        }

        if (!afPlayerId) { _afPlayerCache[playerId] = empty; return res.json(empty); }

        const result = {
            photoUrl:    `https://media.api-sports.io/football/players/${afPlayerId}.png`,
            afPlayerId,
        };
        _afPlayerCache[playerId] = result;
        res.json(result);
    } catch (err) {
        res.status(500).json({ ...empty, error: err.message });
    }
});

// ── DB migration — add competition column if it doesn't exist yet ──────────
async function initDb() {
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition VARCHAR(100)`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage VARCHAR(50)`);
    await pool.query(`ALTER TABLE teams   ADD COLUMN IF NOT EXISTS api_football_id INTEGER`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_football_id INTEGER`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS api_football_id INTEGER`);
}

// ── Competitions list endpoint (distinct from matches) ─────────────────────
app.get('/competitions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT competition FROM matches WHERE competition IS NOT NULL ORDER BY competition`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Auto-sync all configured competitions on startup and on interval
async function autoSync() {
    for (const code of SYNC_COMPETITIONS) {
        try {
            const result = await syncCompetition(code);
            console.log(`[sync] ${result.competition}: ${result.teams} teams, ${result.matches} matches`);
        } catch (err) {
            console.error(`[sync] ${code} failed:`, err.message);
        }
    }
}

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initDb();
    autoSync();
    setInterval(autoSync, SYNC_INTERVAL_MS);
});
