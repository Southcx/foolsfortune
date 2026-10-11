// ---------------------------------------------------------------------------------------
// THE MELEE LOADOUT (working name, Espada's and the owner's to rule; "kit" is the Pneuka Box and the belt's): the Sondelass's moves as
// data, and which of them the Courier has slotted (the owner, 2026-10-11: "expand and bulletproof the Sondelass melee combo system ...
// like God Hand, where you build out your combo kit yourself"; docs/plans/MELEE-LOADOUT.md section 2).
//
//   SONDELASS_MOVES     the catalogue: every move a slot can hold, one row each
//     { id, kind: 'normal' | 'special', clip (its Sond_ clip), effect: 'stagger' | 'knock' | 'launch' | 'guardBreak' (what it does to a
//       body), parent (the move whose use opens it: Dovina's earning; null for today's moves, known from the start), rule (its row in
//       progress/combat/moves.js: power, time, cost, unlock), play (a normal: how the combo engine plays it, tools/moveset.js's A MOVE),
//       wraps (a special the tool plays itself: the stinger is the cutlass's lunge), and that special's own numbers }
//   SONDELASS_LOADOUT   the default: the string's slots in order (c1 .. c4, today's string; LMB walks them and the last loops to the
//                       first) and the specials (RMB tapped, with W, with S; an empty forward or back slot is the tap's)
//   Read by the engine (tools/moveset.js: `catalogue`, `loadout`), built once, so any tool can take a loadout later. The fixed grammar
//   stays the tool's own table (cutlass.js MOVES: S + LMB the launcher, the air string, the pause strings, the dash, the charge, the
//   counter, R the Tidecutter, the crouched iaido).
//
// Prior art: God Hand (Clover, 2006): the Combo Tree (the square button walks a chain of slots the player fills with learned
// techniques) and the specials on their own buttons, bought and assigned in a menu (here: earned, Dovina's predicates); the fighting
// games' move lists as data (each move a row of its frames and its effect).
// A data module: it imports nothing (docs/ARCHITECTURE.md, Imports), so a Node script reads it as the game does.
// ---------------------------------------------------------------------------------------

/** Every move a slot can hold. A normal's `play` is today's row of the cutlass's table, unchanged (SONDELASS-STRINGS.md section 1). */
export const SONDELASS_MOVES = {
  c1: { id: 'c1', kind: 'normal', clip: 'Sond_Combo1', effect: 'stagger', parent: null, rule: 'combo1', // (opener: a flat cut, right to left)
    play: { rate: 1.1, chain: [0.22, 0.75], to: 0.85, fade: 0.3, hit: { power: 1.2, dmg: 1.0 }, lunge: 3.2, arc: 'r2l' } },
  c2: { id: 'c2', kind: 'normal', clip: 'Sond_Combo2', effect: 'stagger', parent: null, rule: 'combo2', // (link: a rising cut, left to right)
    play: { rate: 1.1, chain: [0.26, 0.8], to: 0.9, fade: 0.3, hit: { power: 1.3, dmg: 1.1 }, lunge: 3.2, arc: 'l2r' } },
  c3: { id: 'c3', kind: 'normal', clip: 'Sond_Combo3', effect: 'stagger', parent: null, rule: 'combo3', // (link: a fast flat cut on a 0.35 m hop)
    play: { rate: 1.1, chain: [0.42, 0.95], to: 1.05, fade: 0.35, hit: { power: 1.5, dmg: 1.3 }, lunge: 3.6, arc: 'r2l' } },
  c4: { id: 'c4', kind: 'normal', clip: 'Sond_Combo4', effect: 'knock', parent: null, rule: 'combo4', // (finisher: the whole body's leap and overhead cut)
    play: { body: 'whole', root: 'xz', hit: { power: 2.0, dmg: 1.9, push: 6 }, heat: 1, arc: 'over' } },
  // RMB: a committed thrust, six metres in a quarter of a real second, everything in the line pierced and thrown (cutlass.js plays it;
  // courier/moves/launch.js carries them past the core's speed cap). `dash` real s, `speed` m/s, `dmg` x a pot's, `power` a hit, `reach`
  // m past the body, `radius` m of the line, `cost` Lachryma (its row's), `cool` real s before the next
  stinger: { id: 'stinger', kind: 'special', clip: 'Sond_Thrust', effect: 'knock', parent: null, rule: 'stinger', wraps: 'stinger',
    sting: { dash: 0.26, speed: 30, dmg: 2.4, power: 3.0, reach: 2.0, radius: 0.85, cost: 6, cool: 0.5 } },
};

/** The default loadout: today's moves, so the string plays exactly as it did before there was a loadout. */
export const SONDELASS_LOADOUT = {
  string: ['c1', 'c2', 'c3', 'c4'], // (the slots c1 .. c4, in order: 4 to start, 8 at most, MELEE-LOADOUT.md section 2, Dovina's earning)
  specials: { tap: 'stinger', forward: null, back: null }, // (RMB; with W; with S)
};
