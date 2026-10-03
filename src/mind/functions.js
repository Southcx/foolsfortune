// ---------------------------------------------------------------------------------------
// FUNCTIONS: the words of NEURALESE, the language a mind is written in. Each is one thing a creature's mind can be made to do, and it is
// exactly one of the parts of the mind itself (src/ai, docs/AI.md): an ACTION its Brain can run (drink, rest, forage, huddle, flee...), a
// STATUS the creatures' contract knows (halt, sleep, calm, melt), a RELATION in the ecology (take them for kin, turn on its own), a DRIVE
// to stir (thirst, hunger), a MEMORY to wipe, or a MODIFIER of the one before it (longer, deeper). A Function is a piece of the lattice
// (lattice.js): a small shape with a way in and a way out, and composing a macro is fitting the pieces into the lattice so that the signal
// runs from the mind's core to its mouth.
//
// A Function is LEARNED, never bought: most are learned by seeing the behaviour (a photograph of a slip jelly drinking, appraised, teaches
// the bestiary that fact, and the fact teaches SIVA: you can only ask a mind for what you have seen a mind do), a few by doing (stunning
// minds, reprogramming them, a brawl between jellies). Each test reads the ledger, so it is retroactive like an achievement.
//
// The words: two syllables at most, a few letters, invented (Riven's D'ni numerals and Tunic's runes for a language that is learned by
// its use, Chant of Sennaar's glyph-words, a Lojban-ish sound to each): SIVA to drink, LUNO to rest, STIL to be still. Spoken in a
// macro in the order the signal meets them (STIL-LON: be still, for long). Typed whole, they are the Reprogram's challenge.
//
// Prior art: Spore's and Black & White's creature minds (teach a creature by example), The Sims' interactions as the verbs of a mind,
// Opus Magnum's and SpaceChem's components (a small set of shaped parts and a path that must connect), and Transistor's Functions (the
// word itself: abilities found, then combined, and how they are combined is the skill).
//
//   FUNCTIONS[id] = { id, word, kind: 'act'|'status'|'rel'|'drive'|'mem'|'mod'|'wire', label, does, shape, learn, ... }
//   known(id, ledger) -> bool       knownList(ledger) -> [ids]      SHAPES[name] = { cells: [[x, y]], in: [cell, side], out: [cell, side] }
// ---------------------------------------------------------------------------------------

// the shapes of the pieces: cells, and the sides the signal enters and leaves by (0 E, 1 S, 2 W, 3 N: rotation turns these with the cells)
export const SHAPES = {
  dot:   { cells: [[0, 0]], in: [0, 2], out: [0, 0] },                       // a straight wire, or a modifier
  bend:  { cells: [[0, 0]], in: [0, 2], out: [0, 3] },                       // a wire that turns
  bar2:  { cells: [[0, 0], [1, 0]], in: [0, 2], out: [1, 0] },
  bar3:  { cells: [[0, 0], [1, 0], [2, 0]], in: [0, 2], out: [2, 0] },
  ell:   { cells: [[0, 0], [1, 0], [1, 1]], in: [0, 2], out: [2, 1] },        // in on the left, out at the bottom
  ess:   { cells: [[0, 0], [0, 1], [1, 1]], in: [0, 2], out: [2, 0] },        // in on the left, out on the right, a row lower
  block: { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], in: [0, 2], out: [3, 0] },
};

const fact = (f, n = 1) => (L) => L.get(`bestiary.fact.slipjelly.${f}`) >= n;
const count = (k, n) => (L) => L.get(k) >= n;

/**
 * The Functions. `learn(ledger)` is how it is learned, and `how` says it in a sentence (the composer shows the unknown ones' `how`).
 * act: the Brain action it runs (ai/brain.js direct). status: the creatures' status (creatures.js). rel: what they become to it, or what
 * its kin become (ai/ecology.js). drive: the drive it stirs. mem: what it forgets. mod: what it does to the Function before it.
 */
