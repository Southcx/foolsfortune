// ---------------------------------------------------------------------------------------
// THE BOX'S UNDERSIDE, IN THE WINDOW (docs/plans/SPREADS.md 5.1): the Pneuka Box flipped (F, or FLIP), drawn as the window's own page:
// the spreads opened (a tab each), the cloth (the 8 x 7 grid seen from below, so the face's mirror, its cells lit by the laid cards'
// footprints), each position of the spread at its anchor on the cloth (laid, a card; empty, a frame and its name), the hand (the bound
// Majors not laid), and the four suits' tallies. Pick a card in the hand, then a position, to lay it; a laid card clicked goes back to
// the hand, right-clicked turns over (reversed). The reading view (Calissa's vfx/readingview.js, in Petra's scene) is the same reading
// drawn round the Courier; while it is there this page hands it the state and its anchors carry the positions' names. Plain DOM in
// classes Calissa dresses (`us-*`), the window's own.
//
// Prior art: the Celtic Cross as the Golden Dawn lays it (the cross and the staff); Hades' Mirror of Night (one page, chosen between
// runs); Balatro's hand (the cards held low, the one picked lifted).
//
// While the reading view shows (`game.readingScene.active`: Petra's scene of it, the Courier in the title's dark), the page falls away
// to a bar at the bottom, the spreads' tabs, the hand and the tallies, and the cards are laid on the view itself: a card dragged from the
// hand (or picked, then a click) onto a place, a laid card clicked to take it back or right-clicked to reverse
// it (`readingScene.pickAt`). The cloth on the page is the fallback when the view is not there.
//
//   const U = new Underside(game, reading, onChange)   U.mount(host)   U.slim (the view shows)   U.atView(x, y, button) -> bool   U.held   UNDERSIDE_CSS
// ---------------------------------------------------------------------------------------
import { SPREADS, SUITS, COLS, ROWS, MIRROR, MAJOR_SUIT, FOOTPRINTS, TALLY, FOOL_CELL, effectOf, cellIndex } from '../progress/spreads.js';
import { ARCANA } from '../tools/veritome/arcana.js';
import { OPEN_AT } from './reading.js';
import { UNDERSIDE_LOOK } from '../ui/undersidelook.js';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const BY_ID = Object.fromEntries(ARCANA.map((A, n) => [A.id, { ...A, n }]));
/** The suits' colours: Calissa's palette (ui/undersidelook.js, the reading view's SUIT_LOOK as CSS), one for the window and the view;
 *  the wild card's purple stays until the film has a CSS of its own. */
