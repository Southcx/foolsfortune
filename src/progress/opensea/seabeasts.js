// ---------------------------------------------------------------------------------------
// THE SEA'S BEASTS (docs/plans/OPEN-SEA.md section 14.3; the owner, 2026-10-27: "the ship combat feels shallow"): every Egregore that
// fights the ship, as numbers. The sea serpent was the first (seaserpent.js, its row kept as it is); these are the territorial ones that
// defend a radius (leave it and they let you go: Monster Hunter's), and the hostile legend. Each is built from the serpent's four move
// kinds (ram, spit, coil, dive), each with its one answer, plus ONE signature that is its myth, with an answer a mount gives
// (progress/rail/mounts.js SEA_MOUNTS), so a beast asks for a tool and teaches its story by being fought:
//   the akhlut (wolfWhale)      the BREACH: a leap that lands where the ship will be (its ring leads you): change speed, never course
//   the umibozu (seaMonk)       the GRIP: it holds the hull and pours the sea in, as the tale's monk asks for a ladle to fill your boat;
//                               the answer is the tale's (a ladle with no bottom): the Lockheart's gulp drinks what it pours, or shoot its eyes
//   the kraken (bigSquid)       its ARMS are parts (the boss law: each owns a move and shows the gold line while it can be hit); INK hides
//                               the water's tells, and the Dreamvane's sonar reads through it
//   Jormungandr (worldSerpent)  three phases: it CIRCLES (its body a wall round the ship; through only where it dives), RISES (a fan of
//                               outlined spit), then COILS THE WORLD (a ring closing over 20 real s: out through the gap, or its head at the peak)
// Its mind is assembled from creatures/ai/ (Petra's), its body Calissa's, its voice Wanda's; these rows are what they read.
//
// WHAT A KILL PAYS: as the serpent's (seaserpent.js, ruled 2026-10-22): `give.minutes` of play at the aim, the fight and the sail to it
// with a hostile's premium, x0.75 .. x1.25 by the hull kept (skill skips grind). Territorial beasts are fights you choose, so they pay a
// little less than a hunter for their time; the legend once a game day a sea.
//
// Prior art: Monster Hunter (a territory left is a fight ended; each monster's one signature), Sea of Thieves (the Kraken's tentacles,
// the Megalodon's circling), Shadow of the Colossus (a legend fought in phases), the tales themselves (Inuit akhlut, Japanese umibozu,
// Norse kraken and Jormungandr: the answer is in the story).
//
//   SEA_BEASTS[id] = { cls, hp, speed, sense? | zone?, leash?, weak, parts?, phases?, once?, give, moves: { [id]: { windup, hits?, shot?,
//   answer, cooldown, hold?, lead?, fill?, every? } } }   beastPay(id, hullLeft, bears) -> cubes   ANSWERS (each answer and its mount)
//   LAIRS[id] = { every | daily, when? }   lairsOf(grid, seed, day) -> [{ id, square, when? }] (where each beast lives: OPEN-SEA.md 14.9)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SEA_SERPENT } from './seaserpent.js';
import { EGREGORES } from './safari.js';
import { seeded } from '../../core/rng.js';

/** Each answer a beast's move asks, and the mount that gives it at sea (SEA_MOUNTS); the helm's own answers need none. */
export const ANSWERS = {
  steer: null, speed: null, read: 'dreamvane', parry: null, shoot: 'psygun', gulp: 'lockheart', harpoon: 'sondelass', toll: 'crucibelle', flash: 'veritome', slick: 'soulbrush', escape: null,
};

