// ---------------------------------------------------------------------------------------
// THE MAIN AND THE SUB, AND A PAIR'S CARD (docs/plans/TOOLS-TOGETHER.md 8; the owner's rulings, 2026-10-22 and 23): the Courier wears
// two tools. The MAIN is in hand with all its verbs; the SUB lends the main one verb on R and one passive, the same whatever the main
// (SUB_GIFTS). Every pair of the seven tools is one of 21 cards, the Major Arcana I to XXI: the Fool is dropped, since the Fool is you,
// the Courier of Fool's Fortune. So the 21 pairs are the stations of the Fool's journey, from the Magician (the pair a new save starts
// with) to the World, each card matched to what its pair does together (PAIRS' `why`). The order of a pair does not matter: 21, not 42.
// A pair's special is opened by an achievement done with that pair worn (arts only by achievement); its name stays plain until the
// owner calls the pairs finalized, and `special` is null until it is built.
//
// Rules and data only: the belt that wears them is Petra's (tools/belt.js), the window that shows them the Pneuka Box's
// (docs/plans/PNEUKA-BOX.md). Prior art: Persona's arcana (a bond is a card), Bayonetta's hands and feet, NieR: Automata's light and
// heavy pair, Elden Ring's main hand and off hand.
//
//   TOOL_IDS   SUB_GIFTS[id] -> { verb, does, passive }   PAIRS -> [{ n, card, label, tools: [a, b], why, special }]
//   PAIR_SPECIALS[n] -> { label, line }   PAIR_OPEN   pairSpecialOpen(n, L) -> bool
//   pairKey(a, b) -> 'a+b' (sorted)   pairOf(a, b) -> the pair's entry | null   pairsOf(id) -> the six pairs a tool is in
//   START -> { main, sub } (a new save's pair: the Magician)   swapRefusal(game) -> null | the reason a change of main or sub is refused now
//   (the belt's mayEquip asks it and says the reason at the point of use: tools/belt.js, Petra's)
// ---------------------------------------------------------------------------------------

/** The seven tools, in the belt's order. */
export const TOOL_IDS = ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];

/** What each tool lends as the sub: its verb on R (a genre label and one line, CLARITY.md) and its passive. */
export const SUB_GIFTS = {
  psygun: { verb: 'Snap shot', does: 'one round where the main aims', passive: 'the ship\'s gun on the rail' },
  sondelass: { verb: 'Grapple', does: 'the hook, to a point or a creature', passive: null },
  soulbrush: { verb: 'Flick', does: 'a flick of paint in the weather\'s feeling', passive: 'kintsugi: the field mend' },
  veritome: { verb: 'Flash', does: 'the Flash', passive: 'a tag reads one line further' },
  dreamvane: { verb: 'Lure throw', does: 'the fork, the lure thrown', passive: 'the vane: the weather and the crystals\' signatures' },
  crucibelle: { verb: 'Toll', does: 'one toll, the stagger round you', passive: 'the beat: a blow on it hits harder' },
  lockheart: { verb: 'Gulp', does: 'the gulp, the parry that drinks', passive: 'it drinks the pool\'s overflow' },
};

const P = (n, card, a, b, why) => ({ n, card, label: `${roman(n)} · ${card}`, tools: [a, b], why, special: null });
function roman(n) { const R = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of R) while (n >= v) { s += r; n -= v; } return s; }

/** The 21 pairs, one a card of the Major Arcana (TOOLS-TOGETHER.md 8, the table and its reasons). */
export const PAIRS = [
  P(1, 'The Magician', 'psygun', 'sondelass', 'the first card, the new save\'s pair: the tools laid on the table'),
  P(2, 'The High Priestess', 'veritome', 'dreamvane', 'the scroll and the veil: what is hidden, read'),
  P(3, 'The Empress', 'soulbrush', 'lockheart', 'what the coffin draws in, the brush gives back: abundance'),
  P(4, 'The Emperor', 'psygun', 'crucibelle', 'the beat commands and the gun keeps it: order'),
  P(5, 'The Hierophant', 'veritome', 'crucibelle', 'bell and book: the rite, the teaching'),
  P(6, 'The Lovers', 'sondelass', 'crucibelle', 'the blade and the bell in time: a duet'),
  P(7, 'The Chariot', 'sondelass', 'dreamvane', 'the hook and the vane: travel, two forces held in one hand'),
  P(8, 'Strength', 'sondelass', 'soulbrush', 'the edge tamed by the soft brush: gentle force'),
  P(9, 'The Hermit', 'soulbrush', 'veritome', 'the scholar\'s desk: study alone, by lantern'),
  P(10, 'The Wheel of Fortune', 'lockheart', 'dreamvane', 'the wheel of odds and the turning weather'),
  P(11, 'Justice', 'sondelass', 'veritome', 'the sword and the scales: the blade and the appraisal'),
  P(12, 'The Hanged Man', 'veritome', 'lockheart', 'a moment held: the plate and the coffin'),
  P(13, 'Death', 'sondelass', 'lockheart', 'the blade and the coffin'),
  P(14, 'Temperance', 'soulbrush', 'crucibelle', 'pouring between two cups: paint and song, the healing pair'),
  P(15, 'The Devil', 'psygun', 'lockheart', 'the chain'),
  P(16, 'The Tower', 'psygun', 'dreamvane', 'the bolt from the sky'),
  P(17, 'The Star', 'soulbrush', 'dreamvane', 'water poured on land and pool: the painted lure'),
  P(18, 'The Moon', 'crucibelle', 'dreamvane', 'the mirage under the sky: illusion'),
  P(19, 'The Sun', 'psygun', 'veritome', 'the flash and the shutter: all shown'),
  P(20, 'Judgement', 'crucibelle', 'lockheart', 'the trumpet opens the coffin'),
  P(21, 'The World', 'psygun', 'soulbrush', 'the first tool and the mending one: the circle closed'),
];

