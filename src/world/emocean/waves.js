// ---------------------------------------------------------------------------------------
// THE WAVES: what comes at the ship in a crossing, from the score's wave table (progress/rail/crossing.js script().waves: each wave's
// bar, role, class, count, formation and lane; Dovina's), in the RAIL'S FRAME (x across, y up, z along: courier/ship/views.js).
//
//   school   the small fry in a formation: a LINE (eight across: one sweep of the lock-on), a VEE, a PINCER (from both flanks at once,
//            one feeling a side: the polarity lesson, drawn from above), a RING; a stray shot of its feeling now and then
//   darter   one class up: dashes across the lanes and spits OUTLINED shots at the camera (the parry lesson: V sends them home)
//   heavy    two classes up: comes ahead and holds, soaking blows, a fan of shots of its feeling each bar and an outlined one each other
//
// THE ROSTER (progress/rail/showcase.js ROSTER, Dovina's; RAIL-MODULES.md 6): a wave of any of its roles keeps its role, so a pattern
// thrown `from` that role finds it; it is drawn by its own body (vfx/railfoes.js railFoeBody, Calissa's: a hit's flash, the windup's
// tell, its death read in 0.55 real s), and it moves and fires by its role's row below, or the school's where it has none yet; what
// it does beyond that is its mechanic (world/emocean/foemechanics.js: the escort's shield, the gunship's guns, the blocker's weak point,
// the spawner's hatch, the grappler's latch). A wave laid `from` a role comes out of that foe, or not at all once it is down. A blow a
// mechanic turns aside reads as a glance (`glance`: the resist mark, `rail.glance`).
//
// Each foe is a creature (creatures/creatures.js: tagged hurtable, registered, struck only through `creatures.strike`), so the gun
// is a weapon like any other and the creatures' services (the windup, the statuses) are there when the set pieces want them. Each
// keeps its place in the rail's frame (`local`) and its world place (`pos`) for the services. Its feeling is its wave's (alternating,
// and the pincer's two flanks opposite), for Ikaruga's chains. Everything enters and fires on the music's grid (Rez): a wave on its
// bar, a shot on a bar or a sixteenth; a wave more than a bar late (the game was paused while the cue played on) is let go, not
// heaped.
//
// THE ROLL: a set piece's parts are foes on this same roll (`add`): a fish of the shoal, a gill, a gunport, a boarder. Each moves itself
// (`tick`), may be drawn by its set piece's look (no mesh of its own), pays its own way (`pay`, else its class), may stand outside the
// chain (`chain: false`: a shoal's fish are one body) and the medal's count (`count: false`), and may take a blow at a share (`armour`:
// a shut gill takes none). One roll, so the gun, the lock-on, the parry's return and the score never ask what a thing is.
//
// Prior art: the shmup's wave table and its formations (Galaga's swoops, Gradius's lines, Star Fox 64's flights of four), Ikaruga's
// two colours, Sin & Punishment's thrown things you send back, R-Type's big slow ship that soaks a beam.
//
//   const W = new Waves(game, rail)   W.build(scene)   W.begin(plan, aspect)   W.update(dt, { bar, ship, shots })   W.end()
//   W.foes (alive)   W.hitAt(local, r) -> foe | null   W.strike(foe, power, { cause, at, dir, returned, volley })
//   W.add({ kind, name, cls, aspect, local, radius, hp, tick(dt, f, ctx) -> false when gone, mesh?, pay?, chain?, count?, lock?, armour?(f),
//          onHurt?(f, power), onDown?(f) })   (a set piece's part, on the roll)
//   W.onDown(foe, { returned, volley, by })   (the stage's: the score)   W.onSpawn(n)   W.HP   W.tellOf(foe) -> 0..1 (the stage's: its windup)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OPPOSITE } from '../../progress/weather.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { CRUISE } from '../../courier/ship/views.js'; // (a foe drawn from above flies at the ship's cruise height, so the gun's plane meets it)
import { railFoeBody, RAIL_FOE_ROLES, RAIL_FOE_SIZE } from '../../vfx/railfoes.js';
import { FOE_MECHANICS } from './foemechanics.js';
import { foeMove, scrollOf, viewFrame } from './foemoves.js';
import { CARRIER_AT } from '../../progress/rail/legs.js';
import { Swarm } from './swarm.js';
import { ROSTER } from '../../progress/rail/showcase.js';

