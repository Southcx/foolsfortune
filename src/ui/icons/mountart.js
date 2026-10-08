// ---------------------------------------------------------------------------------------
// THE MOUNTS' ICONS: the seven tools at sea (progress/rail/mounts.js, Dovina's table), each a picture of what it DOES on the ship, never
// of the tool ashore (the label is the genre word, so the picture is too: CLARITY.md sections 3 and 5), 14 x 14 in the icons' hand
// (ui/icons/hand.js):
//   psygun      Blaster        a revolver, a shot leaving its muzzle
//   sondelass   Grapple        a grapnel on its line, its tines open
//   soulbrush   Absorb Spray   a nozzle and the fan of spray it throws, shots caught in it
//   crucibelle  Bomb           a bell, rung: a ring going out from it on both sides
//   lockheart   Vacuum         a funnel drinking, shots drawn into its throat
//   veritome    Snapshot       a camera, its flash going off
//   dreamvane   Radar          a signal's arcs going out from a point, a blip found
//
// Prior art: the weapon icons of Gradius's power-up bar and Mega Man's weapon menu (one picture a weapon, what it fires), and Breath of
// the Wild's rune icons (the action, not the object: a magnet for Magnesis, a bomb for a bomb).
//
//   MOUNT_ART[tool] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

export const MOUNT_ART = {
  psygun: [
    '..............',
    '..............',
    '.##...........',
    '.#########..++',
    '.#########..++',
    '.###xx#.......',
    '..##xx#.......',
    '..###.#.......',
    '.####.#.......',
    '.####.........',
    '####..........',
    '####..........',
    '###...........',
    '..............',
  ],
  sondelass: [
    '......++......',
    '......##......',
    '..###.##.###..',
    '.#...####...#.',
    '.#....##....#.',
    '......##......',
    '......##......',
    '......##......',
    '......##......',
    '.....####.....',
    '.....#..#.....',
    '..-..####.....',
    '.-.-..........',
    '-...-.........',
  ],
  soulbrush: grid(14, 14, (x, y) => {
    if (y >= 6 && x <= 4) return y === 6 || x === 0 ? '#' : y >= 12 ? '-' : '#';
    if (y >= 4 && y <= 5 && x >= 1 && x <= 3) return x === 3 && y === 4 ? '+' : '#';
    const dx = x - 4, dy = 4 - y; if (dx < 1) return null;
    const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
    if (a < -0.42 || a > 0.95 || r > 10.2) return null;
    if ((x === 9 && y === 2) || (x === 12 && y === 4)) return 'x';
    return (x + y) % 2 === 0 ? '+' : null;
  }),
  crucibelle: [
    '......##......',
    '.....####.....',
    '.....####.....',
    '.#..######..#.',
    '#...######...#',
    '#...######...#',
    '#...######...#',
    '#...######...#',
    '.#.########.#.',
    '..##########..',
    '......++......',
    '.....++++.....',
    '......++......',
    '..............',
  ],
  lockheart: grid(14, 14, (x, y) => {
    if (x <= 3) return y >= 5 && y <= 8 ? '#' : null;
    const top = 5 - (x - 4) * 0.56, bot = 8 + (x - 4) * 0.56;
    if (Math.abs(y - top) < 0.9 || Math.abs(y - bot) < 0.9) return '#';
    for (const cx of [6, 10]) if (y > top + 1 && y < bot - 1 && x - cx === Math.round(Math.abs(y - 6.5) * 0.8) && Math.abs(y - 6.5) <= 2.6) return '+';
    return null;
  }),
  veritome: [
    '.+...+........',
    '..+.+.........',
    '+++++..###....',
    '..+.+..###....',
    '.+...+####....',
    '.############.',
    '.#####xxx####.',
    '.####x+--x###.',
    '.####x---x###.',
    '.####x---x###.',
    '.#####xxx####.',
    '.############.',
    '..............',
    '..............',
  ],
  dreamvane: grid(14, 14, (x, y) => {
    const dx = x - 1, dy = 12 - y, r = Math.hypot(dx, dy); if (dx < 0 || dy < 0) return null;
    if (r <= 1.6) return '+';
    if ((x === 10 && y === 5) || (x === 11 && y === 5) || (x === 10 && y === 4) || (x === 11 && y === 4)) return '+';
    for (const R of [4.6, 8.0, 11.4]) if (Math.abs(r - R) <= 0.8) return '#';
    return null;
  }),
};