const SUIT_CSS = { ...UNDERSIDE_LOOK.suits, wild: '#b58cff' };
const NAME = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles', wild: 'wild' };
const CELL = 46; // (px a cell of the cloth)
const REACH = 40; // (px from a place's middle a held card is laid there: about a card's half width at the reading's distance)
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export const UNDERSIDE_CSS = `
#pneuka .us{display:flex;flex-direction:column;gap:10px;min-width:880px}
#pneuka.view{background:transparent;align-items:flex-end}
#pneuka.view>.px{position:fixed!important;left:50%!important;bottom:10px!important;top:auto!important;width:min(1180px,calc(100vw - 24px))!important;max-height:36vh!important;overflow:hidden!important;padding:8px 14px!important;transform-origin:bottom center}
#pneuka.view>.px header{margin-bottom:4px} #pneuka.view>.px header .sub,#pneuka.view>.px .hover{display:none}
#pneuka.view .us{min-width:0;flex-direction:row;align-items:flex-start;gap:14px}
#pneuka.view .us-tabs{flex-direction:column;flex:none}
#pneuka.view .us-row{flex:1;min-width:0}
#pneuka.view .us-side{flex-direction:row;align-items:flex-start;gap:14px;min-width:0}
#pneuka.view .us-side>.us-note{max-width:150px}
#pneuka.view .us-hand{flex-wrap:nowrap;overflow-x:auto;flex:1;min-width:0} #pneuka.view .us-card+.us-card{margin-left:-12px} /* (the hand shrinks and overlaps; the tallies keep their room) */
#pneuka.view .us-card{width:52px;height:76px;flex:none}
#pneuka.view .us-tally{min-width:220px} #pneuka.view .us-side>:last-child{flex:none}
#pneuka .us-tabs{display:flex;gap:6px}
#pneuka .us-tab{padding:4px 10px;border:1px solid rgba(255,178,122,.3);border-radius:3px;font-size:11px;letter-spacing:.12em;cursor:var(--jcur-pointer,pointer)}
#pneuka .us-tab.on{border-color:#ffd98a;color:#ffd98a}
#pneuka .us-tab.shut{opacity:.4;cursor:default}
#pneuka .us-row{display:flex;gap:16px;align-items:flex-start}
#pneuka .us-cloth{position:relative;width:${COLS * CELL}px;height:${ROWS * CELL}px;background:#120806;border:1px solid rgba(255,178,122,.3);border-radius:4px;flex:none}
#pneuka .us-cell{position:absolute;width:${CELL - 2}px;height:${CELL - 2}px;border-radius:3px;box-sizing:border-box;border:1px solid rgba(255,178,122,.10)}
#pneuka .us-cell.dark{background:#060302!important;border-color:#5a2a1a}
#pneuka .us-cell.dark::after{content:'╳';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5a2a1a;font-size:16px}
#pneuka .us-cell.fool{box-shadow:inset 0 0 0 2px #e7c46a}
#pneuka .us-pos{position:absolute;width:40px;height:58px;margin:-29px 0 0 -20px;box-sizing:border-box;border-radius:4px;font-size:9px;line-height:1.05;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:var(--jcur-pointer,pointer)}
#pneuka .us-pos.empty{border:1px dashed rgba(255,217,138,.6);color:#ffd98a;background:rgba(20,9,6,.55)}
#pneuka .us-pos.laid{background:#f3e4c6;color:#2a140d;border:2px solid #e7c46a;box-shadow:0 4px 10px #000a}
#pneuka .us-pos.rev{border-color:#c0392b}
#pneuka .us-pos.pair{cursor:default}
#pneuka .us-pos b{font-size:13px}
#pneuka .us-pos i{display:block;width:8px;height:8px;border-radius:4px;border:1px solid #2a140d}
#pneuka .us-lbl{position:absolute;width:90px;text-align:center;color:#ffd98a;font-size:8px;letter-spacing:.06em;text-shadow:0 1px 2px #000;pointer-events:none}
#pneuka .us-side{display:flex;flex-direction:column;gap:10px;flex:1}
#pneuka .us-hand{display:flex;flex-wrap:wrap;gap:6px}
#pneuka .us-card{width:62px;height:88px;box-sizing:border-box;border-radius:5px;background:#f3e4c6;color:#2a140d;border:2px solid #8a5a3a;font-size:9px;line-height:1.1;text-align:center;padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:var(--jcur-pointer,pointer)}
#pneuka .us-card b{font-size:15px}
#pneuka .us-card.held{transform:translateY(-8px);border-color:#ffd98a;box-shadow:0 6px 16px #000c}
#pneuka .us-tally{display:grid;grid-template-columns:72px 1fr 44px;gap:3px 8px;font-size:11px;align-items:center}
#pneuka .us-tally .bar{height:6px;border-radius:3px;background:#2a140d}
#pneuka .us-tally .bar i{display:block;height:100%;border-radius:3px}
#pneuka .us-note{font-size:11px;opacity:.75}
`;

export class Underside {
  constructor(game, reading, onChange) { this.game = game; this.reading = reading; this.onChange = onChange; this.held = null; }