/** Shots to down a foe by class (Guppy, Barracuda, Marlin, Whale, Leviathan: about three times a class, as their pay is). */
export const HP = [1, 3, 12, 40, 150];
const SIZE = 1.8; // (the bodies drawn larger than life: at 480 lines and 60 m a fish must still read as one)
/** How each role moves and fires on its own (a roster role with no row moves as a school and fires only what its leg schedules). */
const ROLES = {
  school: { radius: 0.8, speed: 16, fire: 0.18, shot: 18 },
  darter: { radius: 0.9, speed: 24, fire: 0.5, shot: 20 },
  heavy:  { radius: 2.4, speed: 18, fire: 1, shot: 16 },
};
const _w = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3();
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** Where a formation's member is, t real seconds after it entered (rail frame), or false once it has gone by. */
const PATHS = {
  line: (t, i, n, L, out) => { const z = 100 - 16 * t; out.set(L * 6 + (i - (n - 1) / 2) * 2.2 + Math.sin(t * 1.3 + i * 0.5), 3.4 + Math.sin(t * 2 + i) * 0.35, z); return z > -18; },
  vee: (t, i, n, L, out) => { const k = Math.abs(i - (n - 1) / 2); const z = 100 + k * 2.6 - 16 * t; out.set(L * 6 + (i - (n - 1) / 2) * 2.4, 3.6 + k * 0.5, z); return z > -18; },
  pincer: (t, i, n, L, out) => { const s = i % 2 ? 1 : -1, k = i >> 1; out.set(s * (40 - 11 * t), CRUISE, 34 + k * 5 - 2.5 * t); return Math.abs(out.x) < 44 || t < 2; },
  ring: (t, i, n, L, out) => { const a = (i / n) * Math.PI * 2 + t * 0.9, r = 9 - Math.min(5, t * 0.6); const z = 90 - 14 * t; out.set(L * 3 + Math.cos(a) * r, 3.6 + Math.sin(a) * r * 0.6, z); return z > -18; },
  dash: (t, i, n, L, out) => { const s = i % 2 ? 1 : -1, leave = Math.max(0, t - 10 * BAR_S); out.set(s * 13 * Math.cos(t * 0.85 + i * 1.7), 2.6 + (i % 3) * 1.4 + Math.sin(t * 1.4 + i) * 0.8, 30 + 7 * Math.sin(t * 0.45 + i) + leave * leave * 6); return out.z < 140; },
  hold: (t, i, n, L, out) => { const arrive = smooth(t / 3), leave = Math.max(0, t - 14 * BAR_S); out.set(L * 4 + Math.sin(t * 0.6) * 3, 4.2 + Math.sin(t * 0.9) * 0.8, 120 - 92 * arrive + leave * leave * 5); return out.z < 160; },
};
/** The formations in a plane view (overhead, side): the same shapes laid in its play plane (RAIL-FLOW.md 1, law 4), across it and along
 *  the scroll, through the view's frame (foemoves.js viewFrame), so every member flies where the gun shoots. `a` is across (-1..1),
 *  `s` along the scroll (1 the far edge it enters at, 0 the near edge it leaves by); each comes in from beyond the far edge on a curve
 *  over its first bar (law 3: Galaga's entrance), crosses in `CROSS_S` real s, and is gone past the near edge. Chase, free and astern
 *  keep PATHS above (their play plane is the screen and the scroll comes at it). */
