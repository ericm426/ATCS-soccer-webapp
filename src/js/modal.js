// Modal system — Add Match, Update Score, Team Profile.
// Callbacks are set by app.js after data is loaded so views re-render on changes.

import { state, saveFavs, saveFollowedPlayers } from './state.js';
import { postData, putData } from './api.js';
import { showToast } from './toast.js';
import { abbr, crestColor, fmtDate, isFinished } from './utils.js';

let onMatchAdded = null;
let onMatchUpdated = null;

export function setCallbacks(callbacks) {
  onMatchAdded   = callbacks.onMatchAdded;
  onMatchUpdated = callbacks.onMatchUpdated;
}

// ── Core open/close ──────────────────────────────────────────────────────────

export function closeModal() {
  const overlay = document.getElementById('modal');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function openModal(html) {
  const overlay = document.getElementById('modal');
  const inner   = document.getElementById('modal-inner');
  inner.innerHTML = html;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));

  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); }, { once: true });
}

function showError(msg) {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Add Match ────────────────────────────────────────────────────────────────

export function openAddMatchModal() {
  const teamOptions = state.allTeams
    .map(t => `<option value="${t.team_id}">${t.team_name}</option>`)
    .join('');

  openModal(`
    <div class="modal-header">
      <span class="modal-title">Add Match</span>
      <button class="modal-close-btn" id="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Home Team</label>
        <select id="f-home-team" class="form-input filter-select" style="width:100%">
          <option value="">Select team…</option>${teamOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Away Team</label>
        <select id="f-away-team" class="form-input filter-select" style="width:100%">
          <option value="">Select team…</option>${teamOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Match Date</label>
        <input id="f-match-date" class="form-input" type="date" required>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="f-match-status" class="form-input filter-select" style="width:100%">
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="finished">Finished</option>
        </select>
      </div>
      <div id="score-fields" style="display:none">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Home Score</label>
            <input id="f-home-score" class="form-input" type="number" min="0" value="0">
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Away Score</label>
            <input id="f-away-score" class="form-input" type="number" min="0" value="0">
          </div>
        </div>
      </div>
      <div id="form-error" class="form-error" style="display:none"></div>
      <button id="f-submit" class="form-btn">Add Match</button>
    </div>
  `);

  document.getElementById('f-match-status').addEventListener('change', e => {
    const show = e.target.value === 'live' || e.target.value === 'finished';
    document.getElementById('score-fields').style.display = show ? 'block' : 'none';
  });

  document.getElementById('f-submit').addEventListener('click', async () => {
    const homeId  = parseInt(document.getElementById('f-home-team').value);
    const awayId  = parseInt(document.getElementById('f-away-team').value);
    const date    = document.getElementById('f-match-date').value;
    const status  = document.getElementById('f-match-status').value;
    const showScore = status === 'live' || status === 'finished';
    const homeScore = showScore ? (parseInt(document.getElementById('f-home-score').value) || 0) : null;
    const awayScore = showScore ? (parseInt(document.getElementById('f-away-score').value) || 0) : null;

    if (!homeId || !awayId || !date) { showError('Please fill in all required fields.'); return; }
    if (homeId === awayId) { showError('Home and away teams must be different.'); return; }

    const btn = document.getElementById('f-submit');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const newId = Math.max(0, ...state.allMatches.map(m => m.match_id)) + 1;

    const result = await postData('/matches', {
      match_id: newId,
      home_team_id: homeId,
      away_team_id: awayId,
      match_date: date,
      home_score: homeScore,
      away_score: awayScore,
      status,
    });

    if (result.error) {
      showError(result.error);
      btn.textContent = 'Add Match';
      btn.disabled = false;
      return;
    }

    state.allMatches.push(result);
    closeModal();
    showToast('Match added!', 'success');
    if (onMatchAdded) onMatchAdded();
  });
}

// ── Update Match Score ───────────────────────────────────────────────────────

export function openUpdateScoreModal(matchId) {
  const m = state.allMatches.find(m => String(m.match_id) === String(matchId));
  if (!m) return;
  const home = state.teamsMap[String(m.home_team_id)] || {};
  const away = state.teamsMap[String(m.away_team_id)] || {};

  openModal(`
    <div class="modal-header">
      <span class="modal-title">Update Score</span>
      <button class="modal-close-btn" id="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-match-preview">
        <span class="modal-team-name">${home.team_name || '?'}</span>
        <span class="modal-vs">vs</span>
        <span class="modal-team-name">${away.team_name || '?'}</span>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">${home.team_name || 'Home'}</label>
          <input id="f-home-score" class="form-input" type="number" min="0" value="${m.home_score ?? 0}">
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">${away.team_name || 'Away'}</label>
          <input id="f-away-score" class="form-input" type="number" min="0" value="${m.away_score ?? 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="f-match-status" class="form-input filter-select" style="width:100%">
          <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
          <option value="live"      ${m.status === 'live'      ? 'selected' : ''}>Live</option>
          <option value="finished"  ${m.status === 'finished'  ? 'selected' : ''}>Finished</option>
        </select>
      </div>
      <div id="form-error" class="form-error" style="display:none"></div>
      <button id="f-submit" class="form-btn">Update Score</button>
    </div>
  `);

  document.getElementById('f-submit').addEventListener('click', async () => {
    const homeScore = parseInt(document.getElementById('f-home-score').value) || 0;
    const awayScore = parseInt(document.getElementById('f-away-score').value) || 0;
    const status    = document.getElementById('f-match-status').value;

    const btn = document.getElementById('f-submit');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const result = await putData(`/matches/${matchId}`, { home_score: homeScore, away_score: awayScore, status });

    if (result.error) {
      showError(result.error);
      btn.textContent = 'Update Score';
      btn.disabled = false;
      return;
    }

    const idx = state.allMatches.findIndex(m => String(m.match_id) === String(matchId));
    if (idx >= 0) {
      state.allMatches[idx] = { ...state.allMatches[idx], home_score: homeScore, away_score: awayScore, status };
    }

    closeModal();
    showToast('Score updated!', 'success');
    if (onMatchUpdated) onMatchUpdated();
  });
}

// ── Team Profile Modal ───────────────────────────────────────────────────────

export async function openTeamProfileModal(teamId) {
  const team = state.teamsMap[String(teamId)];
  if (!team) return;

  const color = crestColor(teamId);
  const ab = abbr(team.team_name);
  const isFav = state.favTeamIds.has(String(teamId));

  // Render initial shell immediately; matches load async
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Team Profile</span>
      <button class="modal-close-btn" id="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="tp-header">
        <div class="tp-crest" style="background:${color}">${ab}</div>
        <div class="tp-info">
          <div class="tp-name">${escHtml(team.team_name)}</div>
          <div class="tp-meta">
            ${escHtml(team.league || '—')}<br>
            ${team.stadium ? escHtml(team.stadium) + ' · ' : ''}Est. ${team.founded_year || '—'}
          </div>
        </div>
        <button id="tp-follow-btn" class="tp-follow-btn ${isFav ? 'following' : 'not-following'}">
          ${isFav ? '✓ Following' : '+ Follow'}
        </button>
      </div>

      <div class="tp-section-title">Recent Matches</div>
      <div id="tp-matches-list"><div class="st-loading" style="padding:16px 0">Loading…</div></div>

      <div class="tp-section-title">Squad</div>
      <div id="tp-squad-list"></div>
    </div>
  `);

  // Follow/unfollow toggle
  document.getElementById('tp-follow-btn').addEventListener('click', () => {
    const id = String(teamId);
    if (state.favTeamIds.has(id)) {
      state.favTeamIds.delete(id);
    } else {
      state.favTeamIds.add(id);
    }
    saveFavs();
    const btn = document.getElementById('tp-follow-btn');
    if (btn) {
      const nowFav = state.favTeamIds.has(id);
      btn.textContent = nowFav ? '✓ Following' : '+ Follow';
      btn.className = `tp-follow-btn ${nowFav ? 'following' : 'not-following'}`;
    }
    showToast(state.favTeamIds.has(id) ? 'Team followed!' : 'Unfollowed.', 'info');
  });

  // Render squad from cached state
  renderTeamSquad(teamId);

  // Fetch recent matches async
  try {
    const r = await fetch(`/teams/${teamId}/matches`);
    const matches = r.ok ? await r.json() : [];
    renderTeamMatches(teamId, matches.slice(0, 5));
  } catch {
    const el = document.getElementById('tp-matches-list');
    if (el) el.innerHTML = '<div class="st-empty-msg">Could not load matches.</div>';
  }
}

function renderTeamMatches(teamId, matches) {
  const el = document.getElementById('tp-matches-list');
  if (!el) return;

  const finished = matches.filter(m => isFinished(m.status));
  if (finished.length === 0) {
    el.innerHTML = '<div class="st-empty-msg" style="padding:12px 0">No finished matches yet.</div>';
    return;
  }

  el.innerHTML = finished.map(m => {
    const isHome = String(m.home_team_id) === String(teamId);
    const opponentId = isHome ? m.away_team_id : m.home_team_id;
    const opponent = state.teamsMap[String(opponentId)] || {};
    const gs = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    const result = gs > ga ? 'W' : gs < ga ? 'L' : 'D';
    const resultClass = result === 'W' ? 'tp-result-w' : result === 'L' ? 'tp-result-l' : 'tp-result-d';
    const home = state.teamsMap[String(m.home_team_id)] || {};
    const away = state.teamsMap[String(m.away_team_id)] || {};

    return `
      <div class="tp-match-row">
        <div class="tp-match-info">
          <div class="tp-match-teams">${escHtml(home.team_name || '?')} vs ${escHtml(away.team_name || '?')}</div>
          <div class="tp-match-date">${fmtDate(m.match_date)}</div>
        </div>
        <div class="tp-match-score">${m.home_score ?? 0} – ${m.away_score ?? 0}</div>
        <span class="${resultClass}" style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;width:18px;text-align:center">${result}</span>
      </div>`;
  }).join('');
}

function renderTeamSquad(teamId) {
  const el = document.getElementById('tp-squad-list');
  if (!el) return;

  const players = state.allPlayers.filter(p => String(p.team_id) === String(teamId));
  if (players.length === 0) {
    el.innerHTML = '<div class="st-empty-msg" style="padding:12px 0">No players in squad.</div>';
    return;
  }

  el.innerHTML = players.map(p => {
    const isFollowed = state.followedPlayers.has(String(p.player_id));
    return `
      <div class="tp-player-row">
        <div style="flex:1;min-width:0">
          <div class="tp-player-name">${escHtml(p.player_name)}</div>
          <div class="tp-player-meta">${p.position || '—'} · ${escHtml(p.nationality || '—')}</div>
        </div>
        <div class="tp-player-stats">${p.goals ?? 0}G / ${p.assists ?? 0}A</div>
        <button class="tp-follow-player-btn${isFollowed ? ' active' : ''}" data-playerid="${p.player_id}">
          ${isFollowed ? '♥' : '♡'}
        </button>
      </div>`;
  }).join('');

  el.querySelectorAll('.tp-follow-player-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = String(btn.dataset.playerid);
      if (state.followedPlayers.has(pid)) {
        state.followedPlayers.delete(pid);
        btn.classList.remove('active');
        btn.textContent = '♡';
        showToast('Unfollowed player.', 'info');
      } else {
        state.followedPlayers.add(pid);
        btn.classList.add('active');
        btn.textContent = '♥';
        showToast('Player followed!', 'success');
      }
      saveFollowedPlayers();
    });
  });
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
