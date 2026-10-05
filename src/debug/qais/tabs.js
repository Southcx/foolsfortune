// ---------------------------------------------------------------------------------------
// QAIS'S FOUR TABS, filled from the store (docs/plans/QAIS.md, "The window"): the Brief (this round's notes per division and what each
// waits on from the owner, then the builds before), the Tests (the round's QAIS tests by area, in the order Dovina triaged them), the
// Reports (File a report, and every report with its status) and the Questions. What is drawn is Calissa's (`QaisLook`, src/ui/qais.js:
// the tabs, a test's card with its stamp and evidence mark, the report slips); this file chooses the documents and wires the acts.
//
// Prior art: in-client patch notes (League's PBE client: the changes read where they are tried) and a test-case manager's run view
// (TestRail: steps, the expected result, pass / fail / skip and a note per case).
//
//   TABS   tabList(q) -> [{ id, label, count?, dot? }]   draw(tab, body, q)   (q: the Qais: q.look, q.store, q.round, q.act)
// ---------------------------------------------------------------------------------------
import { tuned, line } from '../tuned.js';

export const TABS = [['brief', 'Brief'], ['tests', 'Tests'], ['reports', 'Reports'], ['questions', 'Questions']];
const DIVISIONS = ['petra', 'dovina', 'wanda', 'calissa', 'espada'];
const OPEN = (t) => !t.status || t.status === 'open';
const order = (a, b) => (a.order ?? a.n ?? 0) - (b.order ?? b.n ?? 0);
const div = (d) => DIVISIONS.indexOf(String(d.division).toLowerCase());

function h(tag, cls = '', text = null) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, fn) { const b = h('button', 'qbtn', label); b.addEventListener('click', fn); return b; }
const row = (...kids) => { const r = h('div', 'acts'); r.append(...kids.filter(Boolean)); return r; };

/** The round's documents. */
const roundTests = (q) => q.store.docs('tests').filter((t) => t.build === q.round?.build).sort(order);
const roundBugs = (q) => q.store.docs('bugs').filter((b) => b.round === q.round?.build);

/** The tab row, with what waits in each. */
export function tabList(q) {
  if (!q.store?.online) return TABS.map(([id, label]) => ({ id, label }));
  const tests = roundTests(q), left = tests.filter(OPEN).length, open = q.store.docs('questions').filter((x) => !x.answer).length;
  return [
    { id: 'brief', label: 'Brief' },
    { id: 'tests', label: 'Tests', count: tests.length ? `${left} left` : null, dot: tests.some((t) => OPEN(t) && t.seen?.length) },
    { id: 'reports', label: 'Reports', count: roundBugs(q).length || null },
    { id: 'questions', label: 'Questions', count: open || null, dot: open > 0 },
  ];
}

function brief(body, q) {
  const all = q.store.docs('brief'), cur = q.round?.build;
  if (!cur) { body.append(q.look.notice('No round is set for this build yet: the Brief is written when it is published.')); return; }
  if (q.round.buildId && q.round.buildId !== q.build) body.append(q.look.notice(`This page is build ${q.build}; the round is ${cur}. Reload for the round's build.`));
  const { knobs } = tuned(); // (a tuned game is not a bug: said first, debug/tuned.js)
  if (knobs.length) body.append(q.look.notice(`Tuned away from the defaults (Tab, then actions, Restore defaults): ${line(knobs, 6)}.`));
  body.append(h('div', 'qarea', `${cur}: what changed`), q.look.brief(all.filter((d) => d.build === cur).sort((a, b) => div(a) - div(b))));
  const before = new Map();
  for (const d of all.filter((x) => x.build !== cur).sort((a, b) => (b.at || 0) - (a.at || 0))) { if (!before.has(d.build)) before.set(d.build, []); before.get(d.build).push(d); }
  for (const [build, docs] of before) {
    const det = h('details'); det.append(h('summary', 'qarea', build), q.look.brief(docs.map((d) => ({ ...d, waiting: [] }))));
    body.append(det);
  }
}

function tests(body, q) {
  const list = roundTests(q);
  if (!list.length) { body.append(q.look.notice(q.round?.build ? `No QAIS tests for ${q.round.build} yet.` : 'No round is set for this build yet.')); return; }
  const A = q.act;
  let area = null;
  for (const t of list) {
    if (t.area !== area) { area = t.area; body.append(h('div', 'qarea', area || '')); }
    const card = q.look.testCard({ ...t, status: OPEN(t) ? null : t.status }, {
      onStatus: (s) => A.mark(t, s || 'open'), onNote: (text) => A.note(t, text), onGo: () => A.go(t), onFail: () => A.file(t),
    });
    card.dataset.id = t.id;
    body.append(card);
  }
  body.append(row(btn('Send to the brigade', () => A.send())));
}

function reports(body, q) {
  body.append(row(btn('File a report', () => q.act.file()), q.store.online ? btn('Send to the brigade', () => q.act.send()) : null));
  if (!q.store.online) return;
  const all = q.store.docs('bugs').map((b) => ({ ...b, test: b.test || null })), now = roundBugs(q);
  const open = (id) => { const b = all.find((x) => x.id === id || x.n === id); if (b?.frameUrl) window.open(b.frameUrl, '_blank', 'noopener'); };
  body.append(q.look.reportList(now, { onOpen: open }));
  const before = all.filter((b) => b.round !== q.round?.build);
  if (before.length) { const det = h('details'); det.append(h('summary', 'qarea', `Earlier (${before.length})`), q.look.reportList(before, { onOpen: open })); body.append(det); }
}

function questions(body, q) { body.append(q.look.questions(q.store.docs('questions'))); }

const DRAW = { brief, tests, reports, questions };
export function draw(tab, body, q) {
  body.replaceChildren();
  if (!q.store?.online && tab !== 'reports') { body.append(q.look.notice()); return; }
  if (!q.store?.online) body.append(q.look.notice());
  DRAW[tab](body, q);
}
