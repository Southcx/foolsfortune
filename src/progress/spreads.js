// ---------------------------------------------------------------------------------------
// SPREADS: the Pneuka Box's underside (docs/plans/SPREADS.md; the owner's idea and rulings, 2026-10-23). The Box's 56 cells are the
// Minor Arcana and the pairs with the Fool the Major Arcana: a whole tarot deck. Major Arcana laid in a spread's positions on the
// Box's underside light FOOTPRINTS on its face; an item on a lit cell of its own suit counts toward that suit's TALLY, and the four
// tallies are modifiers you can see the source of (the tools' costs, the pool's regen, status build-up, worth).
//
// Rules and data only, no DOM and no game state: the window draws them (pneuka/ui.js), the reading view shows them (Calissa's), the
// tallies' hooks read them (Petra's). Taken from:
//  - the Hermetic Order of the Golden Dawn's Book T (the 1880s): each Major's sign, planet or element, so its suit (MAJOR_SUIT), and
//    the elemental dignities (Wands and Cups contrary, Swords and Pentacles contrary, all else friendly: CONTRARY);
//  - Resident Evil 4's attaché case, inverted: the shapes are fields of power laid under the items, never outlines to fit them into;
//  - Backpack Battles and Backpack Hero (where an item sits in the bag decides what it does), Diablo II's charms (power by being
//    carried), Cultist Simulator (an inventory of cards on a table), FFXIV's Astrologian (cards as buffs matched to a seal);
//  - the spreads themselves: the three-card, the Horseshoe and the Celtic Cross, each position's rule its meaning made a mechanic.
//
//   COLS ROWS MIRROR   SUITS CONTRARY MAJOR_SUIT FOOTPRINTS RANK_CELLS   SPREADS POSITION_RULES   TALLY KIND_SUIT TOOL_SUIT
//   footprintOf(card, { turn, reversed }) -> [[dx, dy]]   suitOf(card, reversed) -> suit | 'wild'   itemSuit(item) -> suit | null
//   strengthOf(rule, ctx) -> k   light(spreadId, laid, ctx) -> cells[56] (the face's, mirrored)   tally(cells, items) -> { sums, counted }
//   effectOf(suit, points) -> the modifier as a number   cellIndex(c, r)
// ---------------------------------------------------------------------------------------

/** The Box's grid: 8 columns of 7 rows, its 56 cells (pneuka/box.js SLOTS). */
export const COLS = 8, ROWS = 7;
/** A flip mirrors the grid, as a board turned over does (the owner, 2026-10-23): the underside's left lights the face's right. */
export const MIRROR = true;
export const cellIndex = (c, r) => r * COLS + c;
/** The Fool's cell (the significator's, under the Celtic Cross's Present): an 8-wide grid has no middle column, so it is named. On the
 *  underside column 2, row 3; on the face, mirrored, column 5, row 3. */
export const FOOL_CELL = { under: [2, 3], face: [MIRROR ? COLS - 1 - 2 : 2, 3] };

export const SUITS = ['wands', 'cups', 'swords', 'pentacles'];
/** The elemental dignities: the two contrary pairs. Every other meeting is friendly. */
export const CONTRARY = { wands: 'cups', cups: 'wands', swords: 'pentacles', pentacles: 'swords' };

/** Each Major's suit by the Golden Dawn (SPREADS.md 3): a sign's element, a mother letter's element, or a planet (wild). The Fool's
 *  element is Air, but the Fool is you: it lies as the significator, wild. */
export const MAJOR_SUIT = {
  fool: 'wild', magician: 'wild', priestess: 'wild', empress: 'wild', emperor: 'wands', hierophant: 'pentacles', lovers: 'swords',
  chariot: 'cups', strength: 'wands', hermit: 'pentacles', wheel: 'wild', justice: 'swords', hanged: 'cups', death: 'cups',
  temperance: 'wands', devil: 'pentacles', tower: 'wild', star: 'swords', moon: 'cups', sun: 'wild', judgement: 'wands', world: 'pentacles',
};
/** A wild card's strength against a suited one: a planet wanders through every sign, so it lights every suit, a little less brightly. */
export const WILD_K = 0.75;

