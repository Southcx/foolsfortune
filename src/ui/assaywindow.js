// ---------------------------------------------------------------------------------------
// THE ASSAY'S WINDOW: the Assay (docs/plans/APTITUDE.md 7 and 10; Dovina's game.aptitude, progress/aptitude.js `all()`) drawn as the
// isekai status sheet: a System window summoned before the Courier on `aptitude.ask` (the `/assay` command), in Anagami's dress
// (OVERLAY.md 15.4: Clay), closed by any key or tap, or on its own after ASSAY_LOOK.ask real seconds. It reads what is and says nothing of
// what happened: the log says the same readings as lines (tracking/aptitude.js), so the readings have two avenues.
//   A ROW         an aptitude (APTITUDES): its label and its line (Dovina's placeholders for Espada's words); until APT.shown readings,
//                 ??? as a scrambled line in the running hand (OVERLAY.md 17: a line's read, scrambled: a word swapped a quarter of a
//                 real second, as a creature's tag churns) and its count toward APT.shown; then its median in its unit, its best and
//                 its count as stats, and its trend (readOf's, signed by the aptitude's better way: positive is better) as an arrow,
//                 the better way green; from APT.curve readings a small curve of the recent ones, the better way drawn up.
//   THE TRIALS    the standard trials' runs (`trial.<id>` in all(): APTITUDE.md 10.4, announced as one) apart, under their own heading,
//                 their numbers from the first run (the median over the runs: APTITUDE.md 9, never one noisy run alone once there are
//                 more); the trials not yet run named in one line with the room they are run in.
//   THE LOOK      the goals window's (ui/goalswindow.js): the Brine frame's structure (ui/brineframe.js) dressed in Clay (clayDress),
//                 the cord-marked band under its tab; rows as the isekai sheet's `LABEL ······ value`, sections split by a hairline
//                 and a glyph, never by boxes. The Codex's STATUS shelf's Assay card (codex/status.js `assay()`) is the compact form of
//                 the same data and this keeps its grammar: the same three columns (the name over its line, the value, the curve),
//                 the same numbers (fmtReading), the same arrow colours and the same curve (assayCurve), exported for it.
//   ENTRANCE      summoned (OVERLAY.md 10.3): a line unfolds into the frame, a bright band scans it top to bottom, the tab lands
//                 last; the exit is the unfold reversed in two thirds the time. Too tall or too wide for the view, the dot shrinks.
//
// Prior art: the isekai status window (Solo Leveling's and Sword Art Online's System window: summoned on a word, `LABEL ······ value`
// rows), the Human Benchmark site's result page (your number in its own unit, your history as a curve), and this house's goals window
// and creature tags (vfx/creaturetags.js: the scrambled line's phrase and its pool of real roots, churned).
//
//   game.assayWindow = new AssayWindow(game)   .show(seconds?, readings?)   .hide()   .draw(readings?)   .on
//   ASSAY_LOOK   fmtReading(v) -> string   assayCurve(list, better) -> SVG markup (a compact form may share them)
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';
import { runningHand } from './runninghand.js';
import { cellsOf } from '../npc/neuralesespelling.js';
import { APTITUDES, APT } from '../progress/aptitude.js';
import { TRIALS } from '../progress/assaytrials.js';

/** Real seconds a summon stands, the fade, the arming (a key that summoned it never closes it), the churn; the arrows' and curve's
 *  colours (the STATUS card's: codex/status.js). */
export const ASSAY_LOOK = { ask: 24, fade: 0.3, arm: 0.45, churn: 0.25, width: 360, up: '#9fe0b0', dn: '#ff9a7a', curve: '#ffb27a' };
const L = ASSAY_LOOK;

/** A reading as the STATUS card and the log write it: whole from 10, one decimal under. */
export const fmtReading = (v) => (v == null || !Number.isFinite(v) ? '' : Math.abs(v) >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));

