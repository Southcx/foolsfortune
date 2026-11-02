// ---------------------------------------------------------------------------------------
// THE TOUCH TILES' GLYPHS OF A MECH: the arc's tiles while the Pneuka Jar is sealed in a frame (docs/plans/MECHS.md 4.9; the arc's `mech`
// context, ui/touch/arc.js, its faces ui/mechs/mechfaces.js), 14 x 14 in the icons' hand (ui/icons/hand.js), spread into TOUCH_ART
// (touchart.js) as 'touch.<id>'. Each is the frame's own verb at its scale, the arm's glyph the weapon it holds (PARTS, progress/mechs/parts.js):
//   mkfist     a clenched fist, knuckles up                   mkblade    the great blade, its edge lit, its guard and grip
//   mkblaster  the big gun's barrel, a flash at its muzzle    mkpress    a big hex, a palm lit inside it, ringed dark (the barrier pressed)
//   mkmissiles three motes on their trails out of a pod       mkshield   a kite shield, its boss lit
//   mkunit     a pod on the back mount, two launch tubes standing out of it, their mouths lit (no back unit worn)
//   mkboost    a thruster's bell, its flame streaming out     mkcable    the umbilical's plug, two lit prongs, its thick cord in a curl
// (PRESS, UNIT and CABLE redrawn bold for 48 px: one big shape each, its lit part large, 2026-11-02)
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

/** The palm (the press): four fingers, a thumb, the palm and its wrist, lit inside the hex. */
const HAND = [
  '..............',
  '..............',
  '.....+.+.+....',
  '.....+.+.+.+..',
  '..+..+.+.+.+..',
  '..+..+.+.+.+..',
  '..++.+++++++..',
  '...+++++++++..',
  '....++++++++..',
  '....+++++++...',
  '.....+++++....',
  '.....+++++....',
  '..............',
  '..............',
];
const inHand = (x, y) => (HAND[y]?.[x] ?? '.') === '+';

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
    if (inHand(x, y)) return '+';
    if (hexD(x, y) > 6.6) return null;
    return inHand(x - 1, y) || inHand(x + 1, y) || inHand(x, y - 1) || inHand(x, y + 1) ? 'x' : '-'; // (the hex dim, the palm ringed dark in it)
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
    '.+++.....+++..',
    '.#x#.....#x#..',
    '.###.....###..',
    '.###.....###..',
    '.###.....###..',
    '#############.',
    '#############.',
    '##xxxxxxxxx##.',
    '#############.',
    '#############.',
    '.##.......##..',
    '.##.......##..',
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
    '...++....++...',
    '...++....++...',
    '...++....++...',
    '.############.',
    '.############.',
    '.##xxxxxxxx##.',
    '.############.',
    '..##########..',
    '.....----.....',
    '......--..---.',
    '......--.-..--',
    '......---...--',
    '.......----.-.',
    '.........---..',
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
