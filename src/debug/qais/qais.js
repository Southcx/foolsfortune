// ---------------------------------------------------------------------------------------
// QAIS: the development window in the game where the owner tests a build (docs/plans/QAIS.md, Dovina's spec; the glossary's QAIS).
// F8 anywhere in play takes the frame first (the 480-line canvas read back in the same task as its draw: what the owner saw, before any
// window draws over it), pauses the world (main.js's modalOpen), frees the mouse and opens on the tab last used. Esc or F8 closes it and
// play resumes where it stopped. Four tabs (tabs.js): the Brief, the Tests, the Reports, the Questions; all of it kept in the published
// build's store (store.js), none of it in the save.
//
// What it does on its own: listens for the round's QAIS tests' evidence (evidence.js, one tap on the bus), writes a pass, a fail, a
// skip or a note on the owner's press, files a report (report.js) from the frame taken, takes the owner to a test's place
// (`game.places.travel`), and on **Send to the brigade** marks the round sent and wakes Dovina's session through the owner's Claude Code
// Remote connector (as the viewer, with their consent). It is not text feedback in the world and counts nothing in the ledger; the bus
// says `qais.report.filed` and `qais.round.sent`, and the log's rules say them.
//
// A public build is made without it (main.js: `VITE_PUBLIC=1`: the window and the store are not bundled; the log's rules stay).
//
// Prior art: Valve's Source `bug` command (one key, the frame first), in-client patch notes (League's PBE client), a test-case manager
// (TestRail: a run per build, triaged), and Factorio's and Minecraft's debug screens (development tooling in the game, off for release).
//
//   const qais = new Qais(game, { renderer, scene, camera })   qais.open   qais.toggle()   qais.show(tab?)   qais.close()   qais.onClose
// ---------------------------------------------------------------------------------------
import { BUILD } from '../../core/progress.js';
import { openStore } from './store.js';
import { Evidence } from './evidence.js';
import { fileReport } from './report.js';
import { TABS, draw } from './tabs.js';
import { CSS } from './look.js';

/** The published build (the store every division reads with ArtifactData) and the session a sent round wakes: Dovina's. */
export const BUILD_URL = 'https://claude.ai/artifact/FjLfppJaKzUCZxoVBp9FE8';
export const BRIGADE = { server: 'Claude Code Remote', tool: 'create_trigger', session: 'session_01Dn7Yum1aGbbsUQBLqcm863', who: 'Dovina' };
const NOTE_PAUSE = 1.5; // (real seconds of quiet before a note is written: one write a pause, never one a key)

export class Qais {
  constructor(game, { renderer, scene, camera }) {
    this.game = game; this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.build = BUILD;
    this.open = false; this.marking = false; this.tab = 'brief';
    this.store = null; this.round = null; this.frame = null;
    this.notes = new Map(); // test id -> timer
    this.act = {
      mark: (t, s) => this.mark(t, s), fail: (t) => this.fail(t), note: (t, text) => this.note(t, text),
      go: (t) => this.go(t), file: () => this.file(), send: () => this.send(),
    };
    this.make();
    addEventListener('keydown', (e) => this.key(e), true);
    openStore().then((s) => this.connect(s));
  }

  make() {
    if (!document.getElementById('qais-css')) { const st = document.createElement('style'); st.id = 'qais-css'; st.textContent = CSS; document.head.appendChild(st); }
    const root = this.root = document.createElement('div'); root.id = 'qais';
    const qw = document.createElement('div'); qw.className = 'qw';
    const head = document.createElement('header'), h2 = document.createElement('h2'); h2.textContent = 'QAIS';
    const tabs = this.tabsEl = document.createElement('div'); tabs.className = 'tabs';
    TABS.forEach(([id, label], i) => {
      const b = document.createElement('button'); b.dataset.tab = id; b.textContent = label;
      const k = document.createElement('span'); k.className = 'k'; k.textContent = i + 1; b.append(k);
      b.addEventListener('click', () => this.setTab(id)); tabs.append(b);
    });
    head.append(h2, tabs);
    this.pane = document.createElement('div'); this.pane.className = 'pane';
    this.foot = document.createElement('div'); this.foot.className = 'foot';
    qw.append(head, this.pane, this.foot);
    root.append(qw);
    root.addEventListener('mousedown', (e) => { if (e.target === root) this.close(); });
    document.body.appendChild(root);
  }

  /** The store answered: the round, and every collection watched once (the window redraws from them). */
  connect(store) {
    this.store = store;
    store.watch('meta', (docs) => { this.round = docs.find((d) => d.id === 'round') || null; this.redraw(); });
    this.evidence = new Evidence(this.game, (t, s) => this.seen(t, s));
    store.watch('tests', (docs) => { this.evidence.watch(docs.filter((t) => t.build === this.round?.build)); this.redraw(); });
    for (const c of ['brief', 'bugs', 'questions']) store.watch(c, () => this.redraw());
  }