/** The recent readings as a small curve (the STATUS card's: the better way drawn up), a faint fill under it. */
export function assayCurve(list, better = 'high') {
  if (!list || list.length < 2) return '';
  const lo = Math.min(...list), hi = Math.max(...list), span = hi - lo || 1, flip = better === 'low';
  const pts = list.map((v, i) => `${((i / (list.length - 1)) * 100).toFixed(1)},${((flip ? (v - lo) / span : 1 - (v - lo) / span) * 24 + 2).toFixed(1)}`).join(' ');
  return `<svg class="aw-curve" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,28 ${pts} 100,28" fill="${L.curve}" fill-opacity=".16"/>`
    + `<polyline points="${pts}" fill="none" stroke="${L.curve}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}

// a scrambled line's neuralese (the creature tags' pool, every one a real root; the head SHIRA KE, "know what?", stands where the
// number will be: KE is the particle that stands where the unknown would, npc/neuraleseroots.js)
const HEAD = ['SHIRA', 'KE'];
const POOL = ['VIDA', 'SEMA', 'MAIA', 'VOYD', 'LOGA', 'KAVA', 'VERA', 'DEO', 'NUSA', 'SOMA', 'LITHA'];
const CELLS = new Map();
const cells = (w) => { let c = CELLS.get(w); if (!c) { try { c = cellsOf(w.toLowerCase()); } catch { c = []; } CELLS.set(w, c); } return c; };
const pick = () => POOL[Math.floor(Math.random() * POOL.length)];

const CSS = `
.aw-host{position:fixed;left:var(--safe-l,0px);right:var(--safe-r,0px);top:var(--safe-t,0px);bottom:var(--safe-b,0px);z-index:6;
  display:flex;align-items:center;justify-content:center;pointer-events:none}
.aw{width:calc(${L.width}*var(--d));opacity:0;transform:scale(.84,.03);transform-origin:50% 50%;
  transition:opacity ${(L.fade * 2) / 3}s,transform ${(L.fade * 2) / 3}s cubic-bezier(.5,0,1,1)}
.aw.on{opacity:1;transform:none;transition:opacity .1s,transform ${L.fade}s cubic-bezier(.2,.9,.3,1.04)}
${clayDress('.aw.clay')}
.aw .bf-tab{opacity:0;transform:translateY(calc(3*var(--d)));transition:opacity .12s,transform .12s}
.aw.on .bf-tab{opacity:1;transform:none;transition:opacity .16s ${L.fade * 0.85}s,transform .16s ${L.fade * 0.85}s}
.aw-scan{position:absolute;left:0;right:0;top:0;height:calc(14*var(--d));pointer-events:none;opacity:0;mix-blend-mode:screen;
  background:linear-gradient(180deg,transparent,rgba(255,236,214,.22) 40%,rgba(255,250,240,.6) 50%,rgba(255,236,214,.22) 60%,transparent)}
.aw.on .aw-scan{animation:aw-scan ${L.fade * 1.4}s ${L.fade * 0.3}s cubic-bezier(.3,.6,.5,1) both}
@keyframes aw-scan{0%{top:calc(-14*var(--d));opacity:1}85%{opacity:1}100%{top:100%;opacity:0}}
.aw-sub{display:flex;justify-content:space-between;align-items:baseline;gap:calc(6*var(--d));font-size:calc(9*var(--d));opacity:.8;margin-bottom:var(--d)}
.aw-close{font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.14em;opacity:.75;white-space:nowrap}
.aw-sec{display:flex;align-items:center;gap:calc(4*var(--d));margin:calc(5*var(--d)) 0 calc(1*var(--d));font-family:${FONT.title};font-weight:700;
  font-size:calc(8*var(--d));letter-spacing:.24em;color:rgba(255,226,196,.82)}
.aw-sec::after{content:'';flex:1;height:var(--d);background:rgba(30,12,6,.55);box-shadow:0 var(--d) 0 rgba(255,226,196,.1)}
.aw-sec i{flex:none;width:calc(4*var(--d));height:calc(4*var(--d));transform:rotate(45deg);background:rgb(var(--jtop,104,50,32));filter:brightness(2.2) saturate(1.2);
  box-shadow:0 0 0 var(--d) rgba(30,12,6,.7)}
.aw-row{display:grid;grid-template-columns:minmax(0,1fr) auto calc(52*var(--d));grid-template-areas:"nm v cv" "ln st cv";column-gap:calc(5*var(--d));
  row-gap:calc(.5*var(--d));align-items:baseline;padding:calc(3*var(--d)) 0}
.aw-row+.aw-row{border-top:var(--d) solid rgba(30,12,6,.4);box-shadow:inset 0 var(--d) 0 rgba(255,226,196,.07)}
.aw-nm{grid-area:nm;display:flex;align-items:baseline;min-width:0;font-family:${FONT.title};font-weight:700;font-size:calc(10*var(--d));
  letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.aw-nm .bf-lead{align-self:baseline;height:calc(2*var(--d));margin:0 0 0 calc(3*var(--d));background-position:0 100%}
.aw-ln{grid-area:ln;font-size:calc(9*var(--d));line-height:1.2;opacity:.78;align-self:start}
.aw-v{grid-area:v;justify-self:end;display:flex;align-items:baseline;gap:calc(2*var(--d));white-space:nowrap}
.aw-v b{font-family:${COUNT_FACE};font-weight:400;font-size:calc(17*var(--d));line-height:.9;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:#fff1dc;
  text-shadow:0 var(--d) 0 rgba(20,8,4,.8)}
.aw-v small{font-size:calc(8*var(--d));opacity:.72}
.aw-st{grid-area:st;justify-self:end;align-self:start;font-family:${COUNT_FACE};font-size:calc(10*var(--d));letter-spacing:.06em;opacity:.8;white-space:nowrap}
.aw-st b{font-weight:400;color:#fff1dc}
.aw-cv{grid-area:cv;align-self:stretch;display:flex;align-items:center}
.aw-curve{width:100%;height:calc(22*var(--d));display:block;
  background:linear-gradient(180deg,rgba(20,8,4,.35),rgba(20,8,4,.15));box-shadow:inset 0 var(--d) 0 rgba(0,0,0,.4),0 var(--d) 0 rgba(255,226,196,.08)}
.aw-tr{display:inline-block;width:calc(6*var(--d));height:calc(5*var(--d));align-self:center}
.aw-tr.up{background:${L.up};clip-path:polygon(50% 0,100% 100%,0 100%)}
.aw-tr.dn{background:${L.dn};clip-path:polygon(0 0,100% 0,50% 100%)}
.aw-q{display:block;width:calc(72*var(--d));height:calc(13*var(--d));align-self:center}
.aw-row.unread .aw-nm{opacity:.88}
.aw-none{font-size:calc(9*var(--d));line-height:1.25;opacity:.72;padding:calc(3*var(--d)) 0 var(--d)}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-assaywindow', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class AssayWindow {
  constructor(game) {
    this.game = game; this.root = null; this.on = false; this.timer = 0; this.churnT = 0; this.armed = false; this.scr = []; this.readings = null;
    const ev = game?.events; if (!ev?.on) return;
    ev.on('aptitude.ask', (e) => this.show(L.ask, e?.readings));
    // (a reading that decrypts or a trial that ends while it stands: drawn again from what is)
    ev.on('aptitude.read', () => { if (this.on) this.draw(); });
    ev.on('aptitude.trial', () => { if (this.on) this.draw(); });
    this.onKey = () => { if (this.armed) this.hide(); };
    this.onTap = () => { if (this.armed) this.hide(); };
  }

  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    this.host = make('div', 'aw-host');
    const root = (this.root = make('div', 'aw clay'));
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'The Assay');
    const f = (this.frame = brineFrame(root, { tab: 'THE ASSAY' }));
    f.body.append(make('div', 'bf-rope'));
    const sub = make('div', 'aw-sub');
    sub.append(make('span', '', 'what the System has measured of how you play'), (this.closeWord = make('span', 'aw-close')));
    this.list = make('div', 'aw-list');
    f.body.append(sub, this.list, make('div', 'aw-scan'));
    this.host.append(root); document.body.appendChild(this.host);
    this.fit();
    addEventListener('resize', () => { if (this.on) this.draw(); });
  }

  /** The dot (the 480-line present's), shrunk only when the window would not fit the safe area either way. */
  fit() {
    if (!this.root) return;
    const d0 = dot(), W = this.host.clientWidth || innerWidth, H = this.host.clientHeight || innerHeight;
    let d = Math.min(d0, (W * 0.96) / (L.width + 4));
    this.root.style.setProperty('--d', `${d}px`);
    const h = this.root.offsetHeight + 14 * d; // (the tab stands off the top edge)
    if (h > H * 0.96) { d *= (H * 0.96) / h; this.root.style.setProperty('--d', `${d}px`); }
    this.d = d;
  }

  /** One row: an aptitude's or a trial's (`need` readings before its number shows; `word` what one is called). */
  row(A, r = {}, samples, need, word) {
    const row = make('div', 'aw-row'), n = r.n || 0, shown = n >= need;
    const nm = make('div', 'aw-nm'); nm.append(make('span', '', A.label), make('i', 'bf-lead'));
    const v = make('div', 'aw-v'), st = make('div', 'aw-st'), cv = make('div', 'aw-cv');
    if (shown) {
      v.innerHTML = `<b>${fmtReading(r.median)}</b><small>${esc(A.unit)}</small>${r.trend ? `<i class="aw-tr ${r.trend > 0 ? 'up' : 'dn'}" title="${r.trend > 0 ? 'better' : 'worse'} than at first"></i>` : ''}`;
      st.innerHTML = `BEST <b>${fmtReading(r.best)}</b> · <b>${n}</b> ${word}${n === 1 ? '' : 'S'}`;
      if (r.curve && samples?.length > 1) cv.innerHTML = assayCurve(samples, A.better);
    } else {
      row.classList.add('unread');
      const c = document.createElement('canvas'); c.className = 'aw-q'; c.setAttribute('aria-label', 'not yet known'); v.append(c);
      this.scr.push({ c, toks: [...HEAD, pick(), pick(), pick()] });
      st.innerHTML = `<b>${n}</b> OF ${need} ${word}S`;
    }
    row.append(nm, v, cv, make('div', 'aw-ln', A.line || ''), st);
    return row;
  }

  /** Draw the rows from the readings (`aptitude.ask`'s, else game.aptitude.all()). */
  draw(readings) {
    this.build(); if (!this.root) return;
    const g = this.game, Ap = g?.aptitude, R = readings || Ap?.all?.() || this.readings || {}, S = Ap?.s || {};
    this.readings = R; this.scr = [];
    this.closeWord.textContent = g?.input?.device === 'touch' ? 'TAP TO CLOSE' : 'ANY KEY TO CLOSE';
    const list = this.list; list.innerHTML = '';
    const sec = (t) => { const e = make('div', 'aw-sec'); e.append(make('i'), make('span', '', t)); return e; };
    list.append(sec('FROM PLAY'));
    for (const [id, A] of Object.entries(APTITUDES)) list.append(this.row(A, R[id], S[id]?.list, APT.shown, 'READING'));
    list.append(sec('STANDARD TRIALS'));
    const ran = Object.entries(TRIALS).filter(([id]) => R[`trial.${id}`]?.n), not = Object.entries(TRIALS).filter(([id]) => !R[`trial.${id}`]?.n);
    for (const [id, T] of ran) list.append(this.row(T, R[`trial.${id}`], S[`trial.${id}`]?.list, 1, 'RUN'));
    if (not.length) list.append(make('div', 'aw-none', `${ran.length ? 'Not yet run' : 'None run yet'}, at the Touchstone: ${not.map(([, T]) => T.label).join(', ')}.`));
    this.fit();
    for (const s of this.scr) this.scramble(s);
    requestAnimationFrame(() => this.frame?.layout());
  }

  /** A scrambled line in the running hand, fitted to its canvas by height; words dropped from its end rather than shrunk. */
  scramble(s) {
    const c = s.c, k = (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) * (this.d || dot());
    const W = Math.max(1, Math.round(72 * k)), H = Math.max(1, Math.round(13 * k));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    let words = s.toks.map((t) => ({ cells: cells(t) })).filter((w) => w.cells.length);
    const m1 = runningHand(null, words, { scale: 1 }), sc = (H * 0.78) / Math.max(1, m1.height);
    let m = runningHand(null, words, { scale: sc });
    while (m.width > W * 0.97 && words.length > 1) { words = words.slice(0, -1); m = runningHand(null, words, { scale: sc }); }
    runningHand(ctx, words, { x: (W - m.width) / 2 - m.x0, y: H / 2 - (m.y0 + m.y1) / 2, scale: sc, lw: Math.max(1, sc * 0.85) });
  }

  /** Stand for `seconds` (real), then go; any key or tap after the entrance closes it sooner. */
  show(seconds = L.ask, readings = null) {
    this.draw(readings); if (!this.root) return;
    const was = this.on; this.on = true;
    requestAnimationFrame(() => this.root?.classList.add('on'));
    clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), seconds * 1000);
    if (!was) {
      this.armed = false; clearTimeout(this.armT); this.armT = setTimeout(() => { this.armed = true; }, L.arm * 1000);
      addEventListener('keydown', this.onKey, true); addEventListener('pointerdown', this.onTap, true); addEventListener('touchstart', this.onTap, { capture: true, passive: true });
      clearInterval(this.churnT);
      this.churnT = setInterval(() => { for (const s of this.scr) { const i = HEAD.length + Math.floor(Math.random() * (s.toks.length - HEAD.length)); s.toks[i] = pick(); this.scramble(s); } }, L.churn * 1000);
    }
  }

  hide() {
    clearTimeout(this.timer); clearTimeout(this.armT); clearInterval(this.churnT);
    if (!this.on) return;
    this.on = false; this.armed = false; this.root?.classList.remove('on');
    removeEventListener('keydown', this.onKey, true); removeEventListener('pointerdown', this.onTap, true); removeEventListener('touchstart', this.onTap, { capture: true });
  }
}