export const SEA_BEASTS = {
  seaSerpent: SEA_SERPENT,
  // the akhlut: a wolf that is a whale, fury's hunter; quick (11 m/s: faster than cruise, slower than full sail's 15), it breaches
  wolfWhale: {
    cls: 2, hp: 45, speed: 11, zone: 60, leash: 1.6, weak: 'head', // (leash: x its zone, the ship past it and it turns home)
    give: { minutes: 5, kept: [0.75, 1.25], material: 'edge' },
    moves: {
      ram:    { windup: 1.2, hits: 1, answer: 'steer', cooldown: 5 },
      dive:   { windup: 0.5, answer: 'read', cooldown: 3 },
      breach: { windup: 1.8, hits: 2, answer: 'speed', cooldown: 9, lead: 1.8 }, // (lands where the ship will be in `lead` s at its speed now: change speed and it misses)
    },
  },
  // the umibozu: a dark monk risen out of a calm night sea; slow (4 m/s), it rises beside you and asks for a ladle
  seaMonk: {
    cls: 2, hp: 50, speed: 4, zone: 50, leash: 1.4, weak: 'eyes',
    give: { minutes: 5, kept: [0.75, 1.25], material: 'eldritch' },
    moves: {
      rise: { windup: 2.5, answer: 'read', cooldown: 6 },                               // (up at the beam: where its grip comes from)
      grip: { windup: 2.0, hits: 1, answer: 'gulp', cooldown: 12, hold: 8, fill: 4 },    // (holds the hull `hold` s, a hit each `fill` s as it pours; the gulp drinks it out, or its eyes shot let go)
      dive: { windup: 0.5, answer: 'read', cooldown: 4 },
    },
  },
  // the kraken: arms as parts round the ship, the head under them; dread's deep
  bigSquid: {
    cls: 3, hp: 120, speed: 6, zone: 90, leash: 1.5, weak: 'head',
    parts: { arm: { n: 6, hp: 15, moves: ['grasp', 'slam'] }, head: { hp: 30, moves: ['ink'], open: 'arms' } }, // (the head can be hit once two arms are off)
    give: { minutes: 12, kept: [0.75, 1.25], material: 'arcane' },
    moves: {
      grasp: { windup: 1.6, hits: 1, answer: 'shoot', cooldown: 7, hold: 4 },  // (an arm round the hull: the helm held, shoot that arm)
      slam:  { windup: 1.2, hits: 1, answer: 'steer', cooldown: 6 },           // (an arm brought down on a ring)
      ink:   { windup: 1.0, answer: 'read', cooldown: 15, hold: 6 },           // (the water's tells hidden `hold` s: the sonar reads through it)
    },
  },
  // Jormungandr: the world serpent, gall's legend, once a game day a sea, fought in three phases by its hp left
  worldSerpent: {
    cls: 4, hp: 300, speed: 14, sense: 300, weak: 'head', once: 'gameDay',
    phases: [{ until: 0.66, moves: ['circle', 'dive'] }, { until: 0.33, moves: ['rise', 'spit', 'dive'] }, { until: 0, moves: ['coilWorld', 'rise'] }],
    give: { minutes: 30, kept: [0.75, 1.25], material: 'eldritch', part: 'legend' },
    moves: {
      circle:    { windup: 2.0, answer: 'read', cooldown: 14, hold: 12 },               // (its body a ring 250 m round the ship; crossing it is a ram, but where it dives the ring is open)
      dive:      { windup: 0.6, answer: 'read', cooldown: 4 },
      rise:      { windup: 1.6, hits: 1, answer: 'steer', cooldown: 7 },
      spit:      { windup: 1.1, shot: 'outlined', answer: 'parry', cooldown: 6, every: 5 }, // (a fan of `every` globs: parry the one aimed true, steer from the rest)
      coilWorld: { windup: 3.0, hits: 3, answer: 'escape', cooldown: 24, hold: 20 },     // (a ring closing over `hold` s: out through its gap, or its head at the peak)
    },
  },
};

/** What a beast sunk by the Courier pays: its `give.minutes` of play at the aim, from `kept[0]` (the hull at its last hit) to `kept[1]`
 *  (whole) by the share of the hull's hits left (seaserpent.js serpentPay's rule, any beast). */
export function beastPay(id, hullLeft, bears) {
  const G = SEA_BEASTS[id]?.give; if (!G) return 0;
  const k = bears > 1 ? Math.max(0, Math.min(1, (hullLeft - 1) / (bears - 1))) : 1;
  return Math.round(G.minutes * ECON.perMinute * (G.kept[0] + (G.kept[1] - G.kept[0]) * k));
}

/** Where the beasts live (OPEN-SEA.md 14.9; Petra's ask, 2026-10-27: "where do the beasts live?"): each in the squares its myth allows
 *  (safari.js `lives`: rows off the lanes, the Law or Chaos half) and no tamer than one class under it; one in `every` of those is its
 *  lair, the same all build (a territory is kept: Monster Hunter's), or `daily` a game day (the legend moves). `when`: the hours or
 *  weather it is up (the umibozu's calm night, or dread). One beast a square, the rarer placed first. */
export const LAIRS = {
  worldSerpent: { daily: 1 },
  bigSquid:     { every: 3 },
  seaMonk:      { every: 3, when: { phase: 'night', weather: 'dread' } }, // (up at night or under dread: either)
  wolfWhale:    { every: 4 },
  seaSerpent:   { every: 4 },   // (as seafight.js laid them first)
};

export function lairsOf(grid, seed = 1, day = 0) {
  const out = [], used = new Set();
  for (const [id, L] of Object.entries(LAIRS)) {
    const E = EGREGORES[id]; if (!E) continue;
    const fit = grid.squares.filter((sq) => !sq.lane && !used.has(sq.id) && sq.off >= E.lives.off && (!E.lives.law || Math.sign(sq.law) === E.lives.law || sq.law === 0) && sq.cls >= E.cls - 1);
    if (!fit.length) continue;
    let picked;
    if (L.daily) { const r = seeded((seed * 911 + day * 7919) >>> 0); picked = Array.from({ length: L.daily }, () => fit[Math.floor(r() * fit.length)]); }
    else {
      const hash = (sq) => (Math.imul(sq.col + 1, 73856093) ^ Math.imul(sq.row + 1, 19349663) ^ Math.imul(id.length + id.charCodeAt(0), 83492791) ^ seed) >>> 0;
      picked = fit.filter((sq) => hash(sq) % L.every === 0); if (!picked.length) picked = [fit.reduce((a, b) => (hash(a) < hash(b) ? a : b))];
    }
    for (const sq of picked) { if (used.has(sq.id)) continue; used.add(sq.id); out.push({ id, square: sq.id, ...(L.when ? { when: L.when } : {}) }); }
  }
  return out;
}
