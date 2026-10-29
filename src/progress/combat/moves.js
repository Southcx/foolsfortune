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
const hits = (move, n) => uses(`sond.move.${move}.hit`, n);       // (a Sondelass move's blows landed: tracking/moves.js)
const finishes = (move, n) => uses(`sond.move.${move}.finish`, n); // (its strings finished on a creature)
const either = (...ways) => (L) => ways.some((w) => w(L));          // (the count way or the feat way, whichever first)

/** Each move: `power` per hit (creatures.strike's power; a slip jelly bursts at 8), `hits` in the move, `time` real seconds of the move
 *  (its clip at the speed it plays), `cost` Lachryma, `status` it puts on what it strikes (creatures.apply; each creature decides what
 *  it means), `unlock` a ledger predicate. Strings are listed stroke by stroke ('combo1'..): their sum over their time is the dps. */
export const MOVES = {
  sondelass: { // (the cutlass form: the rod and the hook do not fight with strings)
    combo1: { power: 1.2, time: 0.42, unlock: always }, combo2: { power: 1.3, time: 0.46, unlock: always },
    combo3: { power: 1.4, time: 0.5, unlock: always }, combo4: { power: 2.0, time: 0.78, unlock: always },   // (2.7 power a second over the four)
    pause1: { power: 1.0, time: 0.4, unlock: always }, pause2: { power: 1.0, time: 0.4, unlock: always },
    pause3: { power: 2.6, time: 0.9, unlock: always, status: 'stagger' },                                    // (the pause string's finisher staggers: j3)
    thrust2: { power: 0.9, hits: 3, time: 0.9, unlock: always, status: 'stagger' },                         // (t2, Sond_ThrustCombo: the held thrust stabs three times; pause3's 2.6 as three, Calissa 2026-10-10)
    charge: { power: 4.0, time: 1.3, unlock: always },                                                        // (a full charge, the psygun's 0.85 s and the swing)
    launcher: { power: 0.8, time: 0.55, status: 'airborne', unlock: uses('cut.hit', 50) },                    // (position, not damage; after 50 cutlass blows)
    air1: { power: 0.9, time: 0.35, unlock: uses('move.launch', 10) }, air2: { power: 1.0, time: 0.38, unlock: uses('move.launch', 10) },
    plunge: { power: 2.0, time: 0.6, status: 'stagger', unlock: uses('move.launch', 10) },                   // (2.9 a second over the air string: short, and earned)
    dash: { power: 1.6, time: 0.5, unlock: always },
    counter: { power: 0.8, hits: 4, time: 1.7, unlock: always },                                             // (the spin from the guard, Sond_SpinSlash: four turns of the blade, a read guard's reward; it borrowed combo3's)
    stinger: { power: 3.0, time: 0.7, cost: 6, unlock: always },                                             // (RMB tapped: the lunge, as today; paid in Lachryma, so not a free raise)
    iaido: { power: 1.54, time: 0.6, parent: 'stinger', unlock: always },                                     // (the draw cut: crouched, RMB let go before the iaido's 0.5 s; Calissa's measured 1.4 x 1.1 a cut, 0.6 real s at the shortest charge, 2.57 a second, under the string's 2.7; free and known from the start, since it is Blade Mode's door, and Blade Mode came with the tool)
    // THE MELEE LOADOUT'S CATALOGUE (Calissa's phase 3, keyed by SONDELASS_MOVES' ids; MELEE-LOADOUT-EARNING.md section 2, Dovina's):
    // each opens by its parent's use (the count way) or by a feat (the feat way), whichever first. A normal: its parent landed 60 times, or
    // its parent finishing a string on a creature 5 times, or the feat its effect names. A special: its parent landed 30 times (60 when
    // the parent is itself earned: the counts double along the tree), or its feat once. The numbers are Calissa's measured `stats`
    // (every normal in any slot -2.9..+2.2% of today's string a second; every special -8.5..+6%).
    quickSlash: { power: 1.0, time: 0.34, parent: 'c1', unlock: either(hits('c1', 60), finishes('c1', 5)) },
    bodyBlow: { power: 0.9, time: 0.3, parent: 'c1', unlock: either(hits('c1', 60), finishes('c1', 5)) },
    backhand: { power: 1.1, time: 0.38, parent: 'c2', unlock: either(hits('c2', 60), finishes('c2', 5)) },
    guardBreak: { power: 1.1, time: 0.42, status: 'stagger', parent: 'c2', unlock: either(hits('c2', 60), finishes('c2', 5), uses('sond.effect.guardBreak', 3)) },
    lungeSlash: { power: 1.4, time: 0.5, parent: 'c3', unlock: either(hits('c3', 60), finishes('c3', 5)) },
    lowSweep: { power: 1.35, time: 0.55, status: 'trip', parent: 'c3', unlock: either(hits('c3', 60), finishes('c3', 5), uses('sond.effect.trip', 3)) },
    heavyChop: { power: 2.4, time: 0.92, status: 'stagger', parent: 'c4', unlock: either(hits('c4', 60), finishes('c4', 5)) },
    pushKick: { power: 1.45, time: 0.6, parent: 'c4', unlock: either(hits('c4', 60), finishes('c4', 5), uses('sond.effect.knock', 5), uses('kick.hit', 60)) }, // (a kick: the unarmed kick's blows open it too)
    spinSlash: { power: 0.85, hits: 4, time: 1.17, cost: 8, parent: 'backhand', unlock: either(hits('backhand', 60), best('sond.struck.best', 3)) }, // (three struck by one blow)
    powerSlash: { power: 3.0, time: 1.2, cost: 8, parent: 'heavyChop', unlock: either(hits('heavyChop', 60), finishes('heavyChop', 5)) },
    risingCut: { power: 2.3, time: 0.9, cost: 6, status: 'airborne', parent: 'quickSlash', unlock: either(hits('quickSlash', 60), uses('move.launch', 10)) },
    guardCrush: { power: 2.8, time: 1.11, cost: 6, status: 'stagger', parent: 'stinger', unlock: either(uses('cut.stinger', 30), uses('sond.effect.guardBreak', 1)) },
    backstepSlash: { power: 2.5, time: 1.0, cost: 5, parent: 'c3', unlock: either(hits('c3', 30), uses('parry.sondelass', 10)) }, // (out of reach and back in: ten parries with the Sondelass know when to leave)
    // THE CMU PASS (Calissa's, 2026-10-29: 7 normals and 6 specials of kicks and off-hand blows; MELEE-LOADOUT-EARNING.md 2): the same
    // two ways as the rows above, and a third the plan gives every CMU row, the unarmed kick's blows (`kick.hit`: 60 a normal, 150 a
    // special), since feet trained bare carry over to the blade. A special's parent is itself earned, so its count doubles (60).
    // Calissa's measured `stats` (every normal -2.8..-0.6% of the string's 1.945 a second; every special from rest -4.3..+3.8%).
    frontKick: { power: 1.45, time: 0.58, parent: 'c2', unlock: either(hits('c2', 60), finishes('c2', 5), uses('kick.hit', 60)) },
    roundKick: { power: 1.35, time: 0.52, parent: 'c1', unlock: either(hits('c1', 60), finishes('c1', 5), uses('sond.effect.knock', 5), uses('kick.hit', 60)) },
    sideKick: { power: 1.3, time: 0.5, parent: 'c4', unlock: either(hits('c4', 60), finishes('c4', 5), uses('sond.effect.knock', 5), uses('kick.hit', 60)) },
    kneeStrike: { power: 1.35, time: 0.52, parent: 'c3', unlock: either(hits('c3', 60), finishes('c3', 5), uses('kick.hit', 60)) },
    lowKick: { power: 1.6, time: 0.63, status: 'trip', parent: 'c3', unlock: either(hits('c3', 60), finishes('c3', 5), uses('sond.effect.trip', 3), uses('kick.hit', 60)) },
    straightPunch: { power: 1.35, time: 0.52, parent: 'c3', unlock: either(hits('c3', 60), finishes('c3', 5), uses('kick.hit', 60)) },
    hookPunch: { power: 1.1, time: 0.43, parent: 'c2', unlock: either(hits('c2', 60), finishes('c2', 5), uses('kick.hit', 60)) }, // (never `hook`: the Sondelass's hook is its form)
    flyingKick: { power: 3.6, time: 1.45, cost: 7, parent: 'pushKick', unlock: either(hits('pushKick', 60), uses('sond.effect.knock', 10), uses('kick.hit', 150)) },
    tornadoKick: { power: 3.6, time: 1.45, cost: 8, parent: 'roundKick', unlock: either(hits('roundKick', 60), best('sond.struck.best', 3), uses('kick.hit', 150)) }, // (all round: three struck by one blow)
    spinHeelKick: { power: 3.8, time: 1.55, cost: 7, parent: 'sideKick', unlock: either(hits('sideKick', 60), finishes('sideKick', 5), uses('kick.hit', 150)) },
    risingKick: { power: 2.7, time: 1.1, cost: 6, status: 'airborne', parent: 'frontKick', unlock: either(hits('frontKick', 60), uses('move.launch', 10), uses('kick.hit', 150)) },
    flurry: { power: 1.0, hits: 3, time: 1.05, cost: 5, status: 'stagger', parent: 'bodyBlow', unlock: either(hits('bodyBlow', 60), finishes('bodyBlow', 5), uses('kick.hit', 150)) },
    breakKick: { power: 2.7, time: 1.18, cost: 6, status: 'stagger', parent: 'guardBreak', unlock: either(hits('guardBreak', 60), uses('sond.effect.guardBreak', 3), uses('kick.hit', 150)) },
    special: { id: 'tidecutter', power: 7, time: 2.63, cost: 12, unlock: uses('cut.hit', 500) },             // (a line of slip: the Sondelass mastered; its clip's 2.63 real s, the strike at 1.80)
    // THE PAID CUT (working name; Calissa's price, the owner's to tune in play, 2026-10-10): in a blow's recovery, once its strike is
    // past, a press pays `cost` and the next move begins at once (tools/moveset.js). The reasoning: a fresh pool is 100 (core/config.js
    // lachryma.max; the maker's stone, progress/stones.js, leaves it so; a stone moves it by -15..+30 and the cost by x0.85..1.15). A paid
    // ground string cuts four recoveries (c1, c2, c3, c4's): 1.37 real s on paper, 1.50 measured (a cut waits for a press after the
    // strike), not 2.20 free: 20 Lachryma a string, 13.3 a real second. Regen (3.5 a second) waits 2.2 s unspent, so none comes back while
    // cutting: a fresh pool pays 20 cuts, five strings, 7.7 real s measured, at 3.9 power a second, not 2.7 (x1.47), about 9 power more
    // than the free string in that time, a slip jelly and a fifth (8). Then the pool, which is also the shield, is empty: a burst, not a
    // raise past the 2.6 the raids are sized to. Flat, as Guilty Gear's Roman Cancel is half the gauge whatever it cancels: where it buys
    // most (the charge release's 1.19 real s, the counter's 0.76, the Tidecutter's 0.69, the plunge's landing 0.6) against least (c3's
    // 0.07, a2's none) is for the player to learn. A little more than a psygun shot (4), less than the stinger (6).
    paidCut: { cost: 5, unlock: always },
  },
  unarmed: {
    combo1: { power: 0.6, time: 0.32, unlock: always }, combo2: { power: 0.6, time: 0.32, unlock: always },
    combo3: { power: 0.7, time: 0.36, unlock: always }, roundhouse: { power: 1.4, time: 0.6, unlock: always }, // (1.2 a second: fists are a last resort, the tools are the game)
    frontKick: { power: 1.0, time: 0.45, unlock: always }, shove: { power: 0.6, time: 0.4, status: 'stagger', unlock: always }, // (the pause string after the jab: room made, not damage)
    launcher: { power: 0.6, time: 0.5, status: 'airborne', unlock: uses('kick.hit', 30) },
    groundPound: { power: 1.6, time: 0.7, unlock: uses('move.launch', 10) },
    dash: { power: 0.9, time: 0.55, unlock: always }, sweep: { power: 0.5, time: 0.5, status: 'trip', unlock: always },
  },
  brush: {
    combo1: { power: 1.68, time: 0.43, unlock: always }, combo2: { power: 1.8, time: 0.53, unlock: always },
    combo3: { power: 2.4, time: 1.3, unlock: always },                                                        // (the club's today: 2.6 a second)
    spin: { power: 0.8, hits: 3, time: 0.9, unlock: uses('brush.hit', 100) },                               // (a crowd clearer: 2.7 a second, wide)
    airSlam: { power: 2.4, time: 0.8, unlock: always },                                                       // (the slam, as today: not on the combo engine)
    air1: { power: 0.9, time: 0.35, unlock: uses('move.launch', 10) }, air2: { power: 1.0, time: 0.38, unlock: uses('move.launch', 10) },
    air3: { power: 1.4, time: 0.5, unlock: uses('move.launch', 10) },                                        // (the brush's air string: 2.7 a second, as the cutlass's; earned the same way)
    dash: { power: 1.2, time: 0.6, unlock: always },
  },
  dreamvane: {
    combo1: { power: 1.2, time: 0.45, unlock: always }, combo2: { power: 1.3, time: 0.5, unlock: always },
    combo3: { power: 1.6, time: 0.6, unlock: always }, pick: { power: 1.6, time: 0.55, unlock: always },     // (2.6 a second)
    pause1: { power: 1.1, time: 0.45, unlock: always }, pause2: { power: 1.1, time: 0.45, unlock: always }, pause3: { power: 2.6, time: 0.85, unlock: always },
    launcher: { power: 0.8, time: 0.55, status: 'airborne', unlock: uses('dreamvane.hit', 50) },              // (Vane_Thrust: position, not damage, as every launcher)
    charge: { power: 4.2, time: 1.3, unlock: always },                                                        // (the pick driven (`drive`): half at no charge, all at full, as the cutlass's charge)
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

/** RULINGS on the engine's open questions (Calissa's handoff, 2026-10-07):
 *  - STATUS HOLDS, real seconds: stagger 0.8, airborne 1.6, trip 1.0 (as built).
 *  - A blow that stops a creature stops it as its row's `status` says, never as a stun: only `creatures/stun.js` stuns, and only a stun
 *    doubles a clapperjar's drop when it is killed (the economy's reward for the tools that stun). The unarmed builder's heavy blow
 *    (2 s stun) is a stagger.
 *  - The toll's beat bonus (x1.4) multiplies its stun, not its damage: the bell is support.
 *  - Stuns from tolls refresh to the longest, never add: four tolls on one creature hold it as long as the longest one alone.
 *  - A resisted status hardening a Stoic mind is meant: a thinking opponent learns a string that staggers it every time. */
export const HOLDS = { stagger: 0.8, airborne: 1.6, trip: 1.0 };

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
  'move.cut.paid': 'recoveries cut short for Lachryma (the paid cut, a working name)',
  'skiff.bail': 'bails off the Solar Skiff (a wall struck over 14 m/s, a landing past 17 m/s, or one landed badly crooked: skiff.js BAIL; a wobble is a near miss, not a bail)',
  'skiff.ollie.geyser': 'ollies off a geyser',
};
