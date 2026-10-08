// ---------------------------------------------------------------------------------------
// THE PATTERN LIBRARY: the crossing's danmaku as data and pure functions (docs/plans/RAIL-OVERHAUL.md section 7; the research and
// every source: docs/plans/research/RAIL-PATTERNS.md). An emitter is a row of numbers and a formula; `emit` turns one into every shot
// it fires over its duration, in the rail's frame (x across, y up, z along), so the stage (Petra's runtime), the simulator
// (scripts/rail.mjs) and the fairness checker (`fair`) read the same thing. No Three.js here: vectors are [x, y, z].
//
// Prior art: Kenta Cho's BulletML (fire, repeat, wait, changeDirection, changeSpeed, accel; the `sequence` direction that makes every
// spiral and n-way a running accumulator), Danmokou's movement functions, Sparen's Danmaku Design Studio (rings 360/n; odd fans threaten
// and even fans constrain; stacks of speeds; seed deltas that never leave blind spots), Boghog's design 101 (aimed, static, random mixed;
// walls with gaps; no stray shots), Cave and Touhou (slow shots, light and heavy phases), Ikaruga (two kinds of shot), the Itano circus
// (missiles of three behaviours), and proportional navigation for the homers.
//
// A pattern fires in a PLANE (the view's: a ring reads as a ring from the camera) or in a CONE toward the ship (the chase and free
// views: an angle in the plane becomes a direction off the aim by `cone` radians). Each shot carries its `kind` (astral or umbral: the
// Astral and Umbral forms), whether it is `outlined` (only the roll answers it), and its `motion`: straight, accel, wave, curve,
// decel (then a burst), split, homing, laser (a line that warns then burns), snake (a laser following a head).
//
//   PATTERNS[name] = { does, defaults, fire(p, ctx) -> volleys }   emit(name, params, ctx) -> [shot]   positionAt(shot, t) -> [x, y, z]
//   children(shot) -> [shot] (a burst or a split, at its time)   fair(shots, ship) -> { ok, worst: { gap, reaction, spawn, turn } }
//   ctx = { origin: [x,y,z], aim: [x,y,z] unit toward the ship, up?: [x,y,z], mode?: 'plane' | 'cone', rng?: () => 0..1 (a seeded stream), kind?, outlined? }
// ---------------------------------------------------------------------------------------

const D = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** The basis an emitter fires in: f toward the ship, u across it, v up it (u and v span the plane a planar pattern turns in). */
function basis(ctx) {
  const f = norm(ctx.aim || [0, 0, -1]), up = ctx.up || [0, 1, 0];
  let u = cross(up, f); if (len(u) < 1e-6) u = [1, 0, 0]; u = norm(u);
  return { f, u, v: norm(cross(f, u)) };
}
/** A direction from an angle (degrees, 0 = straight at the ship): in the plane (u, f) it turns the aim by the angle; in a cone it tilts
 *  the aim by `cone` radians toward the angle's direction round it. */
function dirOf(B, deg, ctx, cone = 0.35) {
  const a = deg * D;
  if ((ctx.mode || 'plane') === 'cone') {
    const side = add(scale(B.u, Math.cos(a)), scale(B.v, Math.sin(a)));
    return norm(add(scale(B.f, Math.cos(cone)), scale(side, Math.sin(cone))));
  }
  return norm(add(scale(B.f, Math.cos(a)), scale(B.u, Math.sin(a))));
}

/** The library: 28 emitters. Speeds in m/s (shots 10 to 28: slow enough to read, the Cave lesson); counts small enough to stay under the
 *  leg's budget; every angle in degrees off the aim. `fire(p, ctx)` returns volleys: [{ at, shots: [{ dir, speed, motion?, from? }] }]. */
