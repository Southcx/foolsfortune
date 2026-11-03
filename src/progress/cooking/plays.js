// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, THE MOVES PLAYED: the small state machines behind the hearth's window for every move bread does not use (G222 to
// G225; docs/plans/SPIRIT-COOKING.md 4, 16). A play is pure: `tick(dt)` runs its clock, `act(id, arg)` is a press or a drag of one of
// its `controls()`, `value()` is where the move stands, `tell()` what the food shows there (never a number), and `result(practice)` the
// move judged as moves.js scoreOf judges it. The window (world/garden/kitchenfamily.js) only draws these and wires buttons to them,
// so a node script can cook a dish through them headless (scripts/cookingfamilies.mjs).
//
// One gesture each, so no two moves feel the same (the research's complaint about Fantasy Life i was copy-paste minigames):
//   dial   simmer   do nothing correctly: the pot starts too hot, turn the dial down and hold it (a range: a thumb drag)
//   rinse  rice     tap to rinse until the water clears, then drag the water to the line
//   wait   steep    the water heats on its own: pour on the bubbles' tell (a tap)
//   test   sugar    the syrup climbs; drop a spoon in cold water to read it, take it off at the stage (taps)
//   stir   roux     keep stirring (taps) or the bottom scorches; stop at the colour
//   pour   emulsion a pour drag against a whisk tap rhythm; a pour past what the whisk takes splits it (a rescue costs a yolk)
//   feed   smoke    a fire that dies back: feed it a little at a time (taps), thin blue smoke good, white bad
//   hold   sear     do not move it: lift when the crust is made (a tap)
//   strokes cut     draw the width (a range) and cut ribbons; the same width every stroke
//   press  bleed    the fish thrashes and stills; press in the still moment (a tap)
//   tend   ferment  the game clock's (cooking.js `long`): `fermentValue`, `TEND`
//
// Prior art: Cooking Mama (a gesture a step, under 10 s), Rhythm Heaven (a beat kept by feel), Papa's Pizzeria (an oven watched until
// the colour), Overcooked (stirring or it burns), Venba (the order of a recipe), every dashi, tea and candy book (the bubble stages of
// water: shrimp, crab and fish eyes; the cold-water test of syrup stages).
//
//   newPlay(move, { family, addin }) -> play | null   PLAYABLE (the moves with a play)   fermentValue(segs, hours) -> 0..1
//   play: { move, M, t, done, ruined, controls(), act(id, arg) -> 'rebuild' | undefined, tick(dt), value(), tell(), result(practice), gauge() }
// ---------------------------------------------------------------------------------------
import { moveFor, scoreOf, tellAt, WATER_LINE } from './moves.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Each move's kind: init, tick, act, controls, value, result. `P` is the play, `M` the move as the dish asks it. */
const KINDS = {
  // a value that climbs on its own; ruined past `over`; some moves need stirring or a spoon test
  sear: climb('TAKE IT OFF'), steep: climb('POUR'), sugar: climb('TAKE IT OFF'), roux: climb('STOP'),
  simmer: {
    init: (P, M) => { P.dial = M.start; P.heat = M.start; P.sum = 0; P.sumT = 0; P.boilT = 0; },
    tick: (P, M, dt) => {
      P.heat += (P.dial - P.heat) * (1 - Math.exp(-M.lag * dt));
      if (P.t >= M.warm) { P.sum += P.heat * dt; P.sumT += dt; }
      P.boilT += P.heat >= M.over ? dt : 0;
      if (P.boilT >= M.boilFor) { P.ruined = true; P.done = true; }
      if (P.t >= M.run) P.done = true;
    },
    act: (P, M, id, x) => { if (id === 'dial') P.dial = clamp(x); },
    controls: (P) => [{ id: 'dial', kind: 'range', label: 'DIAL', min: 0, max: 1, value: P.dial }],
    value: (P) => (P.done && P.sumT ? P.sum / P.sumT : P.heat),
    live: (P) => P.heat,
  },
  smoke: {
    init: (P, M) => { P.fire = M.start; P.sum = 0; P.sumT = 0; P.whiteT = 0; },
    tick: (P, M, dt) => {
      P.fire = clamp(P.fire - M.fall * dt);
      if (P.t >= M.warm) { P.sum += P.fire * dt; P.sumT += dt; }
      P.whiteT += P.fire >= M.white ? dt : 0;
      if (P.whiteT >= M.whiteFor) { P.ruined = true; P.done = true; }
      if (P.t >= M.run) P.done = true;
    },
    act: (P, M, id) => { if (id === 'feed') P.fire = clamp(P.fire + M.feed); },
    controls: () => [{ id: 'feed', kind: 'tap', label: 'FEED THE FIRE', big: true }],
    value: (P) => (P.done && P.sumT ? P.sum / P.sumT : P.fire),
    live: (P) => P.fire,
  },
  rice: {
    init: (P) => { P.clear = 0; P.phase = 'rinse'; P.ratio = 1.4; P.rinses = 0; },
    tick: () => {},
    act: (P, M, id, x) => {
      if (id === 'rinse' && P.phase === 'rinse') { P.clear = clamp(P.clear + (1 - P.clear) * M.perRinse + 0.02); P.rinses++; }
      else if (id === 'clear' && P.phase === 'rinse') { P.phase = 'line'; return 'rebuild'; } // (pour off, and on to the water)
      else if (id === 'line' && P.phase === 'line') P.ratio = clamp(x, WATER_LINE.min, WATER_LINE.max);
      else if (id === 'set' && P.phase === 'line') P.done = true;
    },
    controls: (P) => (P.phase === 'rinse'
      ? [{ id: 'rinse', kind: 'tap', label: 'RINSE', big: true }, { id: 'clear', kind: 'tap', label: 'POUR OFF AND ADD WATER' }]
      : [{ id: 'line', kind: 'range', label: 'WATER LINE', min: WATER_LINE.min, max: WATER_LINE.max, value: P.ratio }, { id: 'set', kind: 'tap', label: 'SET IT ON', big: true }]),
    value: (P) => P.clear,
    live: (P) => P.clear,
    result: (P, M, practice) => { // (two halves: how clear the water ran, 3/5, and how near the line, 2/5)
      const a = scoreOf(M, P.clear, practice), b = scoreOf(WATER_LINE, P.ratio, practice);
      return { score: +(0.6 * a.score + 0.4 * b.score).toFixed(3), hit: a.hit && b.hit, ruined: false };
    },
  },
  emulsion: {
    init: (P) => { P.oil = 0; P.pour = 0; P.whisk = 0; P.splitK = 0; P.rescues = 0; },
    tick: (P, M, dt) => {
      P.whisk = clamp(P.whisk - M.whiskDecay * dt);
      const cap = P.whisk * 1.1 + 0.1; // (the pour the whisk can take)
      if (P.pour > cap) P.splitK += (P.pour - cap) * M.split * dt; else P.splitK = Math.max(0, P.splitK - 0.1 * dt);
      if (P.splitK >= 1) { P.ruined = true; P.done = true; }
      P.oil = clamp(P.oil + P.pour * M.oilRate * dt, 0, 1.2);
    },
    act: (P, M, id, x) => {
      if (id === 'pour') P.pour = clamp(x);
      else if (id === 'whisk') P.whisk = clamp(P.whisk + M.whiskTap);
      else if (id === 'rescue') { P.splitK = Math.min(P.splitK, 0.2); P.pour = 0; P.rescues++; } // (a fresh yolk and a spoon of water)
      else if (id === 'done') P.done = true;
    },
    controls: (P) => [{ id: 'pour', kind: 'range', label: 'POUR', min: 0, max: 1, value: P.pour }, { id: 'whisk', kind: 'tap', label: 'WHISK', big: true },
      { id: 'rescue', kind: 'tap', label: 'A FRESH YOLK', show: P.splitK > 0.3 }, { id: 'done', kind: 'tap', label: 'DONE' }],
    value: (P) => P.oil,
    result: (P, M, practice) => {
      const r = scoreOf(M, P.oil, practice);
      return { score: +Math.max(0, r.score * (1 - 0.3 * P.splitK) - 0.08 * P.rescues).toFixed(3), hit: r.hit && P.splitK < 0.2 && !P.rescues, ruined: P.ruined };
    },
  },
  cut: {
    init: (P) => { P.width = 0.5; P.strokes = []; },
    tick: () => {},
    act: (P, M, id, x) => {
      if (id === 'width') P.width = clamp(x);
      else if (id === 'cut') P.strokes.push(P.width);
      else if (id === 'done' && P.strokes.length >= 3) P.done = true;
    },
    controls: (P) => [{ id: 'width', kind: 'range', label: 'RIBBON WIDTH', min: 0, max: 1, value: P.width }, { id: 'cut', kind: 'tap', label: `CUT (${P.strokes.length})`, big: true },
      { id: 'done', kind: 'tap', label: P.strokes.length >= 3 ? 'DONE' : 'CUT AT LEAST 3' }],
    value: (P) => (P.strokes.length ? P.strokes.reduce((a, b) => a + b, 0) / P.strokes.length : P.width),
    result: (P, M, practice) => {
      const spread = P.strokes.length ? Math.max(...P.strokes) - Math.min(...P.strokes) : 1, r = scoreOf(M, KINDS.cut.value(P), practice);
      return { score: +(r.score * (1 - Math.min(0.4, spread * 2))).toFixed(3), hit: r.hit && spread < 0.08, ruined: false }; // (uneven ribbons cost the dish; every one the same is the heart)
    },
  },
  bleed: {
    init: (P) => { P.v = 0; },
    tick: (P, M, dt) => { P.v = (P.t % M.period) / M.period; },
    act: (P, M, id) => { if (id === 'press') { P.pressed = P.v; P.done = true; } },
    controls: () => [{ id: 'press', kind: 'tap', label: 'PRESS THE SPIKE', big: true }],
    value: (P) => (P.pressed ?? P.v),
    live: (P) => P.v,
  },
};

