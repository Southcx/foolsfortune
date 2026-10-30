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
//   SPECIALS_BUILT   SPECIAL_PLAY (the built specials' numbers, with reasons)
//   PAIR_SPECIALS[n] -> { label, line, main: [tool, its verb] } (the sub is the pair's other tool, lending SUB_GIFTS' verb)   specialVerbs(n)   PAIR_OPEN   pairSpecialOpen(n, L) -> bool
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
/** Each special's two verbs (TOOLS-TOGETHER.md 8: the sub's lent verb fed through the main's own): which tool must be the main and which of
 *  its verbs carries the special; the sub is the other tool of the pair, lending its verb on R. Worn the other way round, the pair gives
 *  its lend and no special (one press, one order, so it is learnable). */
export const PAIR_SPECIALS = {
  1: { label: 'Hooked Shot', line: 'A shot that drags what it hits to you.', main: ['psygun', 'the shot'] },
  2: { label: 'Revelation', line: 'The Flash and the dowse at once: every hidden signature near you shown and tagged.', main: ['dreamvane', 'the dowse'] },
  3: { label: "Coffin's Mop", line: 'The coffin drinks spilled paint and crude as it passes, and the brush pours it back as paint.', main: ['lockheart', 'the hoover'] },
  4: { label: 'On the Beat', line: 'Six shots fired on the bell\'s beat, each one staggering.', main: ['psygun', 'the shot'] },
  5: { label: 'Rite', line: 'A toll that reads every creature it reaches, knowing it better.', main: ['crucibelle', 'the toll'] },
  6: { label: 'Rung Line', line: 'Hook a creature and the toll runs down the line, stunning it.', main: ['sondelass', 'the hook form\'s throw'] },
  7: { label: 'Slingshot', line: 'Throw the fork far and hook to it, flung through the air.', main: ['dreamvane', 'the fork\'s throw'] },
  8: { label: 'Gentle Edge', line: 'A cutlass string whose blows calm instead of hurt.', main: ['sondelass', 'the cutlass\'s string'] },
  9: { label: 'Illumined Page', line: 'Photograph a sigil and it is written on what you photographed.', main: ['veritome', 'the photograph'] },
  10: { label: 'Turn of Weather', line: 'Spin the wheel of odds to turn the weather where you stand for a game hour.', main: ['lockheart', 'the wheel of odds'] },
  11: { label: 'Appraised Cut', line: 'A blow on a weak point you have photographed is always the right kind.', main: ['sondelass', 'the cutlass\'s string'] },
  12: { label: 'Held Plate', line: 'A photograph holds a creature still in time for a moment.', main: ['veritome', 'the photograph'] },
  13: { label: "Reaper's Draw", line: 'A blow that downs a creature drinks its Lachryma straight into the coffin.', main: ['sondelass', 'the cutlass\'s string'] },
  14: { label: 'Healing Song', line: 'Paint laid on the beat mends your cracks.', main: ['soulbrush', 'paint laid'] },
  15: { label: 'Chain Shot', line: 'A shot that chains two creatures together where they stand.', main: ['psygun', 'the shot'] },
  16: { label: 'Lightning Rod', line: 'Where the fork sticks, a bolt comes down.', main: ['dreamvane', 'the fork\'s throw'] },
  17: { label: 'Painted Lure', line: 'The lure thrown leaves a stream of paint behind it.', main: ['dreamvane', 'the lure\'s throw'] },
  18: { label: 'Singing Mirage', line: 'A decoy rises where the fork lands, singing so creatures go to it.', main: ['dreamvane', 'the fork\'s throw'] },
  19: { label: 'The Mark', line: 'The Flash marks a creature, and every chamber homes on the mark.', main: ['psygun', 'the shot'] },
  20: { label: 'Last Call', line: 'The toll opens the coffin: all it drank bursts out as a wave.', main: ['lockheart', 'the Opening'] },
  21: { label: 'Full Circle', line: 'A shot that paints where it lands and mends what it passes.', main: ['psygun', 'the shot'] },
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

/** The specials built in play (Petra's tools/pairspecials.js, wave 1, 2026-10-29): their pairs' `special` set, so the Box's loadout shows
 *  the special's line in place of "to come". */
export const SPECIALS_BUILT = [19, 6, 17, 3];
for (const n of SPECIALS_BUILT) { const p = PAIRS.find((x) => x.n === n); if (p) p.special = PAIR_SPECIALS[n]; }

/** The specials' numbers in play (tools/pairspecials.js reads them), each against a number the game already has:
 *  - The Mark (19): `rounds` 6, THE PSYGUN's cylinder, one reload's worth homing; `life` 8 real s, about the cylinder fired at the quick
 *    taps' pace with a beat to aim; `cone` 0.35 rad (20 degrees), the lock-on's own forgiveness, so a shot that would miss by a body
 *    still lands and one fired the wrong way does not; `range` 40 m, the psygun's useful reach (the Flash marks within its own 10 m).
 *  - Rung Line (6): `stun` 1.1 real s, half again the Flash's 0.75 (two verbs and a bitten hook for it); `power` 0.6, a light blow,
 *    so the line sets up the cutlass and never replaces it.
 *  - Painted Lure (17): a stamp of `r` 0.7 m every 0.06 real s at `cost` 0.2 is 3.3 Lachryma a second, about half the brush's spray
 *    (6 a second for a 1.2 m stroke): a line, cheaper because the fork's flight is short; `drop` 8 m, the fork's arc's height to paint below.
 *  - Coffin's Mop (3): 3 sips every 0.15 real s within `r` 1 m and `reach` 5 m, the hoover's cone; a sip `want` 0.5 of a cell; into the
 *    brush's bottle at `toBottle` 1.5x (the pair's gift: the Lockheart drinks for the brush), else the coffin. */
export const SPECIAL_PLAY = {
  mark: { n: 19, rounds: 6, life: 8, cone: 0.35, range: 40 },
  rung: { n: 6, stun: 1.1, power: 0.6 },
  lure: { n: 17, every: 0.06, r: 0.7, cost: 0.2, drop: 8 },
  mop: { n: 3, every: 0.15, r: 1, want: 0.5, toBottle: 1.5, reach: 5 },
};

/** A special's two verbs, said plainly: { main: [tool, verb], sub: [tool, its lent verb] }. */
export function specialVerbs(n) {
  const S = PAIR_SPECIALS[n], p = PAIRS.find((x) => x.n === n); if (!S || !p) return null;
  const sub = p.tools.find((t) => t !== S.main[0]);
  return { main: S.main, sub: [sub, SUB_GIFTS[sub].verb] };
}
