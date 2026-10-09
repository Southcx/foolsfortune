// ---------------------------------------------------------------------------------------
// THE TELEGRAPHS' GLYPHS: the pictures a telegraph wears (docs/plans/TELEGRAPHS.md sections 3 and 4), 14 x 14 in the icons' hand
// (ui/icons/hand.js: the light shape only; the bevel and the keyline are the hand's, 16 x 16 with it), so the marks in the world are
// drawn by the same hand as the HUD's keywords and read the same way: a light shape keylined dark, on any ground. They are world marks:
// no words, no numbers (a count is pips). The world draws them from one atlas (vfx/telegraphs/telegraphatlas.js); the Codex may show
// them as icons (ui/icons/icons.js: 'answer.<id>', 'status.<id>', 'tmark.<id>').
//
//   THE ANSWERS (step 4: how to answer)
//   out         two chevrons pointing one way: laid on the ground at an area's edge, turned to point out of it (and, turned, in and
//               sidestep's: the world draws all three from this one picture)
//   in          two chevrons closing on a dot (the Codex's: the safe centre)       sidestep   a bar with a chevron off each side
//   behind      a curved arrow round a body's back (laid behind a cone's maker)    lookAway   a shut eye, lashes down (on the gazer)
//   guard       a shield (on the arena's rim, a raidwide lessened by the guard)    bait       a block split by a crack (on the pillar)
//   killFirst   the target: a ring, four ticks, a dot (over each add)              highGround an up-chevron over a ledge (on each safe island)
//   (parry: nothing new; the parry mark already says it: vfx/parrymark.js)
//   THE MARKS (step 1 to 2, where nothing lies on the ground)
//   eye         an open eye (on a gazer: Charybdis's eye family)     add   a head marker, a triangle pointing down (over each add)
//   pip         a diamond: a real second left (a row of them over a glyph: "a pip a second left")
//   THE STATUSES (step 3: the status the blow builds, each from its aura's motif, vfx/library.js `aura.<status>`)
//   stun        three stars wheeling (the daze)          doubt     a hex in a hex (the lattice that holds)      charm   a heart
//   blind       an eye struck through                    confusion a swirl with bubbles off it                 slow    a snail
//   halt        an octagon barred (the stop)             sleep     three bubbles rising                          soaked  two drops (the next hit doubled)
//
// Prior art: FFXIV's head markers and status icons (a shape a player knows before its name: the stack arrows, the flare's chevrons,
// the tankbuster's), Monster Hunter's status icons (the snail, the stars, the bubbles), Into the Breach's intent marks, and the
// accessibility guidelines' rule that colour is never alone: every glyph here is told apart in greys.
//
//   ANSWER_ART[id]   STATUS_ART[id]   TMARK_ART[id]   (rows, 14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

const C = 6.5; // (the grid's centre)
const ring = (x, y, cx = C, cy = C) => Math.hypot(x - cx, y - cy);
const almond = (x, y, w = 6.8, h = 4.2) => Math.abs(y - C) <= h * (1 - ((x - C) / w) ** 2); // (an eye's outline)

export const ANSWER_ART = {
  out: [
    '......++......',
    '.....++++.....',
    '....++++++....',
    '...+++..+++...',
    '..+++....+++..',
    '.+++......+++.',
    '.++...##...++.',
    '.....####.....',
    '....######....',
    '...###..###...',
    '..###....###..',
    '.###......###.',
    '.##........##.',
    '..............',
  ],
  in: [
    '.##........##.',
    '.###......###.',
    '..###....###..',
    '...###..###...',
    '....######....',
    '.....####.....',
    '.##...##...##.',
    '.###......###.',
    '..###....###..',
    '...###..###...',
    '....######....',
    '.....+##+.....',
    '.....++++.....',
    '......++......',
  ],
  sidestep: [
    '......##......',
    '..+...##...+..',
    '.++...##...++.',
    '++....##....++',
    '++....##....++',
    '.++...##...++.',
    '..+...##...+..',
    '......##......',
    '..+...##...+..',
    '.++...##...++.',
    '++....##....++',
    '++....##....++',
    '.++...##...++.',
    '..+...##...+..',
  ],
  behind: [
    '.....####.....',
    '....######....',
    '....######....',
    '....######....',
    '.....####.....',
    '.+..........+.',
    '.++........+++',
    '.++.......+++.',
    '..++.....+++..',
    '..+++...++++..',
    '...+++++++....',
    '....+++++.....',
    '..............',
    '..............',
  ],
  lookAway: [
    '..............',
    '..............',
    '..............',
    '..............',
    '##..........##',
    '.###......###.',
    '..##########..',
    '....######....',
    '..+..+..+..+..',
    '..+..+..+..+..',
    '.+...+..+...+.',
    '.+...+..+...+.',
    '..............',
    '..............',
  ],
  guard: [
    '.############.',
    '.#####xx#####.',
    '.#####xx#####.',
    '.#####xx#####.',
    '.#####xx#####.',
    '.#####xx#####.',
    '.#####xx#####.',
    '..####xx####..',
    '..####xx####..',
    '...###xx###...',
    '....##xx##....',
    '.....####.....',
    '......##......',
    '..............',
  ],
  bait: grid(14, 14, (x, y) => {
    if (x < 1 || x > 12 || y < 1 || y > 12) return null;
    const crack = C + [0.4, -0.6, -1.4, -0.6, 0.6, 1.6, 0.8, -0.2, -1.2, -0.4, 0.6, 1.2][y - 1];
    if (Math.abs(x - crack) <= 0.5) return 'x';
    return '#';
  }),
  killFirst: grid(14, 14, (x, y) => {
    const r = ring(x, y);
    if (r <= 1.3) return '+';
    if (r >= 4.0 && r <= 5.4) return '#';
    if ((Math.abs(x - C) <= 0.6 && (y <= 2.6 || y >= 10.4)) || (Math.abs(y - C) <= 0.6 && (x <= 2.6 || x >= 10.4))) return '#';
    return null;
  }),
  highGround: [
    '..............',
    '......++......',
    '.....++++.....',
    '....++++++....',
    '...+++..+++...',
    '..+++....+++..',
    '.+++......+++.',
    '.++........++.',
    '..............',
    '..............',
    '##############',
    '##############',
    '..............',
    '..............',
  ],
};

