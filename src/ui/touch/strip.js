// ---------------------------------------------------------------------------------------
// THE CLUSTER'S STRIP AND THE BELT'S PAIR: the small tiles over the cluster (docs/plans/MOBILE.md 4.7 "the digits become a strip of the
// context's choices", 8.5, 8.8, 8.9), what ui/touch/actioncontext.js reads, laid out here:
//   THE BELT'S PAIR  DRAW (STOW while the main is out), LEND (the sub's verb), SWAP and SKIFF (the top bar's, opened from here) at the
//                    cluster's top edge, 44 px, right-aligned to it, as wide as their words (`fit`: the least type is never shrunk).
//   THE STRIP        the tool's own row (the chambers, FAN; the forms, LURE, CRANK; PAINT or MOP; FLASH; the Crucibelle's five note pads; the helm's BROADSIDE, its rim its side's reload)
//                    or the duel's moves (ROTATE first), BLINK at its end: one row over the pair on a clay shelf (the top bar's), right-
//                    aligned to the cluster, down to 44 px to keep one row, its end then beside the pair (left of it), rows upward only past that
//                    (the look area too narrow); 44 px a tile (the note pads 52,
//                    an instrument on glass), never under 44. The lit one (the chamber chosen, the form in hand) in the schiller.
//   FOLDED           (the owner, 2026-10-26: "retractable menus") a tool's row of two or more folds to one MORE tab (three dots),
//                    the core moves and BLINK kept beside it; a tap on MORE opens the row (MORE lit at its head), a tap again folds it. Kept folded
//                    or open until tapped (a row in use is not taken away mid-fight).
// Every press reports through touchTiles with the binding's touch id (core/bindings.js); the driver resolves it in the live ctx. Hidden
// off touch, under a window, and with nothing to show.
//
// Prior art: Genshin Impact's and Call of Duty Mobile's small tiles over the fire button (a weapon's modes, the reload), Into the
// Breach's strip of moves, the god hand's strip (godstrip.js: a shelf and its tiles), the art bar's wrapping (artbar.js).
//
// Where: inside the HUD layout's strip room (hudlayout.js stripArea), so no tile stands over the Sight, the top bar or the log; what one
// row cannot hold goes beside the pair (the bottom row's band reaching further left) before rows climb to the room's top.
//
// On a phone on its side (hudlayout.js `stripTop`, South 2026-10-29) the pair and the strip stand instead in one row at the top edge,
// beside the folded top bar (layoutTop), so nothing of theirs stands in the centre 60%.
//
//   new TouchStrip(game)   .update(now, on, clusterBounds)   .relayout()   .ids (the strip's)   .pair (the belt pair's ids)   STRIP
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { shelf } from './topbar.js';
import { stripOf, beltPairOf, nearOf } from './actioncontext.js';
import { CURSOR } from '../../core/touchcursor.js';

/** The numbers (CSS px): the strip's tile (44, the least: 48 until the owner asked for room, 2026-10-26), a note pad, the pair's; the gaps; the shelf's padding; the room kept off the look area's edge. */
const MORE = 'strip.more';
/** The core movement's verbs and BLINK, never folded away (a jump hidden behind a tap mid-fight is no jump). */
const STAYS = new Set(['blink', 'jump', 'crouch', 'dash', 'parry', 'use', 'broadside', 'mount.1', 'mount.2']); // (the broadside and the mounts too: a fight's verbs)
/** The tool's own row, folded to its MORE tab (or opened behind it) where it has two or more tiles; what STAYS stands after it. */
function folding(entries, folded) {
  const stay = entries.filter((e) => STAYS.has(e.id)), row = entries.filter((e) => !STAYS.has(e.id));
  if (row.length < 2) return entries;
  return [{ id: MORE, glyph: 'more', word: null, lit: !folded }, ...(folded ? [] : row), ...stay];
}

export const STRIP = { size: 44, pad: 52, near: 52, pair: TILE.small, gap: 6, rowGap: 8, shelf: 6, edge: 8, margin: 6 };
/** The far shelf's most before the fold, and what folds first (MOBILE.md 4.1). */
const FAR_MAX = 8, FOLD_ORDER = ['skiff', 'swap', 'lend', 'ps.breath', 'ps.fan'];

export class TouchStrip {
  constructor(game) {
    this.game = game; this.tiles = new Map(); this.ids = []; this.pair = []; this.nearIds = []; this.pairShown = 0; this.entries = []; this.shown = false; this.key = ''; this.folded = true;
    this.shelf = shelf();
  }

