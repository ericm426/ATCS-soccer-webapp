// Modal system — Add Match.
// Callbacks are set by app.js after data is loaded so views re-render on changes.

import { state } from './state.js';
import { postData } from './api.js';
import { showToast } from './toast.js';

let onMatchAdded = null;

export function setCallbacks(callbacks) {
  onMatchAdded = callbacks.onMatchAdded;
}

// ── Core open/close ──────────────────────────────────────────────────────────

export function closeModal() {
  const overlay = document.getElementById('modal');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function openModal(html) {
  const overlay = document.getElementById('modal');
  const inner   = document.getElementById('modal-inner');
  inner.innerHTML = html;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));

  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); }, { once: true });
}

function showError(msg) {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Add Match ────────────────────────────────────────────────────────────────

export function openAddMatchModal() {
  const teamOptions = state.allTeams
    .map(t => `<option value="${t.team_id}">${t.team_name}</option>`)
    .join('');

  openModal(`
    <div class="modal-header">
      <span class="modal-title">Add Match</span>
      <button class="modal-close-btn" id="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Home Team</label>
        <select id="f-home-team" class="form-input filter-select" style="width:100%">
          <option value="">Select team…</option>${teamOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Away Team</label>
        <select id="f-away-team" class="form-input filter-select" style="width:100%">
          <option value="">Select team…</option>${teamOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Match Date</label>
        <input id="f-match-date" class="form-input" type="date" required>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="f-match-status" class="form-input filter-select" style="width:100%">
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="finished">Finished</option>
        </select>
      </div>
      <div id="score-fields" style="display:none">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Home Score</label>
            <input id="f-home-score" class="form-input" type="number" min="0" value="0">
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Away Score</label>
            <input id="f-away-score" class="form-input" type="number" min="0" value="0">
          </div>
        </div>
      </div>
      <div id="form-error" class="form-error" style="display:none"></div>
      <button id="f-submit" class="form-btn">Add Match</button>
    </div>
  `);

  document.getElementById('f-match-status').addEventListener('change', e => {
    const show = e.target.value === 'live' || e.target.value === 'finished';
    document.getElementById('score-fields').style.display = show ? 'block' : 'none';
  });

  document.getElementById('f-submit').addEventListener('click', async () => {
    const homeId  = parseInt(document.getElementById('f-home-team').value);
    const awayId  = parseInt(document.getElementById('f-away-team').value);
    const date    = document.getElementById('f-match-date').value;
    const status  = document.getElementById('f-match-status').value;
    const showScore = status === 'live' || status === 'finished';
    const homeScore = showScore ? (parseInt(document.getElementById('f-home-score').value) || 0) : null;
    const awayScore = showScore ? (parseInt(document.getElementById('f-away-score').value) || 0) : null;

    if (!homeId || !awayId || !date) { showError('Please fill in all required fields.'); return; }
    if (homeId === awayId) { showError('Home and away teams must be different.'); return; }

    const btn = document.getElementById('f-submit');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const newId = Math.max(0, ...state.allMatches.map(m => m.match_id)) + 1;

    const result = await postData('/matches', {
      match_id: newId,
      home_team_id: homeId,
      away_team_id: awayId,
      match_date: date,
      home_score: homeScore,
      away_score: awayScore,
      status,
    });

    if (result.error) {
      showError(result.error);
      btn.textContent = 'Add Match';
      btn.disabled = false;
      return;
    }

    state.allMatches.push(result);
    closeModal();
    showToast('Match added!', 'success');
    if (onMatchAdded) onMatchAdded();
  });
}
