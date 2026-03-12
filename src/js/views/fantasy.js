// Fantasy mode — create custom teams, players, matches, and match events.
// All data is persisted to the database via the /fantasy/* REST endpoints.

let _teams = [];          // cached fantasy teams
let _activeTab = 'teams'; // 'teams' | 'matches'
let _teamDetail = null;   // { team, players } currently expanded
let _matchDetail = null;  // { match, events } currently expanded

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(path, opts);
  if (r.status === 204) return {};
  const text = await r.text();
  console.log(`[fantasy] ${method} ${path} → ${r.status}`, text.slice(0, 200));
  try { return JSON.parse(text); } catch { return {}; }
}

// ── Top-level render ──────────────────────────────────────────────────────────

export async function renderFantasyView() {
  const view = document.getElementById('view-fantasy');
  if (!view) return;

  const teamsRes = await api('GET', '/fantasy/teams');
  _teams = Array.isArray(teamsRes) ? teamsRes : [];

  _renderShell(view);
  _attachTabListeners(view);
  await _renderActiveTab(view);
}

function _renderShell(view) {
  view.innerHTML = `
    <div class="page-header" style="padding-bottom:6px">
      <h1 class="page-title">Fantasy</h1>
    </div>

    <div class="fy-tabs">
      <button class="fy-tab ${_activeTab === 'teams'   ? 'active' : ''}" data-fytab="teams">Teams</button>
      <button class="fy-tab ${_activeTab === 'matches' ? 'active' : ''}" data-fytab="matches">Matches</button>
    </div>

    <div id="fy-content"></div>
  `;
}

function _attachTabListeners(view) {
  view.querySelectorAll('.fy-tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      _activeTab = btn.dataset.fytab;
      _teamDetail  = null;
      _matchDetail = null;
      view.querySelectorAll('.fy-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await _renderActiveTab(view);
    });
  });
}

async function _renderActiveTab(view) {
  const content = document.getElementById('fy-content');
  if (!content) return;

  if (_activeTab === 'teams') {
    if (_teamDetail) {
      await _renderTeamDetail(content);
    } else {
      _renderTeamsList(content);
    }
  } else {
    if (_matchDetail) {
      await _renderMatchDetail(content);
    } else {
      await _renderMatchesList(content);
    }
  }
}

// ── Teams list ────────────────────────────────────────────────────────────────

function _renderTeamsList(content) {
  const teamCards = _teams.length === 0
    ? `<div class="fy-empty"><div class="fy-empty-icon">🏟</div><p>No fantasy teams yet.<br>Create one to get started.</p></div>`
    : _teams.map(t => `
        <div class="fy-team-card" data-teamid="${t.team_id}">
          <div class="fy-team-badge">${esc(t.name.slice(0,2).toUpperCase())}</div>
          <div class="fy-team-name">${esc(t.name)}</div>
          <button class="fy-delete-btn" data-deleteteam="${t.team_id}" title="Delete team">✕</button>
        </div>`).join('');

  content.innerHTML = `
    <div class="fy-action-bar">
      <button class="fy-create-btn" id="fy-new-team">＋ New Team</button>
    </div>
    <div id="fy-new-team-form" style="display:none" class="fy-inline-form">
      <input id="fy-team-name-input" class="form-input" type="text" placeholder="Team name…" maxlength="60">
      <button class="fy-save-btn" id="fy-team-save">Create</button>
      <button class="fy-cancel-btn" id="fy-team-cancel">Cancel</button>
    </div>
    <div class="fy-teams-grid">${teamCards}</div>
  `;

  // Show/hide inline form
  content.querySelector('#fy-new-team').addEventListener('click', () => {
    content.querySelector('#fy-new-team-form').style.display = 'flex';
    content.querySelector('#fy-team-name-input').focus();
  });
  content.querySelector('#fy-team-cancel').addEventListener('click', () => {
    content.querySelector('#fy-new-team-form').style.display = 'none';
  });

  // Create team
  content.querySelector('#fy-team-save').addEventListener('click', async () => {
    const name = content.querySelector('#fy-team-name-input').value.trim();
    if (!name) return;
    const btn = content.querySelector('#fy-team-save');
    btn.textContent = '…';
    btn.disabled = true;
    const team = await api('POST', '/fantasy/teams', { name });
    btn.textContent = 'Create';
    btn.disabled = false;
    if (team.team_id) {
      _teams.push(team);
      _renderTeamsList(content);
    } else {
      console.error('[fantasy] create team failed:', team);
      alert('Error creating team: ' + (team.error || 'unknown — check console'));
    }
  });

  // Delete team
  content.querySelectorAll('[data-deleteteam]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.deleteteam;
      await api('DELETE', `/fantasy/teams/${id}`);
      _teams = _teams.filter(t => String(t.team_id) !== String(id));
      _renderTeamsList(content);
    });
  });

  // Click card → team detail
  content.querySelectorAll('.fy-team-card').forEach(card => {
    card.addEventListener('click', async e => {
      if (e.target.closest('[data-deleteteam]')) return;
      const team = _teams.find(t => String(t.team_id) === card.dataset.teamid);
      const players = await api('GET', `/fantasy/teams/${team.team_id}/players`);
      _teamDetail = { team, players };
      await _renderTeamDetail(content);
    });
  });
}

