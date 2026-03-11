// Entry point — sets up navigation, loads data, polls for updates every 60s.
import { state } from './state.js';
import { safeFetch } from './api.js';
import { renderMatchesView } from './views/matches.js';
import { renderLeagueTabs, loadAndRenderStandings } from './views/leagues.js';
import { renderFollowingView } from './views/following.js';
import { setupNav } from './nav.js';
import { setCallbacks } from './modal.js';

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

async function init() {
  setupNav();
  await loadAllData();
  renderMatchesView();
  renderLeagueTabs();
  setCallbacks({ onMatchAdded: renderMatchesView });

  // Poll for fresh data every 60 seconds
  setInterval(refreshAll, 60_000);
}

init();
