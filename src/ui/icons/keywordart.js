// ---------------------------------------------------------------------------------------
// THE KEYWORDS' ICONS: the twelve genre words of docs/plans/CLARITY.md section 5 (ui/keywords.js holds their words), each a picture of
// what it means, 14 x 14 in the icons' hand (ui/icons/hand.js: the light shape only; the bevel and the keyline are the hand's, 16 x 16
// with it). Each is a shape a player already knows from other games, so it reads in greyscale and at 1x before its word is read:
//   absorb     a mouth open over a shot (the chomp: a thing that eats what it meets)
//   parry      a blade with the flash where the blow meets it, the shot sent back (the deflect)
//   bomb       a burst: a ring blown out from a core, broken where it flies apart
//   lockon     the bracket reticle: four corners closing on a point
//   weakpoint  an eye with a crack through it (the eye is this game's weak point: Old Nobody's, the shoal's silhouette's)
//   stun       three stars wheeling over a head (the cartoon daze)
//   energy     a drop (the pool: Lachryma is a tear)
//   cooldown   a clock with the wedge of time still to wait
//   charges    three pips (the uses left, as a shmup counts its bombs)
//   hull       a ship's side in planks, cracked (the hits it can still take)
//   fuel       the bottle, stoppered, a level of fuel in it
//   passive    a ring, closed: always on
//
// Prior art: the keyword icons of Slay the Spire (one picture a keyword), the status icons of Monster Hunter and Final Fantasy XIV
// (a shape before a colour), and the cartoon's own vocabulary (stars for a daze, a burst for a bomb, a reticle for a lock).
//
//   KEYWORD_ART[id] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

const ring = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

export const KEYWORD_ART = {
  absorb: grid(14, 14, (x, y) => {
    const dx = x - 5.6, dy = y - 6.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (ring(x, y, 12, 6.5) <= 1.2) return '+';
    if (r <= 6.1 && !(dx > 0 && Math.abs(a) < 0.72)) return ring(x, y, 5, 3.4) < 0.9 ? 'x' : '#';
    return null;
  }),
  parry: [
    '...........##.',
    '.+.+.+....###.',
    '..+++....###..',
    '.+++++..###...',
    '..+++..###....',
    '.+.+.+###.....',
    '.....###......',
    '....###.......',
    '.#.###........',
    '.####.........',
    '..##..........',
    '.####.........',
    '##..#.........',
    '#.............',
  ],
  bomb: grid(14, 14, (x, y) => {
    const dx = x - 6.5, dy = y - 6.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const R = 3.9 + 3.0 * Math.max(0, Math.cos(a * 8)) ** 3;
    if (r <= 2.5) return '+';
    return r <= R ? '#' : null;
  }),
  lockon: [
    '####......####',
    '####......####',
    '##..........##',
    '##..........##',
    '..............',
    '..............',
    '......++......',
    '......++......',
    '..............',
    '..............',
    '##..........##',
    '##..........##',
    '####......####',
    '####......####',
  ],
  weakpoint: grid(14, 14, (x, y) => {
    const dx = x - 6.5, dy = y - 6.5, r = Math.hypot(dx, dy);
    const crack = [6, 7, 7, 8, 7, 6, 6, 7, 8, 8, 7, 7, 6, 6][y];
    const lid = 4.6 * (1 - (dx / 7.2) ** 2);
    if (Math.abs(dy) > lid) return x === crack && (y <= 1 || y >= 12) ? 'x' : null;
    if (x === crack) return 'x';
    if (r <= 1.4) return 'x';
    return r <= 3.4 ? '#' : '+';
  }),
  stun: [
    '..+.......+...',
    '.+++.....+++..',
    '..+...+...+...',
    '.....+++......',
    '......+.......',
    '..............',
    '..............',
    '....######....',
    '..##########..',
    '.############.',
    '##############',
    '##############',
    '##############',
    '##############',
  ],
  energy: grid(14, 14, (x, y) => {
    const cx = 6.5, cy = 8.6, R = 4.9, d = ring(x, y, cx, cy);
    const inCone = y < cy && Math.abs(x - cx) <= ((y + 0.4) / (cy + 0.4)) * R * 0.98;
    if (d > R && !inCone) return null;
    return ring(x, y, 4.6, 8.4) < 1.2 ? 'b' : '#';
  }),
  cooldown: grid(14, 14, (x, y) => {
    const dx = x - 6.5, dy = y - 6.5, r = Math.hypot(dx, dy); if (r > 6.6) return null;
    if (r > 5.5) return '#';
    const a = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
    if ((Math.abs(dx) < 0.6 && dy < 0 && dy > -5) || (r < 3.6 && Math.abs(a - 2.1) < 0.28)) return 'x';
    return a < 2.1 ? '-' : '+';
  }),
  charges: [
    '..............',
    '..............',
    '..............',
    '..............',
    '.##...##...##.',
    '####.####.####',
    '####.####.####',
    '####.####.####',
    '.##...##...##.',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  hull: [
    '......#.......',
    '......##......',
    '......###.....',
    '......####....',
    '......#####...',
    '......######..',
    '......#.......',
    '##############',
    '#######x######',
    '.xxxxxxx.xxxx.',
    '.#####x######.',
    '..####x#####..',
    '...####x###...',
    '..............',
  ],
  fuel: [
    '.....----.....',
    '.....----.....',
    '......--......',
    '.....----.....',
    '....------....',
    '..----------..',
    '.------------.',
    '.------------.',
    '.xxxxxxxxxxxx.',
    '.++++++++++++.',
    '.++++++++++++.',
    '.++++++++++++.',
    '..++++++++++..',
    '....++++++....',
  ],
  passive: grid(14, 14, (x, y) => { const r = ring(x, y, 6.5, 6.5); return r >= 3.4 && r <= 6.6 ? '#' : null; }),
};
