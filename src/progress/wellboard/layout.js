// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS LAYOUT (docs/plans/WELL-BOARD.md; ENDGAME.md 3.1; South, 2026-10-31: a Well run as a board of spaces moved
// across on your own dice): the numbers of the board and how one floor of it is laid from a seed. A board is floors laid end to end;
// a floor is a RING: a main line of spaces from where you come in round to its door and back to its first space, with one side line that forks off the main line and joins it
// again: a SHORT CUT (fewer spaces, hazards on it) or a LONG WAY (more spaces, caches and a spring on it). The last floor's door is
// the FOE's space. A floor is laid only from (seed, depth), so the same seed lays the same board for everyone (wellSeed(well, day):
// the game day's Well), a floor is laid when a seat first comes down to it, and a board has no last floor unless the rules give one
// (the endless Well: ENDGAME.md 2, GAPS G88).
//
// A data module: no three.js, so the simulator (scripts/wellboard.mjs) lays the boards the game does.
//
// Prior art: Mario Party's and Fortune Street's boards (spaces with one job each, a fork as the board's one decision of route, a space
// that stops you whatever you threw); Slay the Spire's map (the route read ahead: what a path holds is known before it is taken);
// Snakes and Ladders (a space that moves you, its distance printed on it); Dokapon Kingdom (a loot space taken once); Shiren the
// Wanderer (deeper is the same kinds, dearer).
//
//   BOARD (the numbers)   KINDS { kind: { label, line, lands } }   layOut(seed, depth, { last }) -> floor { depth, spaces: { id: space }, first, door }
//   space { id, kind, depth, next: [ids], x, y, side?, shift?, odds? }   MOUTH (the space every seat starts on)   tierAt(depth)
//   kinds: mouth, fight, genre (a trial), cache, spring, hazard, shift, rest, shop, item, arcana, door, foe
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

/** The board's numbers, each with its reason.
 *  `dice`: the standard set's six that move you (the d% never moves: it is the fate die, thrown for a hazard's save). Their mean
 *  faces sum to 33, so one cast of the whole set is about one floor and its door: a floor is 12 spaces on the main line.
 *  `bears`: cracks a seat bears before it falls (the vessel's four regions: mask, torso, arms, legs; the runtime's real cracks).
 *  `need`: floors (fights, trials) cleared at a depth before its door opens or its FOE wakes: "a material for each floor whose
 *  creatures are all down" (the haul's own rule), so a floor of the board is worked, not crossed.
 *  `floors`: floors before the FOE's space in a story run (the Great Dunemaw's three). `foeEvery`: in the endless Well, a FOE's
 *  space closes every third floor.
 *  `deck`: what a floor's main line holds between its first space and its door (11 spaces), shuffled by the seed.
 *  `save`: a hazard's save on the fate die, a share, falling `saveDeeper` a floor (never under `saveFloor`).
 *  `shift`: how far a shift space moves you, back or on. `side`: the two side lines, a floor has one.
 *  `rerolls`: Luck's re-rolls a run when the runtime gives none (`game.rerolls.left()`, progress/dice.js).
 *  The rest are the board game's own (WELL-BOARD.md 11): what a seat may hold, what a duel, a snare, a stray and an award are worth. */
export const BOARD = {
  dice: [4, 6, 8, 10, 12, 20],
  fate: 100,
  bears: 4,
  need: 2,
  floors: 3,
  foeEvery: 3,
  main: 12,
  deck: { fight: 3, genre: 1, cache: 1, spring: 1, hazard: 1, shift: 1, arcana: 1, item: 1 }, // (and a tenth by the floor: a rest on the odd floors, a shop on the even)
  save: 0.6, saveDeeper: 0.05, saveFloor: 0.3,
  shift: [-3, -2, 2, 3, 4],
  side: {
    short: { from: [1, 3], skips: [4, 5], len: 2, deck: ['hazard', 'fight'] },
    long: { from: [1, 3], skips: [2, 3], len: 5, deck: ['cache', 'shop', 'spring', 'fight', 'rest'] },
  },
  rerolls: 1,
  hold: 3,          // (items a seat may hold: Mario Party's three)
  duel: 15,         // (cubes a duel's winner takes where the loser holds no haul)
  duelRest: 2,      // (rounds a seat that has duelled is left alone: a pack on one ring is not one long brawl)
  snare: 15,        // (cubes a snare takes for its setter)
  stray: { steps: 4, cubes: 15, from: [4, 9] }, // (a ring's stray: a d4 a round along the main line; what downing it pays; where it starts)
  award: 15,        // (a bonus award's worth at the standings: Mario Party's bonus stars)
};

/** The kinds of space: the label and the one line the player reads (CLARITY.md: a genre word, one line of effect), and what landing
 *  asks: `floor` (a floor is played: the runtime's, its outcome handed back), `take`, `mend`, `save` (the fate die), `move`,
 *  `recast`, `stop` (never passed: whatever you threw ends here). Plain names until South calls the board final. */