export const TMARK_ART = {
  eye: grid(14, 14, (x, y) => {
    if (!almond(x, y)) return null;
    const r = ring(x, y);
    if (r <= 1.3) return 'x';
    return r <= 3.3 ? '+' : '#';
  }),
  add: grid(14, 14, (x, y) => {
    const top = 1.5, h = 10.5, half = 6.2 * (1 - (y - top) / h);
    if (y < top || y > top + h || Math.abs(x - C) > half) return null;
    return ring(x, y, C, 4.6) <= 1.4 ? 'x' : '#';
  }),
  pip: grid(14, 14, (x, y) => (Math.abs(x - C) + Math.abs(y - C) <= 4.2 ? '+' : null)),
};

export const STATUS_ART = {
  stun: [
    '......+.......',
    '......+.......',
    '....+++++.....',
    '.....+++......',
    '.....+.+......',
    '..............',
    '.+.........+..',
    '.+.........+..',
    '+++.......+++.',
    '.+.........+..',
    '..............',
    '.....####.....',
    '...########...',
    '..##########..',
  ],
  doubt: grid(14, 14, (x, y) => {
    const hex = (r) => { const dx = Math.abs(x - C), dy = Math.abs(y - C); return Math.max(dx * 0.866 + dy * 0.5, dy) <= r; }; // (a flat-sided hexagon)
    if (hex(6.2) && !hex(4.4)) return '#';
    return hex(2.2) ? '+' : null;
  }),
  charm: grid(14, 14, (x, y) => {
    const l = ring(x, y, 4.3, 4.6) <= 3.1, r = ring(x, y, 8.7, 4.6) <= 3.1, v = y >= 4.6 && y <= 12.4 && Math.abs(x - C) <= (12.4 - y) * 0.86;
    return l || r || v ? '+' : null;
  }),
  blind: [
    '............xx',
    '...........xx.',
    '....######xx..',
    '..#######xx##.',
    '.####--xx####.',
    '####--xx--####',
    '###--xx---####',
    '####xx--######',
    '.#xx#--#####..',
    '.xx#######....',
    'xx..######....',
    'x.............',
    '..............',
    '..............',
  ],
  confusion: [
    '..........++..',
    '.........++++.',
    '..######..++..',
    '.##....##.....',
    '##..##..##....',
    '#..#..#..#....',
    '#..#.##..#....',
    '#..#....##....',
    '##..####.#....',
    '.##.....##....',
    '..#######..++.',
    '..........+++.',
    '.++........+..',
    '.++...........',
  ],
  slow: [
    '..............',
    '.....xxxx.....',
    '...xx++++xx...',
    '..x++xxx++x...',
    '..x+x+++x+x...',
    '..x+x+x+x+x.#.',
    '..x+x+xx++x.#.',
    '..x++x+++x..#.',
    '...xx+xxx..##.',
    '.....xx...###.',
    '.############.',
    '##############',
    '..............',
    '..............',
  ],
  halt: grid(14, 14, (x, y) => {
    const dx = Math.abs(x - C), dy = Math.abs(y - C);
    if (Math.max(dx, dy, (dx + dy) * 0.7071) > 6.3) return null;
    return dy <= 1.0 && dx <= 4.2 ? 'x' : '#';
  }),
  sleep: [
    '.........++++.',
    '........++--++',
    '........+----+',
    '........++--++',
    '....+++..++++.',
    '...++-++......',
    '...+---+......',
    '...++-++......',
    '....+++.......',
    '..............',
    '.++...........',
    '+--+..........',
    '+--+..........',
    '.++...........',
  ],
  soaked: [
    '...+..........',
    '...+..........',
    '..+++.....+...',
    '..+++.....+...',
    '.+++++...+++..',
    '.+++++...+++..',
    '+++++++.+++++.',
    '+++++++.+++++.',
    '+++++++.+++++.',
    '.+++++...+++..',
    '..+++.........',
    '..............',
    '..............',
    '..............',
  ],
};
