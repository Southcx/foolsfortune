// ---------------------------------------------------------------------------------------
// CARVING A SLAB'S ICONS: the seven verbs at the carving bench (progress/slabs.js VERBS; world/garden/bench.js lays them as the slot row,
// ui/benchlook.js gives each its icon), each a picture of what the verb DOES to the stone, never of the tool (CLARITY.md sections 3 and
// 5), 14 x 14 in the icons' hand (ui/icons/hand.js):
//   brush       the brush's tuft sweeping, dust lifting off           pick        a pick's head brought down, a chip knocked off
//   blast       a burst on the stone, its crust thrown                slice       a blade drawn along a layer, the cut line dark
//   hoover      the funnel drinking (the Lockheart's mount icon)      toll        the bell rung, a ring out both sides (the Crucibelle's)
//   silhouette  a plate held up, the creature's shape dashed in it
//
// Prior art: the mounts' icons (ui/icons/mountart.js), whose hoover and toll pictures are the same deeds; Fossil Fighters' and Spectrobes:
// Origins' tool buttons (a picture of the tool's effect on the rock).
//
//   SLAB_VERB_ART[verb] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';
import { MOUNT_ART } from './mountart.js';

export const SLAB_VERB_ART = {
  brush: [
    '...........##.',
    '..........##..',
    '.........##...',
    '........##....',
    '.......##.....',
    '......++......',
    '.....+++......',
    '....####......',
    '...#####......',
    '..#####.......',
    '..###.........',
    '..............',
    '-..-..-.......',
    '.-..-.........',
  ],
  pick: [
    '..............',
    '.+..........-.',
    '.++########...',
    '..+########.-.',
    '.......##.....',
    '.......##.....',
    '.......##.....',
    '.......##.....',
    '.......##.....',
    '.......##.....',
    '..-....##.....',
    '.-.-..####....',
    '..............',
    '##############',
  ],
  blast: grid(14, 14, (x, y) => {
    if (y >= 12) return x >= 1 && x <= 12 ? '#' : null;
    const dx = x - 6.5, dy = y - 5.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (r < 1.8) return '+';
    if (r < 5.6 && Math.abs(Math.sin(a * 4)) > 0.86) return r < 3.4 ? '+' : '#';
    if ((x === 1 && y === 1) || (x === 12 && y === 2) || (x === 2 && y === 10) || (x === 11 && y === 9)) return '-';
    return null;
  }),
  slice: [
    '...........##.',
    '..........##..',
    '.........##...',
    '.+++++++++....',
    '..............',
    '.############.',
    '.############.',
    '.xxxxxxxxxxxx.',
    '.############.',
    '.############.',
    '.############.',
    '..............',
    '..-.-.........',
    '...-..........',
  ],
  hoover: MOUNT_ART.lockheart,
  toll: MOUNT_ART.crucibelle,
  silhouette: [
    '##############',
    '#............#',
    '#....+.......#',
    '#...+.+......#',
    '#..+...+++...#',
    '#.+.......+..#',
    '#+.........+.#',
    '#.+.......+..#',
    '#..+++.+++...#',
    '#....+.+.....#',
    '#............#',
    '##############',
    '......##......',
    '.....####.....',
  ],
};
