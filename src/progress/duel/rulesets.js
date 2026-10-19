// ---------------------------------------------------------------------------------------
// THE FIGMENTS' RULESETS (docs/plans/PUZZLE-DUELS.md section 6: "one aberrant Figment is one ruleset", the owner, 2026-10-19): what the
// engine loads for a fight, chosen by the Figment's feeling. The kernel's three, a first pass; every other feeling's families are to
// come as their rules are built (section 5). A ruleset is data: the clears it uses, its gravity map, its odds and its bot's weights.
//
// Prior art: Puzzle Fighter's and Puyo's characters (one drop pattern each), Noon's arenas, Dr. Mario's viruses per level.
//
//   RULESETS[feeling] -> { run, cluster, gravity(x, y, board), bombs, blast, pincer, colours, rain, queue, bot }
// ---------------------------------------------------------------------------------------
import { DIRS } from './board.js';

export const RULESETS = {
  // Fury: bombs and kicks. Plain gravity, runs of three, a bomb in every 16 pieces that come.
  fury: { feeling: 'fury', run: 3, cluster: 0, gravity: () => DIRS.S, bombs: 0.06, blast: 2, colours: 4, rain: 4, bot: { garbage: 12 } },
  // Grief: everything sinks toward the line (each side's pile leans on it), clusters of four, the pincer turns junk to gems.
  grief: { feeling: 'grief', run: 0, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.E : DIRS.W), pincer: true, colours: 6,
    bot: { pairs: 1 } },
  // Mirth: gravity mirrored (down on the left, up on the right), runs and clusters both, so chains come easily.
  mirth: { feeling: 'mirth', run: 3, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.S : DIRS.N), colours: 5, rain: 3 },
};
