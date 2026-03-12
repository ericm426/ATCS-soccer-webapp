// Shared mutable application state — import this object in all modules.
// Mutate properties directly; ES module exports objects by reference.

export const state = {
  allTeams: [],
  allPlayers: [],
  allMatches: [],
  teamsMap: {},
  favTeamIds: new Set(JSON.parse(localStorage.getItem('favTeams') || '[]')),
  exploreFilter: 'all',

  followedPlayers: new Set(JSON.parse(localStorage.getItem('followedPlayers') || '[]')),
  bookmarkedMatches: new Set(JSON.parse(localStorage.getItem('bookmarkedMatches') || '[]')),

  // Leagues + standings
  allLeagues: [],
  currentLeague: null,
  standingsCache: {},

  // Matches view competition filter
  allCompetitions: [],
  matchesCompetition: null,

  // Leagues view sub-tab + player sort
  leagueView: 'standings',
  leaguePlayerSort: 'appearances',
};

export function saveFavs() {
  localStorage.setItem('favTeams', JSON.stringify([...state.favTeamIds]));
}

export function saveFollowedPlayers() {
  localStorage.setItem('followedPlayers', JSON.stringify([...state.followedPlayers]));
}

export function saveBookmarks() {
  localStorage.setItem('bookmarkedMatches', JSON.stringify([...state.bookmarkedMatches]));
}
