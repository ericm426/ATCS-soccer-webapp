// Wire up all DOM event listeners after initial render.
import { state, saveBookmarks } from './state.js';
import { renderExploreResults } from './views/explore.js';
import { renderLeaguesView } from './views/leagues.js';
import { renderFollowingView } from './views/following.js';
import { renderMatchesView } from './views/matches.js';
import { openAddMatchModal } from './modal.js';
import { pushPage } from './router.js';

// ── View switcher ────────────────────────────────────────────────────────────

export function switchToView(target) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + target)?.classList.add('active');
  document.querySelector(`.nav-item[data-view="${target}"]`)?.classList.add('active');

  // Show the Add Match FAB only on Matches view
  const fab = document.getElementById('fab-add-match');
  if (fab) fab.style.display = target === 'matches' ? 'grid' : 'none';

  // Lazy-render views when first visited
  if (target === 'leagues') renderLeaguesView();
  if (target === 'following') renderFollowingView();
  if (target === 'explore') setTimeout(() => document.getElementById('explore-input')?.focus(), 50);
}

// ── Bookmark toggle ──────────────────────────────────────────────────────────

export function toggleBookmark(matchId) {
  const id = String(matchId);
  if (state.bookmarkedMatches.has(id)) {
    state.bookmarkedMatches.delete(id);
  } else {
    state.bookmarkedMatches.add(id);
  }
  saveBookmarks();
  renderMatchesView();
}

// ── Setup ────────────────────────────────────────────────────────────────────

export function setupNav() {
  // Bottom nav — view switching
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchToView(btn.dataset.view));
  });

  // FAB — Add Match
  document.getElementById('fab-add-match')?.addEventListener('click', openAddMatchModal);

  // ── Featured grid: bookmark button, card click ───────────────────────────
  document.getElementById('featured-grid')?.addEventListener('click', e => {
    const bmBtn = e.target.closest('.bm-btn');
    if (bmBtn) {
      e.stopPropagation();
      toggleBookmark(bmBtn.dataset.matchid);
      return;
    }

    const card = e.target.closest('.featured-card[data-matchid]');
    if (card) {
      pushPage({ type: 'match', id: card.dataset.matchid });
    }
  });

  // ── Fixtures table: bookmark button, row click ───────────────────────────
  document.getElementById('fixtures-table')?.addEventListener('click', e => {
    const bmBtn = e.target.closest('.bm-btn');
    if (bmBtn) {
      e.stopPropagation();
      toggleBookmark(bmBtn.dataset.matchid);
      return;
    }
    const row = e.target.closest('.fx-row[data-matchid]');
    if (row) pushPage({ type: 'match', id: row.dataset.matchid });
  });

  // ── Watchlist: clear all, individual unbookmark ───────────────────────────
  document.getElementById('clear-watchlist-btn')?.addEventListener('click', () => {
    state.bookmarkedMatches.clear();
    saveBookmarks();
    renderMatchesView();
  });

  document.getElementById('watchlist-rows')?.addEventListener('click', e => {
    const bmBtn = e.target.closest('.bm-btn');
    if (bmBtn) { toggleBookmark(bmBtn.dataset.matchid); return; }
    const row = e.target.closest('.wl-row[data-matchid]');
    if (row) pushPage({ type: 'match', id: row.dataset.matchid });
  });

  // ── Following: browse button → switch to leagues ──────────────────────────
  document.getElementById('browse-leagues-btn')?.addEventListener('click', () => {
    switchToView('leagues');
  });

  // ── Explore search input ──────────────────────────────────────────────────
  document.getElementById('explore-input')?.addEventListener('input', e => {
    const q = e.target.value;
    document.getElementById('explore-clear').style.display = q ? 'block' : 'none';
    renderExploreResults(q);
  });

  document.getElementById('explore-clear')?.addEventListener('click', () => {
    document.getElementById('explore-input').value = '';
    document.getElementById('explore-clear').style.display = 'none';
    renderExploreResults('');
  });

  // Explore filter chips
  document.querySelectorAll('[data-exfilter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-exfilter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.exploreFilter = chip.dataset.exfilter;
      renderExploreResults(document.getElementById('explore-input').value);
    });
  });

  // Explore result row clicks — team → full team page, match → match detail
  document.getElementById('explore-results')?.addEventListener('click', e => {
    const bmBtn = e.target.closest('.bm-btn');
    if (bmBtn) { e.stopPropagation(); return; }

    const folBtn = e.target.closest('.fol-toggle-btn');
    if (folBtn) { e.stopPropagation(); return; } // handled by explore.js delegation

    const teamRow = e.target.closest('.explore-result-row[data-teamid]');
    if (teamRow) { pushPage({ type: 'team', id: teamRow.dataset.teamid }); return; }

    const playerRow = e.target.closest('.explore-result-row[data-playerid]');
    if (playerRow) { pushPage({ type: 'player', id: playerRow.dataset.playerid }); return; }

    const matchRow = e.target.closest('.explore-result-row[data-matchid]');
    if (matchRow) { pushPage({ type: 'match', id: matchRow.dataset.matchid }); }
  });
}
