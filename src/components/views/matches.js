// Matches view — competition nav, featured grid, fixtures, and watchlist.
import { state } from '../state.js';
import { abbr, crestColor, crestHtml, compName, dayLabel, fmtDate, fmtTime, isLive, isFinished } from '../utils.js';

export function renderMatchesView() {
  renderCompNav();
  renderWatchlist();
  renderFeaturedGrid();
  renderFixtures();
}

// ── Competition nav ───────────────────────────────────────────────────────────

function renderCompNav() {
  const nav = document.getElementById('matches-comp-nav');
  if (!nav) return;

  // Use competitions from matches if synced, fall back to leagues from teams table
  const comps = state.allCompetitions.length > 0
    ? state.allCompetitions.map(c => c.competition)
    : state.allLeagues.map(l => l.league);

  if (comps.length === 0) { nav.innerHTML = ''; return; }

  nav.innerHTML = ['All', ...comps].map(name => {
    const active = (name === 'All' && !state.matchesCompetition) || name === state.matchesCompetition;
    return `<button class="comp-tab${active ? ' active' : ''}" data-comp="${name}">${name === 'All' ? 'All' : compName(name)}</button>`;
  }).join('');

  nav.querySelectorAll('.comp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.matchesCompetition = btn.dataset.comp === 'All' ? null : btn.dataset.comp;
      renderMatchesView();
    });
  });
}

function filteredMatches() {
  if (!state.matchesCompetition) return state.allMatches;
  return state.allMatches.filter(m => {
    // Match on competition field if available, otherwise fall back to team league
    if (m.competition) return m.competition === state.matchesCompetition;
    const home = state.teamsMap[String(m.home_team_id)];
    const away = state.teamsMap[String(m.away_team_id)];
    return home?.league === state.matchesCompetition || away?.league === state.matchesCompetition;
  });
}

// ── Watchlist ────────────────────────────────────────────────────────────────

