// Match detail page — scores, events timeline, lineups, stats.
import { state } from '../state.js';
import { abbr, crestColor, crestHtml, fmtDate, fmtTime, isLive, isFinished } from '../utils.js';

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function renderMatchDetail(matchId) {
  const content = document.getElementById('detail-content');
  const title   = document.getElementById('detail-title');
  if (!content) return;

  const match = state.allMatches.find(m => String(m.match_id) === String(matchId));
  if (!match) {
    content.innerHTML = '<div class="st-empty-msg" style="padding:40px 20px">Match not found.</div>';
    return;
  }

  const home     = state.teamsMap[String(match.home_team_id)] || {};
  const away     = state.teamsMap[String(match.away_team_id)] || {};
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const homeColor = crestColor(match.home_team_id);
  const awayColor = crestColor(match.away_team_id);

  title.textContent = `${home.team_name || '?'} vs ${away.team_name || '?'}`;

  const showScore = live || finished;
  const homeScore = showScore ? (match.home_score ?? 0) : '–';
  const awayScore = showScore ? (match.away_score ?? 0) : '–';
  const competition = match.competition || home.league || '—';
  const dateStr  = fmtDate(match.match_date);
  const timeStr  = fmtTime(match.match_date);
  const statusLabel = live ? 'Live' : finished ? 'Full Time' : `${dateStr} ${timeStr || ''}`.trim();

  content.innerHTML = `
    <div class="md-header${live ? ' md-header-live' : finished ? ' md-header-ft' : ''}">
      <div class="md-comp-row">${escHtml(competition)}${match.stage && match.stage !== 'REGULAR_SEASON' ? ` · ${escHtml(match.stage.replace(/_/g,' '))}` : ''}</div>
      <div class="md-teams-row">
        <div class="md-team-block">
          ${crestHtml(home, 52)}
          <div class="md-team-name">${escHtml(home.team_name || '?')}</div>
        </div>
        <div class="md-score-block">
          <div class="md-score">${homeScore} – ${awayScore}</div>
          <div class="md-status-label${live ? ' md-live-label' : ''}">${statusLabel}</div>
        </div>
        <div class="md-team-block">
          ${crestHtml(away, 52)}
          <div class="md-team-name">${escHtml(away.team_name || '?')}</div>
        </div>
      </div>
      ${home.stadium ? `<div class="md-venue">${escHtml(home.stadium)}</div>` : ''}
    </div>

    <div class="md-section-title">Match Events</div>
    <div id="md-events" class="md-events-list">
      <div class="st-loading" style="padding:20px">Loading…</div>
    </div>

    <div id="md-lineups-section" style="display:none">
      <div class="md-section-title">Lineups</div>
      <div id="md-lineups" class="md-lineups-grid"></div>
    </div>

    <div id="md-stats-section" style="display:none">
      <div class="md-section-title">Match Stats</div>
      <div id="md-stats" class="md-stats-list"></div>
    </div>
  `;

  // Load events and API-Football data in parallel
  const [dbEvents, afData] = await Promise.all([
    fetch(`/matches/${matchId}/events`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`/api-football/match/${matchId}`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
  ]);

  _renderEvents(dbEvents, afData?.events || [], match.home_team_id, match.away_team_id);
  if (afData?.lineups?.length > 0) _renderLineups(afData.lineups);
  if (afData?.stats?.length >= 2)  _renderStats(afData.stats);
}

function _renderEvents(dbEvents, afEvents, homeTeamId, awayTeamId) {
  const el = document.getElementById('md-events');
  if (!el) return;

  if (afEvents.length > 0) {
    el.innerHTML = afEvents.map(e => {
      const min      = e.time?.elapsed != null ? `${e.time.elapsed}'` : '';
      const extra    = e.time?.extra   != null ? `+${e.time.extra}'` : '';
      const player   = escHtml(e.player?.name || '');
      const assist   = escHtml(e.assist?.name || '');
      const teamName = escHtml(e.team?.name   || '');
      const isHome   = String(e.team?.id) === String(homeTeamId);

      let icon = '⚽';
      if (e.type === 'Card')  icon = e.detail === 'Yellow Card' ? '🟨' : e.detail === 'Red Card' ? '🟥' : '🟧';
      else if (e.type === 'subst') icon = '🔄';
      else if (e.type === 'Var')   icon = '📺';
      else if (e.detail === 'Own Goal') icon = '⚽';

      return `
        <div class="md-event-row ${isHome ? 'ev-home' : 'ev-away'}">
          <span class="md-event-minute">${min}${extra}</span>
          <span class="md-event-icon">${icon}</span>
          <div class="md-event-info">
            <div class="md-event-player">${player}</div>
            ${assist ? `<div class="md-event-assist">${assist}</div>` : ''}
          </div>
          <span class="md-event-team">${teamName}</span>
        </div>`;
    }).join('');

  } else if (dbEvents.length > 0) {
    el.innerHTML = dbEvents.map(e => {
      const min = e.minute != null ? `${e.minute}'` : '';
      let icon = '⚽';
      if (e.event_type === 'yellow_card')   icon = '🟨';
      else if (e.event_type === 'red_card') icon = '🟥';
      else if (e.event_type === 'substitution') icon = '🔄';

      return `
        <div class="md-event-row">
          <span class="md-event-minute">${min}</span>
          <span class="md-event-icon">${icon}</span>
          <div class="md-event-info">
            <div class="md-event-player">${escHtml(e.player_name || '—')}</div>
          </div>
        </div>`;
    }).join('');

  } else {
    el.innerHTML = '<div class="st-empty-msg" style="padding:16px 0">No events recorded yet.</div>';
  }
}

function _renderLineups(lineups) {
  const section = document.getElementById('md-lineups-section');
  const el      = document.getElementById('md-lineups');
  if (!section || !el) return;
  section.style.display = 'block';

  el.innerHTML = lineups.map(team => {
    const starters = (team.startXI || []).map(p => ({ name: p.player?.name || '—', num: p.player?.number || '' }));
    const subs     = (team.substitutes || []).map(p => p.player?.name || '—');
    const formation = team.formation || '';

    return `
      <div class="md-lineup-team">
        <div class="md-lineup-header">
          <span class="md-lineup-team-name">${escHtml(team.team?.name || '?')}</span>
          ${formation ? `<span class="md-formation">${formation}</span>` : ''}
        </div>
        <div class="md-lineup-players">
          ${starters.map(p => `
            <div class="md-lineup-player">
              <span class="md-lineup-num">${p.num}</span>
              <span>${escHtml(p.name)}</span>
            </div>`).join('')}
        </div>
        ${subs.length ? `
          <div class="md-subs-label">Substitutes</div>
          <div class="md-lineup-players">
            ${subs.map(name => `<div class="md-lineup-player md-sub"><span class="md-lineup-num">↔</span><span>${escHtml(name)}</span></div>`).join('')}
          </div>` : ''}
      </div>`;
  }).join('<div class="md-lineup-divider"></div>');
}

function _renderStats(stats) {
  const section = document.getElementById('md-stats-section');
  const el      = document.getElementById('md-stats');
  if (!section || !el) return;
  section.style.display = 'block';

  const homeMap = Object.fromEntries((stats[0]?.statistics || []).map(s => [s.type, s.value]));
  const awayMap = Object.fromEntries((stats[1]?.statistics || []).map(s => [s.type, s.value]));

  const KEYS = [
    { key: 'Ball Possession',  label: 'Possession'     },
    { key: 'Total Shots',      label: 'Shots'          },
    { key: 'Shots on Goal',    label: 'On Target'      },
    { key: 'Corner Kicks',     label: 'Corners'        },
    { key: 'Fouls',            label: 'Fouls'          },
    { key: 'Yellow Cards',     label: 'Yellow Cards'   },
    { key: 'Red Cards',        label: 'Red Cards'      },
    { key: 'Passes Total',     label: 'Passes'         },
    { key: 'Pass Accuracy',    label: 'Pass Accuracy'  },
    { key: 'Offsides',         label: 'Offsides'       },
  ];

  el.innerHTML = KEYS.map(({ key, label }) => {
    const hRaw = homeMap[key]; const aRaw = awayMap[key];
    if (hRaw == null && aRaw == null) return '';
    const hVal = hRaw ?? 0; const aVal = aRaw ?? 0;
    const hNum = parseFloat(String(hVal).replace('%', '')) || 0;
    const aNum = parseFloat(String(aVal).replace('%', '')) || 0;
    const total = hNum + aNum || 1;
    const hPct  = Math.round(hNum / total * 100);

    return `
      <div class="md-stat-row">
        <span class="md-stat-val">${hVal}</span>
        <div class="md-stat-center">
          <div class="md-stat-bar">
            <div class="md-stat-fill md-stat-home" style="width:${hPct}%"></div>
            <div class="md-stat-fill md-stat-away" style="width:${100 - hPct}%"></div>
          </div>
          <div class="md-stat-label">${label}</div>
        </div>
        <span class="md-stat-val">${aVal}</span>
      </div>`;
  }).join('');
}
