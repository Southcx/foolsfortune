// ---------------------------------------------------------------------------------------
// THE STATUS BENCH: the combat wing's station where each status is seen landing (docs/plans/COMBAT-LAB.md section 5; the owner,
// 2026-10-11: "your roly-polies as you called them have no visible interaction"). Calissa's (the combat wing's look and Strawman's kin).
// Eleven ROLY-POLIES on the long bench by the west wall, one a status (STATUS_BENCH_ORDER: stun, halt, slow, sleep, calm, melt, doubt,
// charm, blind, confusion, soaked), its plaque hung under it. Each is a creature as Strawman is (registered with game.creatures, tagged
// `hurtable`, `training`, so every weapon's path is the real path and the ledger never hears it: tracking.js), and a lock target added
// by this room (game.lock.add). Struck by any tool it rocks on its ball (Strawman's spring: vfx/strawman.js rockStep) and takes ITS
// status for that status's real time (STATUS_BENCH_TIME: the times the game's own sources give it), through creatures.apply (the stun
// through game.stun), so the status's own aura (`aura.<status>`, vfx/auras.js) shows round it and its glyph pops over it; and its body
// shows what the status means to it (BODY: halted it freezes, asleep it leans back and breathes, melted it slumps). The first time
// each is struck in a visit the log says the status in one line (`statusbench.status { status, by }`, its rule in
// feedback/tracking/throwingroom.js; the words placeholders for Espada's). Only its own status holds: what a blow's type builds on it is
// shrugged off, so each shows one thing beside the other ten.
//
// THE LECTERN (F, a page set aside): which roly-poly is lit as the target (it warms from within), each in turn (the light moves on a
// beat after the lit one takes its status), or none.
//
// Prior art: FFXIV's striking dummies (a target that takes every debuff and shows it, never dies), the okiagari-koboshi and the Daruma
// (the roly-poly that always rights itself), Monster Hunter's training area (each status tried on a target that shows it), a shop's
// shelf of labelled samples (the plaque under each).
//
//   const B = new StatusBench(game)   B.update(dt)   B.page(im, el)   B.light(status | 'each' | null)   B.list (the eleven creatures)
//   B.lit (the lit one's status, or null)   B.each (each in turn)   STATUS_BENCH_TIME   STATUS_BENCH_WORDS
//   events: statusbench.status { status, by } (the first strike of each in a visit), statusbench.light { light, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { TR } from './layout.js';
import { statusBenchSpots } from './combatwing.js';
import { rolyPolyGeometry, rolyPolyMaterials, ROLY_POLY } from '../../vfx/combatwingkit.js';
import { rockStep } from '../../vfx/strawman.js';
import { GLYPH_TINT } from '../../vfx/figmenttelegraph/figmenttelegraphlook.js';
import { addOutline } from '../../render/outline.js';
import { PropBatch } from '../../render/propbatch.js';
import { FUNCTIONS } from '../../tools/veritome/mind/functions.js';
import { TYPES } from '../../progress/combat/types.js';
import { CASTS } from '../../progress/combat/greatjelly.js';

/** Each status's real time on a roly-poly (seconds at a Balanced mind; the Courier's Focus still widens it, as everywhere): the times
 *  the game's own sources lay it for. */
export const STATUS_BENCH_TIME = {
  stun: 4.5,                                   // (stun.js: a creature's stunFor when it names none)
  halt: FUNCTIONS.stil.base, calm: FUNCTIONS.eza.base, sleep: FUNCTIONS.husa.base, melt: FUNCTIONS.melu.base, // (the Veritome's Functions)
  slow: CASTS.gelidRings.effect.slow,          // (the Great Slip Jelly's gelid rings)
  doubt: TYPES.ego.buildDur, charm: TYPES.influence.buildDur, blind: TYPES.illusion.buildDur, confusion: TYPES.delirium.buildDur, // (built by a type)
  soaked: CASTS.crownBash.effect.soaked,       // (the crown bash's: the next hit doubled)
};
/** What each status does, in a line (the lectern's rows and the log's line; words placeholders for Espada's, CLARITY.md: a label, one
 *  line of effect, the time as a stat). */