/** A value that climbs by itself (sear, steep, sugar, roux). Stirred moves brown twice as fast unstirred; a blind one (sugar) shows its
 *  stage only when a spoon is dropped in water. */
function climb(finish) {
  return {
    init: (P) => { P.v = 0; P.stirAt = 0; P.testT = 0; },
    tick: (P, M, dt) => {
      P.testT = Math.max(0, P.testT - dt);
      P.v += M.rate * dt * (M.stirGap && P.t - P.stirAt > M.stirGap ? M.scorchK : 1);
      if (P.v >= M.over) { P.v = Math.min(P.v, M.over + 0.01); P.ruined = true; P.done = true; }
    },
    act: (P, M, id) => { if (id === 'done') P.done = true; else if (id === 'stir') P.stirAt = P.t; else if (id === 'test') P.testT = 2.5; },
    controls: (P, M) => [...(M.stirGap ? [{ id: 'stir', kind: 'tap', label: 'STIR', big: true }] : []), ...(M.blind ? [{ id: 'test', kind: 'tap', label: 'DROP A SPOON IN WATER' }] : []),
      { id: 'done', kind: 'tap', label: finish, big: !M.stirGap }],
    value: (P) => P.v,
  };
}

/** The moves a play exists for (bread's three, the ferment's long step and the 3D stage's are other places'). */
export const PLAYABLE = new Set(Object.keys(KINDS));

