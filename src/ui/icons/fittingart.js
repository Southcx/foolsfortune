// ---------------------------------------------------------------------------------------
// THE FITTINGS' ICONS: what fits into a tool (FITTINGS, pneuka/box.js), as a tile on its tool's card at the reading table
// (ui/readingtable.js), 8 x 8 in the icons' hand (ui/icons/hand.js: 10 x 10 with the keyline):
//   lure        the rod's lure, a fish-shaped spoon on its ring     instrument  the Crucibelle's, a bell's mouth and its clapper
//   key         a Possibilikey, a bow and a toothed bit             bottle      a Lachrymato Bottle, its neck and its fill line
//   heart       the Lockheart's coffin, the hexagonal lid           shell       a caster shell, a round and its rim
//
// Prior art: the chips' icons beside them (ui/icons/chipart.js), Zelda's item sub-screen (one silhouette a thing, read at a glance).
//
//   FITTING_ART[kind] -> rows (8 x 8)
// ---------------------------------------------------------------------------------------
export const FITTING_ART = {
  lure: [
    '......##',
    '......#.',
    '....###.',
    '..#####.',
    '.######.',
    '######..',
    '.###....',
    '#.#.....',
  ],
  instrument: [
    '...##...',
    '..####..',
    '..####..',
    '.######.',
    '.######.',
    '########',
    '...##...',
    '...##...',
  ],
  key: [
    '.###....',
    '#...#...',
    '#...#...',
    '.#######',
    '.....#.#',
    '.....#.#',
    '........',
    '........',
  ],
  bottle: [
    '...##...',
    '...##...',
    '..####..',
    '.#....#.',
    '.#....#.',
    '.######.',
    '.######.',
    '..####..',
  ],
  heart: [
    '..####..',
    '.######.',
    '########',
    '###..###',
    '.######.',
    '.######.',
    '..####..',
    '...##...',
  ],
  shell: [
    '..####..',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.######.',
    '########',
    '########',
  ],
};
