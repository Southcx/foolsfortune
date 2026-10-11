// ---------------------------------------------------------------------------------------
// THE MELEE LOADOUT (working name, Espada's and the owner's to rule; "kit" is the Pneuka Box and the belt's): the Sondelass's moves as
// data, and which of them the Courier has slotted (the owner, 2026-10-11: "expand and bulletproof the Sondelass melee combo system ...
// like God Hand, where you build out your combo kit yourself"; docs/plans/MELEE-LOADOUT.md section 2).
//
//   SONDELASS_MOVES     the catalogue: every move a slot can hold, one row each (12 normals, 6 specials: Dovina's slice, phase 3)
//     { id, kind: 'normal' | 'special', label (what the UI calls it: a genre word, docs/plans/CLARITY.md), line (its one line of effect,
//       verb first, 8 words at most), lore (the world's name: Espada's, null till then), clip, effect: 'stagger' | 'knock' | 'launch' |
//       'guardBreak' (what it does to a body), parent (the move whose use opens it: Dovina's earning; null for the ones known from the
//       start), earn (null: a move is earned where Dovina's table says, `unlocked(tool, id, L)` in progress/combat/moves.js, asked by loadoutopen.js; locked till then), rule (its row in progress/combat/moves.js, which wins),
//       stats ({ power a hit, hits, time real s (its speed: when the next may begin), range m (its reach from the body: the clip's
//       measured tip and the blade), cost Lachryma, status }: the card's numbers, and the engine's where no `rule` names a row),
//       (a row's `play.hit.away`: what it strikes is sent straight away from the Courier, never along the swing, so a row whose line
//       says it knocks, shoves, kicks or launches does so: tools/moveset.js; casebook NEW:knock-away-not-along)
//       play (how the combo engine plays it: tools/moveset.js's A MOVE), wraps (a special the tool plays itself: the stinger is the
//       cutlass's lunge), and that special's own numbers }
//   SONDELASS_LOADOUT   the default: the string's slots in order (c1 .. c4, today's string; LMB walks them and the last loops to the
//                       first) and the specials (RMB tapped, with W, with S; an empty forward or back slot is the tap's)
//   Read by the engine (tools/moveset.js: `catalogue`, `loadout`), built once, so any tool can take a loadout later. The fixed grammar
//   stays the tool's own table (cutlass.js MOVES: S + LMB the launcher, the air string, the pause strings, the dash, the charge, the
//   counter, R the Tidecutter, the crouched iaido).
//
// Prior art: God Hand (Clover, 2006): the Combo Tree (the square button walks a chain of slots the player fills with learned
// techniques) and the specials on their own buttons, bought and assigned in a menu (here: earned, Dovina's predicates), its techniques'
// mix of blade-less blows among the rest (a shove, a kick, a sweep, a body blow: here the suite's fists and feet with the blade in the
// hand) and its guard breaks; Soulcalibur's Guard Crush; Dark Souls' and Bloodborne's backstep with a cut; the fighting games' move
// lists as data (each move a row of its frames and its effect). The clips are UAL Standard's (swordA/B/C, swordHeavy, meleeHook) and
// the Courier's suite (Sond_*, Fist_*): no clip was authored for the catalogue.
// A data module: it imports nothing (docs/ARCHITECTURE.md, Imports), so a Node script reads it as the game does.
// ---------------------------------------------------------------------------------------

/** Every move a slot can hold. A normal's `play` is how the combo engine plays it (tools/moveset.js's A MOVE); today's four and the
 *  stinger are today's rows of the cutlass's table, unchanged (SONDELASS-STRINGS.md section 1), and their numbers are their `rule` rows
 *  of progress/combat/moves.js, which win (`stats` mirrors them for the card). The catalogue's new moves (phase 3, 2026-10-11) carry
 *  their own `stats` until Dovina takes them into her table; each is held to the row rule (the string's power a real second within 15%
 *  of today's, whatever the slots hold: SONDELASS-STRINGS.md section 7, measured). Clip seconds in `play`; real seconds in `stats`. */