  // ---------------------------------------------------------------- the window
  key(e) {
    if (this.marking) return; // (the markup window has the keys: its Esc is its own)
    if (e.code === 'F8') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) this.toggle(); return; }
    if (!this.open) return;
    e.stopPropagation(); // (the game hears nothing while QAIS is open: a note's B is not the Codex)
    const inText = /^(TEXTAREA|INPUT)$/.test(e.target.tagName);
    if (e.key === 'Escape') { e.preventDefault(); if (inText) e.target.blur(); else this.close(); return; }
    if (!inText && /^Digit[1-4]$/.test(e.code)) this.setTab(TABS[+e.code.slice(5) - 1][0]);
  }

  /** May it open now? In play, not over the title, the workbench or another window that pauses. */
  canOpen() {
    const g = this.game;
    return !g.title?.active && !g.workbench?.open && !g.codex?.open && !g.indexMenu?.open && !g.cartography?.open && !g.pneukaUI?.open && !g.shopUI?.open && !g.dialogue?.open;
  }

  toggle() { if (this.open) this.close(); else if (this.canOpen()) this.show(); }

  /** The frame first (the true look, before anything draws over it), then the pause and the window. */
  show(tab = this.tab) {
    this.frame = this.grab();
    this.open = true; this.tab = tab;
    document.exitPointerLock?.();
    this.root.classList.add('open');
    this.redraw(true);
  }

  close() {
    if (!this.open) return;
    document.activeElement?.blur?.(); // (a note being typed is written by its pause timer)
    this.open = false;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  setTab(id) { this.tab = id; this.redraw(true); }

  /** The canvas as drawn this instant: drawn again here and read back in the same task (the drawing buffer is not preserved). */
  grab() {
    const r = this.renderer, c = document.createElement('canvas');
    try {
      this.game.post.render(this.scene, window.__debugCam || this.camera);
      c.width = r.domElement.width; c.height = r.domElement.height;
      c.getContext('2d').drawImage(r.domElement, 0, 0);
    } catch (e) { console.warn('QAIS: the frame could not be taken', e); c.width = c.height = 1; }
    return c;
  }

  /** Draw the tab again (not while a note is being typed in it: that would take the words from under the owner's fingers). */
  redraw(force = false) {
    if (!this.open || !this.store && !force) return;
    if (!force && this.pane.contains(document.activeElement) && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName)) { this.stale = true; return; }
    this.stale = false;
    for (const b of this.tabsEl.children) b.classList.toggle('on', b.dataset.tab === this.tab);
    const top = this.pane.scrollTop;
    if (this.store) draw(this.tab, this.pane, this);
    else this.pane.textContent = 'Opening the store...';
    this.pane.scrollTop = top;
    const r = this.round;
    this.foot.textContent = `${r?.build ? `round ${r.build}` : 'no round'} · build ${this.build} · ${this.store?.online ? 'the published store' : 'away from the store'}   |   1-4 the tabs · Esc or F8 closes`;
  }

  // ---------------------------------------------------------------- the owner's acts
  latest(t) { return this.store.docs('tests').find((x) => x.id === t.id) || t; }

  mark(t, status) {
    const cur = this.latest(t).status;
    const next = cur === status ? 'open' : status; // (pressed again: undone)
    this.store.update('tests', t.id, { status: next, markedAt: Date.now() });
  }

  /** Fail: marked, then a report filed from the frame taken, carrying the test's id. */
  async fail(t) {
    if (this.latest(t).status !== 'fail') await this.store.update('tests', t.id, { status: 'fail', markedAt: Date.now() });
    await this.file(this.latest(t));
  }

  note(t, text) {
    clearTimeout(this.notes.get(t.id));
    this.notes.set(t.id, setTimeout(() => { this.notes.delete(t.id); this.store.update('tests', t.id, { note: text.slice(0, 2000) }); if (this.stale) this.redraw(); }, NOTE_PAUSE * 1000));
  }

  /** Take me there: closed, and set down beside the test's place as the Index does. */
  go(t) {
    this.close();
    if (!this.game.places?.travel(t.go)) this.game.log.say('system', `QAIS cannot take you to "${t.go}" from here.`, { throttle: 1 });
  }

  /** The Reports tab's File: the markup window over the frame taken at F8 (the QAIS window hidden under it meanwhile). */
  async file(test = null) {
    if (this.marking) return;
    this.marking = true; this.root.classList.remove('open');
    try { await fileReport(this.game, this.store, this.frame || this.grab(), { test, round: this.round }); } catch (e) { console.warn('QAIS: the report could not be filed', e); }
    this.marking = false;
    if (this.open) { this.root.classList.add('open'); this.setTab('reports'); }
  }

  /** A sighting of a test's evidence: written once (the first three kept, evidence.js). */
  seen(t, seen) { this.store.update('tests', t.id, { seen }); }

  /** Send to the brigade: the round marked sent, and Dovina's session woken through the owner's connector (on the owner's press only). */
  async send() {
    const r = this.round;
    if (!r?.build) { this.game.log.say('system', 'QAIS has no round to send.', { throttle: 1 }); return; }
    const ts = this.store.docs('tests').filter((t) => t.build === r.build), n = (s) => ts.filter((t) => (t.status || 'open') === s).length;
    const counts = { pass: n('pass'), fail: n('fail'), skip: n('skip'), open: n('open'), reports: this.store.docs('bugs').filter((b) => b.round === r.build).length };
    await this.store.update('meta', 'round', { sent: true, sentAt: Date.now() });
    let woke = true, why = '';
    try {
      const prompt = `From the owner, through QAIS: the round ${r.build} is sent. ${counts.pass} passed, ${counts.fail} failed, ${counts.skip} skipped, `
        + `${counts.open} not tried; ${counts.reports} reports filed on it. Read the round with ArtifactData on ${BUILD_URL} (the tests and the bugs `
        + `whose build or round is ${r.build}), route each fail and report to its division, set the reports' first status, and answer in the owner's thread.`;
      const at = new Date(Date.now() + 90 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
      await this.store.call(BRIGADE.server, BRIGADE.tool, { name: `QAIS: round ${r.build} sent`, prompt, persistent_session_id: BRIGADE.session, run_once_at: at, initiation: 'human_request' });
    } catch (e) { woke = false; why = e?.code || e?.message || 'refused'; console.warn('QAIS: the brigade could not be woken', e); }
    this.game.events.emit('qais.round.sent', { round: r.build, ...counts, woke, why, who: BRIGADE.who, by: 'courier' });
  }
}
