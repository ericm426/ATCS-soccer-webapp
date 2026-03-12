// Following view — shows followed teams grid and followed players list.
import { state, saveFavs, saveFollowedPlayers } from '../state.js';
import { abbr, crestColor, crestHtml, isFinished } from '../utils.js';
import { pushPage } from '../router.js';

// Top-level render called on view switch
export function renderFollowingView() {
  renderFollowedTeams();
  renderFollowedPlayers();
}

// ── Followed Teams Grid ──────────────────────────────────────────────────────

export function renderFollowedTeams() {
  const grid = document.getElementById('fol-teams-grid');
  const countChip = document.getElementById('fol-teams-count');
  if (!grid) return;

  const followed = [...state.favTeamIds]
    .map(id => state.teamsMap[String(id)])
    .filter(Boolean);

  if (countChip) countChip.textContent = followed.length;

  if (followed.length === 0) {
    grid.innerHTML = `
      <div class="fol-empty" style="grid-column:1/-1">
        <div class="fol-empty-icon">⭐</div>
        <p>Follow teams to track their results and standings</p>
      </div>`;
    return;
  }

  grid.innerHTML = followed.map(t => {
    const color = crestColor(t.team_id);
    const ab = abbr(t.team_name);
    const form = getTeamRecentForm(t.team_id);
    const pos = getStandingsPosition(t);
    const posText = pos ? `#${pos} · ` : '';

    const formPips = form.map(f => {
      const cls = f === 'W' ? 'form-pip form-w' : (f === 'D' ? 'form-pip form-d' : 'form-pip form-l');
      return `<span class="${cls}">${f}</span>`;
    }).join('');

    return `
      <div class="fol-team-card" data-teamid="${t.team_id}">
        <div class="fol-team-top">
          ${crestHtml(t, 40)}
          <button class="fol-unfollow-team" data-teamid="${t.team_id}" title="Unfollow">✕</button>
        </div>
        <div class="fol-team-name">${escHtml(t.team_name)}</div>
        <div class="fol-team-league">${posText}${escHtml(t.league || '')}</div>
        <div class="fol-form">${formPips}</div>
      </div>`;
  }).join('');

  // Card click → open team profile (but not if unfollow button clicked)
  grid.querySelectorAll('.fol-team-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.fol-unfollow-team')) return;
      pushPage({ type: 'team', id: card.dataset.teamid });
    });
  });

  // Unfollow button
  grid.querySelectorAll('.fol-unfollow-team').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.favTeamIds.delete(String(btn.dataset.teamid));
      saveFavs();
      renderFollowedTeams();
    });
  });
}

// ── Followed Players List ────────────────────────────────────────────────────

export function renderFollowedPlayers() {
  const container = document.getElementById('fol-players-list');
  const countChip = document.getElementById('fol-players-count');
  if (!container) return;

  const followed = [...state.followedPlayers]
    .map(id => state.allPlayers.find(p => String(p.player_id) === String(id)))
    .filter(Boolean);

  if (countChip) countChip.textContent = followed.length;

  if (followed.length === 0) {
    container.innerHTML = `
      <div class="fol-empty" style="padding:20px 0">
        <div class="fol-empty-icon" style="font-size:28px">👤</div>
        <p>Follow players from their team's profile</p>
      </div>`;
    return;
  }

  const rowsHtml = followed.map(p => {
    const team = state.teamsMap[String(p.team_id)] || {};
    const initials = p.player_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="fol-player-row" data-playerid="${p.player_id}">
        <div class="tp-player-avatar" id="fol-avatar-${p.player_id}">
          <div class="tp-player-initials">${initials}</div>
        </div>
        <div class="fol-player-info">
          <div class="fol-player-name">${escHtml(p.player_name)}</div>
          <div class="fol-player-meta">${escHtml(team.team_name || '—')} · ${escHtml(p.nationality || '—')} · ${p.position || '—'}</div>
        </div>
        <div class="fol-player-stats">
          <span class="fol-stat-val">${p.goals ?? 0}</span>
          <span class="fol-stat-sep">G</span>
          <span class="fol-stat-val" style="margin-left:4px">${p.assists ?? 0}</span>
          <span class="fol-stat-sep">A</span>
        </div>
        <button class="fol-unfollow-player" data-playerid="${p.player_id}" title="Unfollow">✕</button>
      </div>`;
  }).join('');

  container.innerHTML = rowsHtml;

  // Load player photos async
  for (const p of followed) {
    fetch(`/api-football/player/${p.player_id}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        if (!d.photoUrl) return;
        const wrap = document.getElementById(`fol-avatar-${p.player_id}`);
        if (!wrap?.isConnected) return;
        const img = document.createElement('img');
        img.src = d.photoUrl;
        img.className = 'tp-player-photo';
        img.loading = 'lazy';
        img.onerror = () => img.remove();
        img.onload = () => {
          const init = wrap.querySelector('.tp-player-initials');
          if (init) init.remove();
          wrap.appendChild(img);
        };
        wrap.appendChild(img);
      })
      .catch(() => {});
  }

  container.querySelectorAll('.fol-player-row[data-playerid]').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.fol-unfollow-player')) return;
      pushPage({ type: 'player', id: row.dataset.playerid });
    });
  });

  container.querySelectorAll('.fol-unfollow-player').forEach(btn => {
    btn.addEventListener('click', () => {
      state.followedPlayers.delete(String(btn.dataset.playerid));
      saveFollowedPlayers();
      renderFollowedPlayers();
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Compute last 5 form results for a team from state.allMatches
function getTeamRecentForm(teamId) {
  const id = String(teamId);
  const finished = state.allMatches
    .filter(m => isFinished(m.status) &&
      (String(m.home_team_id) === id || String(m.away_team_id) === id))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(-5);

  return finished.map(m => {
    const isHome = String(m.home_team_id) === id;
    const gs = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    return gs > ga ? 'W' : gs < ga ? 'L' : 'D';
  });
}

// Look up standings position from cache
function getStandingsPosition(team) {
  const cache = state.standingsCache[team.league];
  if (!cache) return null;
  const idx = cache.findIndex(r => String(r.team_id) === String(team.team_id));
  return idx >= 0 ? idx + 1 : null;
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
