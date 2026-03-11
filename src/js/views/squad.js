import { state, PLAYERS_PER_PAGE } from '../state.js';
import { abbr, posShort, posClass } from '../utils.js';

export function renderSquadTeamSelect() {
  const sel = document.getElementById('team-select');
  state.allTeams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.team_id;
    opt.textContent = t.team_name;
    sel.appendChild(opt);
  });
}

export function renderSquad(teamId) {
  state.currentSquadTeamId = teamId;
  const team = state.teamsMap[String(teamId)] || {};
  const players = state.allPlayers.filter(p => String(p.team_id) === String(teamId));

  const name = team.team_name || 'Unknown';
  document.getElementById('manager-name').textContent = `${name} Manager`;
  document.getElementById('manager-initials').textContent = abbr(name).slice(0, 2);

  // Show the Add Player button now that a team is selected
  document.getElementById('add-player-btn').style.display = 'inline';

  state.playerFiltered = players;
  state.playerPage = 1;
  renderPlayerTable();
}

export function renderPlayerTable() {
  const table = document.getElementById('player-table');
  const head = `
    <div class="pt-head">
      <span>#</span><span>Name</span><span>Pos</span><span>Stats</span><span>Apps</span><span>Status</span>
    </div>`;

  const search = document.getElementById('player-search').value.toLowerCase();
  const filtered = state.playerFiltered.filter(p =>
    !search || (p.player_name || '').toLowerCase().includes(search)
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PLAYERS_PER_PAGE));
  state.playerPage = Math.min(state.playerPage, pages);
  const slice = filtered.slice((state.playerPage - 1) * PLAYERS_PER_PAGE, state.playerPage * PLAYERS_PER_PAGE);

  document.getElementById('player-count').textContent = total;

  if (total === 0) {
    table.innerHTML = head + '<div class="pt-empty">No players found.</div>';
    document.getElementById('player-pagination').style.display = 'none';
    return;
  }

  const rows = slice.map((p, i) => {
    const pos = posShort(p.position);
    const pc = posClass(p.position);
    const num = p.player_id ? String(p.player_id).padStart(2, '0') : '—';
    const goals = p.goals ?? 0;
    const assists = p.assists ?? 0;
    const apps = p.appearances ?? 0;
    return `
      <div class="pt-row fade-up" style="animation-delay:${i * 40}ms">
        <span class="pt-num">${num}</span>
        <span class="pt-name">${p.player_name || '—'}</span>
        <span class="pt-pos ${pc}">${pos}</span>
        <span class="pt-stats">${goals}G / ${assists}A</span>
        <span class="pt-cond">${apps}</span>
        <div style="display:flex;align-items:center;gap:4px">
          <span class="pt-status status-active">&#9679; Active</span>
          <button class="pt-del" data-playerid="${p.player_id}" title="Remove player">✕</button>
        </div>
      </div>`;
  }).join('');

  table.innerHTML = head + rows;

  const pag = document.getElementById('player-pagination');
  if (pages > 1) {
    pag.style.display = 'flex';
    document.getElementById('pg-label').textContent = `Page ${state.playerPage} of ${pages}`;
    document.getElementById('pg-prev').disabled = state.playerPage === 1;
    document.getElementById('pg-next').disabled = state.playerPage === pages;
  } else {
    pag.style.display = 'none';
  }
}

export function triggerRecovBars() {
  setTimeout(() => {
    document.querySelectorAll('.recov-fill').forEach(bar => bar.classList.add('animate'));
    document.querySelectorAll('.form-fill').forEach(bar => bar.classList.add('animate'));
  }, 150);
}