// ── Team detail (roster) ──────────────────────────────────────────────────────

async function _renderTeamDetail(content) {
  const { team, players } = _teamDetail;

  const rows = players.length === 0
    ? `<div class="fy-empty" style="padding:16px 0"><p>No players yet.</p></div>`
    : players.map(p => `
        <div class="fy-player-row">
          <div class="fy-player-info">
            <span class="fy-player-name">${esc(p.name)}</span>
            <span class="fy-player-pos">${esc(p.position || '—')}</span>
          </div>
          <button class="fy-delete-btn" data-deleteplayer="${p.player_id}" title="Remove">✕</button>
        </div>`).join('');

  content.innerHTML = `
    <button class="fy-back-btn" id="fy-team-back">← Teams</button>
    <div class="fy-detail-header">
      <div class="fy-team-badge large">${esc(team.name.slice(0,2).toUpperCase())}</div>
      <h2 class="fy-detail-title">${esc(team.name)}</h2>
    </div>

    <div class="section-header" style="margin-top:16px">
      <span class="section-title">Squad</span>
    </div>

    <div class="fy-action-bar" style="margin-top:8px">
      <button class="fy-create-btn" id="fy-new-player">＋ Add Player</button>
    </div>
    <div id="fy-new-player-form" style="display:none" class="fy-inline-form fy-player-form">
      <input id="fy-player-name-input" class="form-input" type="text" placeholder="Player name…" maxlength="80">
      <select id="fy-player-pos-input" class="form-input filter-select" style="width:auto">
        <option value="">Position</option>
        <option>Goalkeeper</option>
        <option>Defender</option>
        <option>Midfielder</option>
        <option>Forward</option>
      </select>
      <button class="fy-save-btn" id="fy-player-save">Add</button>
      <button class="fy-cancel-btn" id="fy-player-cancel">Cancel</button>
    </div>

    <div id="fy-players-list">${rows}</div>
  `;

  content.querySelector('#fy-team-back').addEventListener('click', () => {
    _teamDetail = null;
    _renderTeamsList(content);
  });

  content.querySelector('#fy-new-player').addEventListener('click', () => {
    content.querySelector('#fy-new-player-form').style.display = 'flex';
    content.querySelector('#fy-player-name-input').focus();
  });
  content.querySelector('#fy-player-cancel').addEventListener('click', () => {
    content.querySelector('#fy-new-player-form').style.display = 'none';
  });

  content.querySelector('#fy-player-save').addEventListener('click', async () => {
    const name = content.querySelector('#fy-player-name-input').value.trim();
    const pos  = content.querySelector('#fy-player-pos-input').value;
    if (!name) return;
    const player = await api('POST', '/fantasy/players', { fantasy_team_id: team.team_id, name, position: pos });
    if (player.player_id) {
      _teamDetail.players.push(player);
      await _renderTeamDetail(content);
    }
  });

  content.querySelectorAll('[data-deleteplayer]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api('DELETE', `/fantasy/players/${btn.dataset.deleteplayer}`);
      _teamDetail.players = _teamDetail.players.filter(p => String(p.player_id) !== btn.dataset.deleteplayer);
      await _renderTeamDetail(content);
    });
  });
}

// ── Matches list ──────────────────────────────────────────────────────────────

