// ---------------------------------------------------------------------------------------
// THE SEA SERPENT (docs/plans/OPEN-SEA.md section 7; the owner, 2026-10-20: "a Marlin-Class test enemy (like a simple to animate sea
// serpent) as part of a vertical slice"): the open sea's first hostile Egregore, a class 2 (Marlin), fought from the free helm. Its body
// is a chain of segments (a spine the animation drives as a wave: no rig, so it is simple to animate), its head the one weak point. It
// is hostile by nature (safari.js): inside its `sense` it hunts the ship. These are its numbers and its moves; its mind is assembled
// from creatures/ai/ (Petra's), its body and look Calissa's, its sound Wanda's.
//
// Each move is a windup the Figment attack telegraph draws (a ring on the water where it will rise, the fill its timing) and one
// answer: steer out (the ram), parry (the spit, an outlined shot), or shoot the head while it is up (the coil). It dives between moves
// and surfaces where the sea shows its wake, so reading the water is the skill. Down, it sinks, and a photograph of it in its habit
// (the coil, the spit) pays as a plate does.
//
// Prior art: Monster Hunter's Lagiacrus and Plesioth (a sea monster that dives and resurfaces; read the water); The Legend of Zelda: The
// Wind Waker's Big Octos and sea creatures fought from the boat; Sea of Thieves' Kraken and Megalodon (a hunter that circles the ship).
//
// WHAT IT PAYS (Dovina, 2026-10-22, with Petra's fight measured: about 50 real s of perfect aim, two or three real minutes of ordinary
// play, and the sail to its lair): a kill is priced by its own time, not as a hunt of its class. ECON.hunt's Marlin is 20 minutes of
// play (160 cubes), and a sea has about 8 lairs a game day (safari.js gives the serpent 32 squares; seafight.js lairs one in four), so a
// hunt's worth a kill would be about 2.7x the aim an hour for a sailor who only hunts. Instead a kill pays `give.minutes` of play at the
// aim (its fight and the sail to it, with a hostile's premium), more for the hull you kept (`give.kept`: a hull kept whole pays the top,
// one at its last hit the bottom): skill skips grind (the design laws). Hunting alone, lair to lair, comes to about 0.8x the aim.
// The posted bounty (Letty's board, `bountyCls`) and the material are not wired yet: the board posts none, and the materials table has
// no serpent scale.
//
//   SEA_SERPENT = { cls, hull, segments, length, speed, weak, sense, give, moves: { [id]: { windup, hits?, shot?, answer, cooldown } } }
//   serpentPay(hullLeft, bears) -> cubes
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

export const SEA_SERPENT = {
  cls: 2,                 // (Marlin: econ/emocean.js CLASSES)
  hp: 60,                 // (hits of the ship's gun to sink it: about two real minutes of a sloop's fire with the head up a third of the time)
  segments: 14, length: 30, speed: 9,   // (metres a real second swimming; the sloop cruises at about 10, so it keeps pace and cannot outrun a full sail)
  weak: 'head',           // (the head takes x3; the coils x0.5)
  sense: 120,             // (metres: inside it, it hunts)
  give: { minutes: 6, kept: [0.75, 1.25], bountyCls: 2, material: 'serpent scale' },  // (a kill's pay: 6 minutes of play at the aim, x0.75 .. x1.25 by the hull kept: 36 to 60 cubes; bounty and material not wired)
  moves: {
    ram:   { windup: 1.4, hits: 1, answer: 'steer', cooldown: 6 },      // (rises under the bow's path: the ring is where it breaks the surface)
    spit:  { windup: 0.9, shot: 'outlined', answer: 'parry', cooldown: 4 }, // (a glob of crude; parried, it goes back at the head)
    coil:  { windup: 2.0, hits: 1, answer: 'shoot', cooldown: 10, hold: 5 }, // (wraps the ship for `hold` s: the helm turns half; shoot the head to break it)
    dive:  { windup: 0.5, answer: 'read', cooldown: 3 },                 // (under for 3 to 6 s; its wake shows where it comes up)
  },
};

/** What a sea serpent sunk by the Courier pays: `give.minutes` of play at the aim, scaled from `kept[0]` (the hull at its last hit) to
 *  `kept[1]` (the hull whole) by the share of the hull's hits left. */
export function serpentPay(hullLeft, bears) {
  const G = SEA_SERPENT.give, k = bears > 1 ? Math.max(0, Math.min(1, (hullLeft - 1) / (bears - 1))) : 1;
  return Math.round(G.minutes * ECON.perMinute * (G.kept[0] + (G.kept[1] - G.kept[0]) * k));
}
