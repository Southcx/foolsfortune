// ---------------------------------------------------------------------------------------
// QUERENT'S HANDS AND SCORE (docs/plans/CASINO.md
// section 3): what makes a winning hand of nine and what it is worth. A hand is three MELDS of three: a SET (three of one rank, any suits)
// or a RUN (three ranks in a row, any suits: the owner, 2026-10-15). Ranks run Ace 1 .. 10, Page 11, Knight 12, Queen 13, King 14; an Ace
// is low and never royal. A declared four of a kind is one set. Nine of one suit is a win in any order (an imperfect flush).
// The value is the owner's own formula, designed years before any deckbuilder made it famous:
//   value = TIER x (the multipliers) x (1 + the additive bonuses)
// TIERS: 1 (1,000) any three melds; 2 (2,000) all runs, all sets, or nine of a suit in any order; 3 (8,000) three sets of three
// ranks in a row (6 6 6, 7 7 7, 8 8 8), or nine of a suit in three runs. The bonuses (CASINO.md 3.6) read the hand, the round's history
// (steals, the Fate Clause) and the Major Arcana in play.
//
// Prior art: Riichi Mahjong's yaku (the hand's shapes each worth a share, read from the finished hand) and han (doubling), rummy's sets
// and runs.
//
//   SUITS   RANK   TIERS   melds(cards, need) -> [[meld]]   isWin(cards, quads)   best(winHand, ctx) -> { value, tier, ab, x, notes, steps }
//   (steps: the score in the order it is counted, for the table's count-up: { op: 'base' | '+' | 'x', n, why }; the value is
//   base x (1 + every '+') x every 'x': Balatro's chips and mult in two boxes)
// ---------------------------------------------------------------------------------------

export const SUITS = ['cups', 'swords', 'pentacles', 'wands']; // (the seat suits' order round the table: the owner's Cups, Swords, Pentacles, Wands)
export const RANK = { ace: 1, page: 11, knight: 12, queen: 13, king: 14 };
export const TIERS = [0, 1000, 2000, 8000]; // (tier 2 was 4,000: with mixed-suit runs it came as often as tier 1, 49% to 50% (scripts/casino.mjs); the owner took 2,000, 2026-10-15)
export const cardName = (c) => `${[, 'A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Pg', 'Kn', 'Q', 'K'][c.r]}${'cspw'[c.s]}`;

/** Every way to split `cards` into melds of three (each meld { kind: 'set' | 'run', cards }). */
export function melds(cards) {
  const out = [], C = cards.slice().sort((a, b) => a.r - b.r || a.s - b.s);
  const go = (rest, acc) => {
    if (!rest.length) { out.push(acc.slice()); return; }
    const [f, ...tail] = rest;
    for (let i = 0; i < tail.length; i++) for (let j = i + 1; j < tail.length; j++) if (tail[i].r === f.r && tail[j].r === f.r && (i === 0 || tail[i - 1].r !== tail[i].r || i === 0 || tail[i - 1].s !== tail[i].s)) { acc.push({ kind: 'set', cards: [f, tail[i], tail[j]] }); go(tail.filter((_, k) => k !== i && k !== j), acc); acc.pop(); }
    for (let i = 0; i < tail.length; i++) { if (tail[i].r !== f.r + 1) continue; for (let j = 0; j < tail.length; j++) { if (tail[j].r !== f.r + 2) continue; acc.push({ kind: 'run', cards: [f, tail[i], tail[j]] }); go(tail.filter((_, k) => k !== i && k !== j), acc); acc.pop(); } }
  };
  if (cards.length % 3 === 0) go(C, []);
  return out;
}
const sameSuit = (cards) => cards.every((c) => c.s === cards[0].s);
/** A finished hand: the concealed cards make up the rest of three melds beside the declared fours, or nine cards are all one suit. */
export function isWin(cards, quads = []) {
  if (cards.length !== 3 * (3 - quads.length)) return false;
  if (!quads.length && sameSuit(cards)) return true;
  return melds(cards).length > 0;
}

/** One reading of a finished hand: its tier and the shapes the bonuses read. */
function read(split, all) {
  const runs = split.filter((m) => m.kind === 'run'), sets = split.filter((m) => m.kind === 'set'), low = (m) => Math.min(...m.cards.map((c) => c.r));
  const flush = all.length === 9 && sameSuit(all);
  const setRanks = sets.map(low).sort((a, b) => a - b), runLows = runs.map(low).sort((a, b) => a - b);
  const setLadder = sets.length === 3 && setRanks[1] === setRanks[0] + 1 && setRanks[2] === setRanks[1] + 1;
  const nine = runs.length === 3 && runLows[1] === runLows[0] + 3 && runLows[2] === runLows[1] + 3;
  let tier = 1, name = 'three melds';
  if ((flush && runs.length === 3) || setLadder) { tier = 3; name = setLadder ? 'a ladder of sets' : 'a full flush'; }
  else if (flush || runs.length === 3 || sets.length === 3) { tier = 2; name = flush ? 'an imperfect flush' : runs.length === 3 ? 'all runs' : 'all sets'; }
  return { tier, name, runs, sets, nine, flush };
}