/** A play of `move` as a dish of `family` with `addin` asks it, or null when the move has none. */
export function newPlay(move, { family = null, addin = null } = {}) {
  const K = KINDS[move]; if (!K) return null;
  const M = moveFor(move, family, addin), P = { move, M, t: 0, done: false, ruined: false };
  K.init(P, M);
  P.tick = (dt) => { if (!P.done) { P.t += dt; K.tick(P, M, dt); } };
  P.act = (id, x) => (P.done ? undefined : K.act(P, M, id, x));
  P.controls = () => K.controls(P, M);
  P.value = () => K.value(P);
  P.live = () => (K.live ? K.live(P) : K.value(P));
  /** What the food shows now; a blind move (sugar) shows nothing until it is tested. */
  P.tell = () => (M.blind && !P.testT ? 'You cannot tell by looking. Drop a spoon of it in cold water.' : tellAt(M, P.live()));
  P.result = (practice = 0) => (K.result ? K.result(P, M, practice) : scoreOf(M, P.value(), practice));
  return P;
}

// ------------------------------------------------------------------ the ferment, on the game clock
/** How far koji has come after `segs` ([[hours, multiplier]] segments of the warmth set), at 0.25 a game hour at steady (moves.js ferment). */
export function fermentValue(segs, rate = 0.25) { return segs.reduce((a, [h, mult]) => a + h * mult * rate, 0); }
