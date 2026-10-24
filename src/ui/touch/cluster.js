// ---------------------------------------------------------------------------------------
// THE CLUSTER'S LOOK: the context's verbs as glazed tiles in the right half's bottom corner (docs/plans/MOBILE.md 4.1, 4.2, 8, 8.2; the
// HUD layout's `areas.cluster`), at most four, the main one largest under the thumb (96 px), the others round it (72 px):
//   SLOTS      0 the main, in the corner; 1 above it; 2 left of it; 3 between them, up and to the left. A named tile (USE) is as wide
//              as its label and keeps its right edge where a square one would.
//   CONTEXT    `set(ids)` shows a list (slot order); while `auto` (the default until the driver takes it) the cluster reads the moment
//              itself, read only: the Solar Skiff on the sand HOP, FLARE, BRAKE and BOOST while a flare is banked; in the air or on a
//              rail HOP, NOSE, TAIL (and BOOST); in the Spirit Garden JUMP while the Pneuka Jar moves, and USE naming its thing while the
//              interact chevron is on one (on foot too). A tile swapped out while held lets go first.
//   STATE      HOP's rim fills as the springs load (the skiff's `charge`); FLARE embers toward the scorch (`rules.scorch`) and goes dim
//              while the sail luffs; BOOST stands the banked suns (`combo.stocks`, 0..3); a held tile is lit.
//   USE        its thing's label (the source's own `label` if it gives one, else the plain word for what F does there: TALK, CHEST,
//              SHED, a spirit's name), USE small in its corner; a thing with no label is USE alone (MOBILE.md 8.3).
// Hidden off touch, under a window, and with no context.
//
// Prior art: Mario Kart Tour's and Alto's one-thumb clusters, Genshin Impact's (an attack button with the skill and burst round it),
// Monster Hunter Now's context button (it names what it will do), the slip arc's reading of the skiff tech (vfx/skiffsliparc.js).
//
//   new TouchCluster(game)   .set(ids | null)   .auto (true: it reads the moment)   .update(now, on)   .tile(id) -> TouchTile   .ids   .avoid (a rect)
//   clusterContext(game) -> ids (what the moment would show)   useLabel(game) -> { word, corner } | null   CLUSTER (the numbers)
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';

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

/** The ids the moment would show, slot order (main first). */
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
  if (T?.active || g.god?.controlling) return [];
  return ['dash', use].filter(Boolean); // (on foot: DASH, the Shift press, Dovina's ruling 2026-10-24; the air dash is the core movement's, so it is always there)
}

export class TouchCluster {
  constructor(game) {
    this.game = game; this.auto = true; this.ids = []; this.tiles = new Map(); this.shown = false;
  }

  /** The tile for an id, made once. */
  tile(id) {
    let t = this.tiles.get(id);
    if (!t) {
      t = new TouchTile(id, { size: TILE.size, glyph: id === 'use' ? null : id, onPress: (tid, down) => touchTiles.report(this.game, tid, down) });
      this.tiles.set(id, t);
    }
    return t;
  }

  /** Show these ids (slot order, falsy skipped, four at most); null or [] hides the cluster. Stops reading the moment only if `auto` is
   *  set false by the caller. */
  set(ids) {
    const want = (ids || []).filter(Boolean).slice(0, 4);
    if (want.join() === this.ids.join()) return;
    this.ids = want;
    for (const [id, t] of this.tiles) if (!want.includes(id)) t.set({ hidden: true });
    this.layout();
  }

  /** Lay the shown tiles out in the cluster's area (the main in its corner, the others round it). */
  layout() {
    const A = placeOf(this.game).areas.cluster, G = CLUSTER.gap, M = CLUSTER.margin;
    let right = A.x + A.w - M, bottom = A.y + A.h - M - TILE.foot;
    const V = this.avoid; // (the art bar and its side strip, while they stand: the cluster steps off them)
    if (V) { if (V.portrait) bottom = Math.min(bottom, V.y - CLUSTER.clear); else right = Math.min(right, V.x - CLUSTER.clear); }
    const mainS = TILE.main, s = TILE.size;
    const mx = right - mainS, my = bottom - mainS;
    const spots = [
      [mx, my, mainS],
      [mx + (mainS - s) / 2 + 4, my - G - s - TILE.foot, s],
      [mx - G - s, my + (mainS - s) - 2, s],
      [mx - G * 0.6 - s * 0.82, my - G * 0.6 - s * 0.82 - TILE.foot, s],
    ];
    this.ids.forEach((id, i) => {
      const t = this.tile(id), [x, y, size] = spots[i], w = t.widthFor(size);
      t.place(x + size - w, y, size, w); // (a wide one keeps its right edge)
      t.set({ hidden: !this.shown });
    });
  }

  /** Each frame: read the moment (while auto), stand down under a window or off touch, and put each tile's state on it. */
  update(now, on) {
    const g = this.game, show = !!on && !windowOpen(g);
    if (this.auto) this.set(show ? clusterContext(g) : []);
    if (show !== this.shown) { this.shown = show; for (const id of this.ids) this.tile(id).set({ hidden: !show }); }
    if (!show) return;
    const T = g.player?.techs?.get?.('skiff') || g.techs?.get?.('skiff');
    for (const id of this.ids) {
      const t = this.tile(id), held = t.state.pressed;
      if (id === 'hop') t.set({ charge: T?.active ? Math.min(1, T.charge || 0) : 0 });
      else if (id === 'flare') t.set({ ember: T?.rules?.scorch || 0, dim: (T?.rules?.luffT || 0) > 0 });
      else if (id === 'boost') t.set({ pips: Math.min(3, T?.combo?.stocks || 0) });
      else if (id === 'use') { const L = useLabel(g); if (L) { const before = t.w; t.label(L.word, L.corner); if (t.widthFor(t.size) !== before) this.layout(); } }
      t.set({ lit: held });
      t.update(now);
    }
  }

  /** The layout changed (the layout manager's change, a resize): stand again. */
  relayout() { if (this.ids.length) this.layout(); }
}
