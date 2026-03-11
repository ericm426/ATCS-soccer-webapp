// Player full detail page — stats, team, photo.
import { state, saveFollowedPlayers } from '../state.js';
import { crestHtml, posShort, posClass } from '../utils.js';
import { showToast } from '../toast.js';
import { pushPage } from '../router.js';

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function posColor(pos) {
  if (!pos) return 'var(--muted)';
  const p = pos.toUpperCase();
  if (p.includes('GOAL')) return '#ffc800';
  if (p.includes('DEF') || p.includes('BACK')) return 'var(--accent)';
  if (p.includes('MID')) return '#64a0ff';
  return 'var(--live)';
}

export async function renderPlayerPage(playerId) {
  const content = document.getElementById('detail-content');
  const title   = document.getElementById('detail-title');
  if (!content) return;

  const player = state.allPlayers.find(p => String(p.player_id) === String(playerId));
  if (!player) {
    content.innerHTML = '<div class="st-empty-msg" style="padding:40px 20px">Player not found.</div>';
    return;
  }

  const team   = state.teamsMap[String(player.team_id)] || {};
  title.textContent = player.player_name;

  const isFollowed = state.followedPlayers.has(String(playerId));
  const pc  = posClass(player.position);
  const pos = posShort(player.position) || player.position || '—';
  const pColor = posColor(player.position);

  // Render skeleton with initials avatar first
  const initials = player.player_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  content.innerHTML = `
    <div class="pl-hero">
      <div class="pl-photo-wrap" id="pl-photo-wrap">
        <div class="pl-initials-avatar" style="--pos-color:${pColor}">${initials}</div>
      </div>
      <div class="pl-hero-info">
        <div class="pl-name">${escHtml(player.player_name)}</div>
        <div class="pl-badges">
          <span class="pt-pos ${pc}" style="font-size:12px;padding:3px 8px">${escHtml(pos)}</span>
          ${player.nationality ? `<span class="pl-nat">${escHtml(player.nationality)}</span>` : ''}
        </div>
        <button id="pl-follow-btn" class="tp-follow-btn ${isFollowed ? 'following' : 'not-following'}" style="margin-top:8px">
          ${isFollowed ? '♥ Following' : '♡ Follow'}
        </button>
      </div>
    </div>

    ${team.team_id ? `
    <div class="pl-team-card" id="pl-team-card" data-teamid="${team.team_id}" style="cursor:pointer">
      ${crestHtml(team, 40)}
      <div style="flex:1;min-width:0">
        <div class="pl-team-name">${escHtml(team.team_name)}</div>
        <div class="pl-team-league">${escHtml(team.league || '—')}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>
    </div>` : ''}

    <div class="pl-stats-grid">
      <div class="pl-stat-card">
        <div class="pl-stat-val" style="color:var(--accent)">${player.goals ?? 0}</div>
        <div class="pl-stat-label">Goals</div>
      </div>
      <div class="pl-stat-card">
        <div class="pl-stat-val" style="color:#64a0ff">${player.assists ?? 0}</div>
        <div class="pl-stat-label">Assists</div>
      </div>
      <div class="pl-stat-card">
        <div class="pl-stat-val">${player.appearances ?? 0}</div>
        <div class="pl-stat-label">Apps</div>
      </div>
      ${(player.goals ?? 0) > 0 && (player.appearances ?? 0) > 0 ? `
      <div class="pl-stat-card">
        <div class="pl-stat-val" style="color:var(--upcoming)">${((player.goals / player.appearances) * 90).toFixed(1)}</div>
        <div class="pl-stat-label">G/90min</div>
      </div>` : ''}
    </div>

    <div id="pl-af-section"></div>
  `;

  // Wire follow button
  document.getElementById('pl-follow-btn')?.addEventListener('click', () => {
    const pid = String(playerId);
    if (state.followedPlayers.has(pid)) {
      state.followedPlayers.delete(pid);
      showToast('Unfollowed player.', 'info');
    } else {
      state.followedPlayers.add(pid);
      showToast('Player followed!', 'success');
    }
    saveFollowedPlayers();
    const btn = document.getElementById('pl-follow-btn');
    if (btn) {
      const fol = state.followedPlayers.has(pid);
      btn.textContent = fol ? '♥ Following' : '♡ Follow';
      btn.className   = `tp-follow-btn ${fol ? 'following' : 'not-following'}`;
    }
  });

  // Team card → team page
  document.getElementById('pl-team-card')?.addEventListener('click', () => {
    pushPage({ type: 'team', id: team.team_id });
  });

  // Fetch API-Football data for photo
  try {
    const r   = await fetch(`/api-football/player/${playerId}`);
    const afData = r.ok ? await r.json() : {};
    if (afData.photoUrl) {
      const wrap = document.getElementById('pl-photo-wrap');
      if (wrap) {
        wrap.innerHTML = `<img src="${escHtml(afData.photoUrl)}" class="pl-photo" onerror="this.style.display='none'" loading="lazy">`;
      }
    }
  } catch { /* graceful degradation */ }
}
