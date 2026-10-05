// ---------------------------------------------------------------------------------------
// QAIS'S FOUR TABS, drawn from the store (docs/plans/QAIS.md, "The window"): the Brief (this build's changelog per division, then what
// each waits on from the owner, then the builds before), the Tests (the round's QAIS tests by area, in the order Dovina triaged them:
// pass, fail, skip, a note, the evidence and take me there), the Reports (File a report, and every report with its status) and the
// Questions (the open ones first; the answers are given in Dovina's thread). Everything in the store is someone's typing: it is set as
// text, never as markup.
//
// Prior art: in-client patch notes (League's PBE client, Warframe's notes: the changes read where they are tried), and a test-case
// manager's run view (TestRail: steps, the expected result, pass / fail / skip and a note per case).
//
//   TABS   draw(tab, pane, q)   (q: the Qais: q.store, q.round, q.act.{ mark, note, go, fail, file, send })
// ---------------------------------------------------------------------------------------

export const TABS = [['brief', 'Brief'], ['tests', 'Tests'], ['reports', 'Reports'], ['questions', 'Questions']];
const DIVISIONS = ['Petra', 'Dovina', 'Wanda', 'Calissa', 'Espada'];
const STATUS = { new: 'new', seen: 'seen', fixed: 'fixed', notabug: 'not a bug', asked: 'asked' };