/** What each pair's special is to be (TOOLS-TOGETHER.md 8; GAPS.md 2.2: the sub's lent verb fed through the main's own verb, one press
 *  doing both; the first four are TOOLS-TOGETHER.md 4 K5's). Plain labels, Espada's to word; Petra builds them a wave of four at a time,
 *  and `PAIRS[n].special` is set when one plays. Opened by `pairSpecialOpen` (below). */
export const PAIR_SPECIALS = {
  1: { label: 'Hooked Shot', line: 'A shot that drags what it hits to you.' },
  2: { label: 'Revelation', line: 'The Flash and the dowse at once: every hidden signature near you shown and tagged.' },
  3: { label: "Coffin's Mop", line: 'The coffin drinks spilled paint and crude as it passes, and the brush pours it back as paint.' },
  4: { label: 'On the Beat', line: 'Six shots fired on the bell\'s beat, each one staggering.' },
  5: { label: 'Rite', line: 'A toll that reads every creature it reaches, knowing it better.' },
  6: { label: 'Rung Line', line: 'Hook a creature and the toll runs down the line, stunning it.' },
  7: { label: 'Slingshot', line: 'Throw the fork far and hook to it, flung through the air.' },
  8: { label: 'Gentle Edge', line: 'A cutlass string whose blows calm instead of hurt.' },
  9: { label: 'Illumined Page', line: 'Photograph a sigil and it is written on what you photographed.' },
  10: { label: 'Turn of Weather', line: 'Spin the wheel of odds to turn the weather where you stand for a game hour.' },
  11: { label: 'Appraised Cut', line: 'A blow on a weak point you have photographed is always the right kind.' },
  12: { label: 'Held Plate', line: 'A photograph holds a creature still in time for a moment.' },
  13: { label: "Reaper's Draw", line: 'A blow that downs a creature drinks its Lachryma straight into the coffin.' },
  14: { label: 'Healing Song', line: 'Paint laid on the beat mends your cracks.' },
  15: { label: 'Chain Shot', line: 'A shot that chains two creatures together where they stand.' },
  16: { label: 'Lightning Rod', line: 'Where the fork sticks, a bolt comes down.' },
  17: { label: 'Painted Lure', line: 'The lure thrown leaves a stream of paint behind it.' },
  18: { label: 'Singing Mirage', line: 'A decoy rises where the fork lands, singing so creatures go to it.' },
  19: { label: 'The Mark', line: 'The Flash marks a creature, and every chamber homes on the mark.' },
  20: { label: 'Last Call', line: 'The toll opens the coffin: all it drank bursts out as a wave.' },
  21: { label: 'Full Circle', line: 'A shot that paints where it lands and mends what it passes.' },
};
/** A pair's special opens (arts only by achievement, a count way and a feat way): `downs` creatures downed with the pair worn, or `lends`
 *  of the sub's verb with the pair worn (feedback/tracking/pairs.js keeps `pair.<n>.down` and `pair.<n>.lend`). */
export const PAIR_OPEN = { downs: 50, lends: 40 };
export const pairSpecialOpen = (n, L) => (L?.get?.(`pair.${n}.down`) || 0) >= PAIR_OPEN.downs || (L?.get?.(`pair.${n}.lend`) || 0) >= PAIR_OPEN.lends;

/** A pair's key, the same whichever is main. */
export const pairKey = (a, b) => [a, b].sort().join('+');
const BY_KEY = new Map(PAIRS.map((p) => [pairKey(...p.tools), p]));
/** The pair a main and a sub make, or null (one tool twice, or not a tool). */
export const pairOf = (a, b) => (a && b && a !== b ? BY_KEY.get(pairKey(a, b)) ?? null : null);
/** The six pairs a tool is in. */
export const pairsOf = (id) => PAIRS.filter((p) => p.tools.includes(id));
/** A new save's pair (TOOLS-TOGETHER.md 8: the psygun is the most accessible tool). */
export const START = { main: 'psygun', sub: 'sondelass' };

/** THE SWAP RULE (PNEUKA-BOX.md 1; TOOLS-TOGETHER.md 8): a change of main or sub is made out of a fight, so the build is chosen before
 *  the fight, never dodged inside it (Monster Hunter's loadout at camp, Hades' weapon at the courtyard). The Box opens anywhere, so
 *  anywhere is allowed but these: a fight (`game.combat.engaged`: a notice until the last threat eases off), a puzzle duel, the rail (a crossing sailed), a
 *  race at the Raceway, a seat at Raku's tables. Null when allowed; else the reason, in the log's words (placeholders for Espada). */
export function swapRefusal(game) {
  if (game?.combat?.engaged) return 'You cannot change tools in a fight.';
  if (game?.duel?.active) return 'You cannot change tools in a duel.';
  if (game?.emocean?.stage?.active || game?.voyage?.sailing) return 'You cannot change tools at sea.';
  if (game?.race?.running) return 'You cannot change tools mid-race.';
  if (game?.bazaar?.session) return 'You cannot change tools at a table.';
  return null;
}
