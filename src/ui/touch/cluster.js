// ---------------------------------------------------------------------------------------
// THE CLUSTER'S LOOK: the context's verbs as glazed tiles in the right half's bottom corner (docs/plans/MOBILE.md 4.1, 4.2, 8, 8.2; the
// HUD layout's `areas.cluster`), at most four, the main one largest under the thumb (80 px), the others round it (60 px):
//   SLOTS      0 the main, in the corner; 1 above it; 2 left of it; 3 between them, up and to the left. A named tile (USE) is as wide
//              as its label and keeps its right edge where a square one would.
//   CONTEXT    `set(ids)` shows a list (slot order); while `auto` (the default until the driver takes it) the cluster reads the moment
//              itself, read only: the Solar Skiff on the sand HOP, FLARE, BRAKE and BOOST while a flare is banked; in the air or on a
//              rail HOP, NOSE, TAIL (and BOOST); in the Spirit Garden JUMP while the Pneuka Jar moves, and USE naming its thing while the
//              interact chevron is on one; on foot, with a tool in hand and in a puzzle duel what ui/touch/actioncontext.js reads
//              (JUMP, CROUCH, DASH and USE / PARRY / BLINK; FIRE and AIM in the tool's verbs, its third, PARRY; END TURN, FINISHER, FLEE,
//              FORM). A tile swapped out while held lets go first.
//   STATE      HOP's rim fills as the springs load (the skiff's `charge`); FLARE embers toward the scorch (`rules.scorch`) and goes dim
//              while the sail luffs; BOOST stands the banked suns (`combo.stocks`, 0..3); a held tile is lit.
//   USE        its thing's label (the source's own `label` if it gives one, else the plain word for what F does there: TALK, CHEST,
//              SHED, a spirit's name), USE small in its corner; a thing with no label is USE alone (MOBILE.md 8.3).
//   KEPT       a layout kept by the touch layout editor (hudlayout.js `custom`): each slot at its kept centre, the tiles scaled by its
//              scale (never under 44 px), clamped off the corner instruments and each other (hudlayout.js clampRect).
// Hidden off touch, under a window, and with no context.
//
// Prior art: Mario Kart Tour's and Alto's one-thumb clusters, Genshin Impact's (an attack button with the skill and burst round it),
// Monster Hunter Now's context button (it names what it will do), the slip arc's reading of the skiff tech (vfx/skiffsliparc.js).
//
//   new TouchCluster(game)   .set(ids | entries | null) (an entry: actioncontext.js's { id, glyph, word, lit, dim })   .bounds() -> rect   .auto (true: it reads the moment)   .update(now, on)   .tile(id) -> TouchTile   .ids   .avoid (a rect)
//   clusterContext(game) -> ids (what the moment would show)   useLabel(game) -> { word, corner } | null   CLUSTER (the numbers)
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { footCluster, toolCluster, duelCluster, helmCluster, inHandCtx } from './actioncontext.js';

/** The numbers (CSS px): the gap between tiles, the margin off the area's corner; the Jar's least speed for JUMP (m/s); the room kept
 *  clear of the art bar's edge (its side strip stands there). */
export const CLUSTER = { gap: 10, margin: 6, jumpSpeed: 0.6, clear: 84 };

/** What F does at each source, said plainly where its offer gives no label of its own (courier/interact.js sources; placeholders). */
const USE_WORDS = { npc: 'TALK', chest: 'CHEST', item: 'TAKE', find: 'TAKE', carry: 'LIFT', push: 'PUSH', kiln: 'KILN', well: 'DOWN', ostracon: 'READ', purser: 'PURSER', bazaar: 'TABLE', skiff: 'SKIFF', solar: 'START' };
const GARDEN_WORDS = { gate: 'GATE', shed: 'SHED', press: 'PRESS', athanor: 'PRESS', shrine: 'SHRINE' };

