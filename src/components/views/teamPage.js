// Team full page — profile, form, squad, recent results, standings row.
import { state, saveFavs, saveFollowedPlayers } from '../state.js';
import { abbr, crestColor, crestHtml, fmtDate, posShort, posClass, isFinished } from '../utils.js';
import { showToast } from '../toast.js';
import { pushPage } from '../router.js';

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function renderTeamPage(teamId) {
  const content = document.getElementById('detail-content');
  const title   = document.getElementById('detail-title');
  if (!content) return;

  const team = state.teamsMap[String(teamId)];
  if (!team) {
    content.innerHTML = '<div class="st-empty-msg" style="padding:40px 20px">Team not found.</div>';
    return;
  }

  title.textContent = team.team_name;
  const color   = crestColor(teamId);
  const ab      = abbr(team.team_name);
  const isFav   = state.favTeamIds.has(String(teamId));
  const players = state.allPlayers.filter(p => String(p.team_id) === String(teamId));

  const teamMatches = state.allMatches.filter(
    m => String(m.home_team_id) === String(teamId) || String(m.away_team_id) === String(teamId)
  );
  const finished = teamMatches.filter(m => isFinished(m.status))
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
  const recent = finished.slice(0, 5);

  const form = recent.map(m => {
    const isHome = String(m.home_team_id) === String(teamId);
    const gs = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    return gs > ga ? 'W' : gs < ga ? 'L' : 'D';
  });

  // Upcoming fixtures
  const upcoming = teamMatches
    .filter(m => !isFinished(m.status) && !['live','in_progress'].includes((m.status || '').toLowerCase()))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(0, 3);

  content.innerHTML = `
    <div class="tp-hero" style="--team-color:${color}">
      <div class="tp-hero-bg" style="background:linear-gradient(160deg,${color}30 0%,transparent 60%)"></div>
      <div class="tp-hero-inner">
        ${crestHtml(team, 56)}
        <div class="tp-hero-info">
          <div class="tp-hero-name">${escHtml(team.team_name)}</div>
          <div class="tp-hero-meta">${escHtml(team.league || '—')}${team.stadium ? ' · ' + escHtml(team.stadium) : ''}${team.founded_year ? ' · Est. ' + team.founded_year : ''}</div>
          ${form.length ? `<div class="tp-form-row">${form.map(r => `<span class="tp-form-dot tp-form-${r.toLowerCase()}">${r}</span>`).join('')}</div>` : ''}
        </div>
        <button id="tp-page-follow" class="tp-follow-btn ${isFav ? 'following' : 'not-following'}">
          ${isFav ? '✓ Following' : '+ Follow'}
        </button>
      </div>
    </div>

    ${upcoming.length ? `
    <div class="md-section-title" style="padding-top:16px">Upcoming Fixtures</div>
    <div class="tp-fixtures-list">${upcoming.map(m => {
      const opp = state.teamsMap[String(String(m.home_team_id) === String(teamId) ? m.away_team_id : m.home_team_id)] || {};
      const oppColor = crestColor(String(m.home_team_id) === String(teamId) ? m.away_team_id : m.home_team_id);
      const isHome = String(m.home_team_id) === String(teamId);
      return `
        <div class="tp-fixture-row" data-matchid="${m.match_id}" style="cursor:pointer">
          ${crestHtml(opp, 32)}
          <div class="tp-fix-info">
            <div class="tp-fix-opp">${isHome ? 'vs' : '@'} ${escHtml(opp.team_name || '?')}</div>
            <div class="tp-fix-date">${fmtDate(m.match_date)}</div>
          </div>
          <span class="badge badge-upcoming" style="font-size:9px">${escHtml(m.competition || team.league || '')}</span>
        </div>`;
    }).join('')}</div>` : ''}

    ${recent.length ? `
    <div class="md-section-title" style="padding-top:${upcoming.length ? '8' : '16'}px">Recent Results</div>
    <div class="tp-results-list">${recent.map(m => {
      const isHome = String(m.home_team_id) === String(teamId);
      const oppId  = isHome ? m.away_team_id : m.home_team_id;
      const opp    = state.teamsMap[String(oppId)] || {};
      const gs = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      const r  = gs > ga ? 'W' : gs < ga ? 'L' : 'D';
      const oppColor = crestColor(oppId);
      return `
        <div class="tp-result-row" data-matchid="${m.match_id}" style="cursor:pointer">
          <span class="tp-result-badge tp-form-${r.toLowerCase()}">${r}</span>
          ${crestHtml(opp, 28)}
          <div class="tp-fix-info">
            <div class="tp-fix-opp">${isHome ? 'vs' : '@'} ${escHtml(opp.team_name || '?')}</div>
            <div class="tp-fix-date">${fmtDate(m.match_date)}</div>
          </div>
          <div class="tp-result-score">${m.home_score ?? 0}–${m.away_score ?? 0}</div>
        </div>`;
    }).join('')}</div>` : ''}

    <div class="md-section-title" style="padding-top:16px">
      Squad <span class="count-chip">${players.length}</span>
    </div>
    <div class="tp-squad-list" id="tp-squad-list">
      ${_renderSquad(players)}
    </div>

    <div id="tp-standings-section">
      <div class="md-section-title" style="padding-top:16px">League Position</div>
      <div id="tp-standings-inner"><div class="st-loading" style="padding:16px 20px">Loading…</div></div>
    </div>
  `;

  // Follow button
  document.getElementById('tp-page-follow')?.addEventListener('click', () => {
    const id = String(teamId);
    state.favTeamIds.has(id) ? state.favTeamIds.delete(id) : state.favTeamIds.add(id);
    saveFavs();
    const btn = document.getElementById('tp-page-follow');
    if (btn) {
      const fav = state.favTeamIds.has(id);
      btn.textContent = fav ? '✓ Following' : '+ Follow';
      btn.className   = `tp-follow-btn ${fav ? 'following' : 'not-following'}`;
    }
    showToast(state.favTeamIds.has(id) ? 'Team followed!' : 'Unfollowed.', 'info');
  });

  // Follow-player buttons
  content.querySelectorAll('.tp-follow-player-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = String(btn.dataset.playerid);
      if (state.followedPlayers.has(pid)) {
        state.followedPlayers.delete(pid);
        btn.classList.remove('active'); btn.textContent = '♡';
        showToast('Unfollowed player.', 'info');
      } else {
        state.followedPlayers.add(pid);
        btn.classList.add('active'); btn.textContent = '♥';
        showToast('Player followed!', 'success');
      }
      saveFollowedPlayers();
    });
  });

  // Squad player row clicks → player detail
  content.querySelectorAll('.tp-squad-row[data-playerid]').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.tp-follow-player-btn')) return;
      pushPage({ type: 'player', id: row.dataset.playerid });
    });
  });

  // Fixture / result row clicks → match detail
  content.querySelectorAll('[data-matchid]').forEach(row => {
    row.addEventListener('click', () => pushPage({ type: 'match', id: row.dataset.matchid }));
  });

  // Async player photo loading (sequential to avoid rate limits)
  _loadSquadPhotos(players);

  // Standings
  if (team.league) {
    try {
      const r = await fetch(`/standings/${encodeURIComponent(team.league)}`);
      const standings = r.ok ? await r.json() : [];
      _renderStandings(standings, teamId, team.league);
    } catch {
      const el = document.getElementById('tp-standings-inner');
      if (el) el.innerHTML = '<div class="st-empty-msg" style="padding:12px 20px">Could not load standings.</div>';
    }
  } else {
    document.getElementById('tp-standings-section').style.display = 'none';
  }
}

