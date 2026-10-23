// ---------------------------------------------------------------------------------------
// THE SAFARI (docs/plans/OPEN-SEA.md section 5): the open sea's Egregores, met where they live and photographed with the Veritome. An
// Egregore is a thought-form of real human myth (LORE.md), so the safari is myth-spotting. What each does when the ship comes near is its
// DISPOSITION (Monster Hunter's: most of the sea minds its own business; a few are hostile by nature and hunt you):
//   passive      ignores the ship; photograph it at leisure
//   wary         dives or flees inside its `shy` (metres): come in slow, or from downwind
//   territorial  attacks inside its `zone` and stops when you leave it
//   hostile      hunts the ship inside its `sense` (the sea serpent, the Marlin-class test: seaserpent.js)
// A PLATE of one is scored as Pokemon Snap scores a photo: how much of the frame it fills (best near a third), how centred, whether it
// faces you, and a bonus for a HABIT caught in the act (a breach, a call, a feed). The score is 1 to 4 stars; the first plate of a
// species pays by its class and stars, a better one later pays the difference (the professor pays for an improvement, never twice).
// The plate also counts toward familiarity (progress/familiarity.js), as every plate does.
//
// Prior art: Pokemon Snap (the score's parts, the habits, the professor paying for a better photo); Monster Hunter's ecology (monsters
// that ignore you, are territorial, or hunt); Wind Waker's sea (each square its creature); the Veritome's own plates (tools/veritome/).
//
//   EGREGORES[id] = { feel, cls, disposition, size, habits, lives: { off, law?, phase?, weather? }, shy?, zone?, sense?, weight }   (names: placeholders,
//     each its myth in a comment; Espada's to name when the open sea is called final)
//   sightings(square, { phase, weather }) -> [{ id, weight }]   plateScore({ fill, centre, facing, habit }) -> { score, stars }
//   platePay(id, stars, bestBefore = 0) -> cubes
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SEA_SERPENT } from './seaserpent.js';

/** The open sea's Egregores, small to great. `lives.off` the rows off the lane it keeps to (at least), `lives.law` its end of the line
 *  (-1 the Law half, +1 the Chaos half, 0 either), `phase` / `weather` when it is about at all. `weight` how often it is met there.
 *  `feel` its feeling, read from its myth (Calissa's reading, ruled 2026-10-23; the bodies' colour, vfx/opensea/egregorebodies.js). */
export const EGREGORES = {
  sealFolk:     { feel: 'grief', cls: 0, disposition: 'wary', shy: 25, size: 2, habits: ['bask', 'shed'], lives: { off: 1, law: -1 }, weight: 3 },          // (the selkie)
  seaLights:    { feel: 'wonder', cls: 0, disposition: 'passive', size: 1, habits: ['gather'], lives: { off: 1, phase: 'night' }, weight: 3 },               // (St Elmo's fire, corposants)
  horseHerd:    { feel: 'mirth', cls: 1, disposition: 'passive', size: 3, habits: ['gallop', 'rear'], lives: { off: 1 }, weight: 2 },                        // (the hippocamp)
  fishPeople:   { feel: 'desire', cls: 1, disposition: 'wary', shy: 40, size: 1.5, habits: ['sing', 'dive'], lives: { off: 2, law: 1 }, weight: 2 },          // (the ningyo)
  wolfWhale:    { feel: 'fury', cls: 2, disposition: 'territorial', zone: 60, size: 8, habits: ['breach', 'howl'], lives: { off: 2, law: -1 }, weight: 1.5 }, // (the akhlut)
  seaSerpent:   { feel: 'dread', cls: 2, disposition: 'hostile', sense: 120, size: 30, habits: ['coil', 'spit'], lives: { off: 2 }, weight: 1.5, fight: SEA_SERPENT },           // (the sea serpent: the test enemy)
  seaMonk:      { feel: 'dread', cls: 2, disposition: 'territorial', zone: 50, size: 12, habits: ['rise', 'stare'], lives: { off: 2, phase: 'night', weather: 'dread' }, weight: 1 }, // (the umibozu)
  islandWhale:  { feel: 'wonder', cls: 3, disposition: 'passive', size: 120, habits: ['surface', 'spout'], lives: { off: 3 }, weight: 0.6 },                  // (the aspidochelone: an islet that is a whale; it dives)
  ghostShip:    { feel: 'grief', cls: 3, disposition: 'wary', shy: 150, size: 40, habits: ['hail', 'vanish'], lives: { off: 2, weather: 'grief' }, weight: 0.6 }, // (the Flying Dutchman)
  bigSquid:     { feel: 'dread', cls: 3, disposition: 'territorial', zone: 90, size: 50, habits: ['grasp', 'ink'], lives: { off: 3, law: 1 }, weight: 0.5 },   // (the kraken)
  worldSerpent: { feel: 'gall', cls: 4, disposition: 'hostile', sense: 300, size: 400, habits: ['circle', 'rise'], lives: { off: 3, law: 1 }, weight: 0.15 }, // (Jormungandr)
};

/** The Egregores that may be met in a square now, with their weights (none where the sea is too tame for them). */
export function sightings(square, { phase = 'day', weather = null } = {}) {
  const out = [];
  for (const [id, E] of Object.entries(EGREGORES)) {
    const L = E.lives;
    if (square.off < L.off) continue;
    if (L.law && Math.sign(square.law) !== L.law && square.law !== 0) continue;
    if (L.phase && L.phase !== phase && !(L.weather && L.weather === weather)) continue;
    if (L.weather && !L.phase && L.weather !== weather) continue;
    if (E.cls > square.cls + 1) continue; // (a square holds its class and one above: a front brings the one above in, LORE.md)
    out.push({ id, weight: E.weight });
  }
  return out;
}

/** A plate's score (0 .. 140) and stars (1 .. 4), from what the frame held: `fill` the share of the frame the body covers, `centre`
 *  0 .. 1 how near the middle, `facing` 0 .. 1 how much it looks at you, `habit` whether it was caught doing one of its habits. */
export function plateScore({ fill = 0, centre = 0, facing = 0, habit = false } = {}) {
  const size = Math.max(0, 1 - Math.abs(fill - 0.33) / 0.33); // (best at a third of the frame: too small is a speck, too big is a wall)
  const score = Math.round(100 * (0.45 * size + 0.3 * centre + 0.25 * facing) + (habit ? 40 : 0));
  const stars = score >= 95 ? 4 : score >= 70 ? 3 : score >= 45 ? 2 : 1;
  return { score, stars };
}

/** What a species' plate of `stars` pays, the best before it having paid already (an improvement pays the difference, a worse one nothing). */
export function platePay(id, stars, bestBefore = 0) {
  const E = EGREGORES[id]; if (!E) return 0;
  const P = ECON.openSea.plate, hunt = ECON.hunt.minutes[E.cls] * ECON.perMinute;
  const at = (s) => (s > 0 ? P[Math.min(4, s) - 1] * hunt : 0);
  return Math.max(0, Math.round(at(stars) - at(bestBefore)));
}