export const KINDS = {
  mouth: { label: 'Mouth', line: 'Where the run begins. The way up.', lands: null },
  fight: { label: 'Fight', line: 'A floor of creatures. Clear it for a material; fail and take a crack.', lands: 'floor' },
  genre: { label: 'Trial', line: 'A floor of another kind of game. Clear it for a material of a tier higher.', lands: 'floor' },
  cache: { label: 'Cache', line: 'A material, taken once.', lands: 'take' },
  spring: { label: 'Spring', line: 'Mends one crack. With none, your smallest spent die comes back.', lands: 'mend' },
  hazard: { label: 'Hazard', line: 'Throw the fate die. Under its save, take a crack.', lands: 'save' },
  shift: { label: 'Shift', line: 'The Well moves you the spaces it shows.', lands: 'move' },
  rest: { label: 'Rest', line: 'Every spent die comes back.', lands: 'recast' },
  shop: { label: 'Shop', line: 'Buy one item with the cubes this run has found.', lands: 'shop' },
  item: { label: 'Item', line: 'A random item. With your hands full, cubes.', lands: 'item' },
  arcana: { label: 'Arcana', line: 'Draw a Major Arcana. It does what it says, for good or ill.', lands: 'arcana' },
  door: { label: 'Door', line: 'Stops you. Opens down once two floors here are cleared; shut, it sends you round again. The way up.', lands: 'stop' },
  foe: { label: 'FOE', line: 'Stops you. The FOE wakes once two floors here are cleared; asleep, the space sends you round again.', lands: 'floor' },
};

export const MOUTH = 'mouth';
/** A material's tier at a depth (SLICE.md: tier = floor - 1 at its base; the rest is the run's). */
export const tierAt = (depth) => Math.min(4, depth);
/** A hazard's save at a depth, as a share. */
export const saveAt = (depth) => Math.max(BOARD.saveFloor, BOARD.save - BOARD.saveDeeper * depth);

const shuffled = (r, a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = r.int(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const deckOf = (D) => Object.entries(D).flatMap(([k, n]) => Array(n).fill(k));

/** One floor of the board. `last`: its door is the FOE's space. The first space of a floor is always a fight (you come down into
 *  the floor's creatures, as the Great Dunemaw's floors begin), so the deck's other fights are two. Coordinates are a draft's: x a
 *  space along the main line, y -1 a short cut, +1 a long way. */
export function layOut(seed, depth, { last = false } = {}) {
  const r = seeded((seed ^ Math.imul(depth + 1, 0x9e3779b1)) >>> 0), B = BOARD, n = B.main;
  const id = (i) => `${depth}.${i}`, sid = (j) => `${depth}.s${j}`;
  const deck = deckOf(B.deck); deck.splice(deck.indexOf('fight'), 1); deck.push(depth % 2 ? 'rest' : 'shop');
  let kinds;
  for (let tries = 0; tries < 20; tries++) { // (no two hazards side by side, and no shift beside the door: a floor never reads as a trap)
    kinds = ['fight', ...shuffled(r, deck)];
    if (!kinds.some((k, i) => k === 'hazard' && kinds[i + 1] === 'hazard') && kinds[n - 2] !== 'shift') break;
  }
  const spaces = {};
  for (let i = 0; i < n; i++) {
    const kind = i === n - 1 ? (last ? 'foe' : 'door') : kinds[i];
    const s = spaces[id(i)] = { id: id(i), kind, depth, next: i === n - 1 ? [] : [id(i + 1)], x: i, y: 0 };
    if (kind === 'hazard') s.odds = saveAt(depth);
    if (kind === 'shift') { // (never past the door, never before the floor's first space, never onto another shift)
      const reach = B.shift.filter((d) => i + d >= 0 && i + d <= n - 1 && kinds[i + d] !== 'shift');
      s.shift = reach.length ? r.pick(reach) : 0;
    }
  }
  // the side line: off the main line at `a`, back onto it at `b`
  const which = r.chance(0.5) ? 'short' : 'long', S = B.side[which];
  const a = S.from[0] + r.int(S.from[1] - S.from[0] + 1), b = Math.min(n - 1, a + 1 + S.skips[0] + r.int(S.skips[1] - S.skips[0] + 1));
  for (let j = 0; j < S.len; j++) {
    const s = spaces[sid(j)] = { id: sid(j), kind: S.deck[j], depth, side: which, next: [j === S.len - 1 ? id(b) : sid(j + 1)], x: a + ((j + 1) * (b - a)) / (S.len + 1), y: which === 'short' ? -1 : 1 };
    if (s.kind === 'hazard') s.odds = saveAt(depth);
  }
  spaces[id(a)].next.push(sid(0));
  return { depth, spaces, first: id(0), door: id(n - 1), side: { which, from: id(a), to: id(b) } };
}