/** A footprint's size is its card rank (tools/veritome/arcana.js): a card harder to bind covers more. */
export const RANK_CELLS = { C: 3, B: 4, A: 5, S: 6, SS: 7 };

/** Each Major's footprint, offsets from its position's anchor (x right, y down), drawn from its emblem. The Fool's is one cell. */
export const FOOTPRINTS = {
  fool: [[0, 0]],                                                          // you: the one cell at the heart
  magician: [[-1, 0], [0, 0], [1, 0], [0, -1]],                            // the wand raised over the table
  priestess: [[-1, 0], [-1, -1], [1, 0], [1, -1]],                         // the two pillars
  empress: [[0, 0], [-1, 1], [1, 1]],                                      // the wheat, spread
  emperor: [[0, 0], [0, 1], [0, 2], [1, 2]],                               // the throne
  hierophant: [[0, 0], [0, -1], [-1, 1], [1, 1]],                          // the staff, the crossed keys below
  lovers: [[-1, 0], [1, 0], [0, -1]],                                      // two figures, the angel over them
  chariot: [[0, 0], [1, 0], [0, 1], [1, 1]],                               // the car
  strength: [[0, 0], [1, 0], [-1, 1], [0, 1]],                             // the lion's turn
  hermit: [[0, 0], [0, -1], [1, 0]],                                       // the staff and the lantern
  wheel: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]],                       // the wheel's spokes
  justice: [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],                     // the balance beam
  hanged: [[-1, 0], [0, 0], [1, 0], [0, 1]],                               // the tau cross, the figure hanging from it
  death: [[0, 1], [0, 0], [0, -1], [1, -1], [2, -1]],                      // the scythe
  temperance: [[-1, -1], [-1, 0], [0, 0], [1, 1]],                         // water poured between two cups
  devil: [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]],                     // the horns, the chained pair
  tower: [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [0, 3]],               // the tower
  star: [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2]],             // the star's points
  moon: [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]],                        // the crescent
  sun: [[0, -1], [1, -1], [-1, 0], [2, 0], [0, 1], [1, 1]],                // a ring round an empty heart
  judgement: [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]],                // the trumpet's arch over the risen
  world: [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]],    // the wreath, open on one side
};

/** What a position's strength follows (SPREADS.md 5.4): its meaning made a mechanic. ctx: { since (game days since laid), fight,
 *  company (a sibling or a guest in the party), pool (0..1), goals (the share of the game day's goals done), others (all others laid) }. */
export const POSITION_RULES = {
  flat: () => 1,
  root: () => 0.5,                                                         // the Foundation: weak, and it never fades
  fade: (x) => 1 - 0.5 * Math.min(1, x.since ?? 0),                        // the Past: 1 to 0.5 over a game day
  grow: (x) => 0.5 + 0.5 * Math.min(1, x.since ?? 0),                      // the Future: 0.5 to 1 (with the Past, always 1.5)
  fight: (x) => (x.fight ? 1 : 0),                                         // the Challenge, the Obstacles
  company: (x) => (x.company ? 1 : 0.5),                                   // Others, Environment
  crown: (x) => 0.5 + 0.5 * Math.min(1, x.goals ?? 0),                     // the Crown position: grows with the goals done
  self: (x) => ((x.pool ?? 1) >= 0.5 ? 1 : 0.5),                           // Self: whole while the pool is at half or more
  hopes: () => 0.5,                                                        // Hopes and fears: its suit and its contrary, at half
  outcome: (x) => (x.others ? 1.5 : 0),                                    // the Outcome: lights only once the others are laid
};
export const strengthOf = (rule, ctx = {}) => (POSITION_RULES[rule] || POSITION_RULES.flat)(ctx);