const CROSS_S = 4.5;
function planePath(form, view) {
  const P = viewFrame(view), B = (CARRIER_AT[view] || CARRIER_AT.chase).box, side = view === 'side';
  const across = side ? (B.y[1] - B.y[0]) / 2 : B.x, along = B.z[1] - B.z[0]; // (half the frame across, and its length along the scroll, m)
  const at = (a, sv, out) => out.copy(side ? P(2 * sv - 1, (a + 1) / 2) : P(a, sv));
  const run = (t) => 1.15 - (1.3 * t) / CROSS_S, bow = (t, k) => k * 0.3 * (1 - smooth(t / BAR_S)); // (the scroll's run, and the entrance's curve)
  const F = {
    line: (t, i, n, L, out) => { const sv = run(t), k = i - (n - 1) / 2; at(L * 0.3 + (k * 2.2) / across + Math.sin(t * 1.3 + i * 0.5) * 0.03 + bow(t, L < 0 ? -1 : 1), sv, out); return sv > -0.15; },
    vee: (t, i, n, L, out) => { const k = i - (n - 1) / 2, sv = run(t) + (Math.abs(k) * 1.8) / along; at(L * 0.3 + (k * 2.4) / across + bow(t, L < 0 ? -1 : 1), sv, out); return sv > -0.15; },
    pincer: (t, i, n, L, out) => { const sd = i % 2 ? 1 : -1, k = i >> 1, u = t / CROSS_S; at(sd * (1.35 - 2.7 * u), 0.62 + (k * 4) / along - 0.1 * u, out); return u < 1 || t < 2; },
    ring: (t, i, n, L, out) => { const c = run(t) + 0.1, r = 5 - Math.min(2, t * 0.4), g = (i / n) * Math.PI * 2 + t * 0.9; at(L * 0.25 + (Math.cos(g) * r) / across + bow(t, 1), c + (Math.sin(g) * r) / along, out); return c > -0.3; },
  };
  return F[form] || F.line;
}

export class Waves {
  constructor(game, rail) {
    this.game = game; this.rail = rail;
    this.foes = []; this.plan = null; this.next = 0; this.idx = 0;
    this.onDown = null; this.onSpawn = null; this.onLeave = null; this.tellOf = null;
    this.dying = []; this.swarms = []; // (the swarms in flight: swarm.js)
  }

  build(scene) {
    this.scene = scene;
    // (one body parked hidden, its tether and bubble with it, so the bodies' two programs are compiled with the warm-up and never on a
    // wave's first bar: the stage's parked(), main.js; Calissa's prewarmRailFoes does the same)
    const b = this.parkedBody = railFoeBody('escort', 'mirth'); b.link.target = b.object; b.update(0);
    this.parked = new THREE.Group(); this.parked.add(b.object, b.link.object); this.parked.visible = false; this.parked.userData.zoneFree = true;
    this.parked.traverse((o) => { o.frustumCulled = false; }); scene.add(this.parked);
  }

  /** A crossing begins: its waves, and the ship's feeling (the waves alternate it and its opposite). */
  begin(plan, aspect = 'mirth') {
    this.end();
    this.plan = plan; this.aspect = aspect; this.next = 0; this.idx = 0;
    this.waves = [...(plan?.waves || [])].sort((a, b) => a.bar - b.bar);
  }
  end() {
    for (const s of this.swarms) s.dispose(); this.swarms.length = 0;
    for (const f of this.foes) this.gone(f);
    for (const f of this.dying) this.bury(f);
    this.foes.length = 0; this.dying.length = 0; this.waves = []; this.plan = null;
  }

