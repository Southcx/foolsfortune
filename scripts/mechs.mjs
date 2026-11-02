// ---------------------------------------------------------------------------------------
// MECHS, MEASURED (docs/plans/MECHS.md): every frame of note assembled and its physics printed (mass, acceleration, the stride, the walk's
// top, the boosts, the battery's minutes, the checks), then the straw giant fought by each arm weapon on a simple duel model: how many
// blows and real seconds to fell it with and without stagger, how much battery that costs, and what the giant's swipes do to the mech.
// Read it to judge: a fight should take one to three real minutes, the battery should matter off the cable, and no weapon should win alone
// on every count. v2 (MECHS.md 9): the toy city's buildings under fists and a charge, and the ring's three rivals against four stand-ins
// (a bout should run a minute or two; the sparring frame won by anyone, the champion only by a player who reads it).
//
//   node scripts/mechs.mjs
// ---------------------------------------------------------------------------------------
import { PARTS, CLAY_FRAME, partsIn } from '../src/progress/mechs/parts.js';
import { assemble, chargeK } from '../src/progress/mechs/frame.js';
import { STAGGER, BARRIER, outputK, ENERGY } from '../src/progress/mechs/rules.js';
import { GIANTS } from '../src/progress/mechs/giants.js';
import { FORMS, breakLine, REGION_BREAK } from '../src/progress/combat/vessel.js';

const pad = (s, n) => String(s).padEnd(n), f = (v, d = 1) => (+v).toFixed(d);

const FRAMES = {
  'clay frame': {},
  'tank, blade': { legs: 'treadLegs', arms: 'strongArms', weaponL: 'greatBlade', weaponR: 'bigGun', core: 'kilnCore' },
  'spring, blade': { legs: 'springLegs', arms: 'quickArms', weaponL: 'greatBlade', weaponR: 'fist', core: 'lightCore', generator: 'lightGenerator' },
  'crab, gun': { legs: 'crabLegs', weaponL: 'bigGun', weaponR: 'bigGun', back: 'missiles', generator: 'bigGenerator', booster: 'highBooster' },
  'overweight': { legs: 'springLegs', arms: 'quickArms', weaponL: 'greatBlade', weaponR: 'bigGun', core: 'kilnCore', back: 'shield', generator: 'bigGenerator' },
};

console.log('FRAMES (mass t, accel m/s², a step s, walk top m/s, quick boost Δv m/s, boost top m/s, jump m/s, idle draw kW, battery min at rest)');
console.log(`${pad('frame', 16)}${pad('mass', 7)}${pad('accel', 7)}${pad('step', 6)}${pad('walk', 6)}${pad('QB', 6)}${pad('top', 6)}${pad('jump', 6)}${pad('draw', 6)}${pad('min', 6)}checks`);
for (const [name, sel] of Object.entries(FRAMES)) {
  const s = assemble(sel);
  console.log(`${pad(name, 16)}${pad(f(s.mass), 7)}${pad(f(s.accel), 7)}${pad(f(s.step, 2), 6)}${pad(f(s.walkTop), 6)}${pad(f(s.qb), 6)}${pad(f(s.boostTop), 6)}${pad(f(s.jump), 6)}${pad(s.draw, 6)}${pad(f(s.minutesIdle), 6)}${s.checks.map((c) => c.id).join(', ') || 'ok'}`);
}

// the duel model: one weapon, swung at its own rate at 0.6 sync (a fair pilot); the giant's barrier dropped once at the start (2 s of
// pressing) and again each time it rises; stagger filled by blows, then the staggered window's blows doubled (heavy ones x3)
const RATE = { fist: 1.1, bigGun: 3, greatBlade: 0.9 };
const giant = GIANTS.straw, gForm = FORMS.giant, line = breakLine('giant'), sync = 0.6;
console.log(`\nTHE STRAW GIANT (falls at ${line} cracks, ${gForm.crack} a full blow: ${Math.round(line / gForm.crack)} unmultiplied full blows), at sync ${sync} (output x${outputK(sync)})`);
console.log(`${pad('weapon', 12)}${pad('blows', 7)}${pad('real s', 8)}${pad('staggers', 10)}${pad('kJ spent', 10)}${pad('battery %', 10)}`);
const clay = assemble({});
for (const w of partsIn('weaponL').filter((id) => RATE[id])) {
  const P = PARTS[w], rate = RATE[w], k = (P.k || 0.5) * outputK(sync) * (P.punch ? 1 : 1) * (w === 'fist' ? clay.punch : 1);
  let cracks = 0, blows = 0, t = 0, gauge = 0, staggerT = 0, staggers = 0, kj = 0, barrierUp = true, downT = 0;
  while (cracks < line && t < 900) {
    const dt = 1 / rate; t += dt;
    if (barrierUp) { t += BARRIER.press; barrierUp = false; downT = BARRIER.down; continue; }
    downT -= dt; if (downT <= 0) { barrierUp = true; continue; }
    const heavy = !!P.heavy, mult = staggerT > 0 ? (heavy ? STAGGER.crit : STAGGER.mult) : 1;
    cracks += k * mult * gForm.crack; blows++; kj += P.cost || 0;
    if (staggerT > 0) staggerT -= dt; else { gauge += P.stagger * (P.momentum ? 1.2 : 1); if (gauge >= STAGGER.full) { gauge = 0; staggerT = STAGGER.for; staggers++; } }
  }
  console.log(`${pad(P.label, 12)}${pad(blows, 7)}${pad(f(t, 0), 8)}${pad(staggers, 10)}${pad(Math.round(kj + clay.draw * t), 10)}${pad(f(100 * (kj + clay.draw * t) / clay.capacity, 0), 10)}`);
}

