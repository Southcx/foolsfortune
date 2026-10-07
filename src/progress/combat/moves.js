// ---------------------------------------------------------------------------------------
// THE MOVESETS' NUMBERS: what each move of each tool is worth, costs and needs (Calissa's animation suite, 2026-10-07: the owner,
// "Collaborate with Dovina if you think there are game mechanical expansions sparked by the new suite"). Calissa's engine
// (tools/moveset.js) plays the clips and reads this table; the numbers are Dovina's.
//
// THE RULE THE NUMBERS KEEP: every tool's sustained damage stays about 2.6 power a real second at full uptime
// (progress/combat/greatjelly.js SUSTAINED), so a raid's health holds whatever the Courier carries. A string's total power over its total
// time is about that; a launcher and a dash trade damage for position; a special is a burst that costs Lachryma, not a free raise.
// UNLOCKS are predicates over the ledger, as the achievements are (retroactive, never flags): the string, the alternate string, the
// charge and the dash come with the tool; the launcher and the air string come from using the tool; each special from that tool's
// mastery (Devil May Cry's shop of moves, here earned by doing, as OSRS unlocks are).
//
// Prior art: Devil May Cry 3 and Bayonetta (the launcher, the air string, the pause combo), Kingdom Hearts (finishers in the air), Final
// Fantasy XV's warp-strike economy of a special, and Tony Hawk's bail as a counted thing.
//
//   MOVES[tool][move] = { power, hits?, time, cost?, status?, unlock }   unlocked(tool, move, L) -> bool   dps(tool, string) -> power/s
//   RECORDS (ledger keys the moves' events feed)
// ---------------------------------------------------------------------------------------

const always = () => true;
const uses = (key, n) => (L) => (L.get(key) || 0) >= n;      // (a count in the ledger)
const best = (key, n) => (L) => (L.best(key) || 0) >= n;     // (a record)

/** Each move: `power` per hit (creatures.strike's power; a slip jelly bursts at 8), `hits` in the move, `time` real seconds of the move
 *  (its clip at the speed it plays), `cost` Lachryma, `status` it puts on what it strikes (creatures.apply; each creature decides what
 *  it means), `unlock` a ledger predicate. Strings are listed stroke by stroke ('combo1'..): their sum over their time is the dps. */