  // ---------------------------------------------------------------- the frame
  update(dt, ctx) {
    const { bar, ship, shots } = ctx; this.ship = ship; this.view = ctx.view || this.view; // (the view a new foe's move is laid in: foemoves.js)
    // waves enter on their bars (one more than a bar late: let go)
    while (this.waves && this.next < this.waves.length && this.waves[this.next].bar <= bar) {
      const w = this.waves[this.next++];
      if (bar - w.bar <= 1) this.spawn(w, this.idx);
      this.idx++;
    }
    const sixteenth = Math.floor(bar * 16);
    for (const s of this.swarms) s.step(dt); // (a swarm's flock flies before its members read where they are)
    for (let i = this.foes.length - 1; i >= 0; i--) {
      const f = this.foes[i];
      f.t += dt; f.hitT = Math.max(0, f.hitT - dt);
      if (f.tick) { // (a set piece's part moves itself)
        if (f.tick(dt, f, ctx) === false) { this.leave(f); this.foes.splice(i, 1); continue; }
        this.rail.toWorld(f.local, f.pos);
        if (f.mesh) f.mesh.position.copy(f.pos);
        continue;
      }
      _p.copy(f.local);
      if (!f.pinned) { if (!f.path(f.t, f.i, f.n, f.lane, f.local)) { this.leave(f); this.foes.splice(i, 1); continue; } if (f.shift) f.local.add(f.shift); }
      if (f.mech?.tick && f.mech.tick(this, f, dt, ctx) === false) { this.foes.splice(i, 1); if (f.burst) this.gone(f, true); else this.leave(f); continue; } // (a burst: its death read, unpaid)
      this.rail.toWorld(f.local, f.pos);
      // face the way it moves against the rail (what the eye, riding the rail, reads)
      _d.copy(f.local).sub(_p); this.rail.dirWorld(_d, _w);
      if (_w.lengthSq() > 1e-8) f.mesh.lookAt(_w.add(f.pos));
      f.mesh.position.copy(f.pos);
      if (f.body) { f.body.tell(Math.max(this.tellOf?.(f) ?? 0, f.hatch || 0, f.glow || 0)); f.body.update(dt); }
      this.fire(f, bar, sixteenth, ship, shots);
    }
    // the downed, their death read where they fell in the rail's frame, then put away
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const f = this.dying[i]; this.rail.toWorld(f.local, f.pos); f.mesh.position.copy(f.pos);
      if (f.body.update(dt) === false) { this.bury(f); this.dying.splice(i, 1); }
    }
    for (let i = this.swarms.length - 1; i >= 0; i--) { const s = this.swarms[i]; s.draw(); if (s.done) { s.dispose(); this.swarms.splice(i, 1); } }
    this.lastSixteenth = sixteenth;
  }

  /** Fire on the grid: a school's stray shot on a bar line, a darter's outlined shot every other bar, a heavy's fan each bar. */
  fire(f, bar, sixteenth, ship, shots) {
    if (this.quiet || !ship || !shots || sixteenth === this.lastSixteenth) return; // (quiet: a passage's leg, its schedule the only source of shots)
    const b = Math.floor(bar), onBar = sixteenth % 16 === (f.off % 16);
    if (!onBar || b === f.lastBar || f.t < 1.2 || f.local.z < 6 || f.local.z > 70) return;
    f.lastBar = b;
    const R = f.R, at = () => _d.copy(ship.local).sub(f.local).normalize().multiplyScalar(R.shot);
    if (f.role === 'school') { if (this.rand() < R.fire * (f.form === 'pincer' ? 3 : 1)) shots.foe(f.local, at(), { aspect: f.aspect, from: f }); }
    else if (f.role === 'darter') { if ((b + f.i) % 2 === 0) shots.foe(f.local, at(), { outlined: true, from: f }); }
    else if (f.role === 'heavy') {
      const base = at().clone();
      for (let k = -2; k <= 2; k++) shots.foe(f.local, _p.copy(base).applyAxisAngle(_w.set(0, 1, 0), k * 0.16), { aspect: f.aspect, from: f });
      if (b % 2 === 0) shots.foe(f.local, at().multiplyScalar(1.15), { outlined: true, from: f });
    }
  }
  /** The day's dice for a stray shot (the same crossing, the same strays: core/rng would do, but this is the rail's own little LCG). */
  rand() { this.seed = (Math.imul(this.seed ?? 0x9e3779b1, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }

  // ---------------------------------------------------------------- the foes
  spawn(w, wi) {
    if (ROSTER[w.role]?.moves?.kind === 'flock') { const cls = Math.max(0, Math.min(4, w.cls ?? 0)); this.swarms.push(new Swarm(this, { ...w, hp: HP[cls] * (ROSTER[w.role].hp ?? 1) }, wi)); return; } // (a swarm: one flock, one draw call: swarm.js)
    let src = null, at = null; // (a wave laid `from` a role: out of the nearest live one of it, its hatch opening; none alive, it never comes)
    if (w.from) { for (const f of this.foes) if (f.alive && f.role === w.from && (!src || f.local.z < src.local.z)) src = f; if (!src) return; src.hatch = 1; at = src.local; }
    const plane = this.view === 'above' || this.view === 'side', look = RAIL_FOE_ROLES.includes(w.role) ? w.role : 'school', moves = ROLES[look] ? look : 'school', R = ROLES[moves];
    const path = plane ? planePath(w.formation, this.view) : PATHS[w.formation] || PATHS.line; // (in a plane view, laid in its play plane)
    const A = this.aspect, B = OPPOSITE[A] || A, k = look === 'school' ? 1 + 0.25 * w.cls : 1;
    const radius = ROLES[look] ? SIZE * R.radius * k : SIZE * 0.45 * (RAIL_FOE_SIZE[look] || 2); // (a roster body's own length where its role has no row)
    for (let i = 0; i < w.count; i++) {
      const aspect = w.formation === 'pincer' ? (i % 2 ? B : A) : (wi % 2 ? B : A);
      const body = railFoeBody(look, aspect), mesh = body.object; mesh.userData.zoneFree = true;
      mesh.scale.setScalar(SIZE * k);
      this.scene.add(mesh);
      const f = this.make({
        kind: `rail.${look}`, name: look === 'school' ? 'a fish of the school' : `a ${look.replace('-', ' ')}`,
        role: look, cls: w.cls, aspect, radius, hp: HP[Math.max(0, Math.min(4, w.cls))] * (ROSTER[look]?.hp ?? 1), mesh,
      });
      Object.assign(f, { form: w.formation, i, n: w.count, lane: w.lane ?? 0, off: (i * 5 + wi * 3) % 16, path, R, body, mech: FOE_MECHANICS[look] || null, boss: !!w.boss && ROSTER[look]?.moves?.until === 'beaten' });
      if (ROSTER[look]?.moves) f.path = foeMove(ROSTER[look].moves, { view: this.view, i, lane: f.lane, W: this, f }) || path; // (its row's move, laid in the view it entered in)
      f.path(0, i, w.count, f.lane, f.local); if (at) { f.shift = at.clone().sub(f.local); f.local.copy(at); }
      this.rail.toWorld(f.local, f.pos); mesh.position.copy(f.pos);
      this.game.creatures?.add(f);
      this.foes.push(f);
      f.mech?.spawn?.(this, f, w);
    }
    this.onSpawn?.(w.count, w);
  }

  /** One foe of a role set down at a point (rail frame), scrolling with the world from there (as a turret does: `onScreen` bars in the
   *  frame): a mine dropped (foemechanics.js). */
  spawnAt(role, local, { aspect = this.aspect, cls = 0, hp = 1, pay, count = true, onScreen = ROSTER.turret?.moves?.onScreen ?? 3 } = {}) {
    const scroll = scrollOf(this.view, onScreen);
    const body = railFoeBody(role, aspect), mesh = body.object, start = local.clone(); mesh.userData.zoneFree = true; mesh.scale.setScalar(SIZE); this.scene.add(mesh);
    const f = this.make({ kind: `rail.${role}`, name: `a ${role}`, role, cls, aspect, radius: SIZE * 0.45 * (RAIL_FOE_SIZE[role] || 1), hp: HP[Math.max(0, Math.min(4, cls))] * hp, mesh, ...(pay != null ? { pay } : {}), ...(count ? {} : { count: false }) });
    Object.assign(f, { i: 0, n: 1, lane: 0, off: 0, R: ROLES.school, body, mech: FOE_MECHANICS[role] || null, path: (t, i, n, L, out) => { out.copy(start); out.z -= t * scroll; return t < 20; } });
    f.local.copy(start); this.rail.toWorld(f.local, f.pos); mesh.position.copy(f.pos);
    this.game.creatures?.add(f); this.foes.push(f); if (count) this.onSpawn?.(1, null);
    f.mech?.spawn?.(this, f, null);
    return f;
  }

  /** A foe as a creature (creatures/creatures.js's contract: hurtable, struck only through `creatures.strike`). */
  make(spec) {
    const waves = this;
    const f = {
      type: 'creature', role: spec.role || 'part', cls: 0, aspect: null, t: 0, lastBar: -1, hitT: 0, height: (spec.radius || 1) * 2,
      local: new THREE.Vector3(), pos: new THREE.Vector3(), alive: true, tags: new Set(['hurtable']), poise: 1e6, mesh: null, last: null,
      hurt(point, dir, power) {
        if (!this.alive) return;
        const k = this.armour ? this.armour(this) : 1; if (k <= 0) { waves.glance(this); return; } // (a shut gill, a closed port, a shield: the blow glances off)
        this.hp -= power * k; this.hitT = 0.08; this.body?.hit(); this.onHurt?.(this, power * k);
        if (this.hp <= 0) { this.alive = false; waves.down(this); }
      },
      center(out = new THREE.Vector3()) { return out.copy(this.pos); },
      head() { return this.pos.clone(); },
      vanish() { if (this.alive) { this.alive = false; waves.down(this); } },
    };
    const { local, ...rest } = Object.getOwnPropertyDescriptors(spec);
    Object.defineProperties(f, rest); // (descriptors, not a spread: a part's getters, `solid`, `lock`, stay live)
    if (local) f.local = spec.local.clone();
    return f;
  }
  /** A set piece's part onto the roll (see the header). */
  add(spec) {
    const f = this.make(spec);
    this.rail.toWorld(f.local, f.pos); if (f.mesh) { f.mesh.userData.zoneFree = true; if (!f.mesh.parent) this.scene.add(f.mesh); f.mesh.position.copy(f.pos); }
    this.game.creatures?.add(f);
    this.foes.push(f);
    if (f.count !== false) this.onSpawn?.(1, null);
    return f;
  }
  /** Take a part off the roll without a down (its set piece is over: the brig sails off, the shoal sinks). */
  drop(f) { const i = this.foes.indexOf(f); if (i >= 0) this.foes.splice(i, 1); this.leave(f); }

  /** A blow on a foe, through the creatures' one door (so its look, its sound and its numbers are the game's own). */
  strike(f, power, { cause = 'shot', at = null, dir = null, returned = false, volley = null, by = 'courier' } = {}) {
    if (!f?.alive) return false;
    f.last = { returned, volley, cause, by };
    if (at) this.rail.toWorld(at, _p); else _p.copy(f.pos);
    if (dir) this.rail.dirWorld(dir, _d).normalize(); else _d.set(0, 0, 1);
    return this.game.creatures ? this.game.creatures.strike(f, _p.clone(), _d.clone(), power, cause, by) : (f.hurt(_p, _d, power), true);
  }
  down(f) {
    const i = this.foes.indexOf(f); if (i >= 0) this.foes.splice(i, 1);
    f.onDown?.(f);
    this.onDown?.(f, { returned: !!f.last?.returned, volley: f.last?.volley || null, by: f.last?.by || 'courier' });
    this.gone(f, true);
  }
  leave(f) { f.alive = false; this.onLeave?.(f); this.gone(f); }
  /** A blow turned aside (armour 0): the resist mark where it struck and `rail.glance` for its sound, a fifth of a real second apart. */
  glance(f) {
    const now = performance.now(); if (now - (f.glanceAt ?? -1e9) < 200) return; f.glanceAt = now;
    this.game.glyphs?.pop?.('ward', f.pos.clone(), { color: 0xffffff, size: 1.4, life: 0.6, float: 0.3, burst: true, ring: true });
    this.game.events?.emit('rail.glance', { role: f.role, by: f.last?.by || 'courier' });
  }
  /** Off the roll: a body downed reads its death first (`dying`, put away by update), anything else at once. */
  gone(f, died = false) {
    f.alive = false; this.game.creatures?.remove(f); f.onGone?.(f);
    if (died && f.body && this.plan) { f.body.down(); this.dying.push(f); return; }
    this.bury(f);
  }
  bury(f) { if (f.body) { f.body.dispose(); f.body = null; } else if (!f.keepMesh) f.mesh?.parent?.remove(f.mesh); }

  /** The first foe whose body a point (rail frame) is inside, with a margin r (a part that is `solid: false` lets shots through). */
  hitAt(p, r = 0.3) {
    for (const f of this.foes) if (f.alive && f.solid !== false && f.local.distanceTo(p) < f.radius + r) return f;
    return null;
  }
  /** Every live foe within r of a point (rail frame): the toll's ring, the gulp's cone, the brush's fan ask this. */
  within(p, r) { return this.foes.filter((f) => f.alive && f.local.distanceTo(p) < r + f.radius); }
}