/** USE's words for the thing the chevron is on now, or null when it is on nothing. */
export function useLabel(game) {
  const cur = game?.interact?.cur; if (!cur) return null;
  let word = cur.label || null;
  if (!word && cur.id === 'garden') {
    const n = game.realm?.near;
    word = n?.kind === 'spirit' ? (n.s?.name || null) : GARDEN_WORDS[n?.kind] || null;
  }
  if (!word) word = USE_WORDS[cur.id] || null;
  word = word ? String(word).toUpperCase().split(/\s+/).slice(0, 2).join(' ') : null; // (one word, two at most)
  return word ? { word, corner: 'USE' } : { word: 'USE', corner: null };
}

/** What the moment would show, slot order (main first): ids, or entries with their faces (actioncontext.js). */
export function clusterContext(game) {
  const g = game || {}, T = g.player?.techs?.get?.('skiff') || g.techs?.get?.('skiff');
  const use = useLabel(g) ? 'use' : null;
  if (T?.active && T.phase === 'ride') {
    const boost = (T.combo?.stocks || 0) > 0.001 ? 'boost' : null;
    return T.air || T.grind?.on ? ['hop', 'nose', 'tail', boost] : ['hop', 'flare', 'brake', boost];
  }
  if (g.realm?.active) {
    const J = g.realm.jarBody, moving = !!J && !J.held && (J.vel?.length?.() || 0) > CLUSTER.jumpSpeed;
    return [moving ? 'jump' : null, use].filter(Boolean);
  }
  if (g.duel?.active) return duelCluster(g).filter(Boolean);
  if (g.opensea?.sailing) return helmCluster(g).filter(Boolean); // (the open sea's helm: its own verbs, the stick the rudder alone)
  if (T?.active || g.god?.controlling || g.duel?.pending || g.emocean?.stage?.active) return [];
  const ctx = inHandCtx(g), tool = ctx && toolCluster(g, ctx);
  return (tool || footCluster(g, use)).filter(Boolean); // (on foot: DASH always, the Shift press, Dovina's ruling 2026-10-24: the air dash is the core movement's)
}
const entryOf = (e) => (typeof e === 'string' ? { id: e } : e);

/** The four slots' default places in the cluster's area `A` (each [x, y, size], CSS px), stepped off `avoid` (the art bar, the god
 *  hand's strip) while it stands. The touch layout editor starts from these too (ui/touchlayouteditor.js). */
export function defaultSpots(A, avoid = null) {
  const G = CLUSTER.gap, M = CLUSTER.margin, V = avoid;
  let right = A.x + A.w - M, bottom = A.y + A.h - M - TILE.foot;
  if (V) { if (V.portrait) bottom = Math.min(bottom, V.y - CLUSTER.clear); else right = Math.min(right, V.x - CLUSTER.clear); }
  const mainS = TILE.main, s = TILE.size, mx = right - mainS, my = bottom - mainS;
  return [
    [mx, my, mainS],
    [mx + (mainS - s) / 2 + 4, my - G - s - TILE.foot, s],
    [mx - G - s, my + (mainS - s) - 2, s],
    [mx - G / 2 - s, my - G / 2 - s - TILE.foot, s], // (up and to the left, clear of the main's corner and of its two neighbours)
  ];
}

const screenTaken = (g) => g.touch?.screenTaken?.(); // (true while the rhythm mode's pads or Celestial mode's paper hold the whole screen: Petra's core/touch)

export class TouchCluster {
  constructor(game) {
    this.game = game; this.auto = true; this.ids = []; this.tiles = new Map(); this.shown = false;
  }

  /** The tile for an id, made once. */
  tile(id) {
    let t = this.tiles.get(id);
    if (!t) {
      t = new TouchTile(id, { size: TILE.size, glyph: id === 'use' ? null : id, fit: true, onPress: (tid, down) => touchTiles.report(this.game, tid, down) });
      this.tiles.set(id, t);
    }
    return t;
  }