const P = (id, label, at, rule, o = {}) => ({ id, label, at, rule, turn: 0, ...o });
/** The spreads, in the order they open (SPREADS.md 5.5). A position's `at` is its anchor on the underside; `pair` takes your pair's
 *  card from the belt; `fixed` is a card laid by the spread itself; `hidden` is never drawn on the face until an item counts there;
 *  `advice` marks where a held item would count. */
export const SPREADS = {
  one: { id: 'one', label: 'One card', positions: [P('present', 'Present', [3, 3], 'flat', { pair: true })] },
  three: { id: 'three', label: 'Three cards', positions: [
    P('past', 'Past', [1, 3], 'fade'), P('present', 'Present', [4, 3], 'flat', { pair: true }), P('future', 'Future', [6, 3], 'grow')] },
  horseshoe: { id: 'horseshoe', label: 'The Horseshoe', positions: [
    P('past', 'Past', [0, 1], 'fade'), P('present', 'Present', [1, 3], 'flat', { pair: true }), P('hidden', 'Hidden influences', [2, 5], 'flat', { hidden: true }),
    P('obstacles', 'Obstacles', [4, 5], 'fight', { turn: 90 }), P('others', 'Others', [5, 5], 'company'), P('advice', 'Advice', [6, 3], 'flat', { advice: true }),
    P('outcome', 'Outcome', [7, 1], 'outcome')] },
  celtic: { id: 'celtic', label: 'The Celtic Cross', positions: [
    P('significator', 'Significator', [2, 3], 'flat', { fixed: 'fool' }), P('present', 'Present', [2, 3], 'flat', { pair: true }),
    P('challenge', 'Challenge', [2, 3], 'fight', { turn: 90 }), P('foundation', 'Foundation', [2, 5], 'root'), P('past', 'Recent past', [0, 3], 'fade'),
    P('crownPosition', 'Crown', [2, 1], 'crown'), P('future', 'Near future', [4, 3], 'grow'), P('self', 'Self', [6, 6], 'self'),
    P('environment', 'Environment', [6, 4], 'company'), P('hopes', 'Hopes and fears', [6, 2], 'hopes'), P('outcome', 'Outcome', [6, 0], 'outcome')] },
};

/** A card's footprint as laid: turned a quarter for a crossed position, a half turn when reversed (SPREADS.md 5.3). */
export function footprintOf(card, { turn = 0, reversed = false } = {}) {
  let F = FOOTPRINTS[card] || [];
  if (turn === 90) F = F.map(([x, y]) => [-y, x]);
  if (reversed) F = F.map(([x, y]) => [-x, -y]);
  return F;
}
/** A card's suit as laid: reversed, a suited card lights its contrary (our rule, on the dignities); a planet stays wild. */
export function suitOf(card, reversed = false) {
  const s = MAJOR_SUIT[card];
  if (!s) return null;
  return reversed && s !== 'wild' ? CONTRARY[s] : s;
}

/** An item's suit by its kind (SPREADS.md 7.1, checked by Espada); a carried tool by the tool. */
export const KIND_SUIT = {
  instrument: 'wands', crude: 'wands', psygun: 'wands', shell: 'wands',
  bottle: 'cups', fish: 'cups', lure: 'cups', heart: 'cups',
  key: 'swords', whistle: 'swords', rutter: 'swords',
  material: 'pentacles', curio: 'pentacles', map: 'pentacles',
};
export const TOOL_SUIT = { psygun: 'wands', crucibelle: 'wands', sondelass: 'swords', veritome: 'swords', soulbrush: 'cups', lockheart: 'cups', dreamvane: 'pentacles' };
export function itemSuit(item) {
  if (!item) return null;
  if (item.suit) return item.suit; // (a kind with its own, the bracelet's charms when they come: SPREADS.md 9)
  if (item.kind === 'tool') return TOOL_SUIT[item.key] ?? null;
  return KIND_SUIT[item.kind] ?? null;
}

const blank = () => ({ wands: 0, cups: 0, swords: 0, pentacles: 0, wild: 0, hidden: false, dark: false, hopes: false });

