// ---------------------------------------------------------------------------------------
// THE FIGMENTS' RULESETS (docs/plans/PUZZLE-DUELS.md section 6: "one aberrant Figment is one ruleset", the owner, 2026-10-19): what the
// engine loads for a fight, chosen by the Figment's feeling. The kernel's three, a first pass; every other feeling's families are to
// come as their rules are built (section 5). A ruleset is data: the clears it uses, its gravity map, its odds and its bot's weights.
//
// Prior art: Puzzle Fighter's and Puyo's characters (one drop pattern each), Noon's arenas, Dr. Mario's viruses per level.
//
//   RULESETS[name] -> { feeling, board?: { w, h, perColumn, landCap }, run, cluster, gravity(x, y, board), bombs, blast, pincer, colours, drip, queue, fog, embers, bot }
//   bot: the score's weights (bot.js W), and `sample`: actions it weighs a point (its cleverness: 60 if not said)
//   rulesetOf(creature) -> a ruleset: its kind's own (KIND_RULESETS: an aberrant Lantern Wisp's), else its feeling's, else fury's
// ---------------------------------------------------------------------------------------
import { DIRS } from './board.js';

export const RULESETS = {
  // Fury: bombs and kicks. Plain gravity, runs of three, a bomb in every 16 pieces that come.
  fury: { feeling: 'fury', match: 3, cluster: 0, gravity: () => DIRS.S, bombs: 0.06, blast: 2, colours: 4, drip: 4, bot: { junk: 12 } },
  // Grief: everything sinks toward the line (each side's pile leans on it), clusters of four, the pincer turns junk to gems.
  grief: { feeling: 'grief', match: 0, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.E : DIRS.W), pincer: true, colours: 6,
    bot: { pairs: 1 } },
  // Mirth: gravity mirrored (down on the left, up on the right), runs and clusters both, so chains come easily.
  mirth: { feeling: 'mirth', match: 3, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.S : DIRS.N), colours: 5, drip: 3 },
  // Dread (dread.js): the Figment's half in fog but for its lantern's light, and its junk sent as embers that burn down three of your
  // turns before they can be cleared. Runs of three, plain gravity on both halves.
  dread: { feeling: 'dread', match: 3, cluster: 0, gravity: () => DIRS.S, colours: 5, drip: 3, fog: { side: 1, light: 3 }, embers: { from: 1, count: 3 } },
  // THE ABERRANT LANTERN WISP (PUZZLE-DUELS.md 14; the owner's test enemy, 2026-10-19): Dread's two rules, and its half of the board
  // burns upward (a flame's updraft: its pieces rise) while yours falls, two domains meeting at the Line. The first aberrant met, so
  // the gentlest (PUZZLE-DUELS.md 17, the owner on the phone, 2026-10-26: its bot outscored them about 2:1, "linear match-3 ... makes it
  // very difficult"): runs of 3 and any 4 touching in any shape (Puyo's rule), 5 colours, and a bot that weighs 6 actions a point, not
  // 60. Clusters of 3 were measured and refused: one move at the opening could make 52 to 770 junk (runs only: 9 to 112).
  // Its board 14 x 14 (PUZZLE-DUELS.md 17.4: the phone's cells 1.4x as big, on every device), a column a 2 junk and 6 landing at once:
  // a duel as long as the 20's (7 turns a side to 6.3) and as winnable (the stand-in 14 of 20 to 15).
  lanternwisp: { feeling: 'dread', board: { w: 14, h: 14, perColumn: 2, landCap: 6 }, match: 3, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.S : DIRS.N), colours: 5, drip: 4,
    fog: { side: 1, light: 3 }, embers: { from: 1, count: 3 }, bot: { pairs: 0.8, sample: 8 } }, // (8 since the lookaheads stopped drawing the duel's own dice, 19.4: the stand-in wins 58 of 80, as it did)
};

/** A creature kind's own ruleset, where it has one (`c.kind` -> a RULESETS key). */
export const KIND_RULESETS = { wisp: 'lanternwisp' };

/** The ruleset a creature brings to a duel: its kind's own (an aberrant Lantern Wisp's), else its feeling's (`c.grade`, a blotling's
 *  weather), else fury's. */
export function rulesetOf(c) {
  return RULESETS[KIND_RULESETS[c?.kind]] || RULESETS[c?.grade] || RULESETS.fury;
}
