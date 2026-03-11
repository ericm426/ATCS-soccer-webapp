// Pure utility / formatting helpers — no side-effects, no DOM access.

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
  if (p === 'GK' || p === 'GOALKEEPER') return 'pos-GK-sm';
  if (['CB','LB','RB','LWB','RWB','DF','DEF','DEFENDER'].includes(p)) return 'pos-DEF-sm';
  if (['CM','CDM','CAM','LM','RM','MF','MID','MIDFIELDER'].includes(p)) return 'pos-MID-sm';
  return 'pos-FWD-sm';
}

export function posShort(pos) {
  if (!pos) return '—';
  const p = pos.toUpperCase();
  if (p === 'GOALKEEPER') return 'GK';
  if (['DEFENDER','CENTRE-BACK'].includes(p)) return 'DF';
  if (['MIDFIELDER','MIDFIELD'].includes(p)) return 'MF';
  if (['FORWARD','STRIKER','WINGER'].includes(p)) return 'FW';
  return p.slice(0, 2);
}

export function managerInitials(name) {
  if (!name) return '—';
  const w = name.split(' ');
  return w.length >= 2 ? (w[0][0] + w[w.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}