  /** Is the reading view showing (Petra's scene, game.readingScene, holding Calissa's view), so the page gives way to it? */
  get slim() { return !!this.game.readingScene?.active && this.reading.flipped; }
  /** A click or a drop on the reading view at a client point (readingScene.pickAt: a place or a card of the hand): a held card laid in an
   *  empty place, a laid card taken back (or reversed, button 2), a card of the hand picked up. */
  /** An empty place's frame is four thin strips, so a click inside it touches nothing: with a card held, the nearest place within
   *  REACH px of the point (its anchor, the place's middle on screen) takes it. */
  nearPlace(x, y) {
    let best = null, d2 = REACH * REACH;
    for (const a of this.game.readingScene?.anchors?.() ?? []) { const d = (a.x - x) ** 2 + (a.y - y) ** 2; if (d < d2) { d2 = d; best = { kind: 'place', id: a.id }; } }
    return best;
  }
  atView(x, y, button = 0, card = this.held) {
    const R = this.reading, P = this.game.readingScene?.pickAt?.(x, y) ?? (card ? this.nearPlace(x, y) : null);
    if (!P) return false;
    if (P.kind === 'hand') { this.held = this.held === P.id ? null : P.id; this.changed(); return true; }
    if (P.kind !== 'place') return false;
    if (R.laid[P.id] && !card) { if (button === 2 ? R.reverse(P.id) : R.take(P.id)) this.changed(); return true; }
    if (card && R.lay(P.id, card)) { this.held = null; this.changed(); return true; }
    return false;
  }
  mount(host) {
    const R = this.reading, S = SPREADS[R.spread], cells = R.cells(), wrap = el('div', 'us');
    // the spreads, a tab each: opened, or how many bound open it
    const tabs = el('div', 'us-tabs'), open = R.opened(), nBound = R.bound().size - 1;
    for (const id of Object.keys(SPREADS)) {
      const on = open.includes(id), t = el('div', `us-tab${id === R.spread ? ' on' : ''}${on ? '' : ' shut'}`, on ? SPREADS[id].label : `${SPREADS[id].label} · ${OPEN_AT[id] - nBound} more bound`);
      if (on) t.onclick = () => { if (R.setSpread(id)) this.changed(); };
      tabs.appendChild(t);
    }
    wrap.appendChild(tabs);
    const row = el('div', 'us-row');
    if (!this.slim) row.appendChild(this.cloth(S, cells)); // (the view shows the cloth itself, under the Courier's feet)
    const side = el('div', 'us-side');
    const cls = R.cls?.(), lead = this.slim ? `${cls?.label ? `You read as <b>${cls.label}</b>. ` : ''}` : '', tail = this.slim ? ' H hides this window; the arrows turn the camera.' : '';
    side.appendChild(el('div', 'us-note', lead + (this.held ? `Holding <b>${this.cardName(this.held)}</b>: pick an empty place ${this.slim ? 'round you' : 'on the cloth'}.` : `Pick a card from the hand, then an empty place. A laid card: click to take it back, right-click to reverse it.`) + tail));
    side.appendChild(this.handRow()); // (the one hand: the view's fan is off, Calissa's READING_VIEW.hand.show)
    side.appendChild(this.tallies());
    row.appendChild(side);
    wrap.appendChild(row);
    host.appendChild(wrap);
    this.toView(cells);
  }