async function _renderMatchesList(content) {
  const matches = await api('GET', '/fantasy/matches');

  const statusBadge = m => {
    if (m.status === 'finished') return `<span class="fy-status fy-status-fin">FT</span>`;
    if (m.status === 'live')     return `<span class="fy-status fy-status-live">LIVE</span>`;
    return `<span class="fy-status fy-status-sched">SCH</span>`;
  };

  const rows = matches.length === 0
    ? `<div class="fy-empty"><div class="fy-empty-icon">📅</div><p>No matches yet. Schedule one!</p></div>`
    : matches.map(m => `
        <div class="fy-match-row" data-matchid="${m.match_id}">
          <div class="fy-match-teams">
            <span>${esc(m.home_team_name || '?')}</span>
            <span class="fy-match-score-inline">${m.home_score} – ${m.away_score}</span>
            <span>${esc(m.away_team_name || '?')}</span>
          </div>
          ${statusBadge(m)}
        </div>`).join('');

  const teamOptions = _teams.map(t => `<option value="${t.team_id}">${esc(t.name)}</option>`).join('');

  content.innerHTML = `
    <div class="fy-action-bar">
      <button class="fy-create-btn" id="fy-new-match">＋ New Match</button>
    </div>
    <div id="fy-new-match-form" style="display:none" class="fy-inline-form fy-match-form">
      <select id="fy-home-team" class="form-input filter-select">
        <option value="">Home team…</option>${teamOptions}
      </select>
      <span style="color:var(--muted);align-self:center">vs</span>
      <select id="fy-away-team" class="form-input filter-select">
        <option value="">Away team…</option>${teamOptions}
      </select>
      <input id="fy-match-date" class="form-input" type="date" style="width:auto">
      <button class="fy-save-btn" id="fy-match-save">Create</button>
      <button class="fy-cancel-btn" id="fy-match-cancel">Cancel</button>
    </div>
    <div id="fy-matches-list">${rows}</div>
  `;

  content.querySelector('#fy-new-match').addEventListener('click', () => {
    content.querySelector('#fy-new-match-form').style.display = 'flex';
  });
  content.querySelector('#fy-match-cancel').addEventListener('click', () => {
    content.querySelector('#fy-new-match-form').style.display = 'none';
  });

  content.querySelector('#fy-match-save').addEventListener('click', async () => {
    const homeId = parseInt(content.querySelector('#fy-home-team').value);
    const awayId = parseInt(content.querySelector('#fy-away-team').value);
    const date   = content.querySelector('#fy-match-date').value;
    if (!homeId || !awayId || homeId === awayId) return;
    const match = await api('POST', '/fantasy/matches', { home_team_id: homeId, away_team_id: awayId, match_date: date || null });
    if (match.match_id) await _renderMatchesList(content);
  });

  // Click row → match detail
  content.querySelectorAll('.fy-match-row').forEach(row => {
    row.addEventListener('click', async () => {
      const match = matches.find(m => String(m.match_id) === row.dataset.matchid);
      const events = await api('GET', `/fantasy/matches/${match.match_id}/events`);
      _matchDetail = { match, events };
      await _renderMatchDetail(content);
    });
  });
}

// ── Match detail ──────────────────────────────────────────────────────────────

