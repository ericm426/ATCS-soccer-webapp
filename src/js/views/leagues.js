// Leagues view — renders league tabs + standings table (Fotmob-style).
import { state } from '../state.js';
import { abbr, crestColor, crestHtml, compName } from '../utils.js';
import { pushPage } from '../router.js';

// Called once from nav.js when user first navigates to leagues view
export function renderLeaguesView() {
  renderLeagueTabs();
  // Auto-load first league if available
  if (state.allLeagues.length > 0 && !state.currentLeague) {
    loadAndRenderStandings(state.allLeagues[0].league);
  } else if (state.currentLeague) {
    loadAndRenderStandings(state.currentLeague);
  }
}

// Render the scrollable tab row from state.allLeagues
export function renderLeagueTabs() {
  state.leagueView = state.leagueView || 'standings';
  const container = document.getElementById('league-tabs');
  if (!container) return;

  if (state.allLeagues.length === 0) {
    container.innerHTML = '<div class="lt-skeleton"></div><div class="lt-skeleton"></div><div class="lt-skeleton"></div>';
    return;
  }

  container.innerHTML = state.allLeagues.map(l => {
    const isActive = l.league === state.currentLeague;
    return `<button class="league-tab${isActive ? ' active' : ''}" data-league="${escHtml(l.league)}">
      ${escHtml(compName(l.league))}
    </button>`;
  }).join('');

  // Tab click handlers
  container.querySelectorAll('.league-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      loadAndRenderStandings(btn.dataset.league);
    });
  });
}

export function renderLeagueSubtabs() {
  const el = document.getElementById('league-subtabs');
  if (!el) return;
  el.querySelectorAll('.league-subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === (state.leagueView || 'standings'));
    btn.onclick = () => {
      state.leagueView = btn.dataset.subtab;
      renderLeagueSubtabs();
      if (state.leagueView === 'players') {
        renderLeaguePlayers();
      } else {
        document.getElementById('players-table').style.display = 'none';
        document.getElementById('standings-table').style.display = '';
        document.getElementById('standings-legend').style.display = '';
      }
    };
  });
}

const UCL_NAME = 'UEFA Champions League';

function renderLeaguePlayers() {
  const standingsEl = document.getElementById('standings-table');
  const legendEl    = document.getElementById('standings-legend');
  const bracketEl   = document.getElementById('bracket-section');
  const playersEl   = document.getElementById('players-table');
  if (!playersEl) return;

  if (standingsEl) standingsEl.style.display = 'none';
  if (legendEl)    legendEl.style.display    = 'none';
  if (bracketEl)   bracketEl.style.display   = 'none';
  playersEl.style.display = '';

  // Get teams in the current league
  const league = state.currentLeague;
  if (!league) { playersEl.innerHTML = '<div class="st-empty-msg" style="padding:16px 20px">Select a league first.</div>'; return; }

  const leagueTeamIds = new Set(
    state.allTeams
      .filter(t => t.league === league)
      .map(t => String(t.team_id))
  );

  // Also include teams from competition matches (for cup comps like CL)
  const compTeamIds = new Set(
    state.allMatches
      .filter(m => m.competition === league)
      .flatMap(m => [String(m.home_team_id), String(m.away_team_id)])
  );
  const allTeamIds = new Set([...leagueTeamIds, ...compTeamIds]);

  let players = state.allPlayers.filter(p => allTeamIds.has(String(p.team_id)));

  const sort = state.leaguePlayerSort || 'goals';
  // For goals/assists: only show players with > 0; for appearances: show everyone
  const filtered = sort === 'appearances'
    ? players
    : players.filter(p => (p[sort] ?? 0) > 0);
  players = filtered
    .sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0))
    .slice(0, 30);

  const sortBtns = ['goals', 'assists', 'appearances'].map(s =>
    `<button class="pl-sort-btn${sort === s ? ' active' : ''}" data-plsort="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`
  ).join('');

  const head = `
    <div class="pl-sort-row">${sortBtns}</div>
    <div class="pl-table-head">
      <span>#</span><span>Player</span><span>G</span><span>A</span><span>Apps</span>
    </div>`;

  const rows = players.map((p, i) => {
    const team = state.teamsMap[String(p.team_id)] || {};
    const pc   = posClass(p.position);
    const pos  = posShort(p.position) || '—';
    return `
      <div class="pl-table-row" data-playerid="${p.player_id}" style="cursor:pointer">
        <span class="pl-rank">${i + 1}</span>
        <div class="pl-table-player">
          <div class="pl-table-avatar">${(p.player_name.split(' ').map(w=>w[0]).join('').slice(0,2) || '?').toUpperCase()}</div>
          <div>
            <div class="pl-table-name">${escHtml(p.player_name)}</div>
            <div class="pl-table-team">${crestHtml(team, 14)} ${escHtml(team.team_name || '—')}</div>
          </div>
        </div>
        <span class="pl-table-stat">${p.goals ?? 0}</span>
        <span class="pl-table-stat">${p.assists ?? 0}</span>
        <span class="pl-table-stat">${p.appearances ?? 0}</span>
      </div>`;
  }).join('');

  const emptyMsg = sort === 'appearances'
    ? 'No squad data synced yet.'
    : `No ${sort} recorded yet — stats sync every 5 minutes.`;
  playersEl.innerHTML = head + (rows || `<div class="st-empty-msg" style="padding:16px 20px">${emptyMsg}</div>`);

  // Sort button handlers
  playersEl.querySelectorAll('.pl-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.leaguePlayerSort = btn.dataset.plsort;
      renderLeaguePlayers();
    });
  });

  // Row click → player page
  playersEl.querySelectorAll('.pl-table-row[data-playerid]').forEach(row => {
    row.addEventListener('click', () => pushPage({ type: 'player', id: row.dataset.playerid }));
  });
}

