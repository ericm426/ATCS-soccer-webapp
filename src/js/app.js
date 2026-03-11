// Entry point — sets up navigation immediately, then fetches data and renders.
import { state } from './state.js';
import { safeFetch } from './api.js';
import { renderMatchesView } from './views/matches.js';
import { renderLeaguesView, renderLeagueTabs } from './views/leagues.js';
import { renderFollowingView } from './views/following.js';
import { setupNav } from './nav.js';
import { setCallbacks } from './modal.js';

async function init() {
  // Wire up all buttons immediately — before any async work
  setupNav();

  const [teams, matches, players, leagues] = await Promise.all([
    safeFetch('/teams'),
    safeFetch('/matches'),
    safeFetch('/players'),
    safeFetch('/leagues'),
  ]);

  state.allTeams   = teams;
  state.allMatches = matches;
  state.allPlayers = players;
  state.allLeagues = leagues;
  state.teamsMap   = Object.fromEntries(state.allTeams.map(t => [String(t.team_id), t]));

  renderMatchesView();
  renderLeagueTabs(); // populate tabs without loading data yet

  setCallbacks({
    onMatchAdded:   renderMatchesView,
    onMatchUpdated: renderMatchesView,
  });
}

init();
