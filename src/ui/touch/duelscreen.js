// ---------------------------------------------------------------------------------------
// THE DUEL'S PHONE SCREEN, ITS TILES (South, 2026-10-27: "rethink the entirety of the UI for mobile WRT the puzzle duels ... the board
// needs to be the largest thing on screen"; docs/plans/PUZZLE-DUELS.md 20, Dovina's: a duel offers only the worn pair's moves, no tray):
// while a puzzle duel is open on touch, its controls stand in the two flanks the board leaves, in the rects the HUD layout gives
// (ui/hudlayout.js duelLayout), never over the board. The cluster, the strip and the belt's pair stand down meanwhile (actioncontext.js).
//   LEFT     UNDO beside the top bar (dim with nothing to take back, or on the foe's turn); the worn tools' moves (duelTools: ROTATE first
//            in the hand's form) in two columns of tiles 44 to 60 px, dim where the kernel would refuse them, gold while held (a Paint's
//            reach armed, a song holding); FORM at the flank's foot under the Courier (HAND or COURIER: what you would become).
//   RIGHT    FLEE small at the top, taken only by a long press (the long press's ring, longpress.js: far from END TURN and never by
//            accident); FINISHER over END TURN on a broken foe; END TURN the largest under the right thumb, its rim the action points left.
// Every press reports through touchTiles with the binding's touch id (core/bindings.js `du.*`); the driver presses it in the duel's ctx.
//
// Prior art: Puzzle Quest (the board edge to edge, the two portraits and the spells beside it), Into the Breach (UNDO top-left, END TURN
// alone), Slay the Spire (END TURN the one big button, the energy on it), Honkai: Star Rail (the bottom-right attack under the thumb, the
// skills beside it), the hold-to-confirm rings of console UIs (a destructive verb held, not tapped).
//
//   new TouchDuel(game)   .update(now, on)   .relayout()   .rects() -> [{ id, x, y, w, h }] (what stands now)   .shown
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { longPress } from './longpress.js';
import { windowOpen } from './areas.js';
import { duelCluster, duelTools } from './actioncontext.js';

/** The numbers: FLEE's hold (real ms: a long press longer than the choice card's, so a brush never flees). */
export const TOUCH_DUEL = { fleeMs: 650 };

const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export class TouchDuel {
  constructor(game) { this.game = game; this.tiles = new Map(); this.shown = false; this.key = ''; this.placed = []; }

  tile(e) {
    let t = this.tiles.get(e.id);
    if (!t) {
      const onPress = e.id === 'du.flee' ? (id, down, inside) => this.fleePress(t, down, inside) : (id, down) => touchTiles.report(this.game, id, down);
      t = new TouchTile(e.id, { size: TILE.size, glyph: e.glyph ?? null, word: e.word ?? null, fit: true, onPress }); this.tiles.set(e.id, t);
    }
    t.face({ glyph: e.glyph ?? null, word: e.word ?? null });
    return t;
  }

  /** FLEE: the ring filling under the tile while held; full, the flee is pressed once; let go before, nothing. */
  fleePress(t, down) {
    if (!down) { longPress.cancel(); return; }
    longPress.show(t.x + t.w / 2, t.y + t.size / 2, { ms: TOUCH_DUEL.fleeMs, done: () => { touchTiles.report(this.game, 'du.flee', true); touchTiles.report(this.game, 'du.flee', false); } });
  }

  /** Each frame: read the duel, lay out what changed, put each tile's state on it. */
  update(now, on) {
    const g = this.game, L = g.hudLayout, R = L?.duelR, show = !!on && !!R && !!g.duel?.active && !windowOpen(g) && !L.touchLog?.sheet;
    const top = show ? (duelCluster(g) || []).filter(Boolean) : [], tools = show ? duelTools(g) : [], bar = g.touchUI?.topBar;
    const hideUndo = !!bar && !bar.folded; // (the top bar unfolded over UNDO's slot: it stands down until the row folds)
    const all = [...top.filter((e) => !(e.id === 'du.undo' && hideUndo)), ...tools];
    for (const e of all) this.tile(e);
    const ids = all.map((e) => e.id), key = `${ids.join()}|${R ? [R.board.x, R.board.w, R.left.w, R.right.x].map(Math.round).join() : ''}|${all.map((e) => this.tiles.get(e.id).widthFor(TILE.size)).join()}`;
    if (key !== this.key || show !== this.shown) {
      this.key = key; this.shown = show;
      for (const [id, t] of this.tiles) if (!ids.includes(id)) { if (id === 'du.flee') longPress.cancel(); t.set({ hidden: true }); }
      if (show) this.layout(R, top, tools);
    }
    if (!show) return;
    for (const e of all) {
      const t = this.tiles.get(e.id);
      t.set({ hidden: false, lit: t.state.pressed || !!e.lit, dim: !!e.dim, charge: e.charge ?? 0 }); t.update(now);
    }
  }

  /** The tiles in their rects (a wide one keeps its right edge in the right flank, its left in the left), none over the board. */
  layout(R, top, tools) {
    const L = this.game.hudLayout, F = TILE.foot; this.placed = [];
    const put = (id, r, size, anchorRight = false) => {
      const t = this.tiles.get(id); if (!t || !r) return;
      const w = t.widthFor(size), x = anchorRight ? r.x + r.w - w : r.x; t.place(x, r.y, size, w); this.placed.push({ id, x, y: r.y, w, h: size + F });
    };
    for (const e of top) {
      if (e.id === 'du.end') put(e.id, R.endTurn, R.endTurn.h - F, true);
      else if (e.id === 'du.finish') put(e.id, R.finisher, R.finisher.h - F, true);
      else if (e.id === 'du.flee') put(e.id, R.flee, R.flee.h - F, true);
      else if (e.id === 'du.undo') put(e.id, R.undo, R.undo.h - F);
      else if (e.id === 'du.form') put(e.id, R.form, R.form.h - F, true);
    }
    const spots = L.toolSpots(R.tools, tools.length);
    tools.forEach((e, i) => { const p = spots[i]; put(e.id, { x: p.x, y: p.y, w: p.s, h: p.s + F }, p.s); });
    const over = this.placed.filter((r) => hit(r, R.board)); // (the rule: no tile over the board)
    if (over.length) console.warn('duel screen: tiles over the board', over.map((r) => r.id).join());
  }

  /** What stands now (CSS px): for a look or a test. */
  rects() { return this.shown ? this.placed.map((r) => ({ ...r })) : []; }

  relayout() { this.key = ''; }
}