export const PATTERNS = {
  ring:        { does: 'a ring, all at once', defaults: { n: 16, speed: 14, seed: 0, every: 1.5, volleys: 4 },
    fire: (p) => vol(p, (k) => range(p.n).map((i) => ({ deg: p.seed + 360 * i / p.n }))) },
  rotatingRing:{ does: 'rings whose seed drifts by a delta that never divides the step (no blind spots)', defaults: { n: 18, speed: 13, delta: 7, every: 0.75, volleys: 8 },
    fire: (p) => vol(p, (k) => range(p.n).map((i) => ({ deg: k * p.delta + 360 * i / p.n }))) },
  evenFan:     { does: 'an even fan: it constrains, nothing on the aim line', defaults: { n: 6, arc: 60, speed: 16, every: 1, volleys: 4 },
    fire: (p) => vol(p, () => fan(p.n, p.arc)) },
  oddFan:      { does: 'an odd fan: one shot on the aim line, it makes you move', defaults: { n: 5, arc: 50, speed: 16, every: 1, volleys: 4 },
    fire: (p) => vol(p, () => fan(p.n, p.arc)) },
  aimedBurst:  { does: 'a stream down the aim line', defaults: { n: 6, speed: 20, gap: 0.12, volleys: 3, every: 1.5 },
    fire: (p) => { const out = []; for (let k = 0; k < p.volleys; k++) for (let i = 0; i < p.n; i++) out.push({ at: k * p.every + i * p.gap, shots: [{ deg: 0 }] }); return out; } },
  offsetTwins: { does: 'pairs aimed either side of you: slip between', defaults: { offset: 8, speed: 18, every: 0.5, volleys: 8 },
    fire: (p) => vol(p, () => [{ deg: -p.offset }, { deg: p.offset }]) },
  stackFan:    { does: 'a fan at a stack of speeds: gaps that open further out', defaults: { n: 5, arc: 70, m: 3, vmin: 10, vmax: 20, every: 1.5, volleys: 3 },
    fire: (p) => vol(p, () => fan(p.n, p.arc).flatMap((s) => range(p.m).map((j) => ({ ...s, speed: p.vmin + j * (p.vmax - p.vmin) / Math.max(1, p.m - 1) })))) },
  spiral:      { does: 'one arm turning', defaults: { w: 160, speed: 14, every: 0.08, volleys: 50 },
    fire: (p) => vol(p, (k) => [{ deg: p.w * k * p.every }]) },
  multiSpiral: { does: 'arms turning together', defaults: { arms: 4, w: 120, speed: 13, every: 0.1, volleys: 40 },
    fire: (p) => vol(p, (k) => range(p.arms).map((a) => ({ deg: p.w * k * p.every + 360 * a / p.arms }))) },
  doubleHelix: { does: 'arms that reverse their turn each half period', defaults: { arms: 3, w: 140, T: 2, speed: 13, every: 0.1, volleys: 40 },
    fire: (p) => { let ang = 0; return vol(p, (k) => { ang += p.w * p.every * Math.sign(Math.sin(2 * Math.PI * (k * p.every) / p.T) || 1); return range(p.arms).map((a) => ({ deg: ang + 360 * a / p.arms })); }); } },
  accelSpiral: { does: 'a spiral winding faster, to a cap', defaults: { arms: 2, w0: 60, alpha: 80, wmax: 260, speed: 13, every: 0.08, volleys: 50 },
    fire: (p) => { let ang = 0; return vol(p, (k) => { ang += Math.min(p.wmax, p.w0 + p.alpha * k * p.every) * p.every; return range(p.arms).map((a) => ({ deg: ang + 360 * a / p.arms })); }); } },
  rose:        { does: 'a flower: a ring whose speed follows a rose curve r = cos(k theta)', defaults: { n: 36, k: 3, speed: 9, swell: 9, every: 2, volleys: 3 },
    fire: (p) => vol(p, () => range(p.n).map((i) => { const th = 360 * i / p.n; return { deg: th, speed: p.speed + p.swell * Math.abs(Math.cos(p.k * th * D)) }; })) },
  gapWall:     { does: 'a wall across the plane with a gap that snakes row by row (at least three ship widths)', defaults: { cols: 12, width: 24, gap: 3, step: 2, speed: 12, every: 1, volleys: 6 },
    fire: (p) => vol(p, (k) => { const g = Math.abs(((k * p.step) % (2 * (p.cols - p.gap))) - (p.cols - p.gap)); return range(p.cols).filter((i) => i < g || i >= g + p.gap).map((i) => ({ deg: 0, lateral: -p.width / 2 + (i + 0.5) * p.width / p.cols })); }) },
  sineCurtain: { does: 'a curtain of shots weaving in antiphase: lanes that sway', defaults: { cols: 7, width: 28, A: 2, f: 0.6, speed: 11, every: 1.2, volleys: 5 },
    fire: (p) => vol(p, () => range(p.cols).map((i) => ({ deg: 0, lateral: -p.width / 2 + (i + 0.5) * p.width / p.cols, motion: { type: 'wave', A: p.A, f: p.f, phase: i % 2 ? Math.PI : 0 } }))) },
  decelBurst:  { does: 'shells that slow to a stop, then burst into rings (BulletML)', defaults: { n: 4, arc: 80, speed: 16, T: 1.2, m: 10, childSpeed: 11, every: 2, volleys: 3 },
    fire: (p) => vol(p, () => fan(p.n, p.arc).map((s) => ({ ...s, motion: { type: 'decel', T: p.T, burst: p.m, childSpeed: p.childSpeed } }))) },
  accelRain:   { does: 'shots falling and gathering speed, placed on a jittered grid (no clumps, no holes)', defaults: { n: 7, width: 28, v0: 4, a: 12, vmax: 22, every: 0.6, volleys: 8 },
    fire: (p, ctx) => vol(p, () => stratified(p.n, ctx.rng).map((x) => ({ deg: 0, lateral: (x - 0.5) * p.width, speed: p.v0, motion: { type: 'accel', a: p.a, vmax: p.vmax } }))) },
  curving:     { does: 'shots that arc round you after a straight start', defaults: { n: 6, arc: 90, speed: 14, omega: 50, delay: 0.5, every: 1.2, volleys: 4 },
    fire: (p) => vol(p, (k) => fan(p.n, p.arc).map((s) => ({ ...s, motion: { type: 'curve', omega: (k % 2 ? -1 : 1) * p.omega * D, delay: p.delay } }))) },
  splitShell:  { does: 'a heavy shell that splits into a fan of children', defaults: { speed: 15, T: 0.9, m: 5, spread: 40, childSpeed: 13, every: 1, volleys: 4 },
    fire: (p) => vol(p, () => [{ deg: 0, motion: { type: 'split', T: p.T, m: p.m, spread: p.spread, childSpeed: p.childSpeed } }]) },
  fragmentRing:{ does: 'a ring whose every shot splits once (capped: a ring of 8 into 24)', defaults: { n: 8, speed: 12, T: 0.8, m: 3, spread: 30, childSpeed: 9, every: 2, volleys: 3 },
    fire: (p) => vol(p, () => range(p.n).map((i) => ({ deg: 360 * i / p.n, motion: { type: 'split', T: p.T, m: p.m, spread: p.spread, childSpeed: p.childSpeed } }))) },
  crossGate:   { does: 'two streams from either side whose lines cross at you', defaults: { offset: 9, speed: 18, every: 0.15, volleys: 20, side: 10 },
    fire: (p) => vol(p, () => [{ deg: p.offset, lateral: -p.side }, { deg: -p.offset, lateral: p.side }]) },
  stratRain:   { does: 'a scatter on a jittered grid: random to the eye, fair to the hand', defaults: { n: 8, width: 28, speed: 13, every: 0.5, volleys: 8 },
    fire: (p, ctx) => vol(p, () => stratified(p.n, ctx.rng).map((x) => ({ deg: 0, lateral: (x - 0.5) * p.width }))) },
  sweepBeam:   { does: 'a beam that warns, then burns, sweeping slower than the ship can run', defaults: { warn: 0.75, burn: 2, from: -50, to: 50, reach: 60, every: 4, volleys: 2 },
    fire: (p) => vol(p, () => [{ deg: p.from, speed: 0, motion: { type: 'laser', warn: p.warn, burn: p.burn, from: p.from * D, to: p.to * D, reach: p.reach } }]) },
  snakeLaser:  { does: 'a laser that follows a weaving head (a ribbon over its trail)', defaults: { speed: 16, A: 5, f: 0.8, length: 14, every: 2.5, volleys: 3 },
    fire: (p) => vol(p, () => [{ deg: 0, motion: { type: 'snake', A: p.A, f: p.f, length: p.length } }]) },
  homingSalvo: { does: 'missiles that home, turning no faster than a cap, for a lifetime, then fly dumb', defaults: { n: 4, arc: 120, speed: 12, turn: 80, life: 2.2, N: 3.5, every: 2, volleys: 3 },
    fire: (p) => vol(p, () => fan(p.n, p.arc).map((s) => ({ ...s, motion: { type: 'homing', turn: p.turn * D, life: p.life, N: p.N } }))) },
  itano:       { does: 'the Itano circus: a fanned launch, an overshoot, three behaviours (straight, leading, weaving) homing at once', defaults: { n: 9, arc: 160, speed: 14, turn: 90, life: 2.5, wobble: 2.5, every: 3, volleys: 2 },
    fire: (p) => vol(p, () => fan(p.n, p.arc).map((s, i) => ({ ...s, motion: { type: 'homing', turn: p.turn * D, life: p.life, N: [3, 4.5, 2.5][i % 3], lead: i % 3 === 1, wobble: i % 3 === 2 ? p.wobble : 0, stagger: (i % 4) * 0.1 } }))) },
  cageRing:    { does: 'a ring closing in round you with one sector open (the bait ball as a pattern)', defaults: { n: 20, radius: 14, open: 50, speed: 7, every: 3, volleys: 2 },
    fire: (p, ctx) => vol(p, (k) => { const o = (k * 137) % 360; return range(p.n).map((i) => 360 * i / p.n).filter((a) => Math.abs(((a - o + 540) % 360) - 180) > p.open / 2).map((a) => ({ deg: 0, cage: { radius: p.radius, angle: a } })); }) },
  frenzyDash:  { does: 'glints peel off one by one, glint a warning, then dash straight at where you are', defaults: { n: 6, warn: 0.25, speed: 24, every: 0.35, volleys: 6 },
    fire: (p) => vol(p, () => [{ deg: 0, warn: p.warn }]) },
  mixed:       { does: 'any pattern with a share of its shots outlined (only the roll answers them)', defaults: { of: 'oddFan', share: 0.25 },
    fire: (p, ctx) => { const P = PATTERNS[p.of]; return P.fire({ ...P.defaults, ...p.params }, ctx).map((v) => ({ ...v, shots: v.shots.map((s, i) => ({ ...s, outlined: ((i * 7 + Math.floor(v.at * 13)) % 100) / 100 < p.share })) })); } },
};

