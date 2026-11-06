// ---------------------------------------------------------------------------------------
// THE BOARD'S PLATES (plain names; South, 2026-11-06: "I don't want you guys to anchor to the current artstyle"; docs/plans/
// ENTROPY-TACTICS.md 7): the few words the board view (boardview.js) lays over Entropy Tactics' board, in its own minimal DOM, never the
// house's panels, buttons or fonts: black glass, a thin ivory rule, a clean light sans letter-spaced. The turn's one line at the top (whose
// turn as a block in its side's colour, the turn's four steps with the one now marked, the coach's line); the
// bar of plates along the bottom edge for the choices that are no piece (feed, keep, end, push, count, a re-roll, an active), the house's
// suggestion marked; a tip by the cursor (a choice's label, what it does, what it would bring); a few plates beside the cursor when one
// piece names several choices; the result's plate with AGAIN and STAND UP. Its CSS is injected on mount and removed on unmount, and
// while it is up the seat's own page (world/bazaar/views.js) is hidden under the class `etboard` on #indexmenu.
//
// Prior art: MTG Arena's and Hearthstone's few big words over the board, Into the Breach's tooltips that say what will happen, Teenage
// Engineering's and Swiss typography's hairline rules and spaced capitals.
//
//   new BoardPlates({ play(cm), again(), close() })   .mount()   .unmount()   .hue(css)   .turn(text, mine, { who, step })   .bar(moves, key)
//   .tip(info | null, x, y)   .choose(moves | null, x, y)   .roll(n | null, x, y, css)   .result(r | null)   .busy (a choice or the result is up)
// ---------------------------------------------------------------------------------------

import { strokeText } from './pieces.js';

const CSS = `
#indexmenu.etboard { pointer-events: none; } #indexmenu.etboard .im { visibility: hidden; pointer-events: none; }
#etb { position: fixed; inset: 0; pointer-events: none; z-index: 9000; color: #ece6d6; --hue: #8fd8ff;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; }
#etb .glass { background: rgba(4, 3, 8, 0.8); border: 1px solid rgba(236, 230, 214, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
#etb .turn { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 10px); left: 50%; transform: translateX(-50%); padding: 5px 14px 5px;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; max-width: min(1000px, 76vw); }
#etb .turn { display: flex; align-items: stretch; gap: 10px; padding: 0 14px 0 0; }
#etb .turn b, #etb .turn .steps { white-space: nowrap; align-self: center; }
#etb .turn b { font-weight: 600; color: #050307; background: #9fe9ff; padding: 6px 12px 5px; letter-spacing: 0.18em; font-size: 12px; }
#etb .turn.theirs b { background: #ffa48c; animation: etb-wait 1.4s ease-in-out infinite; }
@keyframes etb-wait { 50% { opacity: 0.55; } }
#etb .turn .steps { font-style: normal; display: flex; gap: 2px; font-size: 9px; letter-spacing: 0.2em; }
#etb .turn .steps i { font-style: normal; padding: 2px 5px; opacity: 0.35; border-bottom: 1px solid transparent; }
#etb .turn .steps i.on { opacity: 1; color: var(--hue); border-bottom-color: var(--hue); }
#etb .turn.theirs .steps i.on { color: #ffa48c; border-bottom-color: #ffa48c; }
#etb .turn span { padding: 5px 0 4px; line-height: 1.35; white-space: normal; } /* (the coach's line wraps: the rule a new player needs must show whole) */
#etb .bar { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 8px); display: flex; gap: 6px;
  justify-content: center; flex-wrap: nowrap; max-width: calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px); pointer-events: auto; }
#etb .pl { padding: 5px 12px 4px; min-height: 26px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; text-align: left;
  font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; white-space: nowrap; position: relative; transition: border-color 0.12s, transform 0.12s; }
#etb .pl:hover { border-color: var(--hue); transform: translateY(-2px); }
#etb .pl small { font-size: 9px; letter-spacing: 0.06em; text-transform: none; opacity: 0.62; margin-top: 1px; }
#etb .pl.best { border-color: var(--hue); }
#etb .pl.best::after { content: ''; position: absolute; top: -4px; right: -4px; width: 7px; height: 7px; background: var(--hue); transform: rotate(45deg); }
#etb .pl.good { box-shadow: inset 2px 0 0 #9fe9ff; } #etb .pl.risk { box-shadow: inset 2px 0 0 #e8d27a; } #etb .pl.bad { box-shadow: inset 2px 0 0 #ffa48c; }
#etb .tip { position: absolute; max-width: 260px; padding: 8px 11px 9px; font-size: 12px; line-height: 1.35; display: none; }
#etb .tip h4 { margin: 0 0 3px; font-weight: 500; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
#etb .tip p { margin: 0; opacity: 0.78; } #etb .tip p.if { opacity: 1; color: var(--hue); margin-top: 4px; }
#etb .tip hr { border: 0; border-top: 1px solid rgba(236, 230, 214, 0.3); margin: 6px 0; }
#etb .pick { position: absolute; display: none; flex-direction: column; gap: 4px; pointer-events: auto; }
#etb .end { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); padding: 22px 34px 20px; text-align: center; display: none; pointer-events: auto; min-width: 240px; }
#etb .end h2 { margin: 0; font-weight: 200; font-size: 34px; letter-spacing: 0.32em; text-transform: uppercase; }
#etb .end h2.won { color: var(--hue); }
#etb .end p { margin: 10px 0 16px; font-size: 13px; opacity: 0.8; } #etb .end .row { display: flex; gap: 8px; justify-content: center; }
#etb .end .tag { font-size: 9px; letter-spacing: 0.3em; opacity: 0.55; text-transform: uppercase; }
#etb .roll { position: absolute; width: 96px; height: 72px; margin: -84px 0 0 -48px; display: none; filter: drop-shadow(0 0 6px rgba(0,0,0,0.9)); }
#etb .rule { position: absolute; left: 0; right: 0; height: 1px; background: rgba(236, 230, 214, 0.35); }
@media (max-height: 500px) { #etb .pl { font-size: 10px; padding: 4px 9px 3px; min-height: 22px; } #etb .pl small { display: none; } #etb .turn { font-size: 10px; } #etb .turn .steps { display: none; } #etb .turn { max-width: 64vw; letter-spacing: 0.08em; } #etb .turn b { font-size: 10px; padding: 5px 8px 4px; } }
`;
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; };
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