export const FUNCTIONS = {
  // ---- the body still (statuses): known from the start, or from stunning
  stil:  { word: 'STIL', kind: 'status', status: 'halt', base: 8, label: 'STILL', does: 'It stops, where it is.', shape: 'bar2', learn: () => true, how: 'Known from the start.' },
  eza:   { word: 'EZA', kind: 'status', status: 'calm', base: 30, label: 'EASE', does: 'It will strike nothing.', shape: 'bar2', learn: () => true, how: 'Known from the start.' },
  husa:  { word: 'HUSA', kind: 'status', status: 'sleep', base: 14, label: 'HUSH', does: 'It falls asleep.', shape: 'ell', learn: count('stun', 3), how: 'Stun three minds.' },
  melu:  { word: 'MELU', kind: 'status', status: 'melt', base: 9, label: 'MELT', does: 'It pools into a puddle that harms nothing.', shape: 'block', learn: count('jelly.burst', 5), how: 'Burst five slip jellies.' },
  // ---- what it does (actions): learned by seeing it done
  siva:  { word: 'SIVA', kind: 'act', act: 'drink', base: 20, label: 'DRINK', does: 'It goes to water, and drinks.', shape: 'bar2', learn: fact('drink'), how: 'Photograph a slip jelly drinking.' },
  luno:  { word: 'LUNO', kind: 'act', act: 'rest', base: 25, label: 'REST', does: 'It finds shade and rests.', shape: 'bar3', learn: fact('rest'), how: 'Photograph a slip jelly resting in the shade.' },
  grav:  { word: 'GRAV', kind: 'act', act: 'forage', base: 20, label: 'FORAGE', does: 'It goes looking for something to eat.', shape: 'ess', learn: fact('forage'), how: 'Photograph a slip jelly foraging.' },
  pexa:  { word: 'PEXA', kind: 'act', act: 'fish', base: 25, label: 'FISH', does: 'It goes to the shallows to hunt fish.', shape: 'ell', learn: fact('fish'), how: 'Photograph a slip jelly fishing the shallows.' },
  kith:  { word: 'KITH', kind: 'act', act: 'huddle', base: 25, label: 'HUDDLE', does: 'It goes to its kin and huddles with them.', shape: 'bar2', learn: fact('huddle'), how: 'Photograph slip jellies huddled together.' },
  romi:  { word: 'ROMI', kind: 'act', act: 'play', base: 20, label: 'PLAY', does: 'It plays.', shape: 'ess', learn: fact('play'), how: 'Photograph slip jellies at play.' },
  shai:  { word: 'SHAI', kind: 'act', act: 'flee', base: 10, label: 'FLEE', does: 'It runs from you.', shape: 'bar2', learn: fact('flee'), how: 'Photograph a slip jelly running away.' },
  hema:  { word: 'HEMA', kind: 'act', act: 'go home', base: 20, label: 'HOME', does: 'It goes home, and stays a while.', shape: 'bar3', learn: fact('home'), how: 'Photograph a slip jelly going home.' },
  mor:   { word: 'MOR', kind: 'act', act: 'mourn', base: 20, label: 'MOURN', does: 'It goes to where its kin burst, and grieves.', shape: 'ell', learn: fact('mourn'), how: 'Photograph a slip jelly mourning its kin.' },
  feta:  { word: 'FETA', kind: 'act', act: 'fetch', base: 35, label: 'FETCH', does: 'It finds Lachryma lying about and brings it to you.', shape: 'block', learn: fact('carry'), how: 'Photograph a slip jelly carrying Lachryma it has eaten.' },
  talo:  { word: 'TALO', kind: 'act', act: 'follow', base: 60, label: 'FOLLOW', does: 'It follows you (if it takes you for kin).', shape: 'bar3', learn: count('reprogram.run', 2), how: 'Reprogram two minds.' },
  // ---- what it takes things for (relations)
  ami:   { word: 'AMI', kind: 'rel', rel: 'kin', who: 'courier', base: 60, label: 'KIN', does: 'It takes you for its own kind.', shape: 'ess', learn: count('reprogram.run', 1), how: 'Reprogram one mind.' },
  riva:  { word: 'RIVA', kind: 'rel', rel: 'rival', who: 'kin', base: 35, label: 'RIVAL', does: 'It turns on its own kind.', shape: 'ell', learn: count('jelly.brawl', 1), how: 'See two slip jellies come to blows.' },
  // ---- what it wants (drives)
  dipsa: { word: 'DIPSA', kind: 'drive', drive: 'thirst', to: 1, base: 1, label: 'THIRST', does: 'It is suddenly thirsty.', shape: 'dot', learn: (L) => fact('drink')(L) && L.get('reprogram.fn.siva') >= 1, how: 'Tell a mind SIVA (drink), once.' },
  gula:  { word: 'GULA', kind: 'drive', drive: 'hunger', to: 1, base: 1, label: 'HUNGER', does: 'It is suddenly hungry.', shape: 'dot', learn: (L) => fact('forage')(L) && L.get('reprogram.fn.grav') >= 1, how: 'Tell a mind GRAV (forage), once.' },
  // ---- what it knows (memory)
  voyd:  { word: 'VOYD', kind: 'mem', mem: 'courier', base: 1, label: 'FORGET', does: 'It forgets you, grudges and all.', shape: 'bar2', learn: () => true, how: 'Known from the start.' },
  // ---- how (modifiers: on the Function the signal met last)
  lon:   { word: 'LON', kind: 'mod', dur: 1.6, label: 'LONG', does: 'The Function before it lasts longer.', shape: 'dot', learn: () => true, how: 'Known from the start.' },
  deo:   { word: 'DEO', kind: 'mod', pow: 1.4, label: 'DEEP', does: 'The Function before it takes deeper hold (and is harder to refuse).', shape: 'dot', learn: count('bestiary.u.slipjelly', 2), how: 'Come to OBSERVE the slip jelly (three facts of it).' },
  // ---- the wires (no word: the signal only passes)
  wire:  { word: '', kind: 'wire', label: 'WIRE', does: 'The signal passes straight through.', shape: 'dot', learn: () => true, how: 'Known from the start.' },
  turn:  { word: '', kind: 'wire', label: 'TURN', does: 'The signal turns a corner.', shape: 'bend', learn: () => true, how: 'Known from the start.' },
};
for (const [id, f] of Object.entries(FUNCTIONS)) f.id = id;

export const known = (id, ledger) => !!ledger && !!FUNCTIONS[id]?.learn(ledger);
export const knownList = (ledger) => Object.keys(FUNCTIONS).filter((id) => known(id, ledger));
/** The colour of a kind of Function (the lattice draws its pieces in it). */
export const KIND_COLOR = { status: '#7fb2ff', act: '#9be36a', rel: '#ff9ad5', drive: '#ffcf6a', mem: '#c9b6ff', mod: '#ffd98a', wire: '#8a7a9a' };