/** A fixed generator when none is given (the runtime passes the day's seeded stream: core/rng.js `stream(name)`). */
function fixedRng(seed = 7) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }
const range = (n) => Array.from({ length: n }, (_, i) => i);
const fan = (n, arc) => range(n).map((i) => ({ deg: n > 1 ? -arc / 2 + arc * i / (n - 1) : 0 }));
const vol = (p, f) => range(p.volleys || 1).map((k) => ({ at: k * (p.every || 1), shots: f(k) }));
/** n positions in 0..1, one in each of n equal cells, jittered (blue-ish noise: no clumps, no holes). */
function stratified(n, rng = fixedRng()) { return range(n).map((i) => (i + 0.15 + 0.7 * rng()) / n); }

/** Every shot a pattern fires, with when (seconds from its start), where from and which way, in the rail's frame. */
export function emit(name, params = {}, ctx = {}) {
  const P = PATTERNS[name]; if (!P) return [];
  const p = { ...P.defaults, ...params }, B = basis(ctx), o = ctx.origin || [0, 0, 0], out = [];
  for (const v of P.fire(p, { ...ctx, rng: ctx.rng || fixedRng() })) for (const s of v.shots) {
    let from = o, dir = dirOf(B, s.deg || 0, ctx, ctx.cone);
    if (s.lateral) from = add(from, scale(B.u, s.lateral));
    if (s.cage) { const a = s.cage.angle * D, ship = add(o, scale(B.f, ctx.range || 30)); from = add(ship, add(scale(B.u, Math.cos(a) * s.cage.radius), scale(B.v, Math.sin(a) * s.cage.radius))); dir = norm(add(ship, scale(from, -1))); }
    out.push({ at: +(v.at + (s.motion?.stagger || 0)).toFixed(3), pos: from, dir, speed: s.speed ?? p.speed ?? 14, kind: s.kind || ctx.kind || 'astral',
      outlined: s.outlined ?? !!ctx.outlined, motion: s.motion || { type: 'straight' }, warn: s.warn || 0, pattern: name });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Where a shot is t seconds after it was fired (closed form for every motion but homing, which the runtime steers: here it flies
 *  straight, its worst case for the fairness check's reaction time). Lasers and snakes report their head. */
export function positionAt(s, t) {
  const m = s.motion || { type: 'straight' }, d = s.dir, v = s.speed;
  t = Math.max(0, t - (s.warn || 0));
  if (m.type === 'accel') { const tc = Math.max(0, (m.vmax - v) / (m.a || 1)), tt = Math.min(t, tc); return add(s.pos, scale(d, v * tt + 0.5 * m.a * tt * tt + m.vmax * Math.max(0, t - tc))); }
  if (m.type === 'decel') { const tt = Math.min(t, m.T); return add(s.pos, scale(d, v * tt - 0.5 * (v / m.T) * tt * tt)); }
  if (m.type === 'split') return add(s.pos, scale(d, v * Math.min(t, m.T)));
  if (m.type === 'wave' || m.type === 'snake') { const side = norm(cross([0, 1, 0], d)); return add(add(s.pos, scale(d, v * t)), scale(len(side) ? side : [1, 0, 0], m.A * Math.sin(2 * Math.PI * m.f * t + (m.phase || 0)))); }
  if (m.type === 'curve') { if (t <= m.delay) return add(s.pos, scale(d, v * t)); const p0 = add(s.pos, scale(d, v * m.delay)), tt = t - m.delay, w = m.omega, side = norm(cross([0, 1, 0], d)); return add(p0, add(scale(d, (v / w) * Math.sin(w * tt)), scale(side, (v / w) * (1 - Math.cos(w * tt))))); }
  if (m.type === 'laser') return s.pos;
  return add(s.pos, scale(d, v * t));
}

/** A shot's children at its time: a decelerating shell bursts into a ring, a splitting one into a fan about its heading. */
export function children(s) {
  const m = s.motion || {};
  if (m.type !== 'decel' && m.type !== 'split') return [];
  const at = s.at + (s.warn || 0) + m.T, pos = positionAt(s, (s.warn || 0) + m.T), f = s.dir;
  let u = cross([0, 1, 0], f); if (len(u) < 1e-6) u = [1, 0, 0]; u = norm(u);
  const n = m.type === 'decel' ? m.burst : m.m, out = [];
  for (let i = 0; i < n; i++) {
    const deg = m.type === 'decel' ? 360 * i / n : (n > 1 ? -m.spread / 2 + m.spread * i / (n - 1) : 0), a = deg * D;
    out.push({ at, pos, dir: norm(add(scale(f, Math.cos(a)), scale(u, Math.sin(a)))), speed: m.childSpeed, kind: s.kind, outlined: s.outlined, motion: { type: 'straight' }, warn: 0, pattern: s.pattern });
  }
  return out;
}

/** THE FAIRNESS CHECK (RAIL-OVERHAUL.md section 7; the research's rules of fair danmaku): for a pattern's shots against a ship at
 *  `ship.pos` with a hurtbox of `ship.width`: every volley leaves a gap of at least three ship widths where it crosses the ship's
 *  distance; every shot gives at least `reaction` seconds from its spawn (and its warning) to reach the ship; none spawns within
 *  `spawn` metres; homers turn no faster than 90 degrees a second and live at most 2.5 real seconds; rotating seeds leave no blind spot. */
export const FAIR = { gapWidths: 3, reaction: 0.5, spawn: 4, turn: 90 * D, life: 2.5 };
export function fair(shots, ship = { pos: [0, 0, 30], width: 1.2 }, params = {}, box = 12, mode = 'plane') {
  let gap = Infinity, reaction = Infinity, spawn = Infinity, turn = 0, life = 0;
  const all = shots.flatMap((s) => [s, ...children(s)]), byAt = new Map();
  for (const s of all) {
    const toShip = add(ship.pos, scale(s.pos, -1)), dist = len(toShip);
    spawn = Math.min(spawn, dist);
    const along = Math.max(0, dot(toShip, s.dir));
    if (s.motion?.type !== 'laser' && s.speed > 0 && dot(norm(toShip), s.dir) > 0.5) reaction = Math.min(reaction, along / s.speed + (s.warn || 0));
    if (s.motion?.type === 'laser') reaction = Math.min(reaction, s.motion.warn);
    if (s.motion?.type === 'homing') { turn = Math.max(turn, s.motion.turn); life = Math.max(life, s.motion.life); }
    const key = s.at.toFixed(2); (byAt.get(key) || byAt.set(key, []).get(key)).push(s);
  }
  // a volley's widest gap where it crosses the plane through the ship facing the emitter, within the ship's reach (`box` either side):
  // only shots heading for that plane count (a ring's back half flies away); a path must exist through every volley
  for (const vol of byAt.values()) {
    const o = vol[0].pos, nrm = norm(add(ship.pos, scale(o, -1))); let ax = cross([0, 1, 0], nrm); if (len(ax) < 1e-6) ax = [1, 0, 0]; ax = norm(ax);
    const ay = norm(cross(nrm, ax)), pts = [];
    for (const s of vol) {
      const den = dot(s.dir, nrm); if (den <= 0.05 || s.motion?.type === 'laser') continue;
      const t = dot(add(ship.pos, scale(s.pos, -1)), nrm) / den, d = add(add(s.pos, scale(s.dir, t)), scale(ship.pos, -1));
      pts.push([dot(d, ax), dot(d, ay)]);
    }
    if (pts.length < 2) continue;
    if (mode === 'plane') {
      // in a plane view the ship moves in the plane: the gap is along its one lateral axis
      const xs = pts.map((q) => q[0]).filter((x) => Math.abs(x) <= box).sort((a, b) => a - b);
      if (xs.length < 2) continue;
      let widest = Math.max(xs[0] + box, box - xs[xs.length - 1]);
      for (let i = 1; i < xs.length; i++) widest = Math.max(widest, xs[i] - xs[i - 1]);
      gap = Math.min(gap, widest);
    } else {
      // in a chase or free view the ship moves across the screen in two axes: the gap is the widest clear circle in its reach
      let best = 0;
      for (let gx = -box; gx <= box; gx += 0.5) for (let gy = -box * 0.6; gy <= box * 0.6; gy += 0.5) {
        let near = Infinity; for (const q of pts) near = Math.min(near, Math.hypot(q[0] - gx, q[1] - gy));
        best = Math.max(best, near);
      }
      gap = Math.min(gap, 2 * best);
    }
  }
  const blind = params.delta != null && params.n ? gcd(Math.round(params.delta), Math.round(360 / params.n)) > 3 : false;
  const worst = { gap: +gap.toFixed(2), reaction: +reaction.toFixed(2), spawn: +spawn.toFixed(2), turn: +(turn / D).toFixed(0), life };
  const ok = gap >= FAIR.gapWidths * ship.width && reaction >= FAIR.reaction && spawn >= FAIR.spawn && turn <= FAIR.turn + 1e-9 && life <= FAIR.life && !blind;
  return { ok, worst, blind };
}