/**
 * The face's cells for a spread as laid: per cell, the strength each suit carries there, wild apart, and whether it is dark.
 * laid: { [positionId]: { card, reversed } }; ctx as POSITION_RULES, plus `pair` (your pair's card id, bound) and `bound` (a Set of
 * bound card ids; a card not bound is not laid). Returns 56 cells in the FACE's order (mirrored when MIRROR).
 */
export function light(spreadId, laid = {}, ctx = {}) {
  const S = SPREADS[spreadId];
  const under = Array.from({ length: COLS * ROWS }, blank);
  if (!S) return under;
  const isBound = (c) => !ctx.bound || ctx.bound.has(c) || c === 'fool';
  const cardAt = (p) => (p.fixed ? { card: p.fixed } : p.pair ? (ctx.pair ? { card: ctx.pair } : null) : laid[p.id] || null);
  const placed = S.positions.filter((p) => { const L = cardAt(p); return L && isBound(L.card); });
  const others = S.positions.filter((p) => p.rule !== 'outcome').every((p) => placed.includes(p));
  for (const p of placed) {
    const L = cardAt(p), k = strengthOf(p.rule, { ...ctx, others });
    if (k <= 0) continue;
    const suit = suitOf(L.card, L.reversed);
    for (const [dx, dy] of footprintOf(L.card, { turn: p.turn, reversed: L.reversed })) {
      const c = p.at[0] + dx, r = p.at[1] + dy;
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue; // (cut off at the edge)
      const cell = under[cellIndex(c, r)];
      if (p.hidden) cell.hidden = true;
      if (suit === 'wild') cell.wild += k;
      else if (p.rule === 'hopes') { cell[suit] += k; cell[CONTRARY[suit]] += k; cell.hopes = true; } // (both sides, and never cancels)
      else cell[suit] += k;
    }
  }
  for (const cell of under) cell.dark = !cell.hopes && ((cell.wands > 0 && cell.cups > 0) || (cell.swords > 0 && cell.pentacles > 0));
  if (!MIRROR) return under;
  const face = new Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) face[cellIndex(COLS - 1 - c, r)] = under[cellIndex(c, r)];
  return face;
}

/** The four tallies' modifiers (SPREADS.md 7: draft numbers, measured by scripts/spreads.mjs before they are set). */
export const TALLY = {
  cap: 10,       // points a suit can hold
  cellCap: 2,    // one cell counts at most double (the same suit twice)
  wands: { per: -0.015, does: "the tools' Lachryma costs" },
  cups: { per: 0.02, does: "the pool's regen and the Bottles' feed" },
  swords: { per: 0.02, does: 'the status your blows build' },
  pentacles: { per: 0.015, does: 'worth when sold or condensed' },
};
export const effectOf = (suit, points) => (TALLY[suit]?.per ?? 0) * Math.min(TALLY.cap, Math.max(0, points));

/**
 * The tallies: an item counts on a lit cell carrying its suit (or wild), and a stack counts once (the cell counts, not the items).
 * items: 56 entries in the face's order, each an item ({ kind, key, suit? }) or null. Returns { sums: { suit: points }, counted: [{ i,
 * suit, w }] }, each sum capped.
 */
export function tally(cells, items) {
  const sums = { wands: 0, cups: 0, swords: 0, pentacles: 0 }, counted = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i], suit = itemSuit(items[i]);
    if (!suit || cell.dark) continue;
    const w = Math.min(TALLY.cellCap, cell[suit] + WILD_K * cell.wild);
    if (w <= 0) continue;
    sums[suit] += w;
    counted.push({ i, suit, w });
  }
  for (const s of SUITS) sums[s] = Math.min(TALLY.cap, sums[s]);
  return { sums, counted };
}

// (the footprints are sized by card rank: a mismatch is a data error, said once at load)
export function checkFootprints(ranks) {
  const bad = [];
  for (const [id, rank] of Object.entries(ranks)) if (id !== 'fool' && FOOTPRINTS[id]?.length !== RANK_CELLS[rank]) bad.push(`${id}: ${FOOTPRINTS[id]?.length} cells, rank ${rank}`);
  return bad;
}
