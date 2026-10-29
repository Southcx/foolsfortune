// ---------------------------------------------------------------------------------------
// THE FIGMENTS' RULESETS (docs/plans/PUZZLE-DUELS.md section 6: "one aberrant Figment is one ruleset", the owner, 2026-10-19): what the
// engine loads for a fight, chosen by the Figment's feeling. The kernel's three, a first pass; every other feeling's families are to
// come as their rules are built (section 5). A ruleset is data: the clears it uses, its gravity map, its odds and its bot's weights.
//
// Prior art: Puzzle Fighter's and Puyo's characters (one drop pattern each), Noon's arenas, Dr. Mario's viruses per level.
//
//   RULESETS[name] -> { feeling, board?: { w, h, perColumn, landCap }, run, cluster, gravity(x, y, board), bombs, blast, pincer, colours, drip, queue, fog, embers, bot }
//   bot: the score's weights (bot.js W), `sample`: actions it weighs a point (its cleverness: 60 if not said), `idle`: it never acts, `every`: it acts one turn in that many
//   PRACTICE { idle, plain, wisp } -> a RULESETS key: the practice duel's difficulty (Strawman's)
//   rulesetOf(creature, practice?) -> a ruleset: a practice pick's (PRACTICE), else its kind's own (KIND_RULESETS: an aberrant Lantern Wisp's, Strawman's), else its feeling's, else fury's
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
  // Its board 12 x 9 and 4 colours since South's phone redo (2026-10-27, PUZZLE-DUELS.md 20: the board the largest thing on screen,
  // its cells 44 px, the touch minimum, at the full height of a phone held sideways): measured over 40 duels against this bot, 14 x 14
  // with 5 colours let the stand-in win 17 and chain 4 to 5 deep; 12 x 10 with 5 colours fell to chains of 3 (too few cells for five
  // colours to meet); 4 colours put the depth back (chains of 4 on both sides) and the stand-in wins 24, 7.9 turns a side. Fury stays
  // on the board, so the Wisp's weakness (fury, the opposite of its dread) is still there to chase.
  // 5 colours since the duel's powers (PUZZLE-DUELS.md 24.3, 2026-10-28): on 4 a stand-in casting them won every duel in 3 turns, the
  // fewest the Line allows, at any strength (a Transmute leaves 3 colours, and 3 colours chain without end); on 5, a stand-in weighing 2
  // drags a turn wins 15 of 16 in 4.8 turns with them and 4 of 16 in 17.9 without, one weighing 12 16 in 6.4 and 9 without: the powers
  // are what win it, and the duel lasts long enough for all four of its foe skills.
  lanternwisp: { feeling: 'dread', board: { w: 12, h: 9, perColumn: 2, landCap: 6 }, match: 3, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.S : DIRS.N), colours: 5, drip: 4,
    palette: ['wonder', 'mirth', 'fury', 'grief', 'dread'], // (its own Dread, the lantern's fuel and the colour it resists, and Fury, its weakness: ABERRANTS.md 3)
    fog: { side: 1, light: 3 }, embers: { from: 1, count: 3 }, bot: { pairs: 0.8, sample: 8 },
    // its foe skills in the PvE duel (foeskills.js; PUZZLE-DUELS.md 23.4): embers hurled every 2nd turn, gems petrified every 3rd, a
    // column sealed every 4th, the Line reclaimed every 5th; at its last 2 columns, once, a flare of all it has
    pve: { perColumn: 5 }, // (the PvE duel's push: 5 sent a column, two columns a turn at most: PUZZLE-DUELS.md 23.5)
    // its secret (secrets.js, ABERRANTS.md 3): snuff the lantern, 48 Dread gems cleared; Kindle wakes once it is half spent
    secret: 'snuff',
    foe: { moves: [{ skill: 'hurl', every: 2, first: 1, n: 3 }, { skill: 'petrify', every: 3, first: 2, n: 3 }, { skill: 'seal', every: 4, first: 3 }, { skill: 'reclaim', every: 5, first: 4 }, { skill: 'kindle', every: 2, first: 1, n: 3, wake: 'half' }],
      desperate: { at: 2, moves: [{ skill: 'hurl', n: 5 }, { skill: 'petrify', n: 4 }] } } }, // (8 since the lookaheads stopped drawing the duel's own dice, 19.4: the stand-in wins 58 of 80, as it did)
  // AN ABERRANT SLIP JELLY (ABERRANTS.md 5; South, 2026-10-29: "it should throw a LOT of junk, but its easy to clear. The weakness could
  // be being highly susceptible to a well timed Transmute that converts the piled up junk for an OHKO"). The Wisp's board and gravity,
  // Gall's colours (its slime is Gall), no colour it is weak to (`weak: false`: its weakness is the Transmute). Its junk lands as slime
  // (`slime`: junk a Transmute turns to gems, duel.js land); it hurls every turn and spews a heap every 3rd; once its slime is piled past
  // the secret's `wake` its Harden wakes (secrets.js `dissolve`). Measured (ABERRANTS.md 5.1, 32 duels a row, every power open, the
  // regen 8): a strong stand-in wins 32 of 32 at the Line in 4.2 turns; a half-skilled one 20 of 32 in 6.5 (11 by the secret, by
  // chance); a player who Transmutes the turn after a Spew wins it by the secret 16 of 16 in 3.4. A board 9 tall drowned the half-skilled
  // (12 of 32); 11 tall gave the secret no edge over the Line (4.1 turns against 4.0).
  slipjelly: { feeling: 'gall', board: { w: 12, h: 10, perColumn: 2, landCap: 8 }, match: 3, cluster: 4, gravity: (x, y, b) => (b.sideOf(x) === 0 ? DIRS.S : DIRS.N), colours: 5, drip: 4,
    palette: ['wonder', 'mirth', 'desire', 'gall', 'grief'], weak: false, slime: { from: 1 }, bot: { pairs: 0.8, sample: 8 },
    pve: { perColumn: 5 }, secret: 'dissolve',
    foe: { moves: [{ skill: 'hurl', every: 1, first: 1, n: 3 }, { skill: 'spew', every: 3, first: 2, n: 7 }, { skill: 'reclaim', every: 5, first: 4 }, { skill: 'harden', every: 2, first: 1, n: 4, wake: 'half' }],
      desperate: { at: 2, moves: [{ skill: 'spew', n: 9 }] } } },
  // STRAWMAN'S PRACTICE DUEL (South, 2026-10-27, via Petra: "test more basic implementations of the puzzle duel module"): the duel with
  // nothing but its core, for testing the duel itself at the sparring circle. The smallest board that still chains (8 x 8, a half of
  // 4 columns: three colours chained too easily, five too rarely), plain gravity on both halves, runs of 3 and any 4 touching (the
  // Wisp's gentle rule), no fog, no embers, no bombs. Its bot weighs few actions (a plain player, never a clever one); `strawmanIdle`
  // never acts, for trying the verbs and the skills with no pressure (Puzzle & Dragons' training dungeon, Tetris's practice).
  // All seven feelings' gems since 2026-10-28 (South, through Petra: "Strawman drops all seven feelings' gems. That is harder, and the
  // seven powers are what bring it back down"): measured over 16 duels each (PUZZLE-DUELS.md 24.3), a stand-in weighing 2 drags a turn
  // wins 14 in 8.4 turns with the powers, 3 in 23.1 without; weighing 1, 12 in 12.0 and 2; weighing 12, 14 in 8.2 and 6 (on 4 colours
  // it won every duel in 3.7 turns with no power at all).
  strawman: { feeling: 'fury', board: { w: 10, h: 8, perColumn: 2, landCap: 5 }, match: 3, cluster: 4, gravity: () => DIRS.S, colours: 7, drip: 3,
    skyfall: { to: 0.5, calm: 0.95 }, bot: { sample: 2, every: 2 }, pve: { perColumn: 4 },
    foe: { moves: [{ skill: 'hurl', every: 3, first: 2, n: 2 }, { skill: 'petrify', every: 4, first: 3, n: 2 }, { skill: 'seal', every: 5, first: 4 }] } }, // (the plain dummy's: gentle, slow, no Reclaim) // (skyfall to half full: at 0.4 its duels ran 7.8 turns a side, at 0.5 5.3, as without it: PUZZLE-DUELS.md 22.7)
  strawmanIdle: { feeling: 'fury', board: { w: 10, h: 8, perColumn: 2, landCap: 5 }, match: 3, cluster: 4, gravity: () => DIRS.S, colours: 7, drip: 3, skyfall: { to: 0.5, calm: 0.95 },
    bot: { idle: true } },
};

/** A creature kind's own ruleset, where it has one (`c.kind` -> a RULESETS key). */
export const KIND_RULESETS = { wisp: 'lanternwisp', strawman: 'strawman', slipjelly: 'slipjelly' };

/** The practice duel's difficulty, for a pick at the lectern (Petra's to wire): the ruleset a choice loads, easiest first. 'wisp' is
 *  the Lantern Wisp's own board met in practice (its fog and embers), to rehearse the real fight. */
export const PRACTICE = { idle: 'strawmanIdle', plain: 'strawman', wisp: 'lanternwisp', jelly: 'slipjelly' }; // (jelly: the aberrant slip jelly's board, rehearsed before any jelly in the world goes wrong)

/** The ruleset a creature brings to a duel: its kind's own (an aberrant Lantern Wisp's), else its feeling's (`c.grade`, a blotling's
 *  weather), else fury's. */
export function rulesetOf(c, practice = null) {
  return RULESETS[PRACTICE[practice]] || RULESETS[KIND_RULESETS[c?.kind]] || RULESETS[c?.grade] || RULESETS.fury;
}
