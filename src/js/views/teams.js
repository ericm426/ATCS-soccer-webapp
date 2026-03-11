import { state, TEAMS_PER_PAGE, saveFavs } from '../state.js';
import { abbr, crestColor } from '../utils.js';

export function renderTeamsView() {
  renderFavTeams();
  populateLeagueFilter();
  applyTeamFilters();
}

export function renderFavTeams() {
  const row = document.getElementById('fav-teams-row');
  const favCards = [...state.favTeamIds].map(id => {
    const t = state.teamsMap[String(id)];
    if (!t) return '';
    const color = crestColor(t.team_id);
    const ab = abbr(t.team_name);
    return `
      <div class="fav-team-card fade-up" data-teamid="${t.team_id}" style="cursor:pointer">
        <div class="fav-crest" style="background:${color}">${ab}</div>
        <div class="fav-info">
          <div class="fav-name">${t.team_name}</div>
          <div class="fav-meta">${t.league || ''}</div>
        </div>
        <button class="fav-heart active" data-teamid="${t.team_id}" title="Remove favorite">&#9829;</button>
      </div>`;
  }).join('');

  row.innerHTML = favCards + `
    <div class="fav-add-card" id="fav-add-card">
      <div class="fav-add-icon">+</div>
      <div class="fav-info"><div class="fav-name" style="color:var(--muted);font-size:12px">Add Team</div></div>
    </div>`;

  row.querySelectorAll('.fav-heart').forEach(btn => {
    btn.addEventListener('click', () => {
      state.favTeamIds.delete(String(btn.dataset.teamid));
      saveFavs();
      renderFavTeams();
    });
  });
}

function populateLeagueFilter() {
  const sel = document.getElementById('league-filter');
  const leagues = [...new Set(state.allTeams.map(t => t.league).filter(Boolean))].sort();
  leagues.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    sel.appendChild(opt);
  });
}

export function applyTeamFilters() {
  const search = document.getElementById('team-search').value.toLowerCase();
  const league = document.getElementById('league-filter').value;
  const sort = document.getElementById('sort-filter').value;

  let filtered = state.allTeams.filter(t => {
    const matchSearch = !search || (t.team_name || '').toLowerCase().includes(search);
    const matchLeague = !league || t.league === league;
    return matchSearch && matchLeague;
  });

  if (sort === 'name-asc') filtered.sort((a, b) => (a.team_name || '').localeCompare(b.team_name || ''));
  else if (sort === 'name-desc') filtered.sort((a, b) => (b.team_name || '').localeCompare(a.team_name || ''));
  else if (sort === 'founded') filtered.sort((a, b) => (a.founded_year || 9999) - (b.founded_year || 9999));

  state.teamFiltered = filtered;
  state.teamPage = 1;
  document.getElementById('teams-count').textContent = filtered.length;
  renderTeamsTable();
}

export function renderTeamsTable() {
  const table = document.getElementById('teams-table');
  const head = `
    <div class="tt-head">
      <span>Team</span><span class="tt-league-col">League</span><span>Status</span>
    </div>`;

  const total = state.teamFiltered.length;
  const pages = Math.max(1, Math.ceil(total / TEAMS_PER_PAGE));
  state.teamPage = Math.min(state.teamPage, pages);
  const slice = state.teamFiltered.slice((state.teamPage - 1) * TEAMS_PER_PAGE, state.teamPage * TEAMS_PER_PAGE);

  if (total === 0) {
    table.innerHTML = head + '<div class="pt-empty">No teams found.</div>';
    document.getElementById('teams-pagination').style.display = 'none';
    return;
  }

  const rows = slice.map((t, i) => {
    const color = crestColor(t.team_id);
    const ab = abbr(t.team_name);
    const isFav = state.favTeamIds.has(String(t.team_id));
    return `
      <div class="tt-row fade-up" style="animation-delay:${i * 40}ms" data-teamid="${t.team_id}">
        <div class="tt-team-cell">
          <div class="tt-crest" style="background:${color}">${ab}</div>
          <span class="tt-name-text">${t.team_name}</span>
        </div>
        <span class="tt-league-col tt-league-val">${t.league || '—'}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tt-status status-active">&#9679; Active</span>
          <button class="fav-heart tt-fav ${isFav ? 'active' : ''}" data-teamid="${t.team_id}" title="${isFav ? 'Remove' : 'Favorite'}">&#9829;</button>
        </div>
      </div>`;
  }).join('');

  table.innerHTML = head + rows;

  table.querySelectorAll('.tt-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = String(btn.dataset.teamid);
      if (state.favTeamIds.has(id)) {
        state.favTeamIds.delete(id);
        btn.classList.remove('active');
      } else {
        state.favTeamIds.add(id);
        btn.classList.add('active');
      }
      saveFavs();
      renderFavTeams();
    });
  });

  const pag = document.getElementById('teams-pagination');
  if (pages > 1) {
    pag.style.display = 'flex';
    document.getElementById('tpg-label').textContent = `Page ${state.teamPage} of ${pages} · ${total} teams`;
    document.getElementById('tpg-prev').disabled = state.teamPage === 1;
    document.getElementById('tpg-next').disabled = state.teamPage === pages;
  } else {
    pag.style.display = 'none';
  }
}
