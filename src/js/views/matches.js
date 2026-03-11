// Matches view — featured grid, fixtures, and watchlist.
import { state } from '../state.js';
import { abbr, crestColor, dayLabel, fmtDate, fmtTime, isLive, isFinished } from '../utils.js';

export function renderMatchesView() {
  renderWatchlist();
  renderFeaturedGrid();
  renderFixtures();
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
      <div class="wl-row">
        <div class="wl-crests">
          <div class="wl-crest" style="background:${homeColor}">${homeAbbr}</div>
          <div class="wl-crest" style="background:${awayColor};margin-left:-4px">${awayAbbr}</div>
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
  const featured = state.allMatches.slice(0, 4);

  if (featured.length === 0) {
    grid.innerHTML = '<div class="fc-empty">No matches scheduled this week.</div>';
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
    const league = home.league || away.league || 'League';
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
          <span class="fc-league">${league}</span>
          ${badgeHtml}
        </div>
        <div class="fc-team-row">
          <div class="fc-crest" style="background:${homeColor}">${homeAbbr}</div>
          <span class="fc-team-name">${homeName}</span>
          ${showScore ? `<span class="fc-score">${homeScore}</span>` : `<span class="fc-dash">—</span>`}
        </div>
        <div class="fc-team-row">
          <div class="fc-crest" style="background:${awayColor}">${awayAbbr}</div>
          <span class="fc-team-name">${awayName}</span>
          ${showScore ? `<span class="fc-score">${awayScore}</span>` : `<span class="fc-dash">—</span>`}
        </div>
        <div class="fc-footer">
          ${timeHtml}
          <div style="display:flex;align-items:center;gap:6px">
            <span class="fc-venue">${stadium}</span>
            <button class="fc-edit-btn" data-matchid="${m.match_id}" title="Update score">✎</button>
            <button class="bm-btn${isBookmarked ? ' bm-active' : ''}" data-matchid="${m.match_id}" title="Bookmark">🔖</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

function renderFixtures() {
  const table = document.getElementById('fixtures-table');
  const upcoming = state.allMatches
    .filter(m => !isLive(m.status) && !isFinished(m.status))
    .slice(0, 6);

  const head = `<div class="fx-head"><span>Date</span><span>Match</span><span>League</span></div>`;

  if (upcoming.length === 0) {
    table.innerHTML = head + '<div class="fx-loading">No upcoming fixtures found.</div>';
    return;
  }

  const rows = upcoming.map((m, i) => {
    const home = state.teamsMap[String(m.home_team_id)] || {};
    const away = state.teamsMap[String(m.away_team_id)] || {};
    const homeName = home.team_name || `Team ${m.home_team_id}`;
    const awayName = away.team_name || `Team ${m.away_team_id}`;
    const league = home.league || away.league || '—';
    const isBookmarked = state.bookmarkedMatches.has(String(m.match_id));
    return `
      <div class="fx-row fade-up" style="animation-delay:${i * 60}ms">
        <span class="fx-date">${fmtDate(m.match_date)}</span>
        <span class="fx-match">${homeName} vs ${awayName}</span>
        <span class="fx-league-text">${league}</span>
      </div>`;
  }).join('');

  table.innerHTML = head + rows;
}
