// ---------------------------------------------------------------------------------------
// REALM NAMES: the words of the Spirit Garden (docs/LORE.md, "The Spirit Garden's words"; Espada's). The planetoids' names, and the
// names offered when an Inner Realm is first named (realm.name), in neuralese, so the naming is where the language is first met.
//
// A realm's name is two words of neuralese joined by a hyphen, as a macro is spoken (STIL-LON), taken only from the Functions a mind can
// be told (tools/veritome/mind/functions.js) and only from the kind ones: a home is named for what you would want done in it (rest,
// play, ease, kin), never for flight, rivalry or forgetting. The gloss says it in English for the naming page. The runes
// (veritome/mind/runes.js) draw any word, so a player's own name may be any letters.
//
// Prior art: Animal Crossing's town naming at the first arrival (a name asked once, kept for good), Dwarf Fortress's generated names
// with their glosses ("Boatmurdered" is two words of Dwarvish and a translation), and Tolkien's compounds (a name you can parse once
// you know the words: Minas Tirith, the tower of guard).
//
//   PLANETOIDS[id] = { name, gloss }     OFFERED = [names]     name(seed) -> 'HEMA-LUNO'     gloss(name) -> 'home, rest' | null
// ---------------------------------------------------------------------------------------

// the planetoids (docs/plans/SPIRIT-GARDEN.md section 3), keyed by the plan's placeholders
export const PLANETOIDS = {
  dantian:   { name: 'the Dantian', gloss: 'the elixir field: where a cultivator keeps what they have refined; your own Lachryma, a lake' },
  terraces:  { name: 'the Herb Terraces', gloss: 'the beds, stepped round a small world' },
  athanor:   { name: 'the Athanor', gloss: "the alchemist's furnace, kept at one slow heat (al-tannur, the oven): the press and the firing" },
  pavilions: { name: 'the Pavilions of Echoes', gloss: 'where echoes of the encounters you mastered keep working' },
  mulberryGrove: { name: 'the Mulberry Grove', gloss: 'the spirits\' home; the cocoon tree is a mulberry, as silk\'s is' },
  chimney:   { name: 'the Chimney', gloss: "a kiln's chimney, where the Heavenly Kiln draws; the needle of rock it stands on" },
  // the later planetoids, bought
  moon:      { name: 'the Moonflower Moon', gloss: 'where the moonflower opens at night' },
  koi:       { name: 'the Koi Pond', gloss: 'a small world that is mostly water' },
  drills:    { name: 'the Drill Yard', gloss: 'where a spirit trains one stat, and tires' },
  fossils:   { name: 'the Bone Bed', gloss: 'a layer of old bones in rock; where the Lachrymite fossils are laid' },
};

// the kind words, with their English (from FUNCTIONS: a word's label, said as a place would be)
const WORDS = {
  HEMA: 'home', LUNO: 'rest', KITH: 'kin', ROMI: 'play', SIVA: 'drink', STIL: 'stillness', EZA: 'ease', HUSA: 'hush',
  AMI: 'kin to you', MOR: 'grief', PEXA: 'fishing',
};
const MODS = { LON: 'long', DEO: 'deep' };

// the ten offered first (LORE.md), each read as a place
const GLOSSES = {
  'HEMA-LUNO': 'home, rest', 'KITH-HEMA': 'the home of kin', 'LUNO-DEO': 'deep rest', 'STIL-DEO': 'deep stillness',
  'EZA-LON': 'long ease', 'ROMI-LON': 'long play', 'SIVA-LUNO': 'drink, and rest: an oasis', 'HUSA-HEMA': 'the hushed home',
  'AMI-HEMA': 'where you are kin', 'MOR-LUNO': 'where grief rests',
};
export const OFFERED = Object.keys(GLOSSES);

// a small seeded generator (mulberry32, which suits a mulberry grove), so a seed always gives the same name
function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// name(seed): half the time one of the ten offered, else a fresh pair (a word and a modifier, or two words)
export function name(seed = 0) {
  const r = rng(seed);
  if (r() < 0.5) return OFFERED[Math.floor(r() * OFFERED.length)];
  const words = Object.keys(WORDS);
  const a = words[Math.floor(r() * words.length)];
  if (r() < 0.4) { const m = Object.keys(MODS); return `${a}-${m[Math.floor(r() * m.length)]}`; }
  let b = a;
  while (b === a) b = words[Math.floor(r() * words.length)];
  return `${a}-${b}`;
}

// gloss(name): the English of a realm name built from the words above, or null for a player's own
export function gloss(n) {
  const key = String(n).toUpperCase();
  if (GLOSSES[key]) return GLOSSES[key];
  const parts = key.split('-');
  if (parts.length !== 2 || !WORDS[parts[0]]) return null;
  if (MODS[parts[1]]) return `${MODS[parts[1]]} ${WORDS[parts[0]]}`;
  return WORDS[parts[1]] ? `${WORDS[parts[0]]}, ${WORDS[parts[1]]}` : null;
}
