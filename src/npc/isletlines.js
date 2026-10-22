// ---------------------------------------------------------------------------------------
// ISLET LINES: the words of the open sea's islets, said in the log when you step onto one and when you find its one secret (Espada's;
// the rules are Dovina's, progress/opensea/islets.js; the room is Petra's, world/opensea/opensea.js). Plain until the owner calls the
// open sea finished (CLAUDE.md, "Plain names until settled"): no coined word here.
//
// What an islet is, in the lore (LORE.md, "The open sea"): an identity that never grew big enough to become an Island of Ego, a small
// self the Emocean left standing. So a landing line notices one human trace (a step worn in, a mark scratched, a thing kept) and never
// says whose: that is a blank, left blank.
//
// Prior art: The Legend of Zelda: The Wind Waker's small islands (one look, one secret, said in a line); Sea of Thieves' sandbars;
// the Animal Crossing mystery-island tour's arrival line.
//
//   LANDING[kit] = [lines]   SECRET_LINES[kind] = [lines]   landingLine(isletId, kit?) -> line   secretLine(kind, isletId) -> line
// ---------------------------------------------------------------------------------------

/** On stepping off onto an islet, by its kit (three a kit; the islet's id picks one, so the same islet always says the same). */
export const LANDING = {
  rock: [
    'A bare rock, worn smooth. Someone cut a step into it once.',
    'A bare rock. A ring of stones on top, the kind you make to sit inside.',
    'A bare rock, warm from the sun. A name was scratched here and the sea took most of it.',
  ],
  atoll: [
    'A ring of sand round still water. It is very quiet inside the ring.',
    'A ring of sand round a lagoon. Someone planted a row of shells, all facing in.',
    'A ring of sand. The lagoon in the middle is calmer than the sea should let it be.',
  ],
  stack: [
    'A tall stack of rock with a path wound up it. The path is older than it looks.',
    'A sea stack. Handholds are cut up one side, worn by many climbs.',
    'A sea stack, narrow at the top. Someone liked to stand up there and look out.',
  ],
  ruin: [
    'A ruin: a doorway with no house round it.',
    'A ruin: half a room, its floor tiled, the tiles still swept.',
    'A ruin: low walls in a square, like a plan for something bigger that never got built.',
  ],
  lighthouse: [
    'A dead lighthouse. Its lamp is cold, but the glass is clean.',
    'A dead lighthouse. Someone kept its stairs in good repair long after the light went out.',
    'A dead lighthouse, leaning a little. It still faces the lanes.',
  ],
  sandbar: [
    'A sandbar, only here at low water. Your footprints fill in behind you.',
    'A sandbar, there for an hour or so. Shells lie in a line, as if set out.',
    'A sandbar the tide will take back soon. Best be quick.',
  ],
};
const ANY = ['A small islet. It feels like someone lived here, a long time ago.', 'A small islet, quiet and out of the way.'];

/** On finding an islet's secret, by its kind (two a kind; plain, what it is and what it gives). */
export const SECRET_LINES = {
  chest: ['You find a chest, half buried and dry inside.', 'You find a chest wedged where the waves cannot reach it.'],
  ostracon: ['You find an ostracon in a crack in the rock. It has a word on it.', 'You find an ostracon under a stone, its word still clear.'],
  vantage: ['From up here you can see for squares in every direction.', 'From the top, the whole sea opens out round you.'],
  nest: ['Figments nest here, and they do not want company.', 'A nest of Figments. They have noticed you.'],
  fuel: ['You find a fuel cache, sealed against the spray: 3 measures.', 'You find a fuel cache someone left for the next sailor: 3 measures.'],
  stele: ['You find a stele with three words cut in a line.', 'You find a stele standing alone, three words on its face.'],
  fishing: ['Fish crowd the shallows here: a fishing spot.', 'The water here is thick with fish: a fishing spot.'],
  crystal: ['A Lachryma crystal grows out of the rock here.', 'You find a Lachryma crystal, humming faintly.'],
};

function pick(list, id = '') { let h = 2166136261; for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return list[(h >>> 0) % list.length]; }

/** The line said on stepping onto an islet (its kit's, else a plain one). */
export const landingLine = (isletId, kit) => pick(LANDING[kit] || ANY, isletId);
/** The line said on finding an islet's secret. */
export const secretLine = (kind, isletId) => pick(SECRET_LINES[kind] || ['You find something left here.'], isletId);