  /** The cloth: the underside, so each cell drawn where the face's mirror is; the positions at their anchors. */
  cloth(S, cells) {
    const cloth = el('div', 'us-cloth'), R = this.reading;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = cells[cellIndex(MIRROR ? COLS - 1 - c : c, r)], d = el('div', `us-cell${cell.dark ? ' dark' : ''}${S.id === 'celtic' && c === FOOL_CELL.under[0] && r === FOOL_CELL.under[1] ? ' fool' : ''}`);
      d.style.left = `${c * CELL + 1}px`; d.style.top = `${r * CELL + 1}px`;
      if (!cell.dark) d.style.background = this.tint(cell);
      cloth.appendChild(d);
    }
    const pair = R.pair();
    for (const p of S.positions) {
      if (p.fixed) continue; // (the Fool: its cell is marked, under the Present)
      const L = p.pair ? (pair && R.bound().has(pair) ? { card: pair } : null) : R.laid[p.id];
      const d = el('div', `us-pos ${L ? 'laid' : 'empty'}${L?.reversed ? ' rev' : ''}${p.pair ? ' pair' : ''}`);
      d.style.left = `${p.at[0] * CELL + CELL / 2 + (p.turn ? 10 : 0)}px`; d.style.top = `${p.at[1] * CELL + CELL / 2 + (p.turn ? 10 : 0)}px`;
      if (p.turn || L?.reversed) d.style.transform = `rotate(${(p.turn || 0) + (L?.reversed ? 180 : 0)}deg)`;
      const suit = L ? (p.pair ? MAJOR_SUIT[L.card] : R.suitAt(p.id)) : null;
      d.innerHTML = L ? `<b>${ROMAN[BY_ID[L.card].n]}</b>${BY_ID[L.card].name.replace(/^The /, '')}<i style="background:${SUIT_CSS[suit]}"></i>` : '';
      const lbl = el('span', 'us-lbl', p.pair ? `${p.label} · your pair` : p.label); // (beside the card, never turned with it)
      lbl.style.left = `${p.at[0] * CELL + CELL / 2 - 45 + (p.turn ? 26 : 0)}px`; lbl.style.top = `${p.at[1] * CELL + CELL / 2 + (p.turn ? -8 : 31)}px`;
      cloth.appendChild(lbl);
      if (!p.pair) {
        d.onclick = () => { if (L ? R.take(p.id) : this.held && R.lay(p.id, this.held)) { if (!L) this.held = null; this.changed(); } };
        d.oncontextmenu = (e) => { e.preventDefault(); if (L && R.reverse(p.id)) this.changed(); };
      }
      cloth.appendChild(d);
    }
    return cloth;
  }
  tint(cell) {
    const on = [...SUITS.filter((s) => cell[s] > 0), ...(cell.wild > 0 ? ['wild'] : [])];
    if (!on.length) return '#1c0e09';
    const a = (s) => `${SUIT_CSS[s]}${Math.round(Math.min(1, 0.22 + 0.3 * (s === 'wild' ? cell.wild : cell[s])) * 255).toString(16).padStart(2, '0')}`;
    if (on.length === 1) return a(on[0]);
    const step = 100 / on.length;
    return `linear-gradient(135deg, ${on.map((s, i) => `${a(s)} ${i * step}%, ${a(s)} ${(i + 1) * step}%`).join(', ')})`;
  }
  cardName(id) { const A = BY_ID[id]; return `${ROMAN[A.n]} · ${A.name}`; }
  handRow() {
    const hand = el('div', 'us-hand');
    for (const id of this.reading.hand()) {
      const A = BY_ID[id], suit = MAJOR_SUIT[id];
      const d = el('div', `us-card${this.held === id ? ' held' : ''}`, `<b>${ROMAN[A.n]}</b>${A.name.replace(/^The /, '')}<span style="color:${SUIT_CSS[suit]};text-shadow:0 0 1px #000">${NAME[suit]}</span><span>${FOOTPRINTS[id].length} cells</span>`);
      d.onclick = () => { this.held = this.held === id ? null : id; this.onChange?.(); };
      d.draggable = true; d.ondragstart = (e) => { this.held = id; e.dataTransfer.setData('text/plain', `card:${id}`); }; // (onto the reading view: the window's drop, pneuka/ui.js)
      hand.appendChild(d);
    }
    if (!hand.children.length) hand.appendChild(el('div', 'us-note', 'No Major in hand: bind more, by a photograph or its other way.'));
    return hand;
  }
  tallies() {
    const box = el('div', 'us-tally'), sums = this.reading.sums();
    for (const s of SUITS) {
      const v = sums[s], pct = Math.round((Math.abs(effectOf(s, v)) * 1000)) / 10;
      box.appendChild(el('span', '', `<span style="color:${SUIT_CSS[s]}">${NAME[s]}</span>`));
      box.appendChild(el('span', 'bar', `<i style="width:${(v / TALLY.cap) * 100}%;background:${SUIT_CSS[s]}"></i>`));
      box.appendChild(el('span', '', `${TALLY[s].per < 0 ? '−' : '+'}${pct}%`));
    }
    return box;
  }
  changed() { this.onChange?.(); }
  /** The reading view (when Petra's scene has put it in): the same reading, drawn round the Courier. */
  toView(cells) {
    const V = this.game.readingView, R = this.reading;
    if (!V?.draw) return;
    const laid = {};
    for (const [pos, L] of Object.entries(R.laid)) laid[pos] = { ...L, suit: R.suitAt(pos) };
    const P = SPREADS[R.spread].positions.find((p) => p.pair), pair = R.pair();
    if (P && pair && R.bound().has(pair)) laid[P.id] = { card: pair, reversed: false, suit: MAJOR_SUIT[pair] };
    V.draw({ spread: R.spread, laid, cells, hand: R.hand(), held: this.held });
  }
}