/** An element with a class and its text (never markup: the store is what people typed). */
function h(tag, cls = '', text = null, kids = []) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  for (const k of kids) if (k) e.append(k);
  return e;
}
const btn = (label, fn, cls = '') => { const b = h('button', cls, label); b.addEventListener('click', fn); return b; };
const when = (ms) => (ms ? new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const order = (a, b) => (a.order ?? a.n ?? 0) - (b.order ?? b.n ?? 0);
const groupBy = (list, key) => { const m = new Map(); for (const x of list) { const k = x[key] ?? '(none)'; if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };

function quiet(pane, q) {
  if (q.store.online) return false;
  pane.append(h('p', 'quiet', 'QAIS lives in the published build: the Brief, the Tests and the Questions are kept in its store. Here a report is saved as a file.'));
  return true;
}

// ---- the Brief
function brief(pane, q) {
  if (quiet(pane, q)) return;
  const all = q.store.docs('brief'), cur = q.round?.build;
  if (!cur) { pane.append(h('p', 'quiet', 'No round is set for this build yet: the Brief is written when it is published.')); return; }
  if (q.round.id && q.round.id !== q.build) pane.append(h('p', 'quiet', `This page is build ${q.build}; the round is ${cur} (built ${q.round.id}). Reload for the round's build.`));
  const mine = all.filter((d) => d.build === cur).sort((a, b) => DIVISIONS.indexOf(a.division) - DIVISIONS.indexOf(b.division));
  pane.append(h('div', 'grp', `${cur}: what changed`));
  if (!mine.length) pane.append(h('p', 'quiet', 'Nothing written for this round yet.'));
  for (const d of mine) pane.append(h('div', 'card', null, [h('div', 'hd', null, [h('b', '', d.division)]), h('ul', '', null, (d.lines || []).map((l) => h('li', '', l)))]));
  const waiting = mine.filter((d) => d.waiting?.length);
  if (waiting.length) {
    pane.append(h('div', 'grp', 'Waiting on you'));
    for (const d of waiting) pane.append(h('div', 'card', null, [h('div', 'hd', null, [h('b', '', d.division)]), h('ul', '', null, d.waiting.map((l) => h('li', '', l)))]));
  }
  const before = [...groupBy(all.filter((d) => d.build !== cur), 'build')].sort((a, b) => Math.max(...b[1].map((d) => d.at || 0)) - Math.max(...a[1].map((d) => d.at || 0)));
  if (before.length) {
    pane.append(h('div', 'grp', 'The builds before'));
    for (const [build, docs] of before) {
      const det = h('details', 'card', null, [h('summary', '', build)]);
      for (const d of docs) det.append(h('p', '', null, [h('b', '', `${d.division}: `), (d.lines || []).join(' · ')]));
      pane.append(det);
    }
  }
}

// ---- the Tests
function testCard(t, q) {
  const status = t.status && t.status !== 'open' ? t.status : '';
  const card = h('div', `card t ${status}`);
  card.dataset.id = t.id;
  card.append(h('div', 'hd', null, [h('b', '', t.id), h('span', 'by', `${t.who || ''}${t.by ? `, triaged by ${t.by}` : ''}`), t.live ? h('span', 'live', 'try it with QAIS closed') : null, t.report ? h('span', 'st new', t.report) : null]));
  card.append(h('p', '', t.what || ''), h('p', 'exp', t.expect ? `Should: ${t.expect}` : ''));
  if (t.watch?.event) {
    const seen = t.seen || [];
    const ev = h('div', `ev${seen.length ? ' seen' : ''}`, seen.length
      ? `seen ${seen.map((s) => `${when(s.at)} ${s.gist || ''}`).join(' | ')}`
      : `watching for ${t.watch.event}${t.watch.match ? ` ${JSON.stringify(t.watch.match)}` : ''}`);
    card.append(ev);
  }
  const A = q.act;
  card.append(h('div', 'act', null, [
    btn('Pass', () => A.mark(t, 'pass'), status === 'pass' ? 'on' : ''),
    btn('Fail', () => A.fail(t), status === 'fail' ? 'on' : ''),
    btn('Skip', () => A.mark(t, 'skip'), status === 'skip' ? 'on' : ''),
    t.go ? btn('Take me there', () => A.go(t)) : null,
  ]));
  const note = h('textarea', 'note'); note.placeholder = 'A note'; note.value = t.note || '';
  note.addEventListener('input', () => A.note(t, note.value));
  card.append(note);
  return card;
}

function tests(pane, q) {
  if (quiet(pane, q)) return;
  const cur = q.round?.build, list = q.store.docs('tests').filter((t) => t.build === cur).sort(order);
  if (!list.length) { pane.append(h('p', 'quiet', cur ? `No QAIS tests for ${cur} yet.` : 'No round is set for this build yet.')); return; }
  const done = list.filter((t) => t.status && t.status !== 'open').length;
  pane.append(h('p', 'quiet', `${cur}: ${done} of ${list.length} done${q.round.sent ? `, sent ${when(q.round.sentAt)}` : ''}.`));
  for (const [area, ts] of groupBy(list, 'area')) { pane.append(h('div', 'grp', area)); for (const t of ts) pane.append(testCard(t, q)); }
  pane.append(h('div', 'act', null, [btn('Send to the brigade', () => q.act.send())]));
}

// ---- the Reports
function reports(pane, q) {
  pane.append(h('div', 'act', null, [btn('File a report', () => q.act.file()), q.store.online ? btn('Send to the brigade', () => q.act.send()) : null]));
  if (!q.store.online) { quiet(pane, q); return; }
  const cur = q.round?.build, all = q.store.docs('bugs').sort((a, b) => (b.n || 0) - (a.n || 0));
  const card = (b) => h('div', 'card b', null, [
    b.frameUrl ? Object.assign(h('img'), { src: b.frameUrl, alt: '' }) : null,
    h('div', 'hd', null, [h('b', '', b.id), h('span', `st ${(b.status || 'new').split(' ')[0].replace(/\W/g, '')}`, STATUS[b.status] || b.status || 'new'), h('span', '', b.title || ''), h('span', 'by', `${b.kind}, ${b.severity}${b.test ? `, from ${b.test}` : ''}`)]),
    b.statusLine ? h('p', 'exp', b.statusLine) : null,
    b.happened ? h('p', '', b.happened) : null,
    h('p', 'by', `${b.place || b.zone || ''} · ${when(b.filedAt)}`),
  ]);
  const now = all.filter((b) => b.round === cur), before = all.filter((b) => b.round !== cur);
  pane.append(h('div', 'grp', cur ? `Reports on ${cur}` : 'Reports'));
  if (!now.length) pane.append(h('p', 'quiet', 'None yet.'));
  for (const b of now) pane.append(card(b));
  if (before.length) { const det = h('details', '', null, [h('summary', 'grp', `Earlier (${before.length})`)]); for (const b of before) det.append(card(b)); pane.append(det); }
}

// ---- the Questions
function questions(pane, q) {
  if (quiet(pane, q)) return;
  const all = q.store.docs('questions').sort((a, b) => !!a.answer - !!b.answer || order(a, b));
  if (!all.length) { pane.append(h('p', 'quiet', 'No open questions.')); return; }
  pane.append(h('p', 'quiet', "Answers are given in Dovina's thread: a decision is a conversation, not a tick box."));
  for (const x of all) pane.append(h('div', 'card q', null, [
    h('div', 'hd', null, [h('b', '', x.id), h('span', 'by', `from ${x.from || '?'}`), x.answer ? h('span', 'st fixed', 'answered') : null]),
    h('p', '', x.q || ''),
    x.options?.length ? h('ul', '', null, x.options.map((o) => h('li', '', o))) : null,
    x.answer ? h('p', 'exp', `${x.answer}${x.where ? ` (${x.where})` : ''}`) : null,
  ]));
}

const DRAW = { brief, tests, reports, questions };
export function draw(tab, pane, q) { pane.replaceChildren(); DRAW[tab](pane, q); }
