// ---------------------------------------------------------------------------------------
// A MECH'S TECHNIQUES AND WHAT IT PICKS UP (docs/plans/MECHS.md 9.2; South, 2026-11-02: "environmental destruction elements and technique
// capabilities, think incredible hulk's ultimate destruction"). Ultimate Destruction's two halves at the mech's scale:
//   TECHNIQUES: moves past the plain moveset, each on keys the mech already has (a chord, a press in the air, a hold), each paid from the
//     battery, each carving the toy city as it lands (destruction.js shapes) and striking what is in reach. Grab and throw are known from
//     the start; the rest are Arts (DESIGN.md 22: arts only by achievement), each with a count way and a feat way, read from the ledger.
//   PROPS: anything loose is a weapon (Ultimate Destruction's weaponizing: the car fists, the lamp-post bat): a lamp post a club, a steel
//     girder a heavier one and a javelin, a carved-off chunk a thing to throw or a shield, a torn-off limb (joints.js: yours, a rival's,
//     a giant's) a club. Each has hits before it breaks, and its own k and reach in the hand and thrown.
// The plain moveset (mechweapons.js) is unchanged: these are modifiers on it with their source in hand or in the frame (base change bad,
// modifiers good).
//
// Prior art: The Incredible Hulk: Ultimate Destruction (2005: Thunderclap, Ground Pound, Elbow Drop, Super Jump, Wall Run kept out of
// scope, the Steel Fists from a car, the lamp post and the girder, Body Surf on a slab; moves bought from a shop of the game's own
// currency, ours earned by deeds), God of War's grab-and-use, Godzilla: Save the Earth (a building's piece thrown), Rampage, Ratchet &
// Clank's Giant Clank (the charge and the slam), Evangelion's progressive knife held in the hand.
//
//   TECHNIQUES[id] = { label, line, keys, kJ, k, stagger, carve: { kind, r }, reach, opens?: { count: [key, n], feat: [key, n] } | null }
//   PROPS[id] = { label, line, mass (t), hand: { k, reach, hits }, thrown: { k, speed }, shield?, from }
//   techniqueOpen(id, L) -> bool   techniquesOpen(L) -> [ids]   propBlow(prop, how, speedK) -> k   thrownK(prop, speed) -> k
// ---------------------------------------------------------------------------------------

/** The techniques. keys: what the runtime reads (the mech's own keys: LMB, RMB, Space, Shift, C, V, F, G); kJ: the battery it takes
 *  (a jab is free; the clay frame's battery is 48 MJ, so the dearest here is about 1/16 of it); k: a full blow's share on what it
 *  strikes (at sync 0.5; outputK multiplies); stagger: what it puts in a giant's gauge; carve: the shape it cuts out of a building where
 *  it lands (destruction.js carve: r in cells); reach: m from the frame. `fall` scales a landing move by its fall (k + fall m x it). */
