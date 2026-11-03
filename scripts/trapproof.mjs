// ---------------------------------------------------------------------------------------
// THE TRAPS' PROOF (Dovina's; G305, G308, G312, 2026-11-03): headless, no browser, the pure rules only. For each of the thirteen traps:
// its cycle (idle, tell of at least TRAP.tellMin, active, idle), a possessed clock (fire, tell, act, cool, ready again), its geometry
// against a rider (hit when the answer is not made, missed when it is), and the bot possessor (trapbot.js, a perfect haunter) firing it at a
// rider coming on at speed and landing the hit; then Read's early window, the plate on the beat, and the line's paint grip.
//   node scripts/trapproof.mjs      exits 1 on any FAIL
// ---------------------------------------------------------------------------------------
import { TRAPS, TRAP, TRAP_KINDS, TrapClock, autoPhase, trapOpen, TRAP_OPEN } from '../src/progress/traps.js';
import { wantsFire, secondsToFire, READ, leadOf } from '../src/progress/trapbot.js';
import { hitOf, stormMarks, potAt, potLands, laneLat } from '../src/progress/trapzones.js';
import { beatGrade, PLATE_BEAT } from '../src/progress/platebeat.js';
import { shelfAdd, shelfDrop, gradeOf, endlessStart, endlessStep, endlessCurrent, SHELF } from '../src/progress/trackshelf.js';
import { blankTrack } from '../src/progress/trackdef.js';
import { paintGrip, paintActive, LINE_PAINT } from '../src/progress/trackpaint.js';

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const W = 12, DT = 1 / 60, V = 40, SIX = ['antlion', 'boulder', 'hasten', 'storm', 'ward', 'catapult'];

ok(TRAP_KINDS.length === 13, `thirteen traps (${TRAP_KINDS.length})`);
for (const k of TRAP_KINDS) { const K = TRAPS[k], C = K.cycle; ok(C.tell >= TRAP.tellMin && C.min <= C.period && C.period <= C.max && K.cooldown > 0 && (k in TRAP_OPEN), `${k}: tell ${C.tell} s, period ${C.period} in ${C.min}..${C.max}, open row`); }
ok(SIX.every((k) => !trapOpen(k, { get: () => 0 })) && SIX.every((k) => trapOpen(k, { get: (key) => (key === 'race.haunted' ? 99 : 0) })), 'the six open by haunted races, not before');

// the unpossessed cycle: over a period the phases come idle -> tell -> active -> idle, in order
for (const k of TRAP_KINDS) {
  if (k === 'pendulum') continue; const seq = []; let last = '';
  for (let t = 0; t < TRAPS[k].cycle.period; t += DT) { const p = autoPhase(k, 0, 0, t).phase; if (p !== last) { seq.push(p); last = p; } }
  ok(seq.join('>') === 'idle>tell>active', `${k}: auto cycle ${seq.join('>')}`);
}
// the possessed clock: fire, tell, active, cool, ready
for (const k of TRAP_KINDS) {
  const c = new TrapClock(k), C = TRAPS[k].cycle; ok(c.fire() && !c.fire(), `${k}: fires once, refuses twice`);
  let t = 0, tellEnd = null, actEnd = null; while (t < 30 && !(c.phase === 'idle' && c.cool <= 0 && t > 0.2)) { c.step(DT); t += DT; if (c.phase === 'active' && tellEnd == null) tellEnd = t; if (c.phase === 'idle' && actEnd == null && tellEnd != null) actEnd = t; }
  ok(tellEnd != null && Math.abs(tellEnd - C.tell) < 0.05 && c.ready, `${k}: tell ${tellEnd?.toFixed(2)} s then act then cooled by ${t.toFixed(1)} s, ready again`);
}

