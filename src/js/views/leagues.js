// Leagues view — renders league tabs + standings table (Fotmob-style).
import { state } from '../state.js';
import { abbr, crestColor } from '../utils.js';
import { openTeamProfileModal } from '../modal.js';

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
  const container = document.getElementById('league-tabs');
  if (!container) return;

  if (state.allLeagues.length === 0) {
    container.innerHTML = '<div class="lt-skeleton"></div><div class="lt-skeleton"></div><div class="lt-skeleton"></div>';
    return;
  }

  container.innerHTML = state.allLeagues.map(l => {
    const isActive = l.league === state.currentLeague;
    return `<button class="league-tab${isActive ? ' active' : ''}" data-league="${escHtml(l.league)}">
      ${escHtml(l.league)}
    </button>`;
  }).join('');

  // Tab click handlers
  container.querySelectorAll('.league-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      loadAndRenderStandings(btn.dataset.league);
    });
  });
}

// Fetch standings and render — shows skeleton while loading
export async function loadAndRenderStandings(league) {
  state.currentLeague = league;

  // Update active tab highlight
  document.querySelectorAll('.league-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.league === league);
  });

  // Update label
  const label = document.getElementById('standings-label');
  if (label) label.textContent = league;

  // Show skeleton rows while loading
  const table = document.getElementById('standings-table');
  if (table) {
    table.innerHTML = Array.from({ length: 6 }, () => '<div class="st-skeleton"></div>').join('');
  }

  // Check cache first
  if (state.standingsCache[league]) {
    renderStandingsTable(state.standingsCache[league]);
    return;
  }

  try {
    const r = await fetch(`/standings/${encodeURIComponent(league)}`);
    if (!r.ok) throw new Error('Failed to load standings');
    const rows = await r.json();
    // Cache the result
    state.standingsCache[league] = rows;
    renderStandingsTable(rows);
  } catch {
    if (table) {
      table.innerHTML = '<div class="st-empty-msg">Could not load standings. Check your connection.</div>';
    }
  }
}

// Render the full standings table from an array of row objects
export function renderStandingsTable(rows) {
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
  // UCL spots = top 4 (or fewer if less than 4 teams)
  const uclSpots = Math.min(4, Math.floor(total / 2));
  // Relegation = bottom 3
  const relStart = total - 3;

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
          <div class="st-crest" style="background:${color}">${ab}</div>
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
    row.addEventListener('click', () => openTeamProfileModal(row.dataset.teamid));
  });
}

// Simple HTML escaping helper
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
