// Explore / search view — search across teams, players, matches.
import { state, saveFavs, saveFollowedPlayers } from '../state.js';
import { abbr, crestColor, crestHtml, dayLabel, fmtDate, isLive, isFinished, posClass, posShort } from '../utils.js';

export function renderExploreResults(raw) {
  const results = document.getElementById('explore-results');
  const query = (raw || '').toLowerCase().trim();

  if (!query) {
    results.innerHTML = `<div class="explore-empty"><div class="explore-empty-icon">⚽</div><div>Search across teams, players, and matches</div></div>`;
    return;
  }

  let html = '';

  // ── Teams ────────────────────────────────────────────────────────────────
  if (state.exploreFilter === 'all' || state.exploreFilter === 'teams') {
    const teams = state.allTeams.filter(t =>
      (t.team_name || '').toLowerCase().includes(query) ||
      (t.league || '').toLowerCase().includes(query) ||
      (t.stadium || '').toLowerCase().includes(query)
    );
    if (teams.length) {
      html += `<div class="explore-section-label">Teams</div>`;
      html += teams.slice(0, 6).map(t => {
        const color = crestColor(t.team_id);
        const ab = abbr(t.team_name);
        const isFav = state.favTeamIds.has(String(t.team_id));
        return `<div class="explore-result-row" data-teamid="${t.team_id}" style="cursor:pointer">
          ${crestHtml(t, 32)}
          <div class="explore-result-info">
            <div class="explore-result-name">${t.team_name}</div>
            <div class="explore-result-meta">${t.league || ''} · Est. ${t.founded_year || '—'}</div>
          </div>
          <button class="fol-toggle-btn${isFav ? ' active' : ''}" data-teamfol="${t.team_id}">${isFav ? '✓ Following' : '+ Follow'}</button>
        </div>`;
      }).join('');
    }
  }

  // ── Players ──────────────────────────────────────────────────────────────
  if (state.exploreFilter === 'all' || state.exploreFilter === 'players') {
    const players = state.allPlayers.filter(p =>
      (p.player_name || '').toLowerCase().includes(query) ||
      (p.nationality || '').toLowerCase().includes(query) ||
      (p.position || '').toLowerCase().includes(query)
    );
    if (players.length) {
      html += `<div class="explore-section-label">Players</div>`;
      html += players.slice(0, 8).map(p => {
        const team = state.teamsMap[String(p.team_id)] || {};
        const pc = posClass(p.position);
        const pos = posShort(p.position);
        const isFollowed = state.followedPlayers.has(String(p.player_id));
        return `<div class="explore-result-row" data-playerid="${p.player_id}" style="cursor:pointer">
          <span class="pt-pos ${pc}" style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:11px;flex-shrink:0">${pos}</span>
          <div class="explore-result-info">
            <div class="explore-result-name">${p.player_name}</div>
            <div class="explore-result-meta">${team.team_name || '—'} · ${p.nationality || '—'}</div>
          </div>
          <span class="explore-result-stat" style="flex-shrink:0">${p.goals ?? 0}G / ${p.assists ?? 0}A</span>
          <button class="fol-toggle-btn${isFollowed ? ' active' : ''}" data-playerfol="${p.player_id}" style="margin-left:6px">${isFollowed ? '♥' : '♡'}</button>
        </div>`;
      }).join('');
    }
  }

  // ── Matches ──────────────────────────────────────────────────────────────
  if (state.exploreFilter === 'all' || state.exploreFilter === 'matches') {
    const matches = state.allMatches.filter(m => {
      const home = state.teamsMap[String(m.home_team_id)] || {};
      const away = state.teamsMap[String(m.away_team_id)] || {};
      return (home.team_name || '').toLowerCase().includes(query) ||
             (away.team_name || '').toLowerCase().includes(query) ||
             (home.league || '').toLowerCase().includes(query);
    });
    if (matches.length) {
      html += `<div class="explore-section-label">Matches</div>`;
      html += matches.slice(0, 5).map(m => {
        const home = state.teamsMap[String(m.home_team_id)] || {};
        const away = state.teamsMap[String(m.away_team_id)] || {};
        const live = isLive(m.status);
        const finished = isFinished(m.status);
        const badge = live ? `<span class="badge badge-live">Live</span>` :
                     finished ? `<span class="badge badge-finished">FT</span>` :
                     `<span class="badge badge-upcoming">${dayLabel(m.match_date)}</span>`;
        const score = (live || finished) ? `${m.home_score ?? '—'} – ${m.away_score ?? '—'}` : 'vs';
        return `<div class="explore-result-row" data-matchid="${m.match_id}" style="cursor:pointer">
          ${badge}
          <div class="explore-result-info">
            <div class="explore-result-name">${home.team_name || '?'} ${score} ${away.team_name || '?'}</div>
            <div class="explore-result-meta">${home.league || ''} · ${fmtDate(m.match_date)}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  if (!html) {
    html = `<div class="explore-empty"><div class="explore-empty-icon" style="font-size:32px">🔍</div><div>No results for "${raw.trim()}"</div></div>`;
  }

  results.innerHTML = html;

  // ── Attach follow button handlers after rendering ─────────────────────────
  results.querySelectorAll('[data-teamfol]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = String(btn.dataset.teamfol);
      if (state.favTeamIds.has(id)) {
        state.favTeamIds.delete(id);
        btn.classList.remove('active');
        btn.textContent = '+ Follow';
      } else {
        state.favTeamIds.add(id);
        btn.classList.add('active');
        btn.textContent = '✓ Following';
      }
      saveFavs();
    });
  });

  results.querySelectorAll('[data-playerfol]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = String(btn.dataset.playerfol);
      if (state.followedPlayers.has(id)) {
        state.followedPlayers.delete(id);
        btn.classList.remove('active');
        btn.textContent = '♡';
      } else {
        state.followedPlayers.add(id);
        btn.classList.add('active');
        btn.textContent = '♥';
      }
      saveFollowedPlayers();
    });
  });
}