/** The best value of a winning hand. `win` { cards (concealed), quads [rank] }; `ctx` the round's facts: seatSuit, stole (this player's
 *  steals), steals (everyone's), stealsLeft (everyone's unused), fate { turnDeclared, first, by } | null, nextTurn (won on the turn after
 *  declaring), firstDraw (won on their first draw of the round), arcana (the ids in play for them, the pooled ones deduped), board (every
 *  arcana id on the table), hierophant (the rank chosen), judged (cards the Judgment's target stole), tower (flipped this round). */
export function best(win, ctx) {
  const quadCards = (win.quads || []).flatMap((r) => [0, 1, 2].map((s) => ({ r, s: (s + ctx.seatSuit + 1) % 4 }))); // (a declared four reads as a set of that rank)
  const all = [...win.cards, ...quadCards], splits = melds(win.cards).map((sp) => [...sp, ...(win.quads || []).map((r) => ({ kind: 'set', cards: [{ r }, { r }, { r }] }))]);
  if (!splits.length) splits.push([]); // (nine of a suit in no order: no melds to read)
  let top = null;
  for (const sp of splits) {
    const R = read(sp, all), notes = [R.name], steps = [{ op: 'base', n: TIERS[R.tier], why: R.name, tier: R.tier }]; let ab = 0, x = 1;
    const A = (n, why) => { if (n) { ab += n; notes.push(`+${n} ${why}`); steps.push({ op: '+', n, why }); } }, X = (n, why) => { x *= n; notes.push(`x${n} ${why}`); steps.push({ op: 'x', n, why }); };
    // the hand's own shapes
    const bySuit = {}; for (const m of R.runs) if (sameSuit(m.cards)) (bySuit[m.cards[0].s] ||= []).push(Math.min(...m.cards.map((c) => c.r)));
    for (const lows of Object.values(bySuit)) if (lows.length >= 2) { lows.sort((a, b) => a - b); A(lows.some((l, i) => i && l === lows[i - 1] + 3) ? 2 : 1, lows.some((l, i) => i && l === lows[i - 1] + 3) ? 'half flush, pure' : 'half flush'); }
    const perfect = R.nine && R.runs.every((m) => m.cards.every((c) => c.s === ctx.seatSuit));
    if (R.nine) A(1, 'nine in a row');
    if (all.every((c) => c.r >= 11)) A(1, 'all royals'); else if (all.every((c) => c.r <= 10)) A(1, 'no royals');
    if (!ctx.stole) A(1, 'no steals');
    if (perfect) X(5, 'perfect straight flush'); else A(R.runs.filter((m) => m.cards.every((c) => c.s === ctx.seatSuit)).length, 'seat suit runs');
    // the round's story
    if (ctx.fate?.first) A(1, 'first-turn Fate Clause');
    if (ctx.fate && ctx.nextTurn) { if (ctx.fate.by === 'steal') A(2, 'fortune favours (steal)'); else X(4, 'fortune favours (draw)'); }
    if (ctx.firstDraw) A(20, 'fated one');
    // the Major Arcana in play for them
    const has = (id) => ctx.arcana.includes(id), count = (r) => all.filter((c) => c.r === r).length;
    A(ctx.arcana.length, 'arcana in play');
    if (has(1)) A(2 * count(1), 'the Magician (aces)');
    if (has(3)) A(2 * count(13), 'the Empress (queens)');
    if (has(4)) A(2 * count(14), 'the Emperor (kings)');
    if (has(5) && ctx.hierophant) A(count(ctx.hierophant), 'the Hierophant');
    if (has(7)) A(2 * count(12), 'the Chariot (knights)');
    if (has(8)) { X(2, 'Strength'); A(ctx.board.filter((id) => id === 8).length - 1, 'more Strength'); }
    if (has(14)) A(ctx.stealsLeft, 'Temperance (steals unused)');
    if (has(15)) A(ctx.steals, 'the Devil (steals made)');
    if (has(16) && ctx.tower) A(4, 'the Tower');
    if (has(20)) A(2 * (ctx.judged || 0), 'Judgement');
    if (has(21)) A(new Set(ctx.board).size, 'the World (unique arcana)');
    const value = Math.round(TIERS[R.tier] * x * (1 + ab));
    if (!top || value > top.value) top = { value, tier: R.tier, ab, x, notes, steps, split: sp };
  }
  return top;
}
