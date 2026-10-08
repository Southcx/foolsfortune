// ---------------------------------------------------------------------------------------
// THE CHIPS' ICONS AND THE CARD'S MARKS: the small pictures a choice card's stat chips carry beside their numbers (ui/choicecard.js),
// 8 x 8 in the icons' hand (ui/icons/hand.js: 10 x 10 with the keyline), and the card's marks of state and comparison:
//   range     a span with its ends marked (metres)          angle     a wedge and its arc (degrees)
//   energy    a drop (the pool's cost)                      charges   three pips (uses a crossing)
//   cooldown  a clock (real seconds before it is ready)     duration  an hourglass (real seconds it lasts)
//   lock      a padlock (a card not yet opened)             check     a tick (a card equipped)
//   up, down  an arrow (a compared number rising or falling; drawn solid for better and hollow for worse, so the comparison never
//             rests on its green or red alone)
//
// Prior art: Monster Hunter's equipment compare (the arrow beside the number), Hades' boon card numbers, Diablo's tooltip stat lines,
// and the Xbox Accessibility Guideline 103 (colour is never the only way a thing is told).
//
//   CHIP_ART[id] -> rows (8 x 8)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

export const CHIP_ART = {
  range: [
    '#......#',
    '#......#',
    '#.#..#.#',
    '########',
    '########',
    '#.#..#.#',
    '#......#',
    '#......#',
  ],
  angle: grid(8, 8, (x, y) => {
    const dx = x, dy = 7 - y, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (y >= 6 && x <= 7) return '#';
    if (a > 0.95 && a < 1.25 && r <= 8.4) return '#';
    if (Math.abs(r - 4.6) < 0.6 && a > 0 && a < 1.0) return '+';
    return null;
  }),
  energy: [
    '...##...',
    '...##...',
    '..####..',
    '.######.',
    '.#b####.',
    '.#b####.',
    '.######.',
    '..####..',
  ],
  charges: [
    '........',
    '........',
    '##.##.##',
    '##.##.##',
    '........',
    '........',
    '........',
    '........',
  ],
  cooldown: grid(8, 8, (x, y) => {
    const dx = x - 3.5, dy = y - 3.5, r = Math.hypot(dx, dy); if (r > 3.9) return null;
    if (r > 3.0) return '#';
    if ((x === 3 && y >= 1 && y <= 3) || (y === 3 && x >= 3 && x <= 5)) return 'x';
    return '-';
  }),
  duration: [
    '########',
    '.#----#.',
    '..#--#..',
    '...##...',
    '...##...',
    '..#++#..',
    '.#++++#.',
    '########',
  ],
  lock: [
    '..####..',
    '.##..##.',
    '.#....#.',
    '########',
    '###xx###',
    '###xx###',
    '####x###',
    '########',
  ],
  check: [
    '.......#',
    '......##',
    '.....##.',
    '#...##..',
    '##.##...',
    '.###....',
    '..#.....',
    '........',
  ],
  up: [
    '...##...',
    '..####..',
    '.######.',
    '########',
    '..####..',
    '..####..',
    '..####..',
    '........',
  ],
  upHollow: [
    '...##...',
    '..#..#..',
    '.#....#.',
    '###..###',
    '..#..#..',
    '..#..#..',
    '..####..',
    '........',
  ],
};
CHIP_ART.down = [...CHIP_ART.up].reverse();
CHIP_ART.downHollow = [...CHIP_ART.upHollow].reverse();