  /** Show these ids (slot order, falsy skipped, four at most); null or [] hides the cluster. Stops reading the moment only if `auto` is
   *  set false by the caller. */
  set(ids) {
    const entries = (ids || []).filter(Boolean).slice(0, 4).map(entryOf), want = entries.map((e) => e.id);
    this.entries = entries;
    let wider = false;
    for (const e of entries) if (e.glyph !== undefined || e.word !== undefined) { const t = this.tile(e.id), w = t.widthFor(t.size); t.face({ glyph: e.glyph ?? null, word: e.word ?? null }); if (t.widthFor(t.size) !== w) wider = true; }
    if (want.join() === this.ids.join()) { if (wider) this.layout(); return; }
    this.ids = want;
    for (const [id, t] of this.tiles) if (!want.includes(id)) t.set({ hidden: true });
    this.layout();
  }

  /** Lay the shown tiles out in the cluster's area (the main in its corner, the others round it). */
  layout() {
    const spots = defaultSpots(placeOf(this.game).areas.cluster, this.avoid);
    const L = this.game.hudLayout, C = L?.touch ? L.custom : null, k = C ? L.clusterScale(C) : 1, placed = [];
    const V = this.avoid, keepOff = V ? [V] : [];
    this.ids.forEach((id, i) => {
      const t = this.tile(id), [sx, sy, s0] = spots[i];
      if (C) { // (the kept layout: the slot's centre, its size scaled, clamped off the instruments and the tiles placed before it)
        const size = Math.max(TILE.min, Math.round(s0 * k)), w = t.widthFor(size), c = C.slots?.[i] ? L.fromFrac(C.slots[i]) : { x: sx + s0 / 2, y: sy + s0 / 2 };
        const q = L.clampRect({ x: c.x - w / 2, y: c.y - (size + TILE.foot) / 2, w, h: size + TILE.foot }, [...keepOff, ...placed]);
        t.place(q.x, q.y, size, w); placed.push(q);
      } else { const w = t.widthFor(s0); t.place(sx + s0 - w, sy, s0, w); } // (a wide one keeps its right edge)
      t.set({ hidden: !this.shown });
    });
  }

  /** Each frame: read the moment (while auto), stand down under a window or off touch, and put each tile's state on it. */
  update(now, on) {
    // (the screen taken, Petra's ruling 2026-10-24: the rhythm mode's pads take every touch, so the cluster stands down; Celestial mode's
    //  paper lives only while AIM is held, so AIM alone stays: core/touchlanes.js, core/touchtools.js)
    const taken = !!screenTaken(this.game), pads = taken && !!this.game.rhythm?.active;
    const g = this.game, show = !!on && !windowOpen(g) && !pads;
    if (this.auto) this.set(show ? (taken ? (clusterContext(g) || []).filter((e) => (e?.id ?? e) === 'aim') : clusterContext(g)) : []);
    if (show !== this.shown) { this.shown = show; for (const id of this.ids) this.tile(id).set({ hidden: !show }); }
    if (!show) return;
    const T = g.player?.techs?.get?.('skiff') || g.techs?.get?.('skiff');
    for (const id of this.ids) {
      const t = this.tile(id), held = t.state.pressed;
      if (id === 'hop') t.set({ charge: T?.active ? Math.min(1, T.charge || 0) : 0 });
      else if (id === 'flare') t.set({ ember: T?.rules?.scorch || 0, dim: (T?.rules?.luffT || 0) > 0 });
      else if (id === 'boost') t.set({ pips: Math.min(3, T?.combo?.stocks || 0) });
      else if (id === 'use') { const L = useLabel(g); if (L) { const before = t.w; t.label(L.word, L.corner); if (t.widthFor(t.size) !== before) this.layout(); } }
      const e = this.entries?.find((x) => x.id === id);
      t.set({ lit: held || !!e?.lit }); if (id !== 'flare') t.set({ dim: !!e?.dim }); // (FLARE's dim is the luffed sail's, above)
      t.update(now);
    }
  }

  /** The shown tiles' bounds (CSS px), or null: the strip stands over it (strip.js). */
  bounds() {
    if (!this.shown || !this.ids.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of this.ids) { const t = this.tile(id); x0 = Math.min(x0, t.x); y0 = Math.min(y0, t.y); x1 = Math.max(x1, t.x + t.w); y1 = Math.max(y1, t.y + t.size + TILE.foot); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /** The layout changed (the layout manager's change, a resize): stand again. */
  relayout() { if (this.ids.length) this.layout(); }
}
