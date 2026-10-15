// ---------------------------------------------------------------------------------------
// THE COUNT-UP'S STEPS (docs/plans/CASINO-CLARITY.md section 8; Calissa's ask, her art brief 7.7): an outcome at Raku's tables as the steps
// it is counted in, for the table's count-up, reels and shake. Each game's moment (a log entry of its rules module) becomes
// { steps: [{ op, n, why, ... }], total, scale }, `scale` the outcome against the game's median and its 90th percentile (measured:
// scripts/casino.mjs), so a big result shakes harder than a common one.
//   Querent's winning hand: the base (the tier's), the two biggest bonuses each in turn and the rest rolled into one, then the multipliers.
//   Supernova Run's reaction: each settled face, the dice born and shrunk, a Supernova's doubling.
//   Nebula Bluff's call or reveal: the shown hand's faces (a maximum's +10) against the claim.
//   Event Horizon's hit: the pot, and the house's bonus by its read (x1, x3, x5 the ante).
//
// Prior art: Balatro's scoring (each piece lit in turn as it adds), a slot machine's reel, a fighting game's damage counter.
//
//   ceremonyOf(gameId, entry, ctx?) -> { steps, total, scale } | null   SCALE
// ---------------------------------------------------------------------------------------

/** Each game's outcomes, measured: the median and the 90th percentile (Querent a winning hand's value, 4 seats x100 games; Supernova a
 *  reaction's points, 400 games; Nebula a six-dice hand's worth; Event Horizon the bonus in antes). */
export const SCALE = { querent: { median: 16000, p90: 56000 }, supernova: { median: 17, p90: 37 }, nebula: { median: 39, p90: 59 }, eventhorizon: { median: 1, p90: 3 } };
const scaled = (game, v) => { const S = SCALE[game]; if (!S) return 1; const k = v <= S.median ? v / S.median : 1 + (v - S.median) / Math.max(1, S.p90 - S.median); return Math.max(0, Math.min(2, k)); }; // (1 the median, 2 the 90th percentile and beyond)

export function ceremonyOf(game, x, ctx = {}) {
  if (!x) return null;
  if (game === 'querent' && x.steps) {
    const base = x.steps.find((s) => s.op === 'base'), adds = x.steps.filter((s) => s.op === '+').sort((a, b) => b.n - a.n), muls = x.steps.filter((s) => s.op === 'x');
    const rest = adds.slice(2), steps = [base, ...adds.slice(0, 2)];
    if (rest.length) steps.push({ op: '+', n: rest.reduce((a, s) => a + s.n, 0), why: `and ${rest.length} more`, parts: rest });
    steps.push(...muls);
    return { steps, total: x.value, tier: x.tier, scale: scaled('querent', x.value) };
  }
  if (game === 'supernova' && x.react != null) {
    const steps = x.faces.map((n) => ({ op: 'face', n }));
    if (x.born) steps.push({ op: 'born', n: x.born, why: `${x.born} new ${x.born === 1 ? 'die' : 'dice'}` });
    if (x.decayed) steps.push({ op: 'decayed', n: x.decayed, why: `${x.decayed} shrank` });
    if (x.lost) steps.push({ op: 'lost', n: x.lost, why: `${x.lost} lost` });
    return { steps, total: x.react, scale: scaled('supernova', x.react) };
  }
  if (game === 'supernova' && x.nova != null) return { steps: [{ op: 'x', n: 2, why: 'SUPERNOVA' }], total: x.points, scale: 2 };
  if (game === 'nebula' && (x.callout != null || x.reveal)) {
    const worth = x.callout != null ? x.worth : Math.max(...x.reveal.map((y) => y.worth));
    const shown = x.callout != null ? x.shown : x.reveal.reduce((b, y) => (y.worth > b.worth ? y : b)).faces;
    const steps = (shown || []).map((f) => ({ op: 'face', n: f.face + (f.face === f.sides ? 10 : 0), sides: f.sides, max: f.face === f.sides }));
    steps.push({ op: 'against', n: x.claim ?? null, why: x.callout != null ? (x.bluff ? 'CAUGHT' : 'TRUE') : 'REVEAL' });
    return { steps, total: worth, scale: scaled('nebula', worth) };
  }
  if (game === 'eventhorizon' && x.win != null) {
    const n = x.read === 'exact' ? 5 : x.read === 'par' ? 3 : 1;
    return { steps: [{ op: 'base', n: x.pot, why: 'the pot' }, { op: '+', n: x.bonus, why: `the house pays ×${n}` }], total: x.pot + x.bonus, scale: scaled('eventhorizon', n) };
  }
  return null;
}