export class BoardPlates {
  constructor(on) { this.on = on; this.root = null; this.barKey = null; this.tipKey = null; this.picking = null; this.ended = null; }
  get busy() { return !!(this.picking || this.ended); }
  mount() {
    if (this.root) return;
    this.style = document.createElement('style'); this.style.textContent = CSS; document.head.appendChild(this.style);
    const R = (this.root = el('div', null, document.body)); R.id = 'etb';
    this.turnEl = el('div', 'turn glass', R); this.barEl = el('div', 'bar', R); this.tipEl = el('div', 'tip glass', R); this.pickEl = el('div', 'pick', R); this.endEl = el('div', 'end glass', R); this.rollEl = el('canvas', 'roll', R); this.rollEl.width = 192; this.rollEl.height = 144;
    this.pickEl.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  unmount() { this.root?.remove(); this.style?.remove(); this.root = this.style = null; this.barKey = this.tipKey = null; this.picking = this.ended = null; }
  hue(css) { if (this.root && css !== this.hueCss) { this.hueCss = css; this.root.style.setProperty('--hue', css); } }
  /** The turn's one line: whose turn as a block in its side's colour (theirs breathing while you wait), the turn's steps with the one
   *  now marked, and the coach's line. */
  turn(text, mine, { who = mine ? 'Your turn' : 'Their turn', step = '' } = {}) {
    if (!this.root) return; const k = `${mine}|${text}|${who}|${step}`; if (k === this.turnKey) return; this.turnKey = k;
    this.turnEl.style.display = text ? '' : 'none'; this.turnEl.classList.toggle('theirs', !mine);
    const steps = ['Draw', 'Play', 'Carve', 'Bomb'].map((x) => `<i class="${x === step ? 'on' : ''}">${x}</i>`).join('');
    this.turnEl.innerHTML = `<b>${esc(who)}</b><em class="steps">${steps}</em><span>${esc(text)}</span>`;
  }
  /** A plate a choice: its label, its preview (or what it does) small under it. */
  plate(cm, parent, fn = () => this.on.play(cm)) {
    const b = el('div', `pl glass${cm.best ? ' best' : ''}${cm.tone ? ` ${cm.tone}` : ''}`, parent);
    b.innerHTML = `${esc(cm.label)}${cm.preview || cm.what ? `<small>${esc(cm.preview || cm.what)}</small>` : ''}`;
    b.addEventListener('click', (e) => { e.stopPropagation(); this.choose(null); fn(); });
    return b;
  }
  bar(moves, key) {
    if (!this.root || key === this.barKey) return; this.barKey = key;
    this.barEl.textContent = ''; for (const cm of moves || []) this.plate(cm, this.barEl);
  }
  /** The tip by the cursor: { title, lines: [], moves: [{ label, what, preview }] }, kept on the screen. */
  tip(info, x, y) {
    if (!this.root) return;
    if (!info || this.busy) { this.tipEl.style.display = 'none'; this.tipKey = null; return; }
    const k = JSON.stringify(info);
    if (k !== this.tipKey) {
      this.tipKey = k;
      const ms = (info.moves || []).map((m) => `<h4>${esc(m.label)}</h4>${m.what ? `<p>${esc(m.what)}</p>` : ''}${m.preview ? `<p class="if">${esc(m.preview)}</p>` : ''}`).join('<hr>');
      this.tipEl.innerHTML = `${info.title ? `<h4>${esc(info.title)}</h4>` : ''}${(info.lines || []).map((l) => `<p>${esc(l)}</p>`).join('')}${info.title && ms ? '<hr>' : ''}${ms}`;
      this.tipEl.style.display = 'block';
    }
    const w = this.tipEl.offsetWidth, h = this.tipEl.offsetHeight, X = Math.min(innerWidth - w - 10, x + 18), Y = Math.max(10, Math.min(innerHeight - h - 60, y - h - 14));
    this.tipEl.style.left = `${Math.max(10, X)}px`; this.tipEl.style.top = `${Y}px`;
  }
  /** Several choices one piece names: plates by the cursor (a click elsewhere puts them away). */
  choose(moves, x = 0, y = 0) {
    if (!this.root) return; this.picking = moves && moves.length ? moves : null;
    this.pickEl.textContent = ''; this.pickEl.style.display = this.picking ? 'flex' : 'none'; if (!this.picking) return;
    for (const cm of moves) this.plate(cm, this.pickEl);
    const w = this.pickEl.offsetWidth, h = this.pickEl.offsetHeight;
    this.pickEl.style.left = `${Math.max(10, Math.min(innerWidth - w - 10, x - w / 2))}px`; this.pickEl.style.top = `${Math.max(10, Math.min(innerHeight - h - 60, y - h - 16))}px`;
  }
  /** The settled die's roll, face on over it in the board's stroke numerals (crisp: the tilt-shift never takes the DOM). */
  roll(n, x, y, css) {
    if (!this.root) return; const E = this.rollEl;
    if (n == null) { E.style.display = 'none'; this.rollKey = null; return; }
    const k = `${n}|${css}`; if (k !== this.rollKey) { this.rollKey = k; const c = E.getContext('2d'); c.clearRect(0, 0, 192, 144); c.strokeStyle = c.fillStyle = 'rgba(3,2,6,0.9)'; strokeText(c, n, 96, 72, 96, { lw: 22 }); c.strokeStyle = c.fillStyle = css; strokeText(c, n, 96, 72, 96, { lw: 9 }); }
    E.style.display = 'block'; E.style.left = `${x}px`; E.style.top = `${y}px`;
  }
  /** The game's end: { won, title, how, practice } or null. */
  result(r) {
    if (!this.root) return; const k = r ? JSON.stringify(r) : null; if (k === this.endKey) return; this.endKey = k; this.ended = r;
    this.endEl.style.display = r ? 'block' : 'none'; this.endEl.textContent = ''; if (!r) return;
    el('div', 'tag', this.endEl).textContent = r.practice ? 'Practice · nothing counted' : 'Entropy Tactics';
    const h = el('h2', r.won ? 'won' : '', this.endEl); h.textContent = r.title;
    el('p', null, this.endEl).textContent = r.how;
    const row = el('div', 'row', this.endEl);
    this.plate({ label: 'Again', what: r.practice ? 'Another practice game' : 'Another game for chips' }, row, () => this.on.again());
    this.plate({ label: 'Stand up', what: 'Back to the oasis' }, row, () => this.on.close());
  }
}
