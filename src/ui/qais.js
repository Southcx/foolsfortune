// ---------------------------------------------------------------------------------------
// THE LOOK OF QAIS: the owner's testing window under F8 (docs/plans/QAIS.md, Dovina's; the shell, the store, the evidence watch and
// "take me there" are Petra's, src/debug/qais/, which calls these). A development window the player opened, like F3: words are allowed
// in it, it counts nothing, and it is drawn in the house window (ui/theme.js) so it reads as part of the game, not a web page over it.
// Always "QAIS" where it is seen, never spelled out: "the System" is the game's own voice.
//
// One look, named plainly: A TESTER'S LEDGER. Index tabs along the top of one page; each QAIS test a card on that page, stamped when it
// is judged; the reports a list of slips with their status lozenges.
//
//   THE TABS       index tabs: the open one joins the page (no rule under it); each may carry a count and a dot (something waits)
//   A TEST'S CARD  what to do, what should happen, who and which build; PASS, FAIL and SKIP buttons; a note; when judged, a STAMP in the
//                  card's corner in the verdict's ink, a little askew, as on a paper test sheet. A `live` test says to try it with QAIS
//                  closed. "Take me there" when the test names a place.
//   THE EVIDENCE MARK  "seen": an open eye in the celadon of a pass not yet given, with the real time and the payload's gist. It is
//                  evidence, never a verdict: the card is not stamped by it, and its ink is not the pass's.
//   THE REPORT LIST  one slip a report: its number, title, kind and severity, the test it came from, who took it, and a lozenge for its
//                  status (new, seen, fixed <commit>, not a bug, asked)
//
// Prior art: TestRail's statuses and their inks (passed green, failed red, untested grey: the colour is the status at a glance), the
// paper test sheet a QA lead stamps PASS or FAIL at the bench, Jira's status lozenges (a status is a small rounded word, its colour its
// family), the index tabs of a card file, and the house window's frame (sixth-generation JRPG menus, ui/theme.js).
//
//   import { QaisLook } from '../../ui/qais.js'   const look = new QaisLook()   (its CSS is put in once)
//   look.window()                                  -> { root, tabs, body }   (#qais .qw: append root to the page; fill tabs and body)
//   look.tabs(el, [{ id, label, count?, dot? }], active, onPick(id))
//   look.testCard(test, { onStatus(status), onNote(text), onGo(), onFail() })  -> element (element.update(test) redraws it in place)
//   look.seenMark(seen)                            -> element | null   (seen: [{ at, gist }], the first three sightings)
//   look.reportList(bugs, { onOpen(id) })          -> element
//   look.brief(docs) and look.questions(qs)        -> element   (the other two tabs, plain)
//   look.preview()                                 (the four tabs over sample documents, for `/qais` until the shell lands; Esc closes)
// ---------------------------------------------------------------------------------------

/** A test's verdicts and their inks (null: not yet judged). */
export const VERDICTS = { pass: { label: 'Pass', ink: '#7fd39a' }, fail: { label: 'Fail', ink: '#ff5a4a' }, skip: { label: 'Skip', ink: '#b9ad9d' } };
/** A report's statuses (`fixed` carries its commit: 'fixed 1dd3c9c'). */
export const REPORT_STATUS = { new: { label: 'new', ink: '#ff8a3c' }, seen: { label: 'seen', ink: '#f2c84a' }, fixed: { label: 'fixed', ink: '#7fd39a' }, 'not a bug': { label: 'not a bug', ink: '#9a9088' }, asked: { label: 'asked', ink: '#b58cff' } };
const SEEN_INK = '#5ec8e0'; // (wonder's teal: noticed, not judged)
const DIVISION_SUIT = { petra: '♦', dovina: '★', wanda: '♣', calissa: '♥', espada: '♠', owner: '♛' }; // (pentacles, the trumps, wands, cups, swords: the suits as the cards print them)

