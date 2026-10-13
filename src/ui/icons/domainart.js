// ---------------------------------------------------------------------------------------
// THE DOMAINS' ICONS: the seven domains of the Courier's psyche (progress/domains.js), each a picture of what the domain does, 14 x 14 in
// the icons' hand (ui/icons/hand.js: the light shape only; the bevel and the keyline are the hand's, 16 x 16 with it), coloured by the
// domain's own glaze (ui/domainlook.js, palettes 'domain.<id>' in ui/icons/icons.js) and readable in grey before its colour:
//   ouranurgy       a cloud with a spiral in it (the space round you, turned)
//   manifestation   a small solid cube, and the spark it came from, joined by dots (thought made solid)
//   divination      an eye in a ring (the hidden seen)
//   psychokinesis   a boulder lifted off the ground, the gap and its shadow below it (moved by will)
//   possession      a mask, its ties at the sides (another's face worn)
//   alteration      a looped arrow, coming round on itself (what is, made other)
//   spellscription  a brush stroke, wet at its head and dry at its tail (a thing written down)
//
// Prior art: the school icons of the Elder Scrolls' magic menus (Alteration, Illusion, Conjuration: one emblem a school, read before
// its word), the skill glyphs of RuneScape's skill tab (one small picture a skill, at 1x), and the sho brush's stroke of East Asian
// calligraphy (the dry tail, hihaku, for Spellscription).
//
//   DOMAIN_ART[id] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

export const DOMAIN_ART = {
  ouranurgy: [
    '..............',
    '......####....',
    '....########..',
    '...##########.',
    '..###xxxxx###.',
    '.###x#####x###',
    '.##x##xxx##x##',
    '###x#x###x#x##',
    '###x#x#x#x#x##',
    '###x#x##x##x##',
    '###x##x###x###',
    '.###x##xxx####',
    '..##########..',
    '..............',
  ],
  manifestation: [
    '........bb....',
    '......bbbbbb..',
    '.....bbbbbbbb.',
    '.....77bbbb44.',
    '.....77774444.',
    '.....77774444.',
    '.....77774444.',
    '......777444..',
    '........74....',
    '......+.......',
    '..b.+.........',
    '..b...........',
    'bb+bb.........',
    '..b...........',
  ],
  divination: grid(14, 14, (x, y) => {
    const px = x + 0.5 - 7, py = y + 0.5 - 7, r = Math.hypot(px, py);
    if (r >= 5.9 && r <= 7) return '#';
    const half = 2.6 * (1 - (px / 4.4) ** 2);
    if (half > 0 && Math.abs(py) <= half) {
      if (Math.hypot(px - 0.6, py + 0.6) < 0.7) return '+'; // (the glint)
      return r <= 1.6 ? 'x' : '#'; // (the pupil)
    }
    return null;
  }),
  psychokinesis: [
    '..............',
    '.....###......',
    '..#######.##..',
    '.############.',
    '.############.',
    '##############',
    '##############',
    '.############.',
    '...########...',
    '..............',
    '..............',
    '..............',
    '....------....',
    '.....----.....',
  ],
  possession: grid(14, 14, (x, y) => {
    const px = x + 0.5 - 7, py = y + 0.5 - 7;
    if (py >= -2.5 && py <= -1.5 && Math.abs(px) >= 5 && Math.abs(px) <= 7) return '-'; // (the ties)
    if ((px / 5) ** 2 + (py / 6.6) ** 2 > 1) return null;
    const eye = (s) => { const ex = px - s * 2.3, ey = py + 1.6 - s * ex * -0.35; return Math.abs(ey) <= 0.55 && Math.abs(ex) <= 1.4; };
    if (eye(-1) || eye(1)) return 'x';
    if (Math.abs(py - 3.1) <= 0.5 && Math.abs(px) <= 1.6) return 'x'; // (the mouth's slit)
    return '#';
  }),
  alteration: [
    '..............',
    '.....####.....',
    '...########...',
    '..###....###..',
    '.##.....+++++.',
    '.##......+++..',
    '.##.......+...',
    '.##...........',
    '.##........##.',
    '.###......###.',
    '..####..####..',
    '...########...',
    '.....####.....',
    '..............',
  ],
  spellscription: [
    '..............',
    '.+++..........',
    '.++####.......',
    '..########....',
    '...#########..',
    '.....#######..',
    '........####..',
    '.........###..',
    '.........##.#.',
    '........##.#..',
    '.......##.#...',
    '......#..#....',
    '.....#..#.....',
    '..............',
  ],
};