async function _renderMatchDetail(content) {
  const { match, events } = _matchDetail;

  // Fetch players from both teams for the event form
  const [homePlayers, awayPlayers] = await Promise.all([
    match.home_team_id ? api('GET', `/fantasy/teams/${match.home_team_id}/players`) : [],
    match.away_team_id ? api('GET', `/fantasy/teams/${match.away_team_id}/players`) : [],
  ]);
  const allPlayers = [...homePlayers, ...awayPlayers];

  const playerOptions = allPlayers.map(p => `<option value="${p.player_id}">${esc(p.name)}</option>`).join('');

  const eventIcon = type => ({ goal:'⚽', yellow_card:'🟨', red_card:'🟥', substitution:'🔄' }[type] || '•');

  const eventRows = events.length === 0
    ? `<div class="fy-empty" style="padding:12px 0"><p>No events logged yet.</p></div>`
    : events.map(ev => `
        <div class="fy-event-row">
          <span class="fy-event-icon">${eventIcon(ev.event_type)}</span>
          <span class="fy-event-min">${ev.minute != null ? ev.minute + "'" : '—'}</span>
          <span class="fy-event-player">${esc(ev.player_name || 'Unknown')}</span>
          <span class="fy-event-type">${esc(ev.event_type?.replace('_', ' ') || '')}</span>
        </div>`).join('');

  content.innerHTML = `
    <button class="fy-back-btn" id="fy-match-back">← Matches</button>
    <div class="fy-match-scoreboard">
      <div class="fy-sb-team">${esc(match.home_team_name || '?')}</div>
      <div class="fy-sb-score">${match.home_score} – ${match.away_score}</div>
      <div class="fy-sb-team">${esc(match.away_team_name || '?')}</div>
    </div>

    <div class="fy-score-controls">
      <div class="fy-inline-form" style="justify-content:center;flex-wrap:wrap;gap:8px">
        <input id="fy-sc-home" class="form-input" type="number" min="0" value="${match.home_score}" style="width:60px;text-align:center">
        <span style="align-self:center;color:var(--muted)">–</span>
        <input id="fy-sc-away" class="form-input" type="number" min="0" value="${match.away_score}" style="width:60px;text-align:center">
        <select id="fy-sc-status" class="form-input filter-select" style="width:auto">
          <option value="scheduled" ${match.status==='scheduled'?'selected':''}>Scheduled</option>
          <option value="live"      ${match.status==='live'     ?'selected':''}>Live</option>
          <option value="finished"  ${match.status==='finished' ?'selected':''}>Finished</option>
        </select>
        <button class="fy-save-btn" id="fy-sc-save">Update</button>
      </div>
    </div>

    <div class="section-header" style="margin-top:16px">
      <span class="section-title">Match Events</span>
    </div>
    <div class="fy-action-bar" style="margin-top:8px">
      <button class="fy-create-btn" id="fy-new-event">＋ Log Event</button>
    </div>
    <div id="fy-new-event-form" style="display:none" class="fy-inline-form fy-event-form">
      <select id="fy-ev-player" class="form-input filter-select" style="width:auto">
        <option value="">Player…</option>${playerOptions}
      </select>
      <select id="fy-ev-type" class="form-input filter-select" style="width:auto">
        <option value="goal">⚽ Goal</option>
        <option value="yellow_card">🟨 Yellow Card</option>
        <option value="red_card">🟥 Red Card</option>
        <option value="substitution">🔄 Sub</option>
      </select>
      <input id="fy-ev-min" class="form-input" type="number" min="1" max="120" placeholder="Min" style="width:64px">
      <button class="fy-save-btn" id="fy-ev-save">Log</button>
      <button class="fy-cancel-btn" id="fy-ev-cancel">Cancel</button>
    </div>
    <div id="fy-events-list">${eventRows}</div>
  `;

  content.querySelector('#fy-match-back').addEventListener('click', async () => {
    _matchDetail = null;
    await _renderMatchesList(content);
  });

  // Update score
  content.querySelector('#fy-sc-save').addEventListener('click', async () => {
    const homeScore = parseInt(content.querySelector('#fy-sc-home').value) || 0;
    const awayScore = parseInt(content.querySelector('#fy-sc-away').value) || 0;
    const status    = content.querySelector('#fy-sc-status').value;
    const updated = await api('PUT', `/fantasy/matches/${match.match_id}`, { home_score: homeScore, away_score: awayScore, status });
    if (updated.match_id) {
      _matchDetail.match = { ...match, home_score: homeScore, away_score: awayScore, status };
      await _renderMatchDetail(content);
    }
  });

  // Log event form toggle
  content.querySelector('#fy-new-event').addEventListener('click', () => {
    content.querySelector('#fy-new-event-form').style.display = 'flex';
  });
  content.querySelector('#fy-ev-cancel').addEventListener('click', () => {
    content.querySelector('#fy-new-event-form').style.display = 'none';
  });

  content.querySelector('#fy-ev-save').addEventListener('click', async () => {
    const playerId  = parseInt(content.querySelector('#fy-ev-player').value) || null;
    const eventType = content.querySelector('#fy-ev-type').value;
    const minute    = parseInt(content.querySelector('#fy-ev-min').value) || null;
    const ev = await api('POST', '/fantasy/match_events', {
      fantasy_match_id: match.match_id,
      fantasy_player_id: playerId,
      event_type: eventType,
      minute,
    });
    if (ev.event_id) {
      // Re-fetch events so player_name join is included
      const updated = await api('GET', `/fantasy/matches/${match.match_id}/events`);
      _matchDetail.events = updated;
      await _renderMatchDetail(content);
    }
  });
}
