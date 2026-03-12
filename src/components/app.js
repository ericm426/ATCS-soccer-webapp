// Entry point — sets up navigation, loads data, polls for updates every 60s.
import { state } from './state.js';
import { safeFetch } from './api.js';
import { renderMatchesView } from './views/matches.js';
import { renderLeagueTabs, loadAndRenderStandings } from './views/leagues.js';
import { renderFollowingView } from './views/following.js';
import { setupNav } from './nav.js';
import { setCallbacks } from './modal.js';
import { setupRouter } from './router.js';

export async function loadAllData() {
  const [teams, matches, players, leagues, competitions] = await Promise.all([
    safeFetch('/teams'),
    safeFetch('/matches'),
    safeFetch('/players'),
    safeFetch('/leagues'),
    safeFetch('/competitions'),
  ]);
  state.allTeams        = teams;
  state.allMatches      = matches;
  state.allPlayers      = players;
  state.allLeagues      = leagues;
  state.allCompetitions = competitions;
  state.teamsMap        = Object.fromEntries(state.allTeams.map(t => [String(t.team_id), t]));
  state.standingsCache  = {};
}

async function refreshAll() {
  await loadAllData();
  renderMatchesView();
  renderLeagueTabs();
  if (state.currentLeague) loadAndRenderStandings(state.currentLeague);
  renderFollowingView();
}

function _updateThemeIcon(isLight) {
  document.getElementById('theme-icon-moon').style.display = isLight ? 'none' : '';
  document.getElementById('theme-icon-sun').style.display  = isLight ? '' : 'none';
}

async function init() {
  setupNav();
  setupRouter();

  // Global fallback for crest images that fail to load
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.classList.contains('crest-img')) return;
    const wrap = img.parentElement;
    if (!wrap) return;
    wrap.style.background = img.dataset.fb || '#333';
    wrap.style.fontFamily = "'Barlow Condensed', sans-serif";
    wrap.style.fontSize   = (img.dataset.fs || 12) + 'px';
    wrap.style.fontWeight = '800';
    wrap.style.color      = '#fff';
    wrap.innerHTML        = img.dataset.abbr || '?';
  }, true);

  // Theme toggle
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-mode');
  _updateThemeIcon(savedTheme === 'light');

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    _updateThemeIcon(isLight);
  });

  await loadAllData();
  renderMatchesView();
  renderLeagueTabs();
  setCallbacks({ onMatchAdded: renderMatchesView });

  // Poll for fresh data every 5 minutes (matches the server sync interval)
  setInterval(refreshAll, 5 * 60_000);
}

init();