  tile(e) {
    let t = this.tiles.get(e.id);
    if (!t) {
      const onPress = e.cycle ? (tid, down, inside) => this.cyclePress(tid, down, inside)
        : e.id === MORE ? (tid, down, inside) => { if (!down && inside) { this.folded = !this.folded; this.relayout(); } }
        : e.id === 'skiff' ? (tid, down, inside) => { if (!down && inside) this.game.touchUI?.topBar?.open('skiff'); } // (what the top bar's SKIFF presses: folded under MENU on a phone)
          : (tid, down) => touchTiles.report(this.game, tid, down);
      t = new TouchTile(e.id, { size: STRIP.size, glyph: e.glyph ?? null, word: e.word ?? null, corner: e.corner ?? null, tint: e.tint ?? null, fit: true, onPress }); this.tiles.set(e.id, t);
    }
    t.face({ glyph: e.glyph ?? null, word: e.word ?? null, corner: e.corner ?? null, tint: e.tint ?? null });
    return t;
  }

  /** A pick's tile (CHAMBER, FORM; MOBILE.md 4.1): a tap presses the next one's binding, a hold (CURSOR.long) opens the radial. */
  cyclePress(tid, down, inside) {
    const e = this.entries.find((x) => x.id === tid); if (!e) return;
    if (down) { clearTimeout(this.holdT); this.holdT = setTimeout(() => { this.holdT = 0; this.openRadial(e); }, CURSOR.long); return; }
    if (!this.holdT) return; // (held: the radial is open, the lift picks nothing)
    clearTimeout(this.holdT); this.holdT = 0;
    if (inside) this.tap(e.cycle[(e.at + 1) % e.cycle.length]);
  }
  /** A binding pressed and let go, as a key tapped. */
  tap(id) { touchTiles.report(this.game, id, true); setTimeout(() => touchTiles.report(this.game, id, false), 90); }
  /** The radial: the pick's choices on an arc under its tile, each a tile; a tap on one picks it, anywhere else closes it. */
  openRadial(e) {
    this.closeRadial(); const src = this.tiles.get(e.id); if (!src?.el) return;
    const b = src.el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, n = e.radial.length, R = 64, s = STRIP.size;
    this.radial = e.radial.map((r, i) => {
      const a = Math.PI * (0.15 + 0.7 * (n > 1 ? i / (n - 1) : 0.5)), t = new TouchTile(`radial.${r.id}`, { size: s, glyph: r.glyph ?? null, word: r.word ?? null, fit: true,
        onPress: (_, down, inside) => { if (!down && inside) { this.tap(r.id); this.closeRadial(); } } });
      t.place(cx + Math.cos(a) * R - s / 2, cy + Math.sin(a) * R - s / 2 + 8, s); t.set({ hidden: false, lit: !!r.lit }); t.update(performance.now() / 1000); return t;
    });
    this.radialOff = (ev) => { if (!this.radial?.some((t) => t.el.contains(ev.target))) this.closeRadial(); };
    setTimeout(() => document.addEventListener('pointerdown', this.radialOff, true), 0);
  }
  closeRadial() { if (this.radialOff) document.removeEventListener('pointerdown', this.radialOff, true); this.radialOff = null; for (const t of this.radial || []) t.el.remove(); this.radial = null; }

  /** Where it may stand over the cluster's bounds: the HUD layout's strip room (hudlayout.js stripArea: clear of the Sight, the top
   *  bar and the log), or the cluster's own column without it. */
  area(cb) {
    const Lm = this.game.hudLayout;
    if (Lm?.touch && Lm.stripArea) return Lm.stripArea(cb);
    const P = placeOf(this.game), A = P.areas.cluster, L = P.areas.look, left = (L.w > 0 ? L.x : P.view.w / 2) + STRIP.edge;
    return { left, right: A.x + A.w - STRIP.margin, top: 0, base: cb ? cb.y : A.y + A.h - STRIP.margin, sideLeft: left };
  }

