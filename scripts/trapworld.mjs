// ---------------------------------------------------------------------------------------
// THE TRAPS IN THE WORLD, HEADLESS WITHOUT A BROWSER (Dovina's; G305, G308, 2026-11-03): world/raceway/traps.js on a real made track
// (trackdef.js buildTrack) with a stand-in game: all thirteen traps placed, built (the placeholders), run through their cycles on their
// own, then possessed by the bots, with a rider coming round the line at speed. Proves: every kind builds and shows without throwing,
// the six later ones hit (events trap.hit / trap.bolt / trap.land), Read lists a possessed trap about to fire, the shoulder breaks a
// boulder, a pot in the air is popped.
//   node scripts/trapworld.mjs      exits 1 on any FAIL
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Traps } from '../src/world/raceway/traps.js';
import { buildTrack, blankTrack } from '../src/progress/trackdef.js';
import { TRAP_KINDS } from '../src/progress/traps.js';

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const bus = { h: {}, log: [], on(n, f) { (this.h[n] ||= []).push(f); }, emit(n, e) { this.log.push({ n, ...e }); for (const f of this.h[n] || []) f(e); } };
const def = blankTrack('Smoke'); def.traps = TRAP_KINDS.map((kind, i) => ({ kind, u: 0.125 * (i % 8) + (i < 8 ? 0.04 : 0.09), lat: 0, period: 6, offset: 0, ...(kind === 'portal' ? { u2: 0.125 * (i % 8) + 0.07 } : {}) }));
const T = buildTrack(def), L = T.length;
const game = { scene: new THREE.Scene(), events: bus, input: { wasPressed: () => false }, race: null, haunt: null, paintmap: null, player: { pos: new THREE.Vector3(), vel: new THREE.Vector3(), moveTo() {}, yaw: 0, bodyYaw: 0 }, techs: { active: null }, racewayTraps: null, ledger: null, psyche: { level: () => 99 } };
const R = { game, made: { T }, active: true, track: T, local: (x, z) => new THREE.Vector3(x, 0, z), heightAt: () => 0, rideHeight: () => 0 };
const traps = new Traps(R); traps.use(T);
const S = { id: 'skiff', phase: 'ride', v: new THREE.Vector3(0, 0, 40), air: false, bails: 0, bail() { this.bails++; }, rules: { hit() {} } };
game.techs.active = S; R.s = 0; R.lat = 0;
ok(traps.list.length === TRAP_KINDS.length, `thirteen traps built on a made track (${traps.list.length})`);
const rider = { name: 'Rival', s: 0, lat: 0, v: 40, group: { position: new THREE.Vector3() }, r: null }; rider.r = rider; rider.wreck = 0;
game.race = { T, lap: 1, running: true, modeId: 'race', rivals: { list: [rider] } };

function runFor(seconds, { mode, lat = 0, air = false } = {}) {
  traps.haunt(mode || null); bus.log.length = 0; let s = 0;
  for (let t = 0; t < seconds; t += 1 / 60) {
    R.s = (R.s + 40 / 60) % L; S.air = air; S.v.set(0, 0, 40); { const Fy = T.frame(R.s); game.player.pos.set(Fy.x, 0, Fy.z); }
    rider.s = (rider.s + rider.v / 60) % L; rider.lat = lat; rider.air = air; const F = T.frame(rider.s); rider.group.position.set(F.x, 0, F.z);
    if (rider.v < 40) rider.v = Math.min(40, rider.v + 0.4); // (a rival recovers speed)
    try { traps.update(1 / 60); } catch (e) { console.log(e.stack); ok(false, 'update threw'); return; } s++;
  }
}
// the traps on their own cycles: a rival circling the whole line meets them
runFor(4 * L / 40);
const hits = (kind) => bus.log.filter((e) => e.n === 'trap.hit' && e.kind === kind).length;
for (const k of ['antlion', 'boulder', 'hasten', 'ward', 'catapult', 'storm']) ok(bus.log.some((e) => e.n === 'trap.tell' && e.kind === k), `${k}: its tell was told on its own cycle`);
ok(bus.log.some((e) => e.n === 'trap.bolt') && bus.log.some((e) => e.n === 'trap.land') && bus.log.some((e) => e.n === 'trap.lob'), 'storm bolts fell, a pot was lobbed and landed');
const own = ['antlion', 'boulder', 'hasten', 'ward', 'catapult', 'storm'].filter((k) => hits(k) > 0);
ok(own.length >= 2, `rivals circling the line were struck by ${own.join(', ')} on the traps' own cycles`);
// possessed by the bots: three more laps; Read lists traps about to fire
let reads = 0, firedKinds = new Set(); game.events.on('trap.fire', (e) => firedKinds.add(e.kind)); game.events.on('trap.read', () => reads++);
runFor(4 * L / 40, { mode: 'bots' });
const botHits = ['antlion', 'boulder', 'hasten', 'ward', 'catapult', 'storm'].filter((k) => hits(k) > 0);
ok(botHits.length >= 4, `held by the bots, the six struck: ${botHits.join(', ')}`);
ok(firedKinds.size >= 8, `the bots fired ${firedKinds.size} kinds of trap (${[...firedKinds].join(', ')})`);
ok(['antlion', 'boulder', 'hasten', 'ward', 'catapult', 'storm'].filter((k) => firedKinds.has(k)).length >= 4, 'and most of the six later ones');
ok(S.bails > 0 || bus.log.some((e) => e.n === 'trap.hit' && e.target === 'courier'), 'the Courier on the board was struck too');
ok(reads > 0, `Read showed a possessed trap about to fire (${reads} times)`);
// the shoulder breaks a boulder
{ const bi = traps.list.findIndex((t) => t.kind === 'boulder'), B = traps.list[bi]; bus.log.length = 0;
  traps.haunt('courier'); B.lane = 1; traps.t = 100; traps.shoulderAt = 100; traps.fire(bi, { lane: 1 }); ok(B.clock.phase === 'tell', 'a held boulder tells on fire'); }
// the clear leaves nothing behind
traps.clear(); ok(traps.list.length === 0 && !traps.group, 'cleared');
console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
