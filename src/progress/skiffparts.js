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
// THE TUNE SHEET AND SETUPS (SKIFF-TUNING.md 2.1, 2.6, 2.7, T4): the five sliders (progress/skifftune.js) kept beside the parts, each
// open once its slot has a part open (the sheet opens with the first part); up to three named setups, each the parts and the sheet,
// one of them pinnable to a track and worn when that track starts. MAST and FIN (2.7) are the Rake's and the Fin's partner slots.
//
//   game.skiffParts = new SkiffParts(game)   .mult(key) -> number   .chosen { sail, keel, hull, mast, fin }   .open(id) -> bool   .choose(slot, id)
//   .sheet { trim, fin, rake, ballast, ride }   .setSlider(id, v)   .slotOpen(slot)   .sheetOpen   .sliderOpen(id)   .recordClass() -> 'stock' | 'open'
//   .pi(track) -> the Performance Index of what is worn, on that track's reference race (100 stock)   .setups [{ name, chosen, sheet }]   .saveSetup(i, name?)   .wear(i)   .pin(track, i | null)   .wearPinned(track)
//   .glaze() -> id | null   .setGlaze(id | null)   PARTS (the table)   SLOTS
//   events: skiff.part { slot, part }   skiff.tune { slider, value }   skiff.setup { i, how }   skiff.glaze { glaze }
// The keys a part may multiply (courier/skiff/boardrules.js mult): top, accel, grip, coast, turn, carveRate, hover, follow, wobble, answer,
// drift, mass. The tune sheet (progress/skifftune.js) is one more source of the same keys. Each part's numbers are set on the ruler
// (`node scripts/skifftune.mjs`, SKIFF-TUNING.md T3) so that none is an upgrade: it wins on its own kind of run and loses on the other.
// ---------------------------------------------------------------------------------------
import { TUNE, STOCK_SHEET, SETUPS, cleanSheet, tuneMult, recordClass, piOf } from './skifftune.js';
import { refLap } from './skiffruler.js';

/** Each part: its slot, its label and one line (CLARITY.md), what it multiplies (top speed, acceleration, the sand's grip, the grind's
 *  answer and drift, the bump's weight) and the achievement that opens it (none: the standard part). */
export const PARTS = {
  'sail.standard': { slot: 'sail', name: 'Standard Sail', does: 'As it came.', mult: {} },
  'sail.racing': { slot: 'sail', name: 'Racing Sail', does: 'Faster at the top, slower to get there.', mult: { top: 1.03, accel: 0.8 }, opens: 'rw21' }, // (the ruler: +2.4 PI on a clean run, -0.9 in a field that knocks you 15 times a km),
  'sail.storm': { slot: 'sail', name: 'Storm Sail', does: 'Quick off the line, a lower top.', mult: { top: 0.98, accel: 1.3 }, opens: 'rw5' }, // (-1.8 clean, +1 in a rough field: the recovering racer's),
  'keel.standard': { slot: 'keel', name: 'Standard Keel', does: 'As it came.', mult: {} },
  'keel.grind': { slot: 'keel', name: 'Grind Keel', does: 'A steadier rail, a looser carve.', mult: { answer: 1.3, drift: 0.8, grip: 0.9 }, opens: 'rw9' },
  'keel.deep': { slot: 'keel', name: 'Deep Keel', does: 'Holds the sand, wobbles on a rail.', mult: { grip: 1.2, drift: 1.2 }, opens: 'rw6' },
  'hull.standard': { slot: 'hull', name: 'Standard Hull', does: 'As it came.', mult: {} },
  'hull.light': { slot: 'hull', name: 'Light Hull', does: 'Light off the line, light in a bump.', mult: { mass: 0.7 }, opens: 'rw13' }, // (mass alone: it winds up 9% quicker, coasts down sooner, and is shoved further in a bump),
  'hull.heavy': { slot: 'hull', name: 'Heavy Hull', does: 'Hits like a kiln door, slow to wind up.', mult: { mass: 1.5 }, opens: 'rw22' }, // (mass alone: 10% slower to wind up, keeps its way, wins every bump),
  // the partner slots (SKIFF-TUNING.md 2.7): each part opened by a Raceway achievement with a count way and a feat way (raceachievements.js)
  'mast.standard': { slot: 'mast', name: 'Standard Mast', does: 'As it came.', mult: {} },
  'mast.tall': { slot: 'mast', name: 'Tall Mast', does: 'More sail up high: faster, and twitchier on a rail and a landing.', mult: { top: 1.02, wobble: 0.85 }, opens: 'rw44' }, // (+1.7 PI, a wobble's bail sooner)
  'mast.short': { slot: 'mast', name: 'Short Mast', does: 'Quick to fill and steady, a lower top.', mult: { accel: 1.12, top: 0.99, wobble: 1.2 }, opens: 'rw45' }, // (-0.8 PI clean, a steadier board)
  'fin.standard': { slot: 'fin', name: 'Standard Fin', does: 'As it came.', mult: {} },
  'fin.surf': { slot: 'fin', name: 'Surf Fin', does: 'Loads a carve quickly; lets go of the sand sooner.', mult: { carveRate: 1.2, grip: 0.9 }, opens: 'rw46' },
  'fin.race': { slot: 'fin', name: 'Race Fin', does: 'Holds the sand hard; a carve loads slowly.', mult: { grip: 1.12, carveRate: 0.88 }, opens: 'rw47' },
};
export const SLOTS = ['sail', 'keel', 'hull', 'mast', 'fin'];
const STANDARD = Object.fromEntries(SLOTS.map((slot) => [slot, `${slot}.standard`]));