// the giant on the mech: its swipes on the clay core, the pool's shield first (SHIELD 35 a full blow), then cracks
const mech = FORMS.mech, swipe = giant.moves.swipe, slam = giant.moves.slam;
const toCore = REGION_BREAK / (swipe.k * mech.crack * clay.armour.core);
console.log(`\nTHE GIANT ON THE CLAY FRAME: a swipe k ${swipe.k} cracks the core ${f(swipe.k * mech.crack, 3)} (unshielded): ${f(toCore, 1)} swipes to break it, about ${f(toCore * swipe.every, 0)} real s at one every ${swipe.every} s; a slam k ${slam.k} on the head`);
console.log(`a charge at the clay frame's boost top (${f(clay.boostTop)} m/s) lands k ${f(chargeK(clay.mass, clay.boostTop), 2)}; the tank frame's (${f(assemble(FRAMES['tank, blade']).boostTop)} m/s) k ${f(chargeK(assemble(FRAMES['tank, blade']).mass, assemble(FRAMES['tank, blade']).boostTop), 2)}`);
console.log(`the cable reaches ${ENERGY.cable} m; off it the clay frame has ${f(clay.minutesIdle)} real minutes at rest, ${f(clay.capacity / (clay.draw + clay.fire) / 60, 2)} boosting flat out`);

// ---- v2 (MECHS.md 9): the toy city's buildings under the fist and the charge, and the ring's bouts against four stand-ins ----
import { newBuilding, carve, collapse, cellsLeft, footLeft, BUILDINGS } from '../src/progress/mechs/destruction.js';
import { newBout, boutStep, CIRCUIT } from '../src/progress/mechs/ring.js';
console.log('\nTHE TOY CITY (a fist of 0.6 on one wall\'s foot until it falls; one charge of 1.7 through, a capsule r 4 at 1.5 m and 8 m)');
for (const id of Object.keys(BUILDINGS)) {
  const b = newBuilding(id, 3), n0 = cellsLeft(b); let blows = 0, fell = 0, s = 1;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  while (blows < 120 && !b.fallen) { blows++; carve(b, { kind: 'ball', at: [b.w * r(), 2, 0], r: 2.5 }, 0.6); fell += collapse(b).reduce((a, q) => a + q.cells.length, 0); } // (until its foot gives way: destruction.js FOOT)
  const c = newBuilding(id, 3); let broke = 0; for (const y of [1.5, 8]) broke += carve(c, { kind: 'capsule', at: [-4, y, c.d / 2], to: [c.w + 4, y, c.d / 2], r: 4 }, 1.7).broke.length;
  console.log(`${pad(BUILDINGS[id].label, 12)}${pad(n0 + ' cells', 12)}${b.fallen ? `falls in ${blows} fists (${fell} cells come down)` : `stands after ${blows} fists (foot ${f(footLeft(b), 2)})`}; a charge breaks ${broke}`);
}
console.log('\nTHE RING (12 bouts a rival a stand-in: reads a tell at react s with read odds; a masher punches the head and never answers)');
const STANDINS = { expert: { react: 0.15, read: 0.95, starAt: 3, breaker: true }, decent: { react: 0.3, read: 0.75, starAt: 1 }, novice: { react: 0.45, read: 0.5, starAt: 1 }, masher: { masher: true } };
function bout(id, P, seed) {
  const B = newBout(id, { punchK: 0.55, seed }), dt = 1 / 30; let t = 0, last = 0, plan = null, z = seed;
  const r = () => (z = (z * 9301 + 49297) % 233280) / 233280;
  while (!B.over && t < 700) {
    t += dt; const F = B.foe, m = F.move && B.R.moves[F.move], press = { mash: B.me.state === 'down' && r() < 0.5 };
    if (P.masher) { if (t - last > 0.4) { press.punch = r() < 0.5 ? 'L' : 'R'; press.high = true; last = t; } } else {
      if (m && F.phase === 'windup' && !plan) plan = { at: B.t + P.react, ok: r() < P.read };
      if (plan && F.phase !== 'windup') plan = null;
      if (plan && m && B.t >= plan.at && (m.windup - F.t) / B.R.speed[B.round - 1] < 0.3) {
        if (plan.ok) { const a = m.answers[0]; if (a === 'dodge') press.dodge = 'L'; else if (a === 'duck') press.duck = true; else press.block = true; }
        if (m.breakOn && P.breaker) { press.punch = 'R'; press.high = false; press.dodge = null; }
      }
      if ((F.phase === 'open' || F.taunting) && t - last > 0.36) { if (B.me.stars >= P.starAt) press.star = true; else { press.punch = 'R'; press.high = true; } last = t; }
      if (!F.move && B.R.guard === 'low' && t - last > 0.5) { press.punch = 'R'; press.high = true; last = t; }
    }
    boutStep(B, dt, press);
  }
  return { ...B.over, t };
}
for (const id of CIRCUIT) {
  const row = Object.entries(STANDINS).map(([n, P]) => { const R = Array.from({ length: 12 }, (_, i) => bout(id, P, i + 1)), won = R.filter((x) => x.winner === 'me');
    return `${n} ${won.length}/12${won.length ? ` ${f(won.reduce((a, x) => a + x.t, 0) / won.length, 0)} s` : ''}`; });
  console.log(`${pad(id, 10)}${row.join('   ')}`);
}
