// ---------------------------------------------------------------------------------------
// THE TOUCH TILES' GLYPHS OF A MECH: the arc's tiles while the Pneuka Jar is sealed in a frame (docs/plans/MECHS.md 4.9; the arc's `mech`
// context, ui/touch/arc.js, its faces ui/mechs/mechfaces.js), 14 x 14 in the icons' hand (ui/icons/hand.js), spread into TOUCH_ART
// (touchart.js) as 'touch.<id>'. Each is the frame's own verb at its scale, the arm's glyph the weapon it holds (PARTS, progress/mechs/parts.js):
//   mkfist     a clenched fist, knuckles up                   mkblade    the great blade, its edge lit, its guard and grip
//   mkblaster  the big gun's barrel, a flash at its muzzle    mkpress    an open hand pressed on a hex (the barrier pressed: AT Field)
//   mkmissiles three motes on their trails out of a pod       mkshield   a kite shield, its boss lit
//   mkunit     a pack on the back, its two pods (no back unit worn)
//   mkboost    a thruster's bell, its flame streaming out     mkcable    the umbilical's plug, its two prongs, the cable curling off
//   mkexit     the Pneuka Jar lifting out of its cradle under an arrow (stepping out: X)
// Where a glyph acts on matter the matter is '#', the part that does the thing '+', the ground and what waits '-' (touchart.js's rule).
//
// Prior art: touchart.js's glyphs (one picture a verb), Armored Core's weapon icons (a part's silhouette a slot), Evangelion's umbilical
// cable plug and its AT Field hexes, the mobile mecha games' (Mech Arena, Gundam Battle) arm buttons.
//
//   TOUCH_MECH_ART[id] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

/** A pointy hex's border round (7, 7) at `r`, its distance on the hex's own metric. */
const hexD = (x, y) => { const dx = Math.abs(x + 0.5 - 7), dy = Math.abs(y + 0.5 - 7); return Math.max(dx * 0.866 + dy * 0.5, dx); };

/** The open hand (the press): four fingers, a thumb, the palm and its wrist; '+' at the fingertips where they meet the hex. */
const HAND = [
  '..............',
  '..............',
  '....+.+.+.....',
  '....#.#.#.+...',
  '....#.#.#.#...',
  '....#.#.#.#...',
  '....#######...',
  '..#.#######...',
  '...########...',
  '....#######...',
  '.....#####....',
  '.....#####....',
  '.....#####....',
  '..............',
];

export const TOUCH_MECH_ART = {
  mkfist: [
    '..............',
    '..............',
    '...##.##.##...',
    '..##########..',
    '..##########..',
    '..#.#.#.#.##..',
    '..##########..',
    '.###########..',
    '.##.#######...',
    '..#########...',
    '...#######....',
    '....######....',
    '....######....',
    '....------....',
  ],
  mkblade: [
    '............++',
    '...........+++',
    '..........+++.',
    '.........+++..',
    '........+++...',
    '.......+++....',
    '......+++.....',
    '.....+++......',
    '..#.+++.......',
    '...###........',
    '...###........',
    '..#.#.#.......',
    '.##...........',
    '##............',
  ],
  mkblaster: [
    '..............',
    '..............',
    '...........+..',
    '.##########.+.',
    '############++',
    '.##########.+.',
    '..####.....+..',
    '..###.........',
    '..###.........',
    '.###..........',
    '.##...........',
    '..............',
    '--------------',
    '..............',
  ],
  mkpress: grid(14, 14, (x, y) => {
    const h = HAND[y]?.[x];
    if (h && h !== '.') return h;
    const d = hexD(x, y);
    return d <= 6.6 && d > 5.6 ? '-' : null;
  }),
  mkmissiles: [
    '.+.....+......',
    '.++...++...+..',
    '..#...#...++..',
    '..-...-...#...',
    '..-...-...-...',
    '...-..-..-....',
    '...-..-..-....',
    '..##########..',
    '..#.##.##.##..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..............',
  ],
  mkshield: [
    '..............',
    '..##########..',
    '.############.',
    '.###......###.',
    '.###......###.',
    '.###..++..###.',
    '.###.++++.###.',
    '.###..++..###.',
    '..###....###..',
    '..###....###..',
    '...###..###...',
    '....######....',
    '.....####.....',
    '......##......',
  ],
  mkunit: [
    '..............',
    '...###..###...',
    '..####..####..',
    '..####..####..',
    '..#++#..#++#..',
    '..####..####..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..##..##..##..',
    '..##########..',
    '...########...',
    '..............',
    '..............',
  ],
  mkboost: [
    '..............',
    '..............',
    '.........###..',
    '.......######.',
    '.+.+..+######.',
    '..+.++########',
    '++++++########',
    '..+.++########',
    '.+.+..+######.',
    '.......######.',
    '.........###..',
    '..............',
    '..............',
    '..............',
  ],
  mkcable: [
    '.........+..+.',
    '.........+..+.',
    '........######',
    '........######',
    '........######',
    '.........####.',
    '..........##..',
    '.........-....',
    '.......--.....',
    '.....--.......',
    '....-.........',
    '...-..........',
    '...-..........',
    '..-...........',
  ],
  mkexit: [
    '......+.......',
    '.....+++......',
    '....+++++.....',
    '......+.......',
    '.....###......',
    '....#####.....',
    '...#######....',
    '...#######....',
    '....#####.....',
    '..-.......-...',
    '..--.....--...',
    '...-------....',
    '....-----.....',
    '..............',
  ],
};