// Fetch standings and render — shows skeleton while loading
export async function loadAndRenderStandings(league) {
  state.currentLeague = league;
  const isUCL = league === UCL_NAME;

  // Update active tab highlight
  document.querySelectorAll('.league-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.league === league);
  });

  renderLeagueSubtabs();
  if (state.leagueView === 'players') {
    renderLeaguePlayers();
    return;
  }

  // Update label
  const label = document.getElementById('standings-label');
  if (label) label.textContent = isUCL ? 'UCL League Phase' : compName(league);

  // Toggle legend / bracket visibility
  const legend = document.getElementById('standings-legend');
  const bracketSection = document.getElementById('bracket-section');
  if (legend) legend.style.display = isUCL ? 'none' : '';
  if (bracketSection) bracketSection.style.display = isUCL ? 'block' : 'none';

  // Show skeleton rows while loading
  const table = document.getElementById('standings-table');
  if (table) {
    table.innerHTML = Array.from({ length: 6 }, () => '<div class="st-skeleton"></div>').join('');
  }

  // Check cache first
  if (state.standingsCache[league]) {
    renderStandingsTable(state.standingsCache[league], isUCL);
  } else {
    try {
      const r = await fetch(`/standings/${encodeURIComponent(league)}`);
      if (!r.ok) throw new Error('Failed to load standings');
      const rows = await r.json();
      state.standingsCache[league] = rows;
      renderStandingsTable(rows, isUCL);
    } catch {
      if (table) {
        table.innerHTML = '<div class="st-empty-msg">Could not load standings. Check your connection.</div>';
      }
    }
  }

  // Load bracket in parallel for UCL
  if (isUCL) loadAndRenderBracket(league);
}

async function loadAndRenderBracket(league) {
  const container = document.getElementById('bracket-container');
  if (!container) return;
  container.innerHTML = '<div class="st-loading" style="padding:16px">Loading bracket…</div>';

  try {
    const r = await fetch(`/bracket/${encodeURIComponent(league)}`);
    if (!r.ok) throw new Error();
    const bracket = await r.json();
    renderBracket(bracket, container);
  } catch {
    container.innerHTML = '<div class="st-empty-msg">Knockout bracket not yet available.</div>';
  }
}