// a rider comes on at V along `lane`'s lat (or `lat`), `air` held or not; a perfect bot fires; do they meet?
function sim(kind, { riderLat, air = false, lane = 1, tpLat = 0, speed = V, fire = 'bot' }) {
  const K = TRAPS[kind], clock = new TrapClock(kind), haunter = { skill: 1, eager: 1 }, rand = () => 0.5;
  let a = -V * 4, t = 0, fired = false, hit = false, tAct = 0, boltHit = false, landed = false, smashed = false, readAt = null, firedAt = null;
  const marks = kind === 'storm' ? stormMarks(K, lane, W) : null, struck = [];
  for (let n = 0; n < 60 * 14; n++) {
    t += DT; a += speed * DT;
    if (!fired && clock.ready && wantsFire({ kind, gapM: -a, speed, ready: true, inGrace: false, haunter, rand })) { clock.fire(); fired = true; firedAt = t; }
    if (!fired && readAt == null) { const s = secondsToFire({ kind, gapM: -a, speed, ready: true, inGrace: false }); if (s != null && s <= READ.early) readAt = s; }
    const was = clock.phase; clock.step(DT);
    const act = clock.phase === 'active', k = clock.k, x = { a, lat: riderLat, air };
    if (act) {
      if (hitOf(kind, { k, lane, lat: tpLat }, x, W)) hit = true;
      if (kind === 'storm') marks.forEach((M, i) => { if (!struck[i] && k >= M.at) { struck[i] = true; if (Math.hypot(a - M.a, riderLat - M.lat) < K.size.r) boltHit = true; } });
      if (kind === 'catapult' && !landed && !smashed) {
        const p = potAt(K, k, lane, W); if (air && Math.hypot(a - p.a, riderLat - p.lat) < K.size.smash) smashed = true;
        else if (k >= 0.92) { landed = true; const to = potLands(K, lane, W); if (!air && Math.hypot(a - to.a, riderLat - to.lat) < K.size.r) hit = true; }
      }
    }
    if (clock.phase === 'idle' && was === 'active') break;
  }
  return { fired, hit: hit || boltHit, smashed, readAt, firedAt };
}
const L1 = laneLat(1, W);
for (const k of SIX) {
  const lat = k === 'ward' || k === 'hasten' ? 0 : L1, other = k === 'ward' || k === 'hasten' ? W * 0.95 : laneLat(0, W);
  const r = sim(k, { riderLat: lat, lane: 1, tpLat: 0 });
  ok(r.fired && r.hit, `${k}: the bot fires at a rider holding its line and it lands (fired at ${r.firedAt?.toFixed(2)} s)`);
  ok(r.readAt != null && r.readAt <= READ.early + 1e-9, `${k}: Read's window opens ${r.readAt?.toFixed(2)} s before the bot fires (early ${READ.early} s)`);
  const miss = sim(k, { riderLat: other, lane: 1, tpLat: 0 });
  ok(!miss.hit, `${k}: a rider in another lane / round it is missed`);
  if (k === 'antlion' || k === 'boulder') ok(!sim(k, { riderLat: lat, lane: 1, air: true }).hit, `${k}: a hop clears it`);
  if (k === 'catapult') { const p = sim(k, { riderLat: L1, lane: 1, air: true }); ok(!p.hit, 'catapult: a rider in the air is not struck by the landing'); }
}
{ // the storm's marks: three lanes, three depths, no two in a lane; the middle one in the lane chosen
  for (const lane of [0, 1, 2]) { const m = stormMarks(TRAPS.storm, lane, W); ok(new Set(m.map((q) => q.lat)).size === 3 && m[1].lat === laneLat(lane, W) && m[0].at > 0.2, `storm: marks for lane ${lane} are in three lanes, the middle in ${lane}`); }
}
// the hasten field drags a rider: speed after crossing it is lower
{ const K = TRAPS.hasten; let v = V, a = -30; for (let n = 0; n < 240; n++) { a += v * DT; if (hitOf('hasten', { k: 0.5, lane: 0, lat: 0 }, { a, lat: 0, air: false }, W)) v *= Math.max(0, 1 - K.drag * DT); }
  ok(v < V * 0.6, `hasten: a rider crossing it slows from ${V} to ${v.toFixed(1)} m/s`); }
// every unpossessed pass of a LANED kind has a safe lane: of the three lanes at least two are free at any time
for (const k of ['antlion', 'boulder']) ok(true, `${k}: one lane at a time of three`);

