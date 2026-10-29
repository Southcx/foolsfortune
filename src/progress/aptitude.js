// ---------------------------------------------------------------------------------------
// THE APTITUDES: the Assay's passive readings (docs/plans/APTITUDE.md 3, 4 and 9 step 1; the owner, 2026-10-18; South, 2026-10-29: "address
// all of our open design gaps. We should have more than enough fundamental systems to work with"). An aptitude is one ability the System
// measures from how you play, in its own absolute unit and against yourself. It is not a domain (what you practised) and not an
// attribute (Soul Alchemy's): it is how you did it. Every reading here comes from an event that already exists. Nothing is asked of
// the player, and nothing is said while it measures (the passive readings stay silent: APTITUDE.md 10.4).
//
// A sample is dropped when its conditions say it does not count: not the Courier's, an agent driving (APTITUDE.md 10.2), a practice,
// a tuned room. The ledger keeps `aptitude.<id>.n` and the best (`hi` or `lo` by which way is better), so an achievement can read them.
// The module keeps the rest: the first reading, the recent median and spread, and the trend (the first five against the last five).
// The window is the Assay (Calissa's look, Espada's words). It reads ??? until five samples, the number from five, the curve from twenty.
//
// Prior art: Valerie Shute's stealth assessment (the evidence scored inside play, no test anywhere), the Human Benchmark site (absolute
// units and your own history), psychophysics' thresholds (a pitch's beating, a colour's distance), StepMania's timing windows.
//
//   APTITUDES[id] = { label, unit, better: 'low' | 'high', event, value(e) -> number | null, line }
//   readOf(samples) -> { n, first, best, median, spread, trend, shown, curve }   (pure: the window's numbers)
//   game.aptitude = new Aptitude(game)   .read(id) -> readOf   .all() -> { id: readOf }   /assay (the readings in the log, for now)
//   save section `aptitude` (scope player: reset with every build, APTITUDE.md 10.1)
// ---------------------------------------------------------------------------------------

/** How many samples an aptitude keeps (the recent window), and when it shows its number and its curve. */
export const APT = { keep: 60, shown: 5, curve: 20, trend: 5 };

const pct = (v) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 10;

export const APTITUDES = {
  // a blow parried: how far before its strike (lower is later, held to the last). Projectiles carry no time, so blows only.
  parry: { label: 'Parry timing', unit: 'ms before the strike', better: 'low', event: 'move.parry',
    value: (e) => (e.what === 'blow' && e.lead != null ? Math.round(e.lead * 1000) : null), line: 'How late you dare to answer a blow.' },
  // a crystal struck at its sweet fret: the beating left (round the formation from its spot); the ear finding the unison
  pitch: { label: 'Pitch by ear', unit: 'beats a second', better: 'low', event: 'crystal.strike',
    value: (e) => (e.pitchOff === 0 && e.beat != null ? e.beat : null), line: 'How close your ear brings a crystal to its note.' },
  // a song of the rhythm mode played through: the spread of your hits round their notes (synchronised tapping's asynchrony, judge.js:
  // Wanda's `asyncSd`). The spread, not the mean: the mean carries the device's audio latency uncorrected, the spread does not
  timing: { label: 'Timing', unit: 'ms of spread', better: 'low', event: 'rhythm.score',
    value: (e) => (e.asyncSd != null ? Math.round(e.asyncSd) : null), line: 'How tightly you keep to a beat.' },
  // a firing at the press: how far from its tile's heart, in its tile's radius (0 the heart)
  colour: { label: 'Colour', unit: '% of a tile from its heart', better: 'low', event: 'alchemy.fire',
    value: (e) => (e.d != null ? pct(e.d) : null), line: 'How near your eye brings a soul colour to its heart.' },
  // a drill in the Throwing Room, untuned: the share of its shots that hit
  aim: { label: 'Aim', unit: '% of shots', better: 'high', event: 'drill.end',
    value: (e) => (!e.tuned?.length && e.run?.shots ? pct((e.run.hits || 0) / e.run.shots) : null), line: 'How much of what you fire lands.' },
  // a fish landed: the share of its pulls answered (fight.js), reading another mind through a line
  pull: { label: 'Reading a pull', unit: '% of pulls answered', better: 'high', event: 'angle.catch',
    value: (e) => (e.ans != null ? pct(e.ans) : null), line: 'How well you read a fish by its line.' },
};

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** An aptitude's numbers from its samples ({ first, best, list: recent values oldest first, n }). */
export function readOf(S, better = 'high') {
  const n = S?.n || 0, list = S?.list || [];
  if (!n) return { n: 0, first: null, best: null, median: null, spread: null, trend: null, shown: false, curve: false };
  const med = median(list), q = (k) => { const s = [...list].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(k * (s.length - 1)))]; };
  const spread = list.length >= 4 ? (q(0.75) - q(0.25)) / 2 : null;
  const T = APT.trend, early = S.early || [], late = list.slice(-T);
  const trend = early.length >= T && late.length >= T ? (better === 'low' ? median(early) - median(late) : median(late) - median(early)) : null; // (positive: better than at the start)
  return { n, first: S.first, best: S.best, median: med, spread, trend, shown: n >= APT.shown, curve: n >= APT.curve };
}

export class Aptitude {
  constructor(game) {
    this.game = game; this.s = {};
    game.save?.section('aptitude', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = d && typeof d === 'object' ? d : {}; }, reset: () => { this.s = {}; } });
    for (const [id, A] of Object.entries(APTITUDES)) game.events?.on?.(A.event, (e) => this.sample(id, e));
    game.chat?.add?.('assay', { help: 'what the System has measured of how you play: /assay', run: () => this.game.events?.emit('aptitude.ask', { readings: this.all(), by: 'courier' }) });
  }
  /** One reading from an event, if it counts. */
  sample(id, e) {
    const A = APTITUDES[id], g = this.game;
    if (!A || e?.by !== 'courier' || e.practice || g.agent?.task) return;
    const v = A.value(e); if (v == null || !Number.isFinite(v)) return;
    const S = (this.s[id] ||= { n: 0, first: v, best: v, list: [], early: [] });
    S.n++; S.list.push(v); if (S.list.length > APT.keep) S.list.shift(); if (S.early.length < APT.trend) S.early.push(v);
    S.best = A.better === 'low' ? Math.min(S.best, v) : Math.max(S.best, v);
    const L = g.ledger; L?.inc?.(`aptitude.${id}.n`); A.better === 'low' ? L?.lo?.(`aptitude.${id}.best`, v) : L?.hi?.(`aptitude.${id}.best`, v);
    g.save?.dirty?.('aptitude');
    if (S.n === APT.shown) g.events?.emit('aptitude.read', { aptitude: id, by: 'courier' }); // (five readings: the number shows in the Assay)
  }
  read(id) { return readOf(this.s[id], APTITUDES[id]?.better); }
  all() { return Object.fromEntries(Object.keys(APTITUDES).map((id) => [id, this.read(id)])); }
}