export const MOVES = {
  sondelass: { // (the cutlass form: the rod and the hook do not fight with strings)
    combo1: { power: 1.2, time: 0.42, unlock: always }, combo2: { power: 1.3, time: 0.46, unlock: always },
    combo3: { power: 1.4, time: 0.5, unlock: always }, combo4: { power: 2.0, time: 0.78, unlock: always },   // (2.7 power a second over the four)
    pause1: { power: 1.0, time: 0.4, unlock: always }, pause2: { power: 1.0, time: 0.4, unlock: always },
    pause3: { power: 2.6, time: 0.9, unlock: always, status: 'stagger' },                                    // (the pause string's finisher staggers)
    charge: { power: 4.0, time: 1.3, unlock: always },                                                        // (a full charge, the psygun's 0.85 s and the swing)
    launcher: { power: 0.8, time: 0.55, status: 'airborne', unlock: uses('cut.hit', 50) },                    // (position, not damage; after 50 cutlass blows)
    air1: { power: 0.9, time: 0.35, unlock: uses('move.launch', 10) }, air2: { power: 1.0, time: 0.38, unlock: uses('move.launch', 10) },
    plunge: { power: 2.0, time: 0.6, status: 'stagger', unlock: uses('move.launch', 10) },                   // (2.9 a second over the air string: short, and earned)
    dash: { power: 1.6, time: 0.5, unlock: always },
    special: { id: 'tidecutter', power: 7, time: 1.4, cost: 12, unlock: uses('cut.hit', 500) },              // (a line of slip: the Sondelass mastered)
  },
  unarmed: {
    combo1: { power: 0.6, time: 0.32, unlock: always }, combo2: { power: 0.6, time: 0.32, unlock: always },
    combo3: { power: 0.7, time: 0.36, unlock: always }, roundhouse: { power: 1.4, time: 0.6, unlock: always }, // (1.2 a second: fists are a last resort, the tools are the game)
    launcher: { power: 0.6, time: 0.5, status: 'airborne', unlock: uses('kick.hit', 30) },
    groundPound: { power: 1.6, time: 0.7, unlock: uses('move.launch', 10) },
    dash: { power: 0.9, time: 0.55, unlock: always }, sweep: { power: 0.5, time: 0.5, status: 'trip', unlock: always },
  },
  brush: {
    combo1: { power: 1.68, time: 0.43, unlock: always }, combo2: { power: 1.8, time: 0.53, unlock: always },
    combo3: { power: 2.4, time: 1.3, unlock: always },                                                        // (the club's today: 2.6 a second)
    spin: { power: 0.8, hits: 3, time: 0.9, unlock: uses('brush.hit', 100) },                               // (a crowd clearer: 2.7 a second, wide)
    airSlam: { power: 2.4, time: 0.8, unlock: always },                                                       // (the slam, as today)
    dash: { power: 1.2, time: 0.6, unlock: always },
  },
  dreamvane: {
    combo1: { power: 1.2, time: 0.45, unlock: always }, combo2: { power: 1.3, time: 0.5, unlock: always },
    combo3: { power: 1.6, time: 0.6, unlock: always }, pick: { power: 1.6, time: 0.55, unlock: always },     // (2.6 a second)
    pause1: { power: 1.1, time: 0.45, unlock: always }, pause2: { power: 1.1, time: 0.45, unlock: always }, pause3: { power: 2.6, time: 0.85, unlock: always },
    vault: { power: 0, time: 0.8, unlock: always },                                                           // (a pole-vault: movement, 1.6 m over a low thing; never a weapon)
    special: { id: 'dreamquake', power: 5, time: 1.2, cost: 10, radius: 5, status: 'stagger', unlock: uses('dreamvane.hit', 200) },
  },
  crucibelle: {
    toll1: { power: 0.8, time: 0.5, status: 'stagger', unlock: always }, toll2: { power: 0.8, time: 0.5, unlock: always },
    toll3: { power: 1.6, time: 0.8, status: 'stagger', unlock: always },                                    // (2 a second, ringed: the bell is support)
    feverPeak: { power: 3, time: 1.0, radius: 6, unlock: uses('crucibelle.fever', 1) },                            // (at full fever, once, the ring at its widest)
  },
  lockheart: {
    flail1: { power: 1.2, time: 0.55, drink: 2, unlock: always }, flail2: { power: 1.3, time: 0.6, drink: 2, unlock: always },
    flail3: { power: 2.0, time: 0.9, drink: 4, unlock: always },                                             // (2.2 a second; each blow DRINKS: Lachryma into the coffin, its fill)
  },
  veritome: {
    bash1: { power: 0.9, time: 0.45, unlock: always }, bash2: { power: 1.4, time: 0.6, status: 'stagger', unlock: always }, // (2.2 a second: a book in a pinch)
  },
  psygun: {
    whip: { power: 1.4, time: 0.45, status: 'stagger', unlock: always },                                    // (within 1.5 m: the gun's answer to closeness)
    special: { id: 'fan', power: 1, hits: 6, time: 0.6, cost: 8, unlock: uses('shot.hit', 300) },            // (Fan the Hammer: 6 shots in 0.6 s)
  },
};

/** Whether a move is open to this ledger (the engine asks before it plays one; a closed move falls back to the string). */
export const unlocked = (tool, move, L) => !!MOVES[tool]?.[move]?.unlock?.(L);

/** A string's damage a real second at full uptime: its power (times hits) over its time. */
export function dps(tool, prefix = 'combo') {
  const m = Object.entries(MOVES[tool] || {}).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v);
  const p = m.reduce((a, v) => a + v.power * (v.hits || 1), 0), t = m.reduce((a, v) => a + v.time, 0);
  return t ? +(p / t).toFixed(2) : 0;
}

/** The ledger keys the moves feed (tracking/moves.js), and what each is for. */
export const RECORDS = {
  'move.launch': 'launchers that lifted something (opens the air string)',
  'move.air.best': 'the most blows in one air string, the creature never touching the ground',
  'move.special.<id>': 'specials used, by id',
  'skiff.bail': 'bails off the Solar Skiff (thrown at a wall over about 14 m/s, or a wobble landing)',
  'skiff.ollie.geyser': 'ollies off a geyser',
};