export const SONDELASS_MOVES = {
  // ---- the normals (LMB: the string's slots) ----
  c1: { id: 'c1', kind: 'normal', label: 'Slash', line: 'Cuts flat, right to left', lore: null, clip: 'Sond_Combo1', effect: 'stagger', parent: null, earn: null, rule: 'combo1', // (opener: a flat cut, right to left)
    stats: { power: 1.2, time: 0.42, range: 2.3 },
    play: { rate: 1.1, chain: [0.22, 0.75], to: 0.85, fade: 0.3, hit: { power: 1.2, dmg: 1.0 }, lunge: 3.2, arc: 'r2l' } },
  c2: { id: 'c2', kind: 'normal', label: 'Rising Slash', line: 'Cuts up, left to right', lore: null, clip: 'Sond_Combo2', effect: 'stagger', parent: null, earn: null, rule: 'combo2', // (link: a rising cut, left to right)
    stats: { power: 1.3, time: 0.46, range: 2.5 },
    play: { rate: 1.1, chain: [0.26, 0.8], to: 0.9, fade: 0.3, hit: { power: 1.3, dmg: 1.1 }, lunge: 3.2, arc: 'l2r' } },
  c3: { id: 'c3', kind: 'normal', label: 'Hop Slash', line: 'Hops in with a fast flat cut', lore: null, clip: 'Sond_Combo3', effect: 'stagger', parent: null, earn: null, rule: 'combo3', // (link: a fast flat cut on a 0.35 m hop)
    stats: { power: 1.4, time: 0.5, range: 2.4 },
    play: { rate: 1.1, chain: [0.42, 0.95], to: 1.05, fade: 0.35, hit: { power: 1.5, dmg: 1.3 }, lunge: 3.6, arc: 'r2l' } },
  // (c4's chain window is read only where it is not the last slot: there its row's time, 0.78, is when the next begins, as its free cut)
  c4: { id: 'c4', kind: 'normal', label: 'Leap Strike', line: 'Leaps in and cuts down; knocks back', lore: null, clip: 'Sond_Combo4', effect: 'knock', parent: null, earn: null, rule: 'combo4', // (finisher: the whole body's leap and overhead cut)
    stats: { power: 2.0, time: 0.78, range: 2.9 },
    play: { body: 'whole', root: 'xz', chain: [0.45, 1.3], hit: { power: 2.0, dmg: 1.9, push: 6 }, heat: 1, arc: 'over' } }, // (no `away`, the carry's travel cut its own: today's c4, frame for frame)
  // the catalogue's normals (phase 3): UAL's split swings and the suite's fists and feet, each a job of its own. `rec` is an upper
  // move's recovery clip (UAL's swordA and swordB are cut from their recoveries); a fist or a foot is measured on itself (`limb`, `tip`)
  // and reaches a hand's or a foot's width past it (`reach`), not a blade's; a kick or a shove leaves no ribbon
  quickSlash: { id: 'quickSlash', kind: 'normal', label: 'Quick Slash', line: 'Cuts fast, low to high', lore: null, clip: 'swordA', effect: 'stagger', parent: 'c1', earn: null, // (UAL's Sword_Regular_A: low right to high left, 271 degrees in 0.14 s)
    stats: { power: 1.0, time: 0.34, range: 2.4 },
    play: { rate: 1.0, chain: [0.3, 0.43], to: 0.43, fade: 0.08, rec: 'swordARec', hit: { power: 1.0, dmg: 0.8 }, lunge: 3.0, arc: 'l2r' } },
  backhand: { id: 'backhand', kind: 'normal', label: 'Backhand', line: 'Cuts back across, fast', lore: null, clip: 'swordB', effect: 'stagger', parent: 'c2', earn: null, // (UAL's Sword_Regular_B: a flat backhand, left to right)
    stats: { power: 1.1, time: 0.38, range: 2.6 },
    play: { rate: 1.0, chain: [0.31, 0.53], to: 0.53, fade: 0.08, rec: 'swordBRec', hit: { power: 1.1, dmg: 0.9 }, lunge: 3.0, arc: 'l2r' } },
  lungeSlash: { id: 'lungeSlash', kind: 'normal', label: 'Lunge Slash', line: 'Lunges far in with a down-cut', lore: null, clip: 'meleeHook', effect: 'stagger', parent: 'c3', earn: null, // (UAL's melee hook: a deep lunge and a cut down across, the reach of the set)
    stats: { power: 1.4, time: 0.5, range: 3.0 },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 0.9, step: { v: 3.5, at: [0.04, 0.24] }, chain: [0.3, 0.47], hit: { power: 1.4, dmg: 1.2, push: 2, away: 1 }, heat: 0.5, arc: 'over' } },
  heavyChop: { id: 'heavyChop', kind: 'normal', label: 'Heavy Chop', line: 'Chops down hard; knocks back', lore: null, clip: 'swordC', effect: 'knock', parent: 'c4', earn: null, // (UAL's Sword_Regular_C: a hop, the blade overhead, chopped down; slow in, hard)
    stats: { power: 2.4, time: 0.92, range: 2.6, status: 'stagger' },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.2, chain: [0.75, 1.45], to: 1.45, hit: { power: 2.4, dmg: 2.2, push: 7, away: 1 }, heat: 1, arc: 'over' } },
  guardBreak: { id: 'guardBreak', kind: 'normal', label: 'Guard Break', line: 'Shoves through a guard; staggers', lore: null, clip: 'Fist_Shove', effect: 'guardBreak', parent: 'c2', earn: null, // (the suite's two-handed shove, the blade across the front)
    stats: { power: 1.1, time: 0.42, range: 1.6, status: 'stagger' },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.1, limb: 'L', tip: 0.12, reach: 0.35, ribbon: false, chain: [0.25, 0.85], to: 0.85, hit: { power: 1.1, dmg: 0.6, push: 5, away: 1, guardBreak: true, cause: 'bashed' }, heat: 0.4, arc: 'raise' } },
  pushKick: { id: 'pushKick', kind: 'normal', label: 'Push Kick', line: 'Kicks them away', lore: null, clip: 'Fist_Kick', effect: 'knock', parent: 'c4', earn: null, // (the suite's front kick, the off hand's side: the left foot, as God Hand mixes them in)
    stats: { power: 1.45, time: 0.6, range: 1.7 },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.1, limb: 'footL', tip: 0.22, reach: 0.35, ribbon: false, strike: [0.4, 0.62], chain: [0.62, 1.05], to: 1.05, hit: { power: 1.45, dmg: 1.0, push: 7, away: 1, cause: 'kick' }, heat: 0.6, arc: 'raise' } },
  lowSweep: { id: 'lowSweep', kind: 'normal', label: 'Low Sweep', line: 'Cuts low; trips them up', lore: null, clip: 'swordHeavy', effect: 'launch', parent: 'c3', earn: null, // (UAL's heavy sword's first cut: a deep lunge, the blade along the floor)
    stats: { power: 1.35, time: 0.55, range: 2.7, status: 'trip' },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.1, chain: [0.56, 1.0], to: 1.05, hit: { power: 1.35, dmg: 1.0, push: 1.5, away: 1, lift: 3 }, heat: 0.6, arc: 'r2l' } },
  bodyBlow: { id: 'bodyBlow', kind: 'normal', label: 'Body Blow', line: 'Jabs with the off hand, fast', lore: null, clip: 'Fist_Combo1', effect: 'stagger', parent: 'c1', earn: null, // (the suite's jab: the left fist, the blade held back)
    stats: { power: 0.9, time: 0.3, range: 1.6 },
    play: { rate: 1.15, limb: 'L', tip: 0.1, reach: 0.35, ribbon: false, chain: [0.18, 0.55], to: 0.6, fade: 0.25, hit: { power: 0.9, dmg: 0.6, push: 1.5, away: 1, cause: 'bashed' }, lunge: 2.2, arc: 'raise' } },
  // ---- the specials (RMB tapped, with W, with S) ----
  // RMB: a committed thrust, eight metres in a quarter of a real second (30 m/s for 0.26 s: 8.4 m measured), everything in the line
  // pierced and thrown (cutlass.js plays it; courier/moves/launch.js carries them past the core's speed cap). `dash` real s, `speed` m/s, `dmg` x a pot's, `power` a hit, `reach`
  // m past the body, `radius` m of the line, `cost` Lachryma (its row's), `cool` real s before the next
  stinger: { id: 'stinger', kind: 'special', label: 'Stinger', line: 'Lunges 8 m, piercing everything in line', lore: null, clip: 'Sond_Thrust', effect: 'knock', parent: null, earn: null, rule: 'stinger', wraps: 'stinger',
    stats: { power: 3.0, time: 0.7, cost: 6, range: 8 },
    sting: { dash: 0.26, speed: 30, dmg: 2.4, power: 3.0, reach: 2.0, radius: 0.85, cost: 6, cool: 0.5 } },
  // the catalogue's specials (phase 3): each a bigger single thing for its Lachryma, at the string's power a second of its own time
  // (a special pays for what it does to a body, never in damage: progress/combat/moves.js's rule, as the Tidecutter's 2.7)
  spinSlash: { id: 'spinSlash', kind: 'special', label: 'Spin Slash', line: 'Spins, cutting everything around you', lore: null, clip: 'Sond_SpinSlash', effect: 'knock', parent: 'backhand', earn: null, // (the suite's spin: 2.8 turns, four cuts round)
    stats: { power: 0.85, hits: 4, time: 1.17, cost: 8, range: 2.4 },
    play: { body: 'whole', travelCut: 'peak', rate: 1.15, to: 1.35, hit: { power: 0.85, dmg: 0.9, push: 5, away: 1 }, heat: 0.8, arc: 'r2l' } },
  powerSlash: { id: 'powerSlash', kind: 'special', label: 'Power Slash', line: 'A full-charge cut at once; knocks back', lore: null, clip: 'Sond_ChargeRelease', effect: 'knock', parent: 'heavyChop', earn: null, // (the charge's release, its 331 degrees, without the hold)
    stats: { power: 3.0, time: 1.2, cost: 8, range: 2.5 },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.0, to: 1.2, hit: { power: 3.0, dmg: 2.6, push: 9, away: 1 }, heat: 1, arc: 'r2l' } },
  risingCut: { id: 'risingCut', kind: 'special', label: 'Rising Cut', line: 'Cuts upward, launching them', lore: null, clip: 'Fist_Uppercut', effect: 'launch', parent: 'quickSlash', earn: null, // (the suite's uppercut, the blade in the fist: a hop and a cut straight up)
    stats: { power: 2.3, time: 0.9, cost: 6, range: 2.0, status: 'airborne' },
    play: { body: 'whole', travelCut: 'peak', root: 'xyz', rate: 1.0, to: 0.9, hit: { power: 2.3, dmg: 1.8, push: 1, away: 1, lift: 8 }, heat: 0.8, arc: 'raise' } },
  guardCrush: { id: 'guardCrush', kind: 'special', label: 'Guard Crush', line: 'Thrusts through a guard; staggers', lore: null, clip: 'Sond_Thrust', effect: 'guardBreak', parent: 'stinger', earn: null, // (the suite's thrust, planted: a step and the point driven through)
    stats: { power: 2.8, time: 1.11, cost: 6, range: 2.7, status: 'stagger' },
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 0.9, step: { v: 3, at: [0.05, 0.2] }, to: 1.0, hit: { power: 2.8, dmg: 2.2, push: 5, away: 1, guardBreak: true }, heat: 0.9, arc: 'raise' } },
  backstepSlash: { id: 'backstepSlash', kind: 'special', label: 'Backstep Slash', line: 'Hops back, cutting as you go', lore: null, clip: 'Sond_Combo3', effect: 'stagger', parent: 'c3', earn: null, // (c3's hop and flat cut, the hop taken backward: 1.4 m out of reach; the back slot's)
    stats: { power: 2.5, time: 1.0, cost: 5, range: 2.1 }, // (range: from where they stand when it is pressed, the hop back taken; measured, S + RMB and tapped, a slip jelly and Strawman: lands at 2.1 m, misses at 2.2; it said 2.4)
    play: { body: 'whole', travelCut: 'peak', root: 'xz', rate: 1.1, step: { v: -5, at: [0.3, 0.55] }, to: 1.1, hit: { power: 2.5, dmg: 1.6, push: 3, away: 1 }, heat: 0.7, arc: 'r2l' } },
};

/** The default loadout: today's moves, so the string plays exactly as it did before there was a loadout. */
export const SONDELASS_LOADOUT = {
  string: ['c1', 'c2', 'c3', 'c4'], // (the slots c1 .. c4, in order: 4 to start, 8 at most, MELEE-LOADOUT.md section 2, Dovina's earning)
  specials: { tap: 'stinger', forward: null, back: null }, // (RMB; with W; with S)
};
