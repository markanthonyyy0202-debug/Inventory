export const STATUSES = ['COMPLETED', 'PENDING', 'REQUIRES FURTHER INVESTIGATION'];

const PT = { check:'Checked', restart:'Restarted', verify:'Verified', confirm:'Confirmed', perform:'Performed', test:'Tested', refresh:'Refreshed', synchronize:'Synchronized', replace:'Replaced', inspect:'Inspected', reset:'Reset', clean:'Cleaned', measure:'Measured', reboot:'Rebooted', reconnect:'Reconnected', repair:'Repaired', update:'Updated', reconfigure:'Reconfigured', power:'Powered', run:'Ran', reseat:'Reseated', reterminate:'Reterminated', install:'Installed' };
const past = (w) => PT[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1) + (/e$/i.test(w) ? 'd' : 'ed');

export function actionLine(a) {
  let t = a.trim().replace(/\s+if required$/i, '');
  t = t.replace(/^([A-Za-z-]+(?:\/[A-Za-z-]+)*)/, (m) =>
    m.split('/').map((w, i) => (i ? past(w).toLowerCase() : past(w))).join('/'));
  // "... and install new unit" / "... or reseat connection" -> past tense too
  t = t.replace(/\b(and|or) ([a-z-]+)\b/gi, (m, c, v) =>
    PT[v.toLowerCase()] || /^re-/i.test(v) ? c + ' ' + past(v).toLowerCase() : m);
  return t.replace(/\.$/, '') + '.';
}

// Suggested status: COMPLETED once a final confirmation/test action is ticked
export function autoStatus(done, rca) {
  if (!done.length) return 'PENDING';
  if (done.some((a) => /confirm.*(online|normal|stable)|test the equipment after|run display test/i.test(a))) return 'COMPLETED';
  if (/unknown/i.test(rca || '')) return 'REQUIRES FURTHER INVESTIGATION';
  return 'PENDING';
}

export function fmtDate(v) {
  const p = (v || '').split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : v;
}

export function buildReport(f) {
  const L = ['ITS MAINTENANCE REPORT', '',
    'Location: ' + f.location, '', 'Reporting Date: ' + fmtDate(f.date), '',
    'Work Order: ' + f.wo, '', 'Reported By: ' + f.by, '',
    'Reported Fault:', f.fault, '', 'Initial Fault Finding:', f.finding, '',
    'Action Taken:', ...f.acts.map((a) => '* ' + actionLine(a)), '',
    'RCA:', f.rca, '', 'Status:', f.status, ''];
  if (f.remarks) L.push('Remarks:', f.remarks, '');
  return L.join('\n').trim();
}