  /** THE TOP ROW (a phone on its side, hudlayout.js `stripTop`; South, 2026-10-29: the centre 60% kept clear): the belt's pair, then the
   *  strip, in one row on one clay shelf from the folded top bar's end toward the Sight, as large as fit (44 px down to the least). */
  layoutTop(Z) {
    this.layoutNear();
    const G = STRIP.gap, F = TILE.foot, ids = this.farIds(), room = Z.w - 2 * STRIP.shelf;
    const span = (sz) => ids.reduce((a, id) => a + this.tiles.get(id).widthFor(sz), 0) + (ids.length - 1) * G + (this.pair.length && this.ids.length ? G : 0);
    let sz = STRIP.size; while (sz > TILE.min && span(sz) > room) sz -= 2;
    let x = Z.x + STRIP.shelf; const y = Z.y + STRIP.shelf;
    ids.forEach((id, i) => {
      const t = this.tiles.get(id), w = t.widthFor(sz);
      if (i === this.pairShown && i) x += G; // (a breath between the pair and the tool's row)
      if (x + w > Z.x + Z.w - STRIP.shelf) { t.set({ hidden: true }); t.over = true; return; } // (past the Sight: folded away, never over it)
      t.over = false; t.place(x, y, sz, w); x += w + G;
    });
    const Wd = Math.min(Z.w, x - G + STRIP.shelf - Z.x), H = sz + F + 2 * STRIP.shelf;
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(Z.x)}px, ${Math.round(Z.y)}px)`, width: `${Math.round(Wd)}px`, height: `${Math.round(H)}px` });
    this.shelf.style.setProperty('--h', `${H}px`);
    this.shelf.classList.toggle('off', !this.shown);
  }

  /** The far shelf's tiles in order, folded past FAR_MAX behind a ⋯ (MOBILE.md 4.1: SKIFF first, then SWAP, LEND, BREATH, FAN; DRAW /
   *  STOW and the pick never), the ⋯ at its end; opened, all of them and the ⋯ lit. */
  farIds() {
    const all = [...this.pair, ...this.ids.filter((id) => id !== MORE)], over = all.length - FAR_MAX;
    if (over <= 0) { this.pairShown = this.pair.length; return all; }
    const hide = new Set(this.folded ? FOLD_ORDER.filter((id) => all.includes(id)).slice(0, over + 1) : []);
    const ids = all.filter((id) => !hide.has(id)); this.pairShown = this.pair.filter((id) => !hide.has(id)).length;
    for (const id of hide) this.tiles.get(id)?.set({ hidden: true });
    this.tile({ id: MORE, glyph: 'more', word: null }); this.tiles.get(MORE).set({ lit: !this.folded });
    return [...ids, MORE];
  }
  /** The near shelf: up to three tiles in a row over the cluster on the right edge (hudlayout.js `areas.near`). */
  layoutNear() {
    const N = this.game.hudLayout?.areas?.near; if (!N || !N.w) return;
    const sz = STRIP.near, G = STRIP.gap; let x = N.x + N.w;
    for (const id of [...this.nearIds].reverse()) { const t = this.tiles.get(id), w = t.widthFor(sz); x -= w; t.place(x, N.y, sz, w); x -= G; }
  }

  /** Lay the pair at the cluster's top edge and the strip over it (rows upward), right-aligned to the cluster, inside the strip's room. */
  layout(cb) {
    const Lm = this.game.hudLayout; if (Lm?.stripTop && Lm.areas?.strip?.w > 0) return this.layoutTop(Lm.areas.strip);
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
    const g = this.game, menuOpen = !!g.hudLayout?.stripTop && g.touchUI?.topBar?.folded === false; // (the top bar's row opened over the top row: the strip stands down under it)
    const show = !!on && !windowOpen(g) && !g.touch?.screenTaken?.() && !menuOpen; // (the pads or the paper hold the screen: the strip stands down, Petra's ruling)
    const top = !!g.hudLayout?.stripTop, entries = show ? (top ? stripOf(g) : folding(stripOf(g), this.folded)) : [], pair = show ? beltPairOf(g) : [];
    const near = show && top ? nearOf(g) : [], all = [...pair, ...entries, ...near];
    for (const e of all) this.tile(e);
    const ids = entries.map((e) => e.id), pids = pair.map((e) => e.id), nids = near.map((e) => e.id);
    const key = `${ids.join()}|${pids.join()}|${nids.join()}|${this.folded}|${cb ? [cb.x, cb.y].map(Math.round).join() : ''}|${g.hudLayout?.stripTop ? JSON.stringify(g.hudLayout.areas.strip) : ''}|${all.map((e) => this.tiles.get(e.id).widthFor(STRIP.size)).join()}`;
    this.entries = entries;
    const wasShown = this.shown; this.shown = show && all.length > 0;
    if (key !== this.key || wasShown !== this.shown) {
      this.key = key; this.ids = ids; this.pair = pids; this.nearIds = nids;
      for (const [id, t] of this.tiles) if (!ids.includes(id) && !pids.includes(id) && !nids.includes(id) && id !== MORE) t.set({ hidden: true });
      if (this.shown) this.layout(cb); else this.shelf.classList.add('off');
    }
    if (!this.shown) { for (const t of this.tiles.values()) t.set({ hidden: true }); this.closeRadial(); return; }
    const far = top ? new Set(this.farIds()) : null; if (far?.has(MORE)) { const m = this.tiles.get(MORE); if (!m.over) { m.set({ hidden: false, lit: !this.folded || m.state.pressed }); m.update(now); } }
    for (const e of all) { const t = this.tiles.get(e.id); if (t.over || (far && !far.has(e.id) && !nids.includes(e.id))) { t.set({ hidden: true }); continue; } t.set({ hidden: false, lit: t.state.pressed || !!e.lit, dim: !!e.dim, charge: e.charge ?? 0, pips: e.pips ?? 0 }); t.update(now); }
  }

  /** The layout changed: stand again at the next frame. */
  relayout() { this.key = ''; }
}
