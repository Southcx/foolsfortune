// ---------------------------------------------------------------------------------------
// THE EGREGORES' HABITS AS RESEARCH (docs/plans/OPEN-SEA.md 15.1; South, 2026-10-27, "determine what else we can fold in"): each species
// of the sea has four habits, each shown only under its own condition (an hour, a feeling's weather, how near you come, the ship at full
// sail, the Veritome's flash), and its myth's: the selkie sheds its skin at dusk, St Elmo's fire crowns the mast in a storm, the ningyo
// weeps in grief, the umibozu asks for a ladle when you come close. A plate taken while a habit shows catches it; each habit caught the
// first time pays a share of a hunt of its class, once, at the next dock, and a species' research level is how many of its four you have.
// Re-sailing at another hour or in another weather finds more: the sea is a place to come back to (New Pokemon Snap's research levels).
//
// Prior art: New Pokemon Snap (research levels, the illumina orb that shows a behaviour: the Veritome's flash here, OPEN-SEA.md 14.2),
// Pokemon Snap's professor (paid for the picture), Monster Hunter's research points by behaviour, the myths themselves.
//
//   HABITS[species] = [{ id, label, when: { phase?, weather?, near?, full?, flash? } }]   habitNow(species, ctx) -> habit | null
//   (ctx: { phase, weather, dist, full, flash }; the first habit whose `when` holds, most particular first)   researchOf(L, species) -> 0..4
//   habitFee(cls) -> cubes   HABIT (its numbers)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** share: a hunt of the class (ECON.hunt) a habit's first plate pays; levels: habits caught for each research level. */
export const HABIT = { share: 0.15, levels: [1, 2, 3, 4] };

/** The habits, by species (safari.js EGREGORES ids; the words placeholders for Espada's). `when`: phase 'day'|'dusk'|'night'|'dawn',
 *  weather an aspect or 'fair', near (m: inside), full (the ship at full sail), flash (the Veritome's flash within its hold). */
export const HABITS = {
  sealFolk:     [{ id: 'shed', label: 'sheds its skin', when: { phase: 'dusk' } }, { id: 'sing', label: 'sings', when: { phase: 'night' } }, { id: 'bask', label: 'basks', when: { phase: 'day', weather: 'fair' } }, { id: 'startle', label: 'startles', when: { near: 25 } }],
  seaLights:    [{ id: 'crown', label: 'crowns the mast', when: { near: 30, weather: 'fury' } }, { id: 'dance', label: 'dances in the storm', when: { weather: 'fury' } }, { id: 'gather', label: 'gathers', when: { phase: 'night' } }, { id: 'fade', label: 'fades', when: { phase: 'dawn' } }],
  horseHerd:    [{ id: 'race', label: 'races the ship', when: { near: 40, full: true } }, { id: 'rear', label: 'rears', when: { flash: true } }, { id: 'gallop', label: 'gallops', when: { phase: 'day' } }, { id: 'graze', label: 'grazes the swell', when: { weather: 'fair' } }],
  fishPeople:   [{ id: 'weep', label: 'weeps pearls', when: { weather: 'grief' } }, { id: 'comb', label: 'combs its hair', when: { phase: 'day', weather: 'fair' } }, { id: 'sing', label: 'sings', when: { phase: 'dusk' } }, { id: 'dive', label: 'dives', when: { near: 40 } }],
  wolfWhale:    [{ id: 'howl', label: 'howls', when: { phase: 'night' } }, { id: 'breach', label: 'breaches', when: { full: true } }, { id: 'hunt', label: 'hunts', when: { weather: 'fury' } }, { id: 'patrol', label: 'patrols', when: {} }],
  seaSerpent:   [{ id: 'coil', label: 'coils', when: { near: 60 } }, { id: 'spit', label: 'spits', when: { flash: true } }, { id: 'bask', label: 'basks', when: { phase: 'day', weather: 'fair' } }, { id: 'swim', label: 'swims', when: {} }],
  seaMonk:      [{ id: 'ask', label: 'asks for a ladle', when: { near: 50 } }, { id: 'stare', label: 'stares', when: { weather: 'dread' } }, { id: 'rise', label: 'rises', when: { phase: 'night' } }, { id: 'sink', label: 'sinks', when: { phase: 'dawn' } }],
  islandWhale:  [{ id: 'sing', label: 'sings', when: { phase: 'night' } }, { id: 'spout', label: 'spouts', when: { phase: 'day' } }, { id: 'sleep', label: 'sleeps', when: { weather: 'fair' } }, { id: 'surface', label: 'surfaces', when: {} }],
  ghostShip:    [{ id: 'hail', label: 'hails you', when: { near: 150, weather: 'grief' } }, { id: 'glow', label: 'glows', when: { phase: 'dusk' } }, { id: 'vanish', label: 'vanishes', when: { flash: true } }, { id: 'sail', label: 'sails', when: {} }],
  bigSquid:     [{ id: 'ink', label: 'inks', when: { near: 90 } }, { id: 'grasp', label: 'grasps', when: { flash: true } }, { id: 'rise', label: 'rises', when: { phase: 'night' } }, { id: 'drift', label: 'drifts', when: {} }],
  worldSerpent: [{ id: 'ouroboros', label: 'bites its tail', when: { phase: 'dawn' } }, { id: 'rise', label: 'rises', when: { near: 300 } }, { id: 'sleep', label: 'sleeps', when: { weather: 'fair' } }, { id: 'circle', label: 'circles', when: {} }],
};

const holds = (w, c) => (!w.phase || w.phase === c.phase) && (!w.weather || w.weather === (c.weather || 'fair')) && (!w.near || (c.dist ?? Infinity) <= w.near) && (!w.full || c.full) && (!w.flash || c.flash);
const particular = (w) => Object.keys(w).length;

/** The habit a species shows now, or null: the most particular whose condition holds (a storm's crown before a plain dance). */
export function habitNow(species, ctx = {}) {
  const list = HABITS[species]; if (!list) return null;
  let best = null; for (const h of list) if (holds(h.when, ctx) && (!best || particular(h.when) > particular(best.when))) best = h;
  return best;
}

/** A species' research level: how many of its habits the ledger has had a plate of (`sea.habit.<species>.<habit>`). */
export const researchOf = (L, species) => (HABITS[species] || []).filter((h) => L.get(`sea.habit.${species}.${h.id}`) > 0).length;

/** What a habit's first plate pays: a share of a hunt of its class (ECON.hunt minutes at the aim). */
export const habitFee = (cls = 0) => Math.round(HABIT.share * ECON.hunt.minutes[Math.max(0, Math.min(4, cls))] * ECON.perMinute);