export const STATUS_BENCH_WORDS = {
  stun: 'Reels, open to what a mind would refuse. Impact builds it.',
  halt: 'Stops where it is.',
  slow: 'Moves and winds up slower.',
  sleep: 'Does nothing until struck or the time runs out.',
  calm: 'Will not attack, though it still follows.',
  melt: 'Pools into a puddle that harms nothing.',
  doubt: 'Hesitates: slower to wind up, weaker when it does. Ego builds it.',
  charm: 'Will not attack, and warms to you. Influence builds it.',
  blind: 'Cannot see. Illusion builds it.',
  confusion: 'Cannot keep a course. Delirium builds it.',
  soaked: 'The next hit lands double.',
};
/** What a status means to a roly-poly's body: `rate` its spring's clock (0 frozen; from `after` seconds into it), `damp` x its damping, `want` the lean it rests in
 *  (radians about x and z, from its time `t`, its place `p` and the Courier's `c`), `squash` its height. */
const BODY = {
  halt: { rate: 0, after: 0.18 }, // (the blow rocks it, then it stops where it is: a halted thing frozen mid-rock)
  slow: { rate: 0.3 },
  sleep: { rate: 0.4, want: (t) => [-0.28 + 0.04 * Math.sin(t * 1.6), 0] },
  calm: { damp: 4 },
  melt: { squash: 0.55 },
  stun: { want: (t) => [0.2 * Math.cos(t * 5), 0.2 * Math.sin(t * 5)] },
  charm: { want: (t, p, c) => { const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz) || 1; return [0.22 * dz / d, -0.22 * dx / d]; } },
  blind: { want: (t) => [0, 0.14 * Math.sin(t * 1.3)] },
  confusion: { want: (t) => [0.2 * Math.sin(t * 3.1), 0.2 * Math.sin(t * 4.7 + 1)] },
};
const VISIT_R = 10, LECTERN_REACH = 1.8, EACH_BEAT = 1.2, REST_FRAMES = 20;
const _v = new THREE.Vector3(), _w = new THREE.Vector2();

export class StatusBench {
  constructor(game) {
    this.game = game;
    const g = game, mats = rolyPolyMaterials(), geo = rolyPolyGeometry();
    this.batch = new PropBatch(g.scene, { maxInstances: 16, maxVertices: 4096 }); // (at rest the eleven are one draw and its outline's)
    this.list = statusBenchSpots().map(({ status, x, y, z }) => this.make(status, x, y, z, geo, mats.rest));
    this.lit = null; this.each = true; this.eachT = 0; this.said = new Set(); this.inVisit = false;
    this.light('each', false);
    const [lx, lz] = TR.wing.statusBench.lectern;
    g.interact?.add('statusbench.lectern', (P) => {
      const d = Math.hypot(P.pos.x - lx, P.pos.z - lz);
      return d < LECTERN_REACH && Math.abs(P.pos.y - TR.strawman.y) < 1.2 ? { pos: new THREE.Vector3(lx, 1.45, lz), d } : null;
    });
  }