export const TECHNIQUES = {
  grab: { label: 'Grab', line: 'Pick up a loose thing: a post, a girder, a chunk of building, a limb', keys: 'F near it', kJ: 0, k: 0, stagger: 0, reach: 10, opens: null },
  throw: { label: 'Throw', line: 'Throw what you hold where you aim', keys: 'RMB holding a thing', kJ: 200, k: 0, stagger: 0, reach: 0, opens: null }, // (its k the thing's own: PROPS thrown)
  thunderclap: { label: 'Thunderclap', line: 'Both hands clapped: a shock in front that staggers and breaks glass', keys: 'LMB and RMB together', kJ: 900, k: 0.35, stagger: 40, reach: 40,
    carve: { kind: 'cone', r: 40, angle: 0.5, only: 'glass' }, opens: { count: ['mech.blow', 100], feat: ['mech.stagger.both', 1] } }, // (feat: a giant staggered by blows from both arms inside a real second)
  groundPound: { label: 'Ground Pound', line: 'Both fists into the ground: everything near is thrown off its feet', keys: 'C on the ground', kJ: 1200, k: 0.6, stagger: 30, reach: 14,
    carve: { kind: 'ball', r: 6 }, opens: { count: ['mech.step', 2000], feat: ['mech.pound.fell', 1] } }, // (feat: a building's foot broken by one pound)
  elbowDrop: { label: 'Elbow Drop', line: 'From the air, down on your elbow: the higher, the harder', keys: 'C in the air', kJ: 600, k: 0.5, fall: 0.06, stagger: 25, reach: 8,
    carve: { kind: 'ball', r: 5 }, opens: { count: ['mech.jump', 150], feat: ['mech.drop.high', 1] } }, // (feat: landed from 30 m or more)
  superJump: { label: 'Super Jump', line: 'Space held, then let go: a jump two and a half times as high', keys: 'Space held 1 real s', kJ: 1500, k: 0, stagger: 0, reach: 0, jumpK: 2.5,
    opens: { count: ['mech.jump', 60], feat: ['mech.roof', 1] } }, // (feat: stood on a building's roof)
  battering: { label: 'Battering Ram', line: 'The assault boost through a building: its walls are no wall', keys: 'Shift held into a building', kJ: 0, k: 1.2, stagger: 20, reach: 6,
    carve: { kind: 'capsule', r: 4 }, opens: { count: ['mech.destroy.cells', 1500], feat: ['mech.through', 1] } }, // (feat: through a building wall to wall in one boost; its kJ the boost's own)
  uppercut: { label: 'Uppercut', line: 'W and LMB: a blow up through the chin, a giant\'s head knocked back, a roof knocked off', keys: 'W + LMB', kJ: 300, k: 0.9, stagger: 35, reach: 9,
    carve: { kind: 'ball', r: 3, up: 8 }, opens: { count: ['mech.blow.head', 40], feat: ['mech.crit', 1] } }, // (feat: a critical: a heavy blow on a staggered giant)
  spin: { label: 'Wrecking Spin', line: 'Holding a club, LMB held: a full turn that strikes all round', keys: 'LMB held with a club', kJ: 700, k: 1.0, stagger: 30, reach: 0,
    carve: { kind: 'ball', r: 0 }, opens: { count: ['mech.prop.hit', 30], feat: ['mech.prop.spin3', 1] } }, // (reach and r: the club's own reach; feat: three things struck in one swing)
  javelin: { label: 'Javelin', line: 'A post or girder thrown point first: it goes through what it meets', keys: 'RMB held, let go, with a post or girder', kJ: 400, k: 0, stagger: 0, reach: 0, pierce: 3,
    opens: { count: ['mech.prop.throw', 20], feat: ['mech.javelin.giant', 1] } }, // (feat: a thrown post or girder striking a giant)
  shieldUp: { label: 'Slab Shield', line: 'Holding a slab of building, V: it takes the blows in front until it breaks', keys: 'V with a slab', kJ: 0, k: 0, stagger: 0, reach: 0,
    opens: { count: ['mech.barrier', 30], feat: ['mech.shield.broke', 1] } }, // (feat: a slab broken taking a blow for you)
  giantThrow: { label: 'Giant Throw', line: 'F on a staggered giant: lift it, then RMB throws it where you aim, LMB slams it down', keys: 'F on a staggered giant, then RMB or LMB', kJ: 2500, k: 0, stagger: 0, reach: 18,
    opens: { count: ['giant.stagger', 15], feat: ['mech.javelin.giant', 1] } }, // (its numbers giants.js GRAPPLE; the frame's legs must hold the giant: canLift. Feat: a thrown post or girder striking a giant)
};
export const TECHNIQUE_IDS = Object.keys(TECHNIQUES);

/** What can be picked up and swung or thrown. mass: t (what the frame's load takes while held: frame.js's load, so a girder slows a
 *  light frame); hand: as a club (k, reach m, hits before it breaks); thrown: k at its speed (a thrown thing's energy, the thrown hit's
 *  rule, sandbox.js: k = m v² / 2 / P0 kJ, P0 900, capped at `cap`); shield: hits it takes in front. from: where they come from. */
export const PROPS = {
  post:   { label: 'Lamp post', line: 'A clay lamp post pulled out of the street', mass: 1.5, hand: { k: 0.8, reach: 10, hits: 8 }, thrown: { speed: 40, cap: 1.2 }, from: 'street' },
  girder: { label: 'Girder', line: 'A steel beam out of a broken building', mass: 6, hand: { k: 1.3, reach: 12, hits: 14 }, thrown: { speed: 32, cap: 2 }, from: 'building' },
  chunk:  { label: 'Chunk', line: 'A piece of a building, as it came off', mass: 0, hand: null, thrown: { speed: 28, cap: 3 }, shield: 4, from: 'building' }, // (mass its own: destruction.js chunkMass; shield when 8 t or more: a slab)
  limb:   { label: 'Limb', line: 'An arm or a leg torn off a frame', mass: 4, hand: { k: 1.0, reach: 9, hits: 10 }, thrown: { speed: 30, cap: 1.5 }, from: 'joint' },
  tower:  { label: 'Water tower', line: 'A tank on legs, full', mass: 12, hand: null, thrown: { speed: 22, cap: 2.5 }, from: 'street' },
};
/** The thrown hit's energy scale (frame.js P0: a full blow is about 900 kJ). */
const P0 = 900;

const got = (L, k) => L?.get?.(k) || 0;
/** Is a technique open: known from the start, or its count way or feat way done (the DEBUG save's lend opens all: the runtime's). */
export function techniqueOpen(id, L) {
  const T = TECHNIQUES[id]; if (!T) return false; if (!T.opens) return true;
  return got(L, T.opens.count[0]) >= T.opens.count[1] || got(L, T.opens.feat[0]) >= T.opens.feat[1];
}
export const techniquesOpen = (L) => TECHNIQUE_IDS.filter((id) => techniqueOpen(id, L));

/** A prop swung: its hand k (x speedK for a swing at a run, 1 standing). */
export const propBlow = (P, speedK = 1) => (P?.hand ? P.hand.k * speedK : 0);
/** A prop thrown at speed (m/s, its own if not said), of mass (t, its own if not said): its energy as a full blow's share, capped. */
export function thrownK(P, speed = P?.thrown?.speed ?? 0, mass = P?.mass ?? 0) {
  if (!P?.thrown) return 0;
  return Math.min(P.thrown.cap, (mass * speed * speed) / 2 / P0);
}
