// Simple push/pop router for full-page detail views (match, team).
// Manages a slide-in detail panel that covers the main view.

import { renderMatchDetail } from './views/matchDetail.js';
import { renderTeamPage }    from './views/teamPage.js';
import { renderPlayerPage }  from './views/playerPage.js';

const stack = [];

export function pushPage(page) {
  stack.push(page);
  _showDetail(page);
}

export function popPage() {
  stack.pop();
  if (stack.length === 0) {
    _hideDetail();
  } else {
    _showDetail(stack[stack.length - 1]);
  }
}

async function _showDetail(page) {
  const panel = document.getElementById('detail-panel');
  // Reset scroll
  document.getElementById('detail-content').scrollTop = 0;
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('open'));

  if (page.type === 'match') await renderMatchDetail(page.id);
  else if (page.type === 'team')  await renderTeamPage(page.id);
  else if (page.type === 'player') await renderPlayerPage(page.id);
}

function _hideDetail() {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('open');
  setTimeout(() => { panel.style.display = 'none'; }, 300);
}

export function setupRouter() {
  document.getElementById('detail-back')?.addEventListener('click', popPage);

  // Close on escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && stack.length > 0) popPage();
  });
}