  /** One roly-poly: its body (one mesh and its outline, parked at rest), its collider, the creature, the lock target. */
  make(status, x, y, z, geo, mat) {
    const g = this.game, base = new THREE.Vector3(x, y, z), H = ROLY_POLY.height;
    const mesh = new THREE.Mesh(geo, mat); mesh.name = `rolyPoly.${status}`; mesh.userData.zone = 'throwingRoom';
    mesh.position.set(x, y + ROLY_POLY.pivot, z); mesh.rotation.order = 'XZY'; mesh.castShadow = true;
    addOutline(mesh); g.scene.add(mesh);
    const self = this, R = {
      type: 'creature', kind: 'rolypoly', name: 'roly-poly', training: true, benchStatus: status,
      pos: base, radius: ROLY_POLY.radius, height: H, auraScale: 1, alive: true, // (its aura drawn as a metre-high body's: read from the striker's place) yaw: Math.PI / 2, mindRest: 0,
      poise: status === 'stun' ? 1 : Infinity, stunFor: STATUS_BENCH_TIME.stun, // (only the stun's roly-poly is ever stunned)
      tags: new Set(['hurtable']),
      mesh, a: new THREE.Vector2(), av: new THREE.Vector2(), t: (z * 1.7) % 6.28, // (each its own phase, from where it sits)
      rest: 0, parked: null, squash: 1, beat: 0,
      center: (out = new THREE.Vector3()) => out.set(x, y + H * 0.47, z),
      head: () => new THREE.Vector3(x, y + H * 0.85, z),
      knock() {}, vanish() {},
      hurt(point, dir, power, cause, by = 'courier') { self.struck(R, point, dir, power, by); },
      onStatus(name) { if (name !== status) R.status.delete(name); }, // (only its own status holds: a type's build shrugged off)
    };
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.capsule(0.13, ROLY_POLY.radius - 0.02).setTranslation(x, y + 0.27, z).setCollisionGroups(GROUPS.static));
    g.physics.register(col, R);
    g.creatures?.add(R);
    g.lock?.add(R);
    return R;
  }

  /** A blow on a roly-poly: it rocks away from it (double on a soaked one, and the soak is spent), and takes its status at its time. */
  struck(R, point, dir, power, by) {
    const g = this.game, from = g.player?.pos;
    R.mind = 0; R.build = {}; // (a Balanced mind every blow, so each status holds its real time; nothing builds toward another)
    const soaked = (R.status.get('soaked')?.t ?? 0) > 0 && R.benchStatus === 'soaked' && R.beat > 0.3;
    const k = Math.min(2, 0.5 + power) * (soaked ? 2 : 1);
    if (dir) _v.copy(dir); else if (from) _v.set(R.pos.x - from.x, 0, R.pos.z - from.z); else _v.set(1, 0, 0);
    _v.y = 0; if (_v.lengthSq() < 1e-6) _v.set(1, 0, 0); _v.normalize();
    R.av.x += _v.z * 3.2 * k; R.av.y -= _v.x * 3.2 * k; // (a push along +z tips it about x, its top toward +z: Strawman's rock)
    if (soaked) R.status.delete('soaked'); // (the next hit doubled, and then dry)
    const s = R.benchStatus, dur = STATUS_BENCH_TIME[s];
    const landed = s === 'stun' ? g.stun?.add(R, Infinity, { by, cause: 'statusbench' }) : soaked ? false : g.creatures?.apply(R, s, dur, 1, by);
    if (landed) {
      R.beat = 0;
      if (s !== 'stun') g.glyphs?.pop(`status.${s}`, _v.set(R.pos.x, R.pos.y + R.height + 0.15, R.pos.z), { color: GLYPH_TINT[s] ?? 0xffffff, size: 0.45, life: 1.1, float: 0.35 });
    }
    if (!this.said.has(s)) { this.said.add(s); g.events?.emit('statusbench.status', { status: s, dur: +(R.status.get(s)?.t ?? dur).toFixed(1), by }); }
    if (this.each && this.lit === s) this.eachT = EACH_BEAT;
  }

  /** Light a roly-poly as the target (`status`), each in turn (`'each'`), or none (null). */
  light(which, say = true) {
    this.each = which === 'each';
    this.lit = this.each ? this.list[0].benchStatus : which || null;
    this.eachT = 0;
    this.paint();
    if (say) this.game.events?.emit('statusbench.light', { light: which || 'none', by: 'courier' });
  }
  paint() { const M = rolyPolyMaterials(); for (const R of this.list) { const m = R.benchStatus === this.lit ? M.lit : M.rest; if (R.mesh.material !== m) R.mesh.material = m; } }

  update(dt) {
    const g = this.game, P = g.player; if (!P) return;
    if (g.interact?.cur?.id === 'statusbench.lectern' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      g.course?.menu?.showPage?.('the status bench', (im, el) => this.page(im, el), { title: 'THE STATUS BENCH', sub: 'click a target · F closes', aside: 'left' });
    }
    // a visit: the Courier within reach of the bench; leaving it, each status is said again the next time
    const B = TR.wing.statusBench, near = Math.hypot(P.pos.x - B.x, P.pos.z - (B.z0 + B.z1) / 2) < VISIT_R && Math.abs(P.pos.y - B.h) < 4;
    if (!near && this.inVisit) this.said.clear();
    this.inVisit = near;
    // each in turn: a beat after the lit one takes its status, the light moves on
    if (this.each && this.eachT > 0 && (this.eachT -= dt) <= 0) {
      const i = this.list.findIndex((R) => R.benchStatus === this.lit);
      this.lit = this.list[(i + 1) % this.list.length].benchStatus; this.paint();
    }
    for (const R of this.list) this.body(R, dt, P.pos);
  }

  /** A roly-poly's body: its spring, at its status's clock, toward the lean its status rests in; parked when it is still. */
  body(R, dt, c) {
    R.t += dt; R.beat += dt;
    const s = R.benchStatus, on = (R.status.get(s)?.t ?? 0) > 0 || (s === 'stun' && this.game.stun?.stunned(R)), B = on ? BODY[s] || {} : {};
    const sdt = dt * (R.beat < (B.after ?? 0) ? 1 : B.rate ?? 1);
    const want = B.want ? B.want(R.t, R.pos, c) : [0, 0];
    _w.set(want[0], want[1]);
    R.a.sub(_w); rockStep(R.a, R.av, sdt, undefined, 3.2 * (B.damp ?? 1)); R.a.add(_w);
    R.squash += ((B.squash ?? 1) - R.squash) * (1 - Math.exp(-dt * 3));
    const m = R.mesh, moving = R.av.lengthSq() > 1e-5 || Math.abs(R.a.x - m.rotation.x) > 1e-4 || Math.abs(R.a.y - m.rotation.z) > 1e-4 || Math.abs(R.squash - m.scale.y) > 1e-3;
    const lit = m.material !== rolyPolyMaterials().rest;
    if (moving || lit) {
      if (R.parked) { this.batch.unpark(R.parked); R.parked = null; }
      m.rotation.set(R.a.x, 0, R.a.y); m.scale.set(1 + (1 - R.squash) * 0.6, R.squash, 1 + (1 - R.squash) * 0.6);
      R.rest = 0;
    } else if (!R.parked && ++R.rest > REST_FRAMES) R.parked = this.batch.park(m, 'throwingRoom');
  }

  /** The lectern's page: each in turn, the eleven, none. */
  page(im, el) {
    const menu = this.game.course?.menu;
    im.appendChild(el('div', 'grp', 'TARGET · The lit roly-poly is the one to strike'));
    const grid = el('div', 'rooms');
    const row = (which, label, line) => {
      const on = which === 'each' ? this.each : !this.each && which === this.lit;
      const r = el('div', 'room', `<span class="n">${on ? '●' : '○'}</span><span><b>${label}</b><s>${line}</s></span>`);
      r.onclick = () => { menu?.close(); this.light(which); };
      grid.appendChild(r);
    };
    row('each', 'Each in turn', 'The light moves on after each takes its status.');
    for (const R of this.list) { const s = R.benchStatus; row(s, `${s[0].toUpperCase() + s.slice(1)} · ${STATUS_BENCH_TIME[s]} s`, STATUS_BENCH_WORDS[s]); }
    row(null, 'None', 'No roly-poly lit: strike any.');
    im.appendChild(grid);
  }
}
