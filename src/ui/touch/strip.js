// ---------------------------------------------------------------------------------------
// THE CLUSTER'S STRIP AND THE BELT'S PAIR: the small tiles over the cluster (docs/plans/MOBILE.md 4.7 "the digits become a strip of the
// context's choices", 8.5, 8.8, 8.9), what ui/touch/actioncontext.js reads, laid out here:
//   THE BELT'S PAIR  DRAW (STOW while the main is out) and LEND (the sub's verb) at the cluster's top edge, 44 px, right-aligned to it,
//                    as wide as their words (`fit`: the least type is never shrunk).
//   THE STRIP        the tool's own row (the chambers, FAN; the forms, LURE, CRANK; PAINT or MOP; FLASH; the Crucibelle's five note pads)
//                    or the duel's moves (ROTATE first), BLINK at its end: one row over the pair on a clay shelf (the top bar's), right-
//                    aligned to the cluster, down to 44 px to keep one row, its end then beside the pair (left of it), rows upward only past that
//                    (the look area too narrow); 48 px a tile (the note pads 56,
//                    an instrument on glass), never under 44. The lit one (the chamber chosen, the form in hand) in the schiller.
// Every press reports through touchTiles with the binding's touch id (core/bindings.js); the driver resolves it in the live ctx. Hidden
// off touch, under a window, and with nothing to show.
//
// Prior art: Genshin Impact's and Call of Duty Mobile's small tiles over the fire button (a weapon's modes, the reload), Into the
// Breach's strip of moves, the god hand's strip (godstrip.js: a shelf and its tiles), the art bar's wrapping (artbar.js).
//
// Where: inside the HUD layout's strip room (hudlayout.js stripArea), so no tile stands over the Sight, the top bar or the log; what one
// row cannot hold goes beside the pair (the bottom row's band reaching further left) before rows climb to the room's top.
//
//   new TouchStrip(game)   .update(now, on, clusterBounds)   .relayout()   .ids (the strip's)   .pair (the belt pair's ids)   STRIP
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { shelf } from './topbar.js';
import { stripOf, beltPairOf } from './actioncontext.js';

/** The numbers (CSS px): the strip's tile, a note pad, the pair's; the gaps; the shelf's padding; the room kept off the look area's edge. */
export const STRIP = { size: 48, pad: 56, pair: TILE.small, gap: 6, rowGap: 8, shelf: 6, edge: 8, margin: 6 };

export class TouchStrip {
  constructor(game) {
    this.game = game; this.tiles = new Map(); this.ids = []; this.pair = []; this.entries = []; this.shown = false; this.key = '';
    this.shelf = shelf();
  }

  tile(e) {
    let t = this.tiles.get(e.id);
    if (!t) { t = new TouchTile(e.id, { size: STRIP.size, glyph: e.glyph ?? null, word: e.word ?? null, corner: e.corner ?? null, tint: e.tint ?? null, fit: true, onPress: (tid, down) => touchTiles.report(this.game, tid, down) }); this.tiles.set(e.id, t); }
    t.face({ glyph: e.glyph ?? null, word: e.word ?? null, corner: e.corner ?? null, tint: e.tint ?? null });
    return t;
  }

  /** Where it may stand over the cluster's bounds: the HUD layout's strip room (hudlayout.js stripArea: clear of the Sight, the top
   *  bar and the log), or the cluster's own column without it. */
  area(cb) {
    const Lm = this.game.hudLayout;
    if (Lm?.touch && Lm.stripArea) return Lm.stripArea(cb);
    const P = placeOf(this.game), A = P.areas.cluster, L = P.areas.look, left = (L.w > 0 ? L.x : P.view.w / 2) + STRIP.edge;
    return { left, right: A.x + A.w - STRIP.margin, top: 0, base: cb ? cb.y : A.y + A.h - STRIP.margin, sideLeft: left };
  }