const CSS = `
#qais { position: fixed; inset: 0; z-index: 58; display: flex; align-items: center; justify-content: center; background: rgba(4,2,8,.55); }
#qais .qw { width: min(860px, calc(100vw - 24px)); height: min(640px, calc(100vh - 24px)); display: flex; flex-direction: column; color: #fff1dc; font-size: 13px; box-sizing: border-box; }
#qais .qtabs { display: flex; gap: 3px; align-items: flex-end; padding: 0 6px; border-bottom: 1px solid rgba(255,241,220,.35); flex: none; }
#qais .qtab { all: unset; cursor: var(--jcur-pointer, pointer); position: relative; padding: 6px 14px 5px; margin-bottom: -1px; border: 1px solid rgba(255,241,220,.25); border-bottom: none;
  border-radius: 7px 7px 0 0; background: rgba(0,0,0,.22); font-family: var(--f-title); letter-spacing: .14em; text-transform: uppercase; font-size: 12px; opacity: .72; }
#qais .qtab:hover { opacity: .95; }
#qais .qtab.on { opacity: 1; background: rgba(var(--jsel, 120,60,40), .55); border-color: rgba(255,241,220,.6); padding-top: 9px; }
#qais .qtab .n { margin-left: 7px; font-family: var(--f-ui); letter-spacing: 0; font-size: 11px; opacity: .8; text-transform: none; }
#qais .qtab .dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: #ff8a3c; box-shadow: 0 0 6px #ff8a3c; }
#qais .qbody { flex: 1; overflow: auto; padding: 10px 6px 4px; display: flex; flex-direction: column; gap: 10px; }
#qais .qbody > * { flex: none; }
#qais .qarea { font-family: var(--f-title); letter-spacing: .16em; text-transform: uppercase; font-size: 11px; opacity: .7; margin: 6px 0 -4px; }

#qais .qcard { position: relative; padding: 10px 12px 9px; border-radius: 6px; background: rgba(0,0,0,.24); border: 1px solid rgba(255,241,220,.18); border-left: 4px solid rgba(255,241,220,.25); overflow: hidden; }
#qais .qcard.v-pass { border-left-color: ${VERDICTS.pass.ink}; } #qais .qcard.v-fail { border-left-color: ${VERDICTS.fail.ink}; } #qais .qcard.v-skip { border-left-color: ${VERDICTS.skip.ink}; opacity: .78; }
#qais .qcard .hd { display: flex; gap: 8px; align-items: baseline; padding-right: 96px; }
#qais .qcard .id { font-family: var(--f-sys, monospace); font-size: 11px; opacity: .65; }
#qais .qcard .what { font-weight: 700; font-size: 14px; }
#qais .qcard .expect { margin: 4px 0 0; padding-right: 96px; opacity: .92; }
#qais .qcard .expect b { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; opacity: .65; margin-right: 6px; }
#qais .qcard .meta { margin-top: 5px; font-size: 11px; opacity: .6; }
#qais .qcard .live { display: inline-block; margin-top: 6px; padding: 1px 7px; border-radius: 3px; font-size: 11px; background: rgba(242,200,74,.16); color: #f2c84a; border: 1px solid rgba(242,200,74,.45); }
#qais .qcard .acts { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-top: 8px; }
#qais .qbtn { all: unset; cursor: var(--jcur-pointer, pointer); padding: 3px 11px; border-radius: 4px; border: 1px solid rgba(255,241,220,.35); font-size: 12px; font-weight: 700; }
#qais .qbtn:hover { background: rgba(255,241,220,.12); }
#qais .qbtn.v { border-color: var(--ink); color: var(--ink); }
#qais .qbtn.v.on { background: var(--ink); color: #1c0d08; }
#qais .qbtn.go { margin-left: auto; border-style: dashed; }
#qais .qcard textarea { box-sizing: border-box; width: 100%; margin-top: 7px; background: rgba(0,0,0,.3); color: #fff1dc; border: 1px solid rgba(255,241,220,.22); border-radius: 4px;
  padding: 4px 7px; font: inherit; font-size: 12px; resize: none; height: 30px; }
#qais .qcard textarea:focus { height: 58px; outline: none; border-color: rgba(255,241,220,.5); }
#qais .stamp { position: absolute; top: 9px; right: 10px; transform: rotate(-9deg); padding: 2px 9px; border: 2.5px solid var(--ink); border-radius: 5px; color: var(--ink);
  font-family: var(--f-title); font-weight: 800; letter-spacing: .2em; font-size: 15px; opacity: .88; pointer-events: none; mix-blend-mode: screen;
  box-shadow: inset 0 0 0 1.5px rgba(0,0,0,.35); text-shadow: 0 0 1px var(--ink); animation: qstamp .16s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes qstamp { from { transform: rotate(-9deg) scale(1.6); opacity: 0; } to { transform: rotate(-9deg) scale(1); opacity: .88; } }

#qais .seen { display: flex; gap: 7px; align-items: flex-start; margin-top: 7px; padding: 4px 8px; border-radius: 4px; background: rgba(94,200,224,.08); border: 1px solid rgba(94,200,224,.35); color: #bfeaf4; font-size: 11px; }
#qais .seen svg { flex: none; margin-top: 1px; }
#qais .seen .s b { color: ${SEEN_INK}; letter-spacing: .08em; text-transform: uppercase; font-size: 10px; margin-right: 5px; }
#qais .seen .s code { font-family: var(--f-sys, monospace); opacity: .85; }

#qais .qslips { display: flex; flex-direction: column; gap: 4px; }
#qais .qslip { all: unset; cursor: var(--jcur-pointer, pointer); display: grid; grid-template-columns: 38px 1fr auto; gap: 2px 10px; align-items: baseline; padding: 6px 10px; border-radius: 5px;
  background: rgba(0,0,0,.2); border: 1px solid rgba(255,241,220,.14); }
#qais .qslip:hover { background: rgba(255,241,220,.08); }
#qais .qslip .no { font-family: var(--f-sys, monospace); opacity: .6; font-size: 12px; }
#qais .qslip .t { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#qais .qslip .sub { grid-column: 2; font-size: 11px; opacity: .62; }
#qais .lz { grid-row: span 2; align-self: center; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; color: var(--ink); background: color-mix(in srgb, var(--ink) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--ink) 60%, transparent); white-space: nowrap; }
#qais .lz code { font-family: var(--f-sys, monospace); font-weight: 500; margin-left: 4px; }
#qais .lz.nab { text-decoration: line-through; }
#qais .sev-blocks .t::before { content: '!! '; color: #ff5a4a; }

#qais .qdiv { padding: 8px 12px; border-radius: 6px; background: rgba(0,0,0,.2); border: 1px solid rgba(255,241,220,.14); }
#qais .qdiv h3 { margin: 0 0 4px; font-family: var(--f-title); font-weight: 600; letter-spacing: .1em; font-size: 14px; }
#qais .qdiv h3 .suit { margin-right: 6px; opacity: .8; }
#qais .qdiv ul { margin: 0; padding-left: 18px; } #qais .qdiv li { margin: 2px 0; }
#qais .qdiv.wait { border-color: rgba(255,138,60,.5); } #qais .qdiv.wait h3 { color: #ffb37c; }
#qais .qq { padding: 8px 12px; border-radius: 6px; background: rgba(0,0,0,.2); border: 1px solid rgba(255,241,220,.14); }
#qais .qq .from { font-size: 11px; opacity: .6; } #qais .qq .opts { margin-top: 4px; font-size: 12px; opacity: .85; }
#qais .qq .ans { margin-top: 6px; padding: 4px 8px; border-left: 3px solid ${VERDICTS.pass.ink}; background: rgba(127,211,154,.08); }
#qais .empty { opacity: .55; font-style: italic; padding: 20px; text-align: center; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = (at) => { const d = new Date(at); return Number.isNaN(+d) ? esc(at) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); };
const EYE = `<svg width="16" height="11" viewBox="0 0 16 11"><path d="M1 5.5C3 2 5.5 1 8 1s5 1 7 4.5C13 9 10.5 10 8 10S3 9 1 5.5Z" fill="none" stroke="${SEEN_INK}" stroke-width="1.4"/><circle cx="8" cy="5.5" r="2.3" fill="${SEEN_INK}"/></svg>`;

export class QaisLook {
  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('qais-css')) { const st = el('style'); st.id = 'qais-css'; st.textContent = CSS; document.head.appendChild(st); }
  }

  /** The window: a framed page (the house window, ui/theme.js WINDOWS has '#qais .qw') with its tab row and its body. */
  window() {
    const root = el('div'); root.id = 'qais';
    const w = el('div', 'qw'), tabs = el('div', 'qtabs'), body = el('div', 'qbody');
    w.append(tabs, body); root.append(w);
    return { root, tabs, body };
  }

  /** Index tabs. tabs: [{ id, label, count?, dot? }]; the active one joins the page. */
  tabs(host, tabs, active, onPick) {
    host.replaceChildren(...tabs.map((t) => {
      const b = el('button', `qtab${t.id === active ? ' on' : ''}`, `${esc(t.label)}${t.count != null ? `<span class="n">${esc(t.count)}</span>` : ''}${t.dot ? '<span class="dot"></span>' : ''}`);
      b.dataset.tab = t.id; b.onclick = () => onPick?.(t.id);
      return b;
    }));
    return host;
  }

  /** A QAIS test's card (the store's `tests` document). The callbacks are the shell's; the card only redraws what it is given. */
  testCard(test, { onStatus, onNote, onGo, onFail } = {}) {
    const card = el('div', 'qcard');
    let noteT = 0;
    const draw = (t) => {
      const v = VERDICTS[t.status] ? t.status : null;
      card.className = `qcard${v ? ` v-${v}` : ''}`;
      card.innerHTML = `
        <div class="hd"><span class="id">T${esc(t.n)}</span><span class="what">${esc(t.what)}</span></div>
        <div class="expect"><b>should</b>${esc(t.expect)}</div>
        ${t.live ? '<div class="live">Live: try it with QAIS closed</div>' : ''}
        <div class="meta">${esc(t.area || '')}${t.area ? ' · ' : ''}build ${esc(t.build)} · ${esc(DIVISION_SUIT[t.by] || '')} ${esc(t.by || t.who || '')}${t.report ? ` · report ${esc(t.report)}` : ''}</div>
        <div class="acts">${Object.entries(VERDICTS).map(([k, V]) => `<button class="qbtn v${v === k ? ' on' : ''}" data-v="${k}" style="--ink:${V.ink}">${V.label}</button>`).join('')}
          ${t.go ? '<button class="qbtn go" data-go="1">Take me there &#x2192;</button>' : ''}</div>
        <textarea placeholder="A note (what you saw)">${esc(t.note || '')}</textarea>
        ${v ? `<div class="stamp" style="--ink:${VERDICTS[v].ink}">${VERDICTS[v].label.toUpperCase()}</div>` : ''}`;
      const seen = this.seenMark(t.seen); if (seen) card.insertBefore(seen, card.querySelector('.acts'));
      card.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { const s = b.dataset.v === v ? null : b.dataset.v; onStatus?.(s); if (s === 'fail') onFail?.(); }; });
      const go = card.querySelector('[data-go]'); if (go) go.onclick = () => onGo?.();
      const ta = card.querySelector('textarea');
      ta.oninput = () => { clearTimeout(noteT); noteT = setTimeout(() => onNote?.(ta.value), 600); }; // (written on the note's pause, never a stream: QAIS.md)
      ta.onblur = () => { clearTimeout(noteT); if (ta.value !== (t.note || '')) onNote?.(ta.value); };
      ta.onkeydown = (e) => e.stopPropagation(); // (typing in a note is not playing)
    };
    draw(test);
    card.update = (t) => { if (card.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') { const keep = document.activeElement.value; draw(t); const ta = card.querySelector('textarea'); ta.value = keep; ta.focus(); } else draw(t); };
    return card;
  }

  /** The evidence mark: the test's event was seen (the first three sightings: real time and the payload's gist). Null when unseen. */
  seenMark(seen) {
    if (!seen?.length) return null;
    const m = el('div', 'seen', EYE);
    const s = el('div', 's', `<b>seen</b>${seen.slice(0, 3).map((x) => `${clock(x.at)} real time${x.gist ? ` <code>${esc(x.gist)}</code>` : ''}`).join('<br>')}`);
    m.append(s); m.title = 'Evidence only: the event fired. Whether it looked or sounded right is yours to judge.';
    return m;
  }

  /** The reports on this build: one slip each, newest first, with its status lozenge. */
  reportList(bugs, { onOpen } = {}) {
    const list = el('div', 'qslips');
    if (!bugs?.length) { list.append(el('div', 'empty', 'No reports on this build.')); return list; }
    for (const b of [...bugs].sort((x, y) => (y.n ?? 0) - (x.n ?? 0))) {
      const [st, ...rest] = String(b.status || 'new').split(' '), key = REPORT_STATUS[b.status] ? b.status : REPORT_STATUS[st] ? st : 'new', S = REPORT_STATUS[key];
      const commit = key === 'fixed' ? rest.join(' ') : '';
      const slip = el('button', `qslip sev-${esc(b.severity || 'wrong')}`, `
        <span class="no">#${esc(b.n ?? b.id)}</span><span class="t">${esc(b.title || '(untitled)')}</span>
        <span class="lz${key === 'not a bug' ? ' nab' : ''}" style="--ink:${S.ink}">${S.label}${commit ? `<code>${esc(commit)}</code>` : ''}</span>
        <span class="sub">${esc(b.kind || 'bug')} · ${esc(b.severity || 'wrong')}${b.test ? ` · from T${esc(String(b.test).replace(/^T/, ''))}` : ''}${b.taken ? ` · ${esc(DIVISION_SUIT[b.taken] || '')} ${esc(b.taken)}` : ''}</span>`);
      slip.onclick = () => onOpen?.(b.id ?? b.n);
      list.append(slip);
    }
    return list;
  }

  /** The Brief: a heading per division with its lines, then what each waits on from the owner. docs: the store's `brief` documents. */
  brief(docs) {
    const box = el('div', 'qslips');
    if (!docs?.length) { box.append(el('div', 'empty', 'No brief for this build yet.')); return box; }
    const waits = [];
    for (const d of docs) {
      const b = el('div', 'qdiv', `<h3><span class="suit">${esc(DIVISION_SUIT[d.division] || '')}</span>${esc(cap(d.division))}</h3><ul>${(d.lines || []).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`);
      box.append(b);
      for (const w of d.waiting || []) waits.push([d.division, w]);
    }
    if (waits.length) box.append(el('div', 'qdiv wait', `<h3>Waiting on you</h3><ul>${waits.map(([d, w]) => `<li>${esc(DIVISION_SUIT[d] || '')} ${esc(cap(d))}: ${esc(w)}</li>`).join('')}</ul>`));
    return box;
  }

  /** The Questions: open ones first; an answered one shows the answer and where it was given. */
  questions(qs) {
    const box = el('div', 'qslips');
    if (!qs?.length) { box.append(el('div', 'empty', 'No open questions.')); return box; }
    for (const q of [...qs].sort((a, b) => !!a.answer - !!b.answer)) {
      box.append(el('div', 'qq', `<div class="from">${esc(DIVISION_SUIT[q.from] || '')} ${esc(cap(q.from))} asks</div><div>${esc(q.q)}</div>
        ${q.options?.length ? `<div class="opts">${q.options.map((o) => esc(o)).join(' · ')}</div>` : ''}
        ${q.answer ? `<div class="ans">${esc(q.answer)}${q.where ? ` <span class="from">(${esc(q.where)})</span>` : ''}</div>` : ''}`));
    }
    return box;
  }

  /** A preview over sample documents (the shapes of QAIS.md's store): `/qais` on the chat line, until Petra's shell calls the parts. */
  preview() {
    document.getElementById('qais')?.remove();
    const W = this.window(), now = Date.now();
    const tests = [
      { n: 1, build: 'v75', area: 'the Dunes', by: 'calissa', what: 'Stand on the beach at night and look where the sun was.', expect: 'A small pale moon with a faint ring; no sun disc.', go: 'dunes.beach', status: 'pass', note: 'Lovely.' },
      { n: 2, build: 'v75', area: 'the Dunes', by: 'calissa', what: 'Wait for a dread pall and watch the far lightning.', expect: 'Bolts land all round the horizon, never marching in steps.', watch: { event: 'weather.change' }, seen: [{ at: now - 64000, gist: 'aspect: dread, strength 0.8' }], status: null },
      { n: 3, build: 'v75', area: 'the Dunemaw', by: 'petra', what: 'Go down the Dunemaw to the third floor and come back up.', expect: 'The maw wipe covers each passage once; no stall when it opens.', go: 'well.mouth', status: 'fail', report: 12 },
      { n: 4, build: 'v75', area: 'Music', by: 'wanda', what: 'Start a fight and listen to the battle theme come in.', expect: 'The ring comes online on the downbeat.', live: true, status: 'skip', note: 'No jellies nearby.' },
    ];
    const bugs = [
      { n: 12, title: 'The maw wipe holds on black after the second floor', kind: 'bug', severity: 'blocks', test: 'T3', status: 'new' },
      { n: 11, title: 'The swash ribbon floats above the sand at the jetty end', kind: 'look', severity: 'rough', status: 'fixed 1dd3c9c', taken: 'calissa' },
      { n: 10, title: 'A line of the folk misgenders the Courier', kind: 'words', severity: 'wrong', status: 'asked', taken: 'espada' },
      { n: 9, title: 'The crude sea reads too busy from the jetty', kind: 'look', severity: 'wish', status: 'not a bug', taken: 'calissa' },
    ];
    const brief = [
      { division: 'petra', lines: ['The glow is compiled in the warm-up: no hitch the first time a lamp blooms.'], waiting: [] },
      { division: 'calissa', lines: ['A moon by night where the sun was.', 'The far lightning lands all round the horizon.'], waiting: ['Is the moon the right size?'] },
    ];
    const qs = [{ from: 'dovina', q: 'Should a skipped QAIS test carry over to the next build?', options: ['carry it', 'drop it'] }, { from: 'petra', q: 'One window under F8?', answer: 'Yes, one window.', where: "Dovina's thread, 2026-10-05" }];
    const tabs = [{ id: 'brief', label: 'Brief' }, { id: 'tests', label: 'Tests', count: `${tests.filter((t) => !t.status).length} left`, dot: true }, { id: 'reports', label: 'Reports', count: bugs.length }, { id: 'questions', label: 'Questions', count: 1 }];
    const show = (id) => {
      this.tabs(W.tabs, tabs, id, show);
      if (id !== 'tests') { W.body.replaceChildren(id === 'brief' ? this.brief(brief) : id === 'reports' ? this.reportList(bugs) : this.questions(qs)); return; }
      W.body.replaceChildren(); let area = null;
      for (const t of tests) {
        if (t.area !== area) { area = t.area; W.body.append(el('div', 'qarea', esc(area))); }
        const c = this.testCard(t, { onStatus: (s) => { t.status = s; c.update(t); } }); W.body.append(c);
      }
    };
    show('tests');
    document.body.append(W.root);
    const key = (e) => { if (e.key === 'Escape') { W.root.remove(); removeEventListener('keydown', key, true); } };
    addEventListener('keydown', key, true);
    return W;
  }
}
const cap = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
