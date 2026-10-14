// ---------------------------------------------------------------------------------------
// THE SKIFF'S PARTS (docs/plans/SKIFF-RACING.md section 12; the owner, 2026-10-14: "build everything"): the Solar Skiff's garage. A part
// is a choice with a trade, never a straight upgrade: a sail (top speed against acceleration), a keel (grip against the grind's balance),
// a hull (weight: bumps and takedowns against acceleration). Each is opened by an achievement (the house's law: arts and their kin only
// by achievement, a count way and a feat way), kept in the save (`skiffParts`, player scope: progress resets with a build), chosen at
// the race board's garage. The board asks `mult(key)` for its numbers (courier/skiff/boardrules.js).
//
// Prior art: Mario Kart 8's kart parts (body, tyres, glider: stats traded, none strictly better), Kirby Air Ride's machines (each a
// different feel, not a different rank), Gran Turismo's tuning shop; OSRS's gear as a choice of trade-offs, opened by quests.
//
// THE HULL'S GLAZE (Calissa's ask, 2026-10-14): the Solar Skiff's hull fired with one of the Courier's glazes at the kiln (Calissa's kiln UI sets it,
// the hull's material reads it); kept as `skiffGlaze` (player scope), `{ glaze: <a GLAZES id> | null }`. Event: skiff.glaze { glaze }.
//
//   game.skiffParts = new SkiffParts(game)   .mult(key) -> number   .chosen { sail, keel, hull }   .open(id) -> bool   .choose(slot, id)
//   .glaze() -> id | null   .setGlaze(id | null)   PARTS (the table)
// ---------------------------------------------------------------------------------------

/** Each part: its slot, its label and one line (CLARITY.md), what it multiplies (top speed, acceleration, the sand's grip, the grind's
 *  answer and drift, the bump's weight) and the achievement that opens it (none: the standard part). */
export const PARTS = {
  'sail.standard': { slot: 'sail', name: 'Standard Sail', does: 'As it came.', mult: {} },
  'sail.racing': { slot: 'sail', name: 'Racing Sail', does: 'Faster at the top, slower to get there.', mult: { top: 1.07, accel: 0.88 }, opens: 'rw21' },
  'sail.storm': { slot: 'sail', name: 'Storm Sail', does: 'Quick off the line, a lower top.', mult: { top: 0.95, accel: 1.15 }, opens: 'rw5' },
  'keel.standard': { slot: 'keel', name: 'Standard Keel', does: 'As it came.', mult: {} },
  'keel.grind': { slot: 'keel', name: 'Grind Keel', does: 'A steadier rail, a looser carve.', mult: { answer: 1.3, drift: 0.8, grip: 0.9 }, opens: 'rw9' },
  'keel.deep': { slot: 'keel', name: 'Deep Keel', does: 'Holds the sand, wobbles on a rail.', mult: { grip: 1.2, drift: 1.2 }, opens: 'rw6' },
  'hull.standard': { slot: 'hull', name: 'Standard Hull', does: 'As it came.', mult: {} },
  'hull.light': { slot: 'hull', name: 'Light Hull', does: 'Light off the line, light in a bump.', mult: { accel: 1.08, mass: 0.7 }, opens: 'rw13' },
  'hull.heavy': { slot: 'hull', name: 'Heavy Hull', does: 'Hits like a kiln door, slow to wind up.', mult: { mass: 1.5, accel: 0.92 }, opens: 'rw22' },
};
const STANDARD = { sail: 'sail.standard', keel: 'keel.standard', hull: 'hull.standard' };

export class SkiffParts {
  constructor(game) {
    this.game = game; this.chosen = { ...STANDARD };
    this.hullGlaze = null;
    game.save?.section('skiffGlaze', { scope: 'player', version: 1, dump: () => ({ glaze: this.hullGlaze }), load: (d) => { this.hullGlaze = typeof d?.glaze === 'string' ? d.glaze : null; }, reset: () => { this.hullGlaze = null; } });
    game.save?.section('skiffParts', { scope: 'player', version: 1, dump: () => this.chosen, load: (d) => { this.chosen = { ...STANDARD, ...(d || {}) }; }, reset: () => { this.chosen = { ...STANDARD }; } });
  }
  /** Is a part open (its achievement got, or no achievement asked)? */
  open(id) { const P = PARTS[id]; if (!P) return false; if (!P.opens) return true; return !!this.game.achievements?.done?.(P.opens) || !!this.game.lend?.has?.('racing'); } // (or lent in the DEBUG save: the Racing row)
  choose(slot, id) {
    const P = PARTS[id]; if (!P || P.slot !== slot || !this.open(id)) return false;
    this.chosen[slot] = id; this.game.save?.dirty('skiffParts');
    this.game.events?.emit('skiff.part', { slot, part: id, by: 'courier' });
    return true;
  }
  /** The hull's glaze (a GLAZES id), or null for the bare hull. */
  glaze() { return this.hullGlaze; }
  setGlaze(id) {
    const glaze = typeof id === 'string' ? id : null; if (glaze === this.hullGlaze) return false;
    this.hullGlaze = glaze; this.game.save?.dirty('skiffGlaze');
    this.game.events?.emit('skiff.glaze', { glaze, by: 'courier' });
    return true;
  }
  /** The product of the chosen parts' multipliers for one number (1 where none touches it). */
  mult(key) { let k = 1; for (const id of Object.values(this.chosen)) k *= PARTS[id]?.mult?.[key] ?? 1; return k; }
}