  /** Lay the pair at the cluster's top edge and the strip over it (rows upward), right-aligned to the cluster, inside the strip's room. */
  layout(cb) {
    const Z = this.area(cb), G = STRIP.gap, F = TILE.foot, right = Z.right, left = Z.left, W1 = (id) => this.tiles.get(id).widthFor(TILE.min);
    let rowsBase = Z.base, bandRight = right + G, bandY = Z.base - STRIP.rowGap - TILE.min - F;
    // the belt's pair, right to left
    if (this.pair.length) {
      const s = STRIP.pair, y = Z.base - STRIP.rowGap - s - F; let x = right;
      for (const id of [...this.pair].reverse()) { const t = this.tiles.get(id), w = t.widthFor(s); x -= w; t.place(x, y, s, w); x -= G + 4; }
      rowsBase = bandY = y; bandRight = x + G;
    }
    // the strip: rows filled in order, each right-aligned, stacked upward
    if (!this.ids.length) { this.shelf.classList.add('off'); return; }
    const pads = this.entries.some((e) => e.pad), room = right - left - 2 * STRIP.shelf;
    const span = (sz, list = this.ids) => list.reduce((a, id) => a + this.tiles.get(id).widthFor(sz), 0) + (list.length - 1) * G;
    let s = pads ? STRIP.pad : STRIP.size; while (s > TILE.min && span(s) > room) s -= 2; // (one row while it fits at 44 px or more: rows upward only past that)
    const rowH = s + F, rowsOf = (list) => { let n = 1, used = 0; for (const id of list) { const w = this.tiles.get(id).widthFor(s); if (used && used + G + w > room) { n++; used = 0; } used += (used ? G : 0) + w; } return n; };
    const heightOf = (n) => n * rowH + (n - 1) * G + 2 * STRIP.shelf;
    // what the room cannot hold goes into the bottom row's band (beside the belt's pair, or on the base with no pair), at 44 px, from the
    // strip's end (BLINK, FAN), while the rows would stand higher than the room's top or one row cannot hold them
    let ids = this.ids, side = [], sideW = 0;
    const base = () => (this.pair.length || side.length ? bandY : Z.base), fits = (list) => base() - STRIP.rowGap - heightOf(rowsOf(list)) >= Z.top;
    while (ids.length > 1 && (span(s, ids) > room || !fits(ids))) {
      const id = ids[ids.length - 1], w = W1(id);
      if (bandRight - G - sideW - w < Z.sideLeft) break;
      side.unshift([id, w]); sideW += w + G; ids = ids.slice(0, -1);
    }
    if (side.length) { let x = bandRight - sideW; for (const [id, w] of side) { this.tiles.get(id).place(x, bandY, TILE.min, w); x += w + G; } rowsBase = bandY; }
    const rows = [[]]; let used = 0;
    for (const id of ids) { const w = this.tiles.get(id).widthFor(s); if (rows[rows.length - 1].length && used + G + w > room) { rows.push([]); used = 0; } used += (rows[rows.length - 1].length ? G : 0) + w; rows[rows.length - 1].push([id, w]); }
    const H = heightOf(rows.length), y0 = Math.max(Z.top, rowsBase - STRIP.rowGap - H); // (clamped under the room's top: never over the Sight or the top bar)
    let Wd = 0;
    rows.forEach((row, r) => {
      const width = row.reduce((a, [, w]) => a + w, 0) + (row.length - 1) * G; Wd = Math.max(Wd, width);
      let x = right - STRIP.shelf - width; const y = y0 + STRIP.shelf + r * (rowH + G);
      for (const [id, w] of row) { this.tiles.get(id).place(x, y, s, w); x += w + G; }
    });
    Wd += 2 * STRIP.shelf;
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(right - Wd)}px, ${Math.round(y0)}px)`, width: `${Math.round(Wd)}px`, height: `${Math.round(H)}px` });
    this.shelf.style.setProperty('--h', `${Math.min(H, rowH + 2 * STRIP.shelf)}px`);
    this.shelf.classList.toggle('off', !this.shown);
  }

  /** Each frame: read the moment, lay out what changed, put each tile's state on it. `cb` the cluster's bounds (or null). */
  update(now, on, cb) {
    const g = this.game, show = !!on && !windowOpen(g) && !g.touch?.screenTaken?.(); // (the pads or the paper hold the screen: the strip stands down, Petra's ruling)
    const entries = show ? stripOf(g) : [], pair = show ? beltPairOf(g) : [];
    const all = [...pair, ...entries];
    for (const e of all) this.tile(e);
    const ids = entries.map((e) => e.id), pids = pair.map((e) => e.id);
    const key = `${ids.join()}|${pids.join()}|${cb ? [cb.x, cb.y].map(Math.round).join() : ''}|${all.map((e) => this.tiles.get(e.id).widthFor(STRIP.size)).join()}`;
    this.entries = entries;
    const wasShown = this.shown; this.shown = show && all.length > 0;
    if (key !== this.key || wasShown !== this.shown) {
      this.key = key; this.ids = ids; this.pair = pids;
      for (const [id, t] of this.tiles) if (!ids.includes(id) && !pids.includes(id)) t.set({ hidden: true });
      if (this.shown) this.layout(cb); else this.shelf.classList.add('off');
    }
    if (!this.shown) { for (const t of this.tiles.values()) t.set({ hidden: true }); return; }
    for (const e of all) { const t = this.tiles.get(e.id); t.set({ hidden: false, lit: t.state.pressed || !!e.lit, dim: !!e.dim }); t.update(now); }
  }

  /** The layout changed: stand again at the next frame. */
  relayout() { this.key = ''; }
}