function _renderSquad(players) {
  if (players.length === 0) {
    return '<div class="st-empty-msg" style="padding:12px 20px">No players in squad.</div>';
  }

  function _posGroup(pos) {
    if (!pos) return 'Other';
    const p = pos.toLowerCase();
    if (p.includes('goalkeeper') || p === 'gk') return 'Goalkeeper';
    if (p.includes('back') || p.includes('defender') || p.includes('defence') || p === 'df') return 'Defender';
    if (p.includes('midfield') || p === 'mf' || (p.includes('winger') && p.includes('mid'))) return 'Midfielder';
    if (p.includes('forward') || p.includes('winger') || p.includes('striker') || p.includes('offence') || p.includes('attack') || p === 'fw') return 'Forward';
    return 'Other';
  }
  const ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Other'];
  const grouped = {};
  for (const p of players) {
    const group = _posGroup(p.position);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(p);
  }

  return ORDER.filter(g => grouped[g]).map(grp => {
    const list = grouped[grp];
    return `
    <div class="tp-pos-group">
      <div class="tp-pos-label">${grp}s</div>
      ${list.map(p => {
        const isFollowed = state.followedPlayers.has(String(p.player_id));
        const initials = p.player_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return `
          <div class="tp-squad-row" data-playerid="${p.player_id}" style="cursor:pointer">
            <div class="tp-player-avatar" id="tp-avatar-${p.player_id}">
              <div class="tp-player-initials">${initials}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div class="tp-squad-name">${escHtml(p.player_name)}</div>
              <div class="tp-squad-meta">${escHtml(p.nationality || '—')}</div>
            </div>
            <div class="tp-squad-stats">${p.goals ?? 0}G&nbsp;${p.assists ?? 0}A</div>
            <button class="tp-follow-player-btn${isFollowed ? ' active' : ''}" data-playerid="${p.player_id}">
              ${isFollowed ? '♥' : '♡'}
            </button>
          </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

async function _loadSquadPhotos(players) {
  // Fetch photos sequentially with a small gap to avoid hammering the API
  for (const p of players) {
    const wrap = document.getElementById(`tp-avatar-${p.player_id}`);
    if (!wrap) continue; // panel was closed
    try {
      const r = await fetch(`/api-football/player/${p.player_id}`);
      const d = r.ok ? await r.json() : {};
      if (d.photoUrl && wrap.isConnected) {
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
      }
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 50)); // small gap between requests
  }
}

function _renderStandings(standings, teamId, league) {
  const el = document.getElementById('tp-standings-inner');
  if (!el) return;

  const idx = standings.findIndex(s => String(s.team_id) === String(teamId));
  if (standings.length === 0 || idx === -1) {
    el.innerHTML = '<div class="st-empty-msg" style="padding:12px 20px">No standings data yet.</div>';
    return;
  }

  // Show a window of ±2 rows around the team
  const start = Math.max(0, idx - 2);
  const end   = Math.min(standings.length, idx + 3);
  const slice = standings.slice(start, end).map((s, i) => ({ ...s, pos: start + i + 1 }));

  el.innerHTML = `
    <div class="st-mini-table">
      <div class="st-mini-head"><span>#</span><span>Team</span><span>P</span><span>GD</span><span>Pts</span></div>
      ${slice.map(s => `
        <div class="st-mini-row${String(s.team_id) === String(teamId) ? ' st-mini-highlight' : ''}">
          <span>${s.pos}</span>
          <span class="st-mini-name">${escHtml(s.team_name)}</span>
          <span>${s.p}</span>
          <span>${s.gd >= 0 ? '+' : ''}${s.gd}</span>
          <span class="st-mini-pts">${s.pts}</span>
        </div>`).join('')}
      ${start > 0 || end < standings.length ? `<div class="st-mini-note">${league} · ${standings.length} teams</div>` : ''}
    </div>`;
}
