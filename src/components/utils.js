// Pure utility / formatting helpers — no side-effects, no DOM access.

// Maps football-data.org API competition names → display names
const COMP_DISPLAY = {
  'Primera Division':          'La Liga',
  'Championship':              'EFL Championship',
  'Primeira Liga':             'Primeira Liga',
};
export function compName(name) {
  return COMP_DISPLAY[name] || name || '—';
}

export function abbr(name) {
  if (!name) return '??';
  const w = name.replace(/^(FC|AC|AS|CF|SC|SK|RC|RB|VfB|VfL|FSV|SV|TSV)\s/i, '').split(/\s+/);
  if (w.length >= 2) return (w[0].slice(0, 2) + w[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

export const CREST_COLORS = [
  '#ef0107','#c8102e','#6cabdd','#003087','#a50044','#dc052d',
  '#8b0000','#004170','#1d6fa4','#cb3524','#003399','#e4000f',
  '#00529f','#d4001a','#e8192c','#1b458f',
];

export function crestColor(id) {
  return CREST_COLORS[Math.abs(parseInt(id) || 0) % CREST_COLORS.length];
}

export function dayLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function isLive(status) {
  return status && ['live','in_progress','inprogress','ongoing'].includes(status.toLowerCase());
}

export function isFinished(status) {
  return status && ['finished','completed','done','ft','full_time'].includes(status.toLowerCase());
}

export function posClass(pos) {
  if (!pos) return '';
  const p = pos.toUpperCase();
  if (p.includes('GOALKEEPER') || p === 'GK') return 'pos-GK-sm';
  if (p.includes('BACK') || p.includes('DEFENCE') || p === 'DF' || p === 'DEF' || p.includes('DEFENDER')) return 'pos-DEF-sm';
  if (p.includes('MIDFIELD') || p === 'MF' || p === 'MID' || p.includes('MIDFIELDER')) return 'pos-MID-sm';
  return 'pos-FWD-sm';
}

export function posShort(pos) {
  if (!pos) return '—';
  const p = pos.toUpperCase();
  if (p.includes('GOALKEEPER') || p === 'GK') return 'GK';
  if (p.includes('BACK') || p.includes('DEFENCE') || p === 'DF' || p === 'DEF') return 'DF';
  if (p.includes('MIDFIELD') || p === 'MF' || p === 'MID') return 'MF';
  if (p.includes('FORWARD') || p.includes('WINGER') || p.includes('STRIKER') || p.includes('ATTACK') || p.includes('OFFENCE') || p === 'FW' || p === 'FWD') return 'FW';
  return p.slice(0, 2);
}

export function managerInitials(name) {
  if (!name) return '—';
  const w = name.split(' ');
  return w.length >= 2 ? (w[0][0] + w[w.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

// Returns HTML for a team crest — logo image if available, colored abbr div as fallback.
export function crestHtml(team, size = 36) {
  const color = crestColor(team?.team_id);
  const ab    = abbr(team?.team_name || '?');
  const r     = Math.round(size * 0.33);
  const fs    = Math.round(size * 0.35);
  const base  = `width:${size}px;height:${size}px;border-radius:${r}px;display:grid;place-items:center;flex-shrink:0;overflow:hidden`;

  if (team?.logo_url) {
    const safe = String(team.logo_url).replace(/"/g, '%22');
    return `<div style="${base}" class="crest-wrap"><img src="${safe}" class="crest-img" data-fb="${color}" data-abbr="${ab}" data-fs="${fs}" style="width:${size - 4}px;height:${size - 4}px;object-fit:contain" loading="lazy"></div>`;
  }
  return `<div style="${base};background:${color};font-family:'Barlow Condensed',sans-serif;font-size:${fs}px;font-weight:800;color:#fff">${ab}</div>`;
}
