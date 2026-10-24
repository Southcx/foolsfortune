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

  /** Lay the pair at the cluster's top edge and the strip over it (rows upward), right-aligned to the cluster. */
  layout(cb) {
    const P = placeOf(this.game), A = P.areas.cluster, L = P.areas.look, G = STRIP.gap, F = TILE.foot;
    const right = A.x + A.w - STRIP.margin, left = (L.w > 0 ? L.x : P.view.w / 2) + STRIP.edge;
    let top = cb ? cb.y : A.y + A.h - STRIP.margin, beltX = right, beltY = null;
    // the belt's pair, right to left
    if (this.pair.length) {
      const s = STRIP.pair, y = top - STRIP.rowGap - s - F; let x = right;
      for (const id of [...this.pair].reverse()) { const t = this.tiles.get(id), w = t.widthFor(s); x -= w; t.place(x, y, s, w); x -= G + 4; }
      top = y; beltX = x; beltY = y;
    }
    // the strip: rows filled in order, each right-aligned, stacked upward
    if (!this.ids.length) { this.shelf.classList.add('off'); return; }
    const pads = this.entries.some((e) => e.pad), room = right - left - 2 * STRIP.shelf;
    const span = (sz, list = this.ids) => list.reduce((a, id) => a + this.tiles.get(id).widthFor(sz), 0) + (list.length - 1) * G;
    let s = pads ? STRIP.pad : STRIP.size; while (s > TILE.min && span(s) > room) s -= 2; // (one row while it fits at 44 px or more: rows upward only past that)
    // what one row cannot hold goes beside the belt's pair, on its left, at 44 px (BLINK, FAN: the strip's end), before any row upward
    let ids = this.ids;
    if (span(s) > room) {
      const side = []; let sideW = 0;
      while (ids.length > 1 && span(s, ids) > room) { const id = ids[ids.length - 1], w = this.tiles.get(id).widthFor(TILE.min); if (beltY == null || beltX - sideW - w < left) break; side.unshift([id, w]); sideW += w + G; ids = ids.slice(0, -1); }
      let x = beltX - sideW + G;
      for (const [id, w] of side) { this.tiles.get(id).place(x, beltY, TILE.min, w); x += w + G; }
    }
    const rows = [[]]; let used = 0;
    for (const id of ids) { const w = this.tiles.get(id).widthFor(s); if (rows[rows.length - 1].length && used + G + w > room) { rows.push([]); used = 0; } used += (rows[rows.length - 1].length ? G : 0) + w; rows[rows.length - 1].push([id, w]); }
    const rowH = s + F, H = rows.length * rowH + (rows.length - 1) * G + 2 * STRIP.shelf, y0 = top - STRIP.rowGap - H;
    let W = 0;
    rows.forEach((row, r) => {
      const width = row.reduce((a, [, w]) => a + w, 0) + (row.length - 1) * G; W = Math.max(W, width);
      let x = right - STRIP.shelf - width; const y = y0 + STRIP.shelf + r * (rowH + G);
      for (const [id, w] of row) { this.tiles.get(id).place(x, y, s, w); x += w + G; }
    });
    W += 2 * STRIP.shelf;
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(right - W)}px, ${Math.round(y0)}px)`, width: `${Math.round(W)}px`, height: `${Math.round(H)}px` });
    this.shelf.style.setProperty('--h', `${Math.min(H, rowH + 2 * STRIP.shelf)}px`);
    this.shelf.classList.toggle('off', !this.shown);
  }

  /** Each frame: read the moment, lay out what changed, put each tile's state on it. `cb` the cluster's bounds (or null). */
  update(now, on, cb) {
    const g = this.game, show = !!on && !windowOpen(g);
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