export function renderWatchlist() {
  const section = document.getElementById('watchlist-section');
  const rowsContainer = document.getElementById('watchlist-rows');
  if (!section || !rowsContainer) return;

  const bookmarked = [...state.bookmarkedMatches]
    .map(id => state.allMatches.find(m => String(m.match_id) === String(id)))
    .filter(Boolean);

  if (bookmarked.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  rowsContainer.innerHTML = bookmarked.map(m => {
    const home = state.teamsMap[String(m.home_team_id)] || {};
    const away = state.teamsMap[String(m.away_team_id)] || {};
    const homeAbbr = abbr(home.team_name || `T${m.home_team_id}`);
    const awayAbbr = abbr(away.team_name || `T${m.away_team_id}`);
    const homeColor = crestColor(m.home_team_id);
    const awayColor = crestColor(m.away_team_id);
    const homeName = home.team_name || `Team ${m.home_team_id}`;
    const awayName = away.team_name || `Team ${m.away_team_id}`;
    const live = isLive(m.status);
    const finished = isFinished(m.status);
    const showScore = live || finished;
    const scoreOrDate = showScore
      ? `${m.home_score ?? 0} – ${m.away_score ?? 0}`
      : fmtDate(m.match_date);

    const statusBadge = live
      ? `<span class="badge badge-live" style="font-size:9px">Live</span>`
      : finished
        ? `<span class="badge badge-finished" style="font-size:9px">FT</span>`
        : `<span class="badge badge-upcoming" style="font-size:9px">${dayLabel(m.match_date)}</span>`;

    return `
      <div class="wl-row" data-matchid="${m.match_id}" style="cursor:pointer">
        <div class="wl-crests">
          ${crestHtml(home, 26)}
          ${crestHtml(away, 26)}
        </div>
        <div class="wl-match-info">
          <div class="wl-teams-text">${homeName} vs ${awayName}</div>
          <div class="wl-date-score">${scoreOrDate}</div>
        </div>
        ${statusBadge}
        <button class="bm-btn bm-active" data-matchid="${m.match_id}" title="Remove from watchlist">🔖</button>
      </div>`;
  }).join('');
}

// ── Featured Grid ────────────────────────────────────────────────────────────

function renderFeaturedGrid() {
  const grid = document.getElementById('featured-grid');
  const all = filteredMatches();

  // Priority: live → soonest upcoming → most recent finished
  const live     = all.filter(m => isLive(m.status));
  const upcoming = all.filter(m => !isLive(m.status) && !isFinished(m.status))
                      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const finished = all.filter(m => isFinished(m.status))
                      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  const featured = [...live, ...upcoming, ...finished].slice(0, 4);

  if (featured.length === 0) {
    grid.innerHTML = '<div class="fc-empty">No matches found.</div>';
    return;
  }

  grid.innerHTML = featured.map((m, i) => {
    const home = state.teamsMap[String(m.home_team_id)] || {};
    const away = state.teamsMap[String(m.away_team_id)] || {};
    const live = isLive(m.status);
    const finished = isFinished(m.status);
    const homeAbbr = abbr(home.team_name || `T${m.home_team_id}`);
    const awayAbbr = abbr(away.team_name || `T${m.away_team_id}`);
    const homeColor = crestColor(m.home_team_id);
    const awayColor = crestColor(m.away_team_id);
    const homeName = home.team_name || `Team ${m.home_team_id}`;
    const awayName = away.team_name || `Team ${m.away_team_id}`;
    const competition = compName(m.competition || home.league || away.league || 'League');
    const stadium = home.stadium || '—';
    const isBookmarked = state.bookmarkedMatches.has(String(m.match_id));

    let badgeHtml, timeHtml;
    if (live) {
      badgeHtml = `<span class="badge badge-live">Live</span>`;
      timeHtml  = `<span class="fc-time t-live">Live</span>`;
    } else if (finished) {
      badgeHtml = `<span class="badge badge-finished">FT</span>`;
      timeHtml  = `<span class="fc-time">${fmtDate(m.match_date)}</span>`;
    } else {
      badgeHtml = `<span class="badge badge-upcoming">${dayLabel(m.match_date)}</span>`;
      const t = fmtTime(m.match_date);
      timeHtml = `<span class="fc-time">${t || fmtDate(m.match_date)}</span>`;
    }

    const showScore = live || finished;
    const homeScore = showScore ? (m.home_score ?? '—') : '—';
    const awayScore = showScore ? (m.away_score ?? '—') : '—';

    return `
      <div class="featured-card ${live ? 's-live' : finished ? 's-finished' : 's-upcoming'} fade-up" data-hometeamid="${m.home_team_id}" data-matchid="${m.match_id}" style="animation-delay:${i * 80}ms;cursor:pointer">
        <div class="fc-header">
          <span class="fc-league">${competition}</span>
          ${badgeHtml}
        </div>
        <div class="fc-team-row">
          ${crestHtml(home, 30)}
          <span class="fc-team-name">${homeName}</span>
          ${showScore ? `<span class="fc-score">${homeScore}</span>` : `<span class="fc-dash">—</span>`}
        </div>
        <div class="fc-team-row">
          ${crestHtml(away, 30)}
          <span class="fc-team-name">${awayName}</span>
          ${showScore ? `<span class="fc-score">${awayScore}</span>` : `<span class="fc-dash">—</span>`}
        </div>
        <div class="fc-footer">
          ${timeHtml}
          <div style="display:flex;align-items:center;gap:6px">
            <span class="fc-venue">${stadium}</span>
            <button class="bm-btn${isBookmarked ? ' bm-active' : ''}" data-matchid="${m.match_id}" title="Bookmark">🔖</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

function renderFixtures() {
  const table = document.getElementById('fixtures-table');
  const upcoming = filteredMatches()
    .filter(m => !isLive(m.status) && !isFinished(m.status))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(0, 10);

  const head = `<div class="fx-head"><span>Date</span><span>Match</span><span>Competition</span><span></span></div>`;

  if (upcoming.length === 0) {
    table.innerHTML = head + '<div class="fx-loading">No upcoming fixtures found.</div>';
    return;
  }

  const rows = upcoming.map((m, i) => {
    const home = state.teamsMap[String(m.home_team_id)] || {};
    const away = state.teamsMap[String(m.away_team_id)] || {};
    const homeName = home.team_name || `Team ${m.home_team_id}`;
    const awayName = away.team_name || `Team ${m.away_team_id}`;
    const competition = compName(m.competition || home.league || '—');
    const isBookmarked = state.bookmarkedMatches.has(String(m.match_id));
    return `
      <div class="fx-row fade-up" style="animation-delay:${i * 60}ms;cursor:pointer" data-matchid="${m.match_id}">
        <span class="fx-date">${fmtDate(m.match_date)}</span>
        <span class="fx-match">${homeName} vs ${awayName}</span>
        <span class="fx-league-text">${competition}</span>
        <button class="bm-btn${isBookmarked ? ' bm-active' : ''}" data-matchid="${m.match_id}" title="Bookmark">🔖</button>
      </div>`;
  }).join('');

  table.innerHTML = head + rows;
}
