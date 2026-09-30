// ---------------------------------------------------------------------------------------
// TREASURE: the numbers behind the chests, the Tithe and the curios. Data only (no three.js), so that the ledger's readers, the
// achievements and the Codex can all ask it things without pulling in any models.
//
// The design is the loot box's, worked out in the open (see the header of chests.js for the sources):
//  - FIVE TIERS, common to prismatic, climbing the game's own terracotta ladder (pale bisque, terracotta, brick, oxblood: the clay
//    darkening and reddening as it is fired harder), and then the one past it, black and iridescent, the look of Lachryma itself.
//    A chest is its tier from the moment it is seen; the Tithe's sealed chest is not, and finds out at the end.
//  - The odds are published (below), and a PITY counter for each of the three upper tiers turns a bad run into a certainty: after
//    `pity.rare` pulls with nothing at rare or better, the next is at least rare, and so on up. The counters are in the ledger
//    (`tithe.since.rare|epic|prismatic`) and shown on the console by lamps, not numbers.
//  - Twenty CURIOS, four to a tier, drawn from the chest's own tier; one you already have is condensed into cubes instead.
// ---------------------------------------------------------------------------------------

export const TIERS = [
  { id: 'common',    name: 'common',    rgb: 0xecd3b2, glow: 0xfff0dc, cubes: [4, 9],     curioP: 0.06, weight: 60 },
  { id: 'fine',      name: 'fine',      rgb: 0xe58a52, glow: 0xffb27a, cubes: [14, 26],   curioP: 0.16, weight: 26 },
  { id: 'rare',      name: 'rare',      rgb: 0xd0432a, glow: 0xff7a58, cubes: [40, 70],   curioP: 0.4,  weight: 10.5 },
  { id: 'epic',      name: 'epic',      rgb: 0x9c2432, glow: 0xff5a6a, cubes: [120, 200], curioP: 0.8,  weight: 3 },
  { id: 'prismatic', name: 'prismatic', rgb: 0xffffff, glow: 0xffffff, cubes: [400, 700], curioP: 1.0,  weight: 0.5, rainbow: true },
];
export const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

/** The price of a sealed chest, in cubes, and how many pulls without a tier make the next one certain. */
export const TITHE = { cost: 25, pity: { rare: 10, epic: 40, prismatic: 100 } };

/** The odds as they stand once pity is counted: the tier a pull lands on (a number 0-4), from three counters and a random number. */
export function rollTier(since, r = Math.random()) {
  const p = TITHE.pity;
  if (since.prismatic + 1 >= p.prismatic) return 4;
  if (since.epic + 1 >= p.epic) return r < 0.12 ? 4 : 3;
  const total = TIERS.reduce((a, t) => a + t.weight, 0);
  let x = r * total, tier = 0;
  for (let i = 0; i < TIERS.length; i++) { x -= TIERS[i].weight; if (x <= 0) { tier = i; break; } }
  if (since.rare + 1 >= p.rare && tier < 2) tier = 2;
  return tier;
}

/** How many cubes a chest of this tier holds (a random amount in its range, leaning a little high or low). */
export function cubesIn(tier, r = Math.random()) {
  const [a, b] = TIERS[tier].cubes;
  return Math.round(a + (b - a) * r);
}

// ---- curios: four to a tier, named in the alliterating manner the rest of the game keeps
export const CURIOS = [
  { id: 'whelk',      tier: 0, name: 'Whistling Whelk',         glyph: '❂', blurb: 'A spiral shell with a hole in it that sings when the tide is in the room.' },
  { id: 'shaker',     tier: 0, name: "Sailor's Salt-Shaker",    glyph: '♨', blurb: 'Nothing has ever come out of it. Everything it has been sprinkled on has kept.' },
  { id: 'keepsake',   tier: 0, name: 'Knotted Keepsake',        glyph: '✣', blurb: 'A knot that no one has managed to undo, or to tie a second time.' },
  { id: 'barnacle',   tier: 0, name: 'Barnacle Button',         glyph: '◉', blurb: 'It does up nothing. It has been on a great many coats.' },
  { id: 'gull',       tier: 1, name: 'Glass Gull',              glyph: '❦', blurb: 'Blown in one breath by someone who had only ever seen gulls from below.' },
  { id: 'compass',    tier: 1, name: 'Current Compass',         glyph: '✥', blurb: 'Its needle points to where the water wants to go, which is seldom where you do.' },
  { id: 'bell',       tier: 1, name: "Brass Bosun's Bell",      glyph: '♫', blurb: 'One note, a long one, and it is always a little flat of the last time.' },
  { id: 'sconce',     tier: 1, name: 'Sea-glass Sconce',        glyph: '✧', blurb: 'A lamp made of what the sea had finished with.' },
  { id: 'pearl',      tier: 2, name: 'Pier Pearl',              glyph: '◍', blurb: 'Grown in the dark under the boards, on a grain of somebody\'s spilled salt.' },
  { id: 'astrolabe',  tier: 2, name: 'Astral Astrolabe',        glyph: '❂', blurb: 'It reads a sky that is not above this room, and is not wrong about it.' },
  { id: 'ammonite',   tier: 2, name: 'Ammonite Almanac',        glyph: '@', blurb: 'A stone that keeps the tides of a sea that went away.' },
  { id: 'amulet',     tier: 2, name: 'Anchor Amulet',           glyph: '⚓', blurb: 'It holds. That is all it has ever been asked to do, and it does it heavily.' },
  { id: 'skull',      tier: 3, name: 'Gilded Gull-Skull',       glyph: '☠', blurb: 'Gold over bone over a grudge.' },
  { id: 'regalia',    tier: 3, name: 'Reed Regalia',            glyph: '♛', blurb: 'The crown of a kingdom of one pond. The pond is very loyal.' },
  { id: 'hourglass',  tier: 3, name: 'Hourglass of High Tide',  glyph: '⧗', blurb: 'The sand runs up as often as it runs down.' },
  { id: 'storm',      tier: 3, name: 'Storm in a Stoppered Jar', glyph: '☈', blurb: 'Do not open it. It is very well behaved for a storm, and would like you to keep believing that.' },
  { id: 'lodestone',  tier: 4, name: 'Lachryma Lodestone',      glyph: '◆', blurb: 'A cube condensed past what a cube ought to bear. The others lean toward it.' },
  { id: 'orb',        tier: 4, name: 'Oil-Slick Orb',           glyph: '◎', blurb: 'It is the colour of every puddle you were told not to stand in.' },
  { id: 'bloom',      tier: 4, name: 'Blacklight Bloom',        glyph: '✿', blurb: 'It is a very ordinary flower until the lights go out.' },
  { id: 'koi',        tier: 4, name: 'Kaleidoscope Koi',        glyph: '❖', blurb: 'It swims in the air of the room it was found in and has not once been seen to blink.' },
];
export const CURIO_BY_ID = Object.fromEntries(CURIOS.map((c) => [c.id, c]));
export const curiosOf = (tier) => CURIOS.filter((c) => c.tier === tier);