function renderBracket(bracket, container) {
  if (!bracket.length) {
    container.innerHTML = '<div class="st-empty-msg">Knockout stage not started yet.</div>';
    return;
  }

  container.innerHTML = bracket.map(round => `
    <div class="bracket-round">
      <div class="bracket-round-label">${escHtml(round.label)}</div>
      <div class="bracket-ties">
        ${round.ties.map(tie => {
          const aWins = tie.done ? (tie.aggA > tie.aggB ? 'winner' : tie.aggB > tie.aggA ? 'loser' : '') : '';
          const bWins = tie.done ? (tie.aggB > tie.aggA ? 'winner' : tie.aggA > tie.aggB ? 'loser' : '') : '';
          const scoreHtml = tie.done
            ? `<span class="bk-agg">${tie.aggA} – ${tie.aggB}</span>`
            : `<span class="bk-agg bk-agg-pending">vs</span>`;
          return `
            <div class="bracket-tie">
              <div class="bk-team ${aWins}">${escHtml(tie.teamA)}</div>
              ${scoreHtml}
              <div class="bk-team ${bWins}">${escHtml(tie.teamB)}</div>
              ${tie.legs.length > 1 ? `<div class="bk-legs">${tie.legs.map(l =>
                `<span>${escHtml(l.home_team_name.split(' ')[0])} ${l.home_score ?? '?'}–${l.away_score ?? '?'} ${escHtml(l.away_team_name.split(' ')[0])}</span>`
              ).join(' · ')}</div>` : ''}
            </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// Render the full standings table from an array of row objects
export function renderStandingsTable(rows, isUCL = false) {
  const table = document.getElementById('standings-table');
  if (!table) return;

  // Update count chip
  const chip = document.getElementById('standings-count');
  if (chip) chip.textContent = rows.length;

  if (rows.length === 0) {
    table.innerHTML = '<div class="st-empty-msg">No standings data available yet.</div>';
    return;
  }

  const total = rows.length;
  // UCL: top 8 auto qualify to R16, 9-24 go to playoffs, 25-36 eliminated
  // Domestic: top 4 UCL, bottom 3 relegated
  const uclSpots  = isUCL ? 8  : Math.min(4, Math.floor(total / 2));
  const relStart  = isUCL ? 24 : total - 3;

  const headHtml = `
    <div class="st-head">
      <span>#</span>
      <span>Team</span>
      <span>P</span>
      <span>W</span>
      <span>D</span>
      <span>L</span>
      <span>GD</span>
      <span>Pts</span>
      <span style="text-align:right">Form</span>
    </div>`;

  const rowsHtml = rows.map((r, i) => {
    const pos = i + 1;
    const zoneClass = pos <= uclSpots ? 'zone-ucl' : (i >= relStart ? 'zone-rel' : '');
    const posClass = pos <= uclSpots ? 'st-col-pos pos-ucl' : 'st-col-pos';
    const color = crestColor(r.team_id);
    const ab = abbr(r.team_name);
    const isFav = state.favTeamIds.has(String(r.team_id));
    const gdStr = r.gd > 0 ? `+${r.gd}` : String(r.gd);
    const gdClass = r.gd > 0 ? 'st-col-num gd-pos' : (r.gd < 0 ? 'st-col-num gd-neg' : 'st-col-num');

    const formPips = (r.form || []).map(f => {
      const cls = f === 'W' ? 'form-pip form-w' : (f === 'D' ? 'form-pip form-d' : 'form-pip form-l');
      return `<span class="${cls}">${f}</span>`;
    }).join('');

    return `
      <div class="st-row ${zoneClass}" data-teamid="${r.team_id}" style="cursor:pointer">
        <span class="${posClass}">${pos}</span>
        <div class="st-col-team">
          ${crestHtml(state.teamsMap[String(r.team_id)], 28)}
          <span class="st-name">${escHtml(r.team_name)}</span>
          ${isFav ? '<span class="st-fav-dot">●</span>' : ''}
        </div>
        <span class="st-col-num">${r.p}</span>
        <span class="st-col-num">${r.w}</span>
        <span class="st-col-num">${r.d}</span>
        <span class="st-col-num">${r.l}</span>
        <span class="${gdClass}">${gdStr}</span>
        <span class="st-col-pts">${r.pts}</span>
        <div class="st-col-form">${formPips}</div>
      </div>`;
  }).join('');

  table.innerHTML = headHtml + rowsHtml;

  // Row click → open team profile modal
  table.querySelectorAll('.st-row[data-teamid]').forEach(row => {
    row.addEventListener('click', () => pushPage({ type: 'team', id: row.dataset.teamid }));
  });
}

// Simple HTML escaping helper
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