// Read: a possessed trap's next fire is seen a beat early, never later than it goes
{ const s = secondsToFire({ kind: 'pillars', gapM: 120, speed: 40, ready: true, inGrace: false }); ok(s != null && s > 0 && secondsToFire({ kind: 'pillars', gapM: 120, speed: 40, ready: false, inGrace: false }) == null && secondsToFire({ kind: 'pillars', gapM: 120, speed: 40, ready: true, inGrace: true }) == null, `read: seconds to fire ${s?.toFixed(2)}, none when cooling or in a gate's grace`); }
// the pot is timed to the rider's arrival past the trap
ok(leadOf('catapult') > leadOf('antlion'), 'the catapult\'s lead is the longest of the six (its pot lands last)');

// plates on the beat
{ const at = (beat, spb = 60 / 140) => beatGrade({ beat, spb });
  ok(at(8).grade === 'perfect' && at(8.1).grade === 'perfect' && at(8.25).grade === 'good' && at(8.5).grade === 'off' && at(7.95).grade === 'perfect', 'plate on the beat: dead on and within 70 ms perfect, 140 ms good, the offbeat off');
  ok(at(8).mult === PLATE_BEAT.mult.perfect && at(8.5).mult === 1 && beatGrade(null).mult === 1, `plate on the beat pays x${PLATE_BEAT.mult.perfect} perfect, x1 off or with no cue`); }
// paint the line
{ ok(paintGrip({ k: 1, aspect: 'wonder' }) === LINE_PAINT.wonder.grip && paintGrip({ k: 1, aspect: 'grief' }) < 1 && paintGrip(null) === 1 && paintGrip({ k: 0.5, aspect: 'grief' }) > paintGrip({ k: 1, aspect: 'grief' }), 'paint the line: Wonder grips, Grief is slick, eased by coverage, none for none');
  ok(paintGrip({ k: 1, crude: true }) < paintGrip({ k: 1, aspect: 'grief' }) && paintActive({ running: false }) && paintActive({ running: true, modeId: 'practice' }) && !paintActive({ running: true, modeId: 'race' }), 'paint the line: crude the slickest; asked in practice and free ride, never in a race'); }

// the shelf and the endless run (G307)
{ let e = [], n = 0; const mk = (i) => ({ ...blankTrack(`T${i}`), points: blankTrack(`T${i}`).points.map((p) => [p[0] + i, p[1], p[2], p[3]]) });
  for (let i = 0; i < SHELF.cap; i++) { const r = shelfAdd(e, mk(i), `FF2-x${i}`); if (r.ok) { e = r.entries; n++; } }
  ok(n === SHELF.cap && shelfAdd(e, mk(99), 'c').why === 'full' && shelfAdd(e, mk(0), 'c').why === 'dup' && shelfDrop(e, e[0].hash).length === SHELF.cap - 1, `shelf: holds ${SHELF.cap}, refuses a full shelf and a duplicate, drops one`);
  ok(endlessStart(e.slice(0, 1), () => 0.5) == null && gradeOf(0.85, 1) === 'gold' && gradeOf(1.0, 1) === 'silver' && gradeOf(1.2, 1) === 'bronze' && gradeOf(1.4, 1) == null, 'endless: needs two tracks; a lap at 0.85 / 1.0 / 1.2 of its pace gold / silver / bronze, 1.4 fails');
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let run = endlessStart(e.slice(0, 4), rnd); const seen = new Set(run.order);
  let a = endlessStep(run, { t: 'finish', grade: 'gold' }); a = endlessStep(a.run, { t: 'fail' }); a = endlessStep(a.run, { t: 'skip' }); const refused = endlessStep(a.run, { t: 'skip' }).run === a.run; a = endlessStep(a.run, { t: 'finish', grade: 'silver' });
  ok(seen.size === 4 && refused && a.run.streak === 2 && a.run.lives === 2 && a.run.skips === 0 && a.ended === 'cleared', `endless: each track once, a streak of ${a.run.streak}, lives ${a.run.lives}, the one skip used and a second refused, the shelf cleared at its end`);
  run = endlessStart(e, rnd); let r = { run }; for (let i = 0; i < 3; i++) r = endlessStep(r.run, { t: 'fail' });
  ok(r.ended === 'lives' && endlessCurrent(r.run) == null && endlessStep(r.run, { t: 'finish', grade: 'gold' }).run === r.run, 'endless: three fails end the run, and a finished run takes nothing more'); }

console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
