// ---------------------------------------------------------------------------------------
// THE ARC, AS DATA (docs/plans/TOUCH-REBUILD.md 3.1, 3.1.1, 3.4, 7): touch play's right-thumb controls as one grid with one gutter (South,
// 2026-11-02: "the tiles need equal padding or else it looks awful"), a slot a kind of verb that each action context only renames, and the
// arc's fold (the meter's column, hinged as the tablitas). Read by the touch driver (Petra's core/touch*.js) and its tiles (Calissa's
// ui/touch/): this file says which cell holds which input action in which context; the driver places, presses and folds them.
//
// Prior art: a keyboard's or a tile wall's one gutter (equal padding); Brawlhalla's and Brawl Stars' fixed slots relabelled by context;
// the Jacob's ladder toy (in Mexico, the tablitas) for the fold; Breath of the Wild's Pro HUD for HIDDEN.
//
//   ARC_GRID { cell, gutter, edge }   ARC_CELLS { A..G, PICK, BELT }   ARC_FOLD   TOUCH_ARC[ctx]   ARC_SETTING
//   arcRect(slot, safe) -> { x, y, w, h }   arcOf(ctx, hasAction?) -> [{ slot, action, rect? }]   foldOf(ctx) -> [slot]
// ---------------------------------------------------------------------------------------

/** One cell and one gutter for every tile (CSS px at a phone on its side), the safe area's edges two gutters off. */
export const ARC_GRID = { cell: 48, gutter: 8, edge: 16 };

/** Each slot's cell, counted from A's corner: the column from the right, the row from the bottom. A spans 2 x 2. */
export const ARC_CELLS = {
  A: { col: 0, row: 0, span: 2 },   // the primary verb
  C: { col: 0, row: 2 },            // vertical
  D: { col: 1, row: 2 },            // the secondary verb
  B: { col: 2, row: 0 },            // evade
  G: { col: 2, row: 1 },            // CROUCH, 3D only (side-on: the stick's down)
  E: { col: 2, row: 2 },            // defend
  F: { col: 3, row: 2 },            // the meter: the fold's top, always showing
  PICK: { col: 3, row: 1 },         // the fold
  BELT: { col: 3, row: 0 },         // the fold
};

/** The arc's fold, top to bottom: folded, only its first shows (as a stack); a swipe down cascades the rest out (TOUCH-REBUILD.md 7). */
export const ARC_FOLD = ['F', 'PICK', 'BELT'];
/** Its flip and its idle fold-back, real seconds. */
export const ARC_FOLD_TIME = { flip: 0.06, idle: 3 };
/** The touch controls' setting (a settings row; Espada's labels): the default first. */
export const ARC_SETTING = ['folded', 'shown', 'hidden'];

/**
 * A context's slots: each an input action id from core/bindings.js (`ACTIONS`), or a radial (`{ tap, hold }`: tap the next, hold the
 * choices). `'picks'` is the tool in hand's own picks (its chambers, forms, notes: ui/touch/actioncontext.js), tap the next, hold the
 * radial. A slot absent is not drawn and its cell stays empty. The contexts are the plan's columns (3.1).
 */
export const TOUCH_ARC = {
  foot:  { A: 'use', B: 'dash', C: 'jump', E: 'parry', F: 'art', G: 'crouch',
           BELT: { tap: 'draw', hold: ['swap', 'lend', 'skiff', 'art'] } },
  tool:  { A: 'primary', B: 'dash', C: 'jump', D: 'secondary', E: 'parry', F: 'art', G: 'crouch',
           PICK: { tap: 'picks', hold: 'picks' }, BELT: { tap: 'draw', hold: ['swap', 'lend', 'skiff', 'art'] } },
  arena: { A: 'arAttack', B: 'arShield', C: 'arJump', D: 'arSpecial', E: 'arGrab' },          // side-on: crouch is the stick's down
  skiff: { A: 'flare', B: 'brake', C: 'hop', D: 'nose', E: 'tail', F: 'boost',
           BELT: { tap: 'stepOff', hold: ['stepOff', 'recall'] } },                             // D and E in the air only (ctx skiff.air)
  rail:  { A: 'raFire', B: 'raRoll', C: 'raForm', D: 'raLock', E: 'parry', F: 'raSurge' },
  helm:  { A: 'heFire', B: 'heUp', D: 'heBroad', E: 'heParry', F: 'heMount1',
           BELT: { tap: 'heMount2', hold: ['heMount1', 'heMount2', 'heMoor'] } },
};

/** Where a slot's tile stands: `safe` is the safe area's right and bottom edges (CSS px). One gutter between every neighbour. */
export function arcRect(slot, { right, bottom }) {
  const c = ARC_CELLS[slot]; if (!c) return null;
  const { cell, gutter, edge } = ARC_GRID, pitch = cell + gutter, span = c.span || 1, size = span * pitch - gutter;
  return { x: right - edge - (c.col + span) * pitch + gutter, y: bottom - edge - (c.row + span) * pitch + gutter, w: size, h: size };
}

/** A context's live slots in drawing order: those it names, and (given `hasAction`) whose action is live now. */
export function arcOf(ctx, hasAction = null, safe = null) {
  const row = TOUCH_ARC[ctx]; if (!row) return [];
  return Object.keys(ARC_CELLS).filter((s) => row[s] && (!hasAction || live(row[s], hasAction)))
    .map((slot) => ({ slot, action: row[slot], rect: safe ? arcRect(slot, safe) : null }));
}

const live = (v, has) => { const id = typeof v === 'string' ? v : v.tap; return id === 'picks' || has(id); };

/** The fold's slots a context draws, top to bottom (its first is the stack's face; F missing, the next one is). */
export function foldOf(ctx) { const row = TOUCH_ARC[ctx] || {}; return ARC_FOLD.filter((s) => row[s]); }
