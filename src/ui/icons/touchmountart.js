// ---------------------------------------------------------------------------------------
// THE TOUCH TILES' GLYPHS OF THE MOUNTS AT SEA: the worn tools at the free helm (docs/plans/OPEN-SEA.md 14.2; the tiles `mount.1` and
// `mount.2` on the helm's strip, ui/touch/actioncontext.js), 14 x 14 in the icons' hand (ui/icons/hand.js), spread into TOUCH_ART
// (touchart.js) as 'touch.<id>'. Each is the mount's own picture at sea, never the tool's on foot (TOUCH_ACTION_ART's).
//   mharpoon  a barbed iron flying on its line          mtoll   the bell, a ring of sound out over the water
//   mgulp     the coffin, the sea spiralling into it    msonar  rings out from a hull, a mark below the water
//   mflash    a burst inside a plate's four corners     mslick  a pool of paint on the water, a drop falling into it
// Where a glyph acts on matter the matter is '#', the part that does the thing '+', the ground and what waits '-' (touchart.js's rule).
//
// Prior art: touchart.js's glyphs (one picture a verb), Sea of Thieves' harpoon and Subnautica's sonar icons, the lock-on's brackets.
//
//   TOUCH_MOUNT_ART[id] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------

export const TOUCH_MOUNT_ART = {
  mharpoon: [
    '..............',
    '..........+++.',
    '.........++#+.',
    '........+.++..',
    '.......#.+....',
    '......#.......',
    '.....#........',
    '....#.........',
    '...#..........',
    '..#...........',
    '.#............',
    '#.............',
    '-.-.-.-.-.-.-.',
    '..............',
  ],
  mtoll: [
    '......##......',
    '.....####.....',
    '.....####.....',
    '....######....',
    '....######....',
    '...########...',
    '..##########..',
    '......##......',
    '..............',
    '.+..........+.',
    '+............+',
    '.++........++.',
    '...++++++++...',
    '--------------',
  ],
  mgulp: [
    '..++++........',
    '.+....+.......',
    '+..++..+......',
    '+.+..+.+......',
    '+..+..+.......',
    '.+..++...####.',
    '..+.....#####.',
    '...++++######.',
    '......#######.',
    '.......######.',
    '........#####.',
    '.........####.',
    '..........###.',
    '--------------',
  ],
  msonar: [
    '..............',
    '....+++++.....',
    '..++.....++...',
    '.+..+++++..+..',
    '+..+.....+..+.',
    '+.+..###..+.+.',
    '+.+.#####.+.+.',
    '--------------',
    '..............',
    '..............',
    '.......+......',
    '......+++.....',
    '.......+......',
    '..............',
  ],
  mflash: [
    '###........###',
    '#............#',
    '#.....+......#',
    '...+..+..+....',
    '....+.+.+.....',
    '.....+++......',
    '..++++#++++...',
    '.....+++......',
    '....+.+.+.....',
    '...+..+..+....',
    '#.....+......#',
    '#............#',
    '###........###',
    '..............',
  ],
  mslick: [
    '......+.......',
    '......+.......',
    '.....+++......',
    '.....+++......',
    '......+.......',
    '..............',
    '...########...',
    '.###########..',
    '##############',
    '.############.',
    '...########...',
    '--------------',
    '..............',
    '..............',
  ],
};