export class SkiffParts {
  constructor(game) {
    this.game = game; this.chosen = { ...STANDARD };
    this.hullGlaze = null;
    game.save?.section('skiffGlaze', { scope: 'player', version: 1, dump: () => ({ glaze: this.hullGlaze }), load: (d) => { this.hullGlaze = typeof d?.glaze === 'string' ? d.glaze : null; }, reset: () => { this.hullGlaze = null; } });
    this.sheet = { ...STOCK_SHEET }; this.setups = []; this.pins = {};
    game.save?.section('skiffParts', {
      scope: 'player', version: 2,
      dump: () => ({ chosen: this.chosen, sheet: this.sheet, setups: this.setups, pins: this.pins }),
      load: (d) => {
        const v2 = d && typeof d.chosen === 'object'; // (version 1 kept the parts alone)
        this.chosen = { ...STANDARD, ...((v2 ? d.chosen : d) || {}) }; this.sheet = cleanSheet(v2 ? d.sheet : null);
        this.setups = v2 && Array.isArray(d.setups) ? d.setups.slice(0, SETUPS).map((S, i) => ({ name: String(S?.name || `Setup ${i + 1}`).slice(0, 24), chosen: { ...STANDARD, ...(S?.chosen || {}) }, sheet: cleanSheet(S?.sheet) })) : [];
        this.pins = v2 && d.pins && typeof d.pins === 'object' ? { ...d.pins } : {};
      },
      reset: () => { this.chosen = { ...STANDARD }; this.sheet = { ...STOCK_SHEET }; this.setups = []; this.pins = {}; },
    });
  }
  /** A slot has something to tune once any part of it but the standard is open; the sheet once any slot has (SKIFF-TUNING.md 2.7). */
  slotOpen(slot) { return Object.entries(PARTS).some(([id, P]) => P.slot === slot && P.opens && this.open(id)); }
  get sheetOpen() { return SLOTS.some((slot) => this.slotOpen(slot)); }
  sliderOpen(id) { return !!TUNE.sliders[id] && this.slotOpen(TUNE.sliders[id].slot); }
  /** One slider to a whole step in -3 .. +3 (0 is stock), if it is open. */
  setSlider(id, v) {
    if (!this.sliderOpen(id)) return false;
    const value = cleanSheet({ [id]: v })[id]; if (value === this.sheet[id]) return false;
    this.sheet[id] = value; this.game.save?.dirty('skiffParts');
    this.game.events?.emit('skiff.tune', { slider: id, value, by: 'courier' });
    return true;
  }
  /** The sheet as it counts: a slider whose slot is shut reads 0. */
  get liveSheet() { return Object.fromEntries(Object.keys(TUNE.sliders).map((id) => [id, this.sliderOpen(id) ? this.sheet[id] || 0 : 0])); }
  /** STOCK (standard parts, the sheet at 0: a time of skill alone) or OPEN. */
  recordClass() { return recordClass(this.chosen, this.liveSheet); }
  /** The Performance Index of what is worn on a track (world/raceway/track.js's output): the reference race on stock against on this. */
  pi(T) {
    if (!T) return 100;
    const stock = (this._stock ||= {})[T.id] ??= refLap(T, () => 1, { race: true }).seconds;
    return piOf(refLap(T, (k) => this.mult(k), { race: true }).seconds, stock);
  }
  /** Keep what is worn as setup `i` (0 .. SETUPS - 1), named. */
  saveSetup(i, name) {
    if (!(i >= 0 && i < SETUPS)) return false;
    this.setups[i] = { name: String(name || this.setups[i]?.name || `Setup ${i + 1}`).slice(0, 24), chosen: { ...this.chosen }, sheet: { ...this.sheet } };
    this.game.save?.dirty('skiffParts'); this.game.events?.emit('skiff.setup', { i, how: 'save', by: 'courier' });
    return true;
  }
  /** Wear setup `i`: its parts (those still open) and its sheet. */
  wear(i) {
    const S = this.setups[i]; if (!S) return false;
    for (const slot of SLOTS) { const id = S.chosen[slot]; this.chosen[slot] = this.open(id) ? id : STANDARD[slot]; }
    this.sheet = cleanSheet(S.sheet); this.game.save?.dirty('skiffParts');
    this.game.events?.emit('skiff.setup', { i, how: 'wear', by: 'courier' });
    return true;
  }
  /** Pin setup `i` to a track (null unpins): worn when a run there begins. */
  pin(track, i) { if (i == null) delete this.pins[track]; else if (this.setups[i]) this.pins[track] = i; else return false; this.game.save?.dirty('skiffParts'); return true; }
  wearPinned(track) { const i = this.pins[track]; return i != null ? this.wear(i) : false; }
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
  /** The product of the chosen parts' multipliers and the sheet's for one number (1 where none touches it). */
  mult(key) { let k = 1; for (const id of Object.values(this.chosen)) k *= PARTS[id]?.mult?.[key] ?? 1; return k * tuneMult(this.liveSheet, key); } // (the parts, then the sheet)
}
