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

const UCL_NAME = 'UEFA Champions League';

// Fetch standings and render — shows skeleton while loading
export async function loadAndRenderStandings(league) {
  state.currentLeague = league;
  const isUCL = league === UCL_NAME;

  // Update active tab highlight
  document.querySelectorAll('.league-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.league === league);
  });

  // Update label
  const label = document.getElementById('standings-label');
  if (label) label.textContent = isUCL ? 'UCL League Phase' : league;

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
