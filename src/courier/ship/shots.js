// ---------------------------------------------------------------------------------------
// THE SHOTS ON THE RAIL: everything that flies in a crossing (docs/plans/RAIL.md sections 4 and 8), kept in the RAIL'S FRAME (x across,
// y up, z along: courier/ship/views.js), so a thing at rest in it keeps pace with the ship and the eye reads only what moves against it.
//
//   gun      the psygun on the rail: a shot each sixteenth while LMB is held, 70 m/s, gone in 0.9 s
//   lance    the lock-on's: one at each painted target, turning onto it, worth four shots (RayStorm's lasers)
//   plain    a foe's shot of a feeling: of the ship's own (its polarity) it is ABSORBED, drunk; of the other it hurts; the roll's first
//            quarter second turns it aside (Ikaruga, Star Fox 64)
//   outlined   a foe's outlined shot: it wears the parry mark (vfx/parrymark.js, and nothing else does) and only the parry answers it,
//            back at whoever threw it (Sin & Punishment); sent home it downs its thrower for three times the pay
//
// Drawn by Calissa's looks (made once, at boot, parked for the warm-up: casebook 17): every shot in one instanced draw (vfx/railshots.js:
// the gun's needles, the foes' astral and umbral capsules far to near, the outlined in the parry mark's ink and film, the ship's hurtbox
// over them), the lances' ribbons (vfx/itano.js) and the telegraph marks a set piece puts on a part about to act (vfx/telegraph.js,
// `S.telegraphs.mark(target, seconds)`). Nothing here decides what a hit means: the ship (`hit`, `absorb`) and the waves (`hitAt`,
// `strike`) do.
//
// Prior art: every shmup's bullet pool (a fixed array, no allocation in the loop), Ikaruga's polarity, RayStorm's lock-on lasers that
// curve onto their targets, Star Fox 64's barrel roll, Sin & Punishment's returned shot.
//
//   const S = new Shots(game, rail)   S.build(scene)   S.gun(p, dir)   S.lance(p, foe)   S.foe(p, vel, { aspect, outlined, from })
//   S.update(dt, { ship, waves })   S.parry(at, radius) -> n   S.clear()   S.show(on)   S.parked() -> meshes (the warm-up)
//   (rail.toWorld(local, out), rail.dirWorld(local, out): the frame's map to the world)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { COLOR } from '../../progress/weather.js';
import { RailShots } from '../../vfx/railshots.js';
import { ItanoRibbons } from '../../vfx/itano.js';
import { TelegraphMarks } from '../../vfx/telegraph.js';
import { stream } from '../../core/rng.js';

const CAP = { gun: 128, lance: 48, plain: 192, outlined: 24 }; // (lances: a volley's eight and the surge's swarm, a lance at everything on the screen)
const FOE_R = 0.3, OUT_R = 0.36;
const _w = new THREE.Vector3(), _d = new THREE.Vector3(), _c3 = new THREE.Vector3();
const LANCE_COLOR = 0x9ff3ff; // (the lances' ribbons: the lock marks' colour, courier/ship/ship.js)
const rand = stream('ship/lances'); // (the simulation's chance: core/rng.js)
// the lances fly by PROPORTIONAL NAVIGATION, Itano's way (docs/plans/research/RAIL-PATTERNS.md 3): fanned out at launch, each its own
// navigation constant, the turn capped, pure pursuit at the last metres (where the sight line's rate blows up)
const LANCE = { speed: 60, fan: 14, N: [2.5, 5], turn: 9, pursue: 4, wobble: 0.6 };
const _R = new THREE.Vector3(), _V = new THREE.Vector3(), _O = new THREE.Vector3(), _A = new THREE.Vector3(), _u = new THREE.Vector3();
const pool = (n, make) => Array.from({ length: n }, make);

export class Shots {
  constructor(game, rail) {
    this.game = game; this.rail = rail;
    this.guns = pool(CAP.gun, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0 }));
    this.lances = pool(CAP.lance, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, to: null, volley: null }));
    this.plains = pool(CAP.plain, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, aspect: null, turned: false }));
    this.outlines = pool(CAP.outlined, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, from: null, back: false, mesh: null }));
  }

  /** The looks (at boot, parked hidden: their one program compiled with the warm-up). */
  build(scene) {
    this.look = new RailShots({ cap: 400, guns: CAP.gun }).build(scene); this.look.mesh.renderOrder = 60; // (the ship's own gun and hurtbox over the hull, which is over the foes' shots: ship.js OVER_SHOTS) // (400: the heaviest peak the overhaul plans, RAIL-OVERHAUL.md section 5)
    this.ribbons = new ItanoRibbons({ max: 64 }); scene.add(this.ribbons.mesh); // (a volley's eight and those still running out behind, and the surge's swarm: vfx/crossinglook.js)
    this.telegraphs = new TelegraphMarks(); scene.add(this.telegraphs.mesh);
    for (const r of this.outlines) { r.mesh = new THREE.Object3D(); r.mesh.visible = false; } // (a handle, not drawn: the look draws the outlined; mounts.js asks `s.mesh`)
    this.meshes = [this.look.mesh, this.ribbons.mesh, this.telegraphs.mesh];
    this.show(false);
  }
  parked() { return this.meshes || []; }
  show(on) { for (const m of this.meshes || []) m.visible = on; if (!on) for (const r of this.outlines) r.mesh.visible = false; }

  // ---------------------------------------------------------------- firing
  gun(p, dir) {
    const s = this.guns.find((x) => !x.on); if (!s) return null;
    const G = T.ship.shot;
    s.on = true; s.p.copy(p); s.v.copy(dir).normalize().multiplyScalar(G.speed); s.life = G.life; s.dmg = 1;
    return s;
  }
  /** A lance at a painted foe (its volley keeps the count). */
  lance(p, to, volley = null) {
    const s = this.lances.find((x) => !x.on); if (!s) return null;
    s.on = true; s.p.copy(p); s.life = 2.5; s.to = to; s.volley = volley; s.age = 0;
    const a = rand() * Math.PI * 2; s.v.set(Math.cos(a) * LANCE.fan, 6 + Math.abs(Math.sin(a)) * LANCE.fan * 0.6, 22); // (fanned: each arcs out its own way first)
    s.N = LANCE.N[0] + rand() * (LANCE.N[1] - LANCE.N[0]); s.last = to?.local ? to.local.clone() : null; s.phase = rand() * 6.28;
    this.ribbons?.start(s, this.rail.toWorld(s.p, _w), { color: LANCE_COLOR });
    return s;
  }
  /** A foe's shot: of a feeling (plain), or outlined (answered only by the parry). */
  foe(p, vel, { aspect = null, outlined = false, from = null } = {}) {
    if (outlined) {
      const r = this.outlines.find((x) => !x.on); if (!r) return null;
      r.on = true; r.p.copy(p); r.v.copy(vel); r.life = 7; r.from = from; r.back = false; r.mesh.visible = true;
      return r;
    }
    const s = this.plains.find((x) => !x.on); if (!s) return null;
    s.on = true; s.p.copy(p); s.v.copy(vel); s.life = 7; s.aspect = aspect; s.turned = false;
    return s;
  }

  /** The parry's answer at sea: every outlined shot within reach and coming on is sent back at its thrower, faster. */
  parry(at, radius = 2.4) {
    let n = 0;
    for (const r of this.outlines) {
      if (!r.on || r.back) continue;
      _d.copy(at).sub(r.p);
      if (_d.length() > radius || _d.dot(r.v) <= 0) continue;
      const sp = Math.max(r.v.length() * 1.6, 34);
      if (r.from?.alive) r.v.copy(r.from.local).sub(r.p).normalize().multiplyScalar(sp); else r.v.negate().normalize().multiplyScalar(sp);
      r.back = true; r.life = 3; n++;
    }
    return n;
  }

  // ---------------------------------------------------------------- the frame
  update(dt, { ship, waves }) {
    this.ship = ship;
    // the gun
    for (const s of this.guns) {
      if (!s.on) continue;
      s.p.addScaledVector(s.v, dt); s.life -= dt;
      if (s.life <= 0) { s.on = false; continue; }
      const f = waves?.hitAt(s.p, T.ship.shot.radius);
      if (f) { waves.strike(f, s.dmg ?? 1, { cause: 'shot', at: s.p, dir: s.v }); s.on = false; }
    }
    // the lances turn onto what they were sent at, and keep going if it is gone
    for (const s of this.lances) {
      if (!s.on) continue;
      s.life -= dt;
      s.age += dt;
      if (s.to?.alive) {
        _R.copy(s.to.local).sub(s.p); const d = _R.length();
        // the target's velocity from its last place (the foes move by their own rules: waves.js)
        _V.copy(s.to.local).sub(s.last || s.to.local).divideScalar(Math.max(dt, 1e-4)).sub(s.v); s.last = (s.last || new THREE.Vector3()).copy(s.to.local);
        const speed = Math.min(LANCE.speed, s.v.length() + 90 * dt); // (it gathers speed out of the launch)
        _u.copy(s.v).normalize();
        if (d < LANCE.pursue) _A.copy(_R).normalize().sub(_u).multiplyScalar(LANCE.turn * 2); // (pure pursuit, close in)
        else { _O.crossVectors(_R, _V).divideScalar(d * d); const Vc = -_R.dot(_V) / d; _A.crossVectors(_O, _u).multiplyScalar(s.N * Math.max(Vc, 10)); }
        const turn = Math.min(_A.length() / Math.max(speed, 1), LANCE.turn) * dt;
        if (_A.lengthSq() > 1e-8) { _A.normalize(); _u.addScaledVector(_A, Math.tan(Math.min(turn, 1.2))).normalize(); }
        if (s.age < 0.5) _u.addScaledVector(_V.set(Math.cos(s.phase + s.age * 18), Math.sin(s.phase + s.age * 18), 0), LANCE.wobble * (0.5 - s.age) * dt * 8).normalize(); // (a decaying wobble early: the circus)
        s.v.copy(_u).multiplyScalar(speed);
        if (d < (s.to.radius || 1) + 0.6) { waves.strike(s.to, T.ship.lock.lance, { cause: 'lance', at: s.p, dir: s.v, volley: s.volley }); this.endLance(s, true); continue; }
      }
      s.p.addScaledVector(s.v, dt);
      if (s.life <= 0) this.endLance(s, false);
    }
    // what the foes throw
    for (const s of this.plains) {
      if (!s.on) continue;
      s.p.addScaledVector(s.v, dt); s.life -= dt;
      if (s.life <= 0 || s.p.z < -40 || Math.abs(s.p.x) > 80) { s.on = false; continue; }
      if (s.turned || !ship) continue;
      if (s.p.distanceTo(ship.local) < (ship.hull?.hurt ?? T.ship.hurt) + FOE_R) {
        if (s.aspect && s.aspect === ship.aspect) { ship.absorb(s); s.on = false; } // (of the ship's feeling: drunk)
        else if (ship.turning) { s.turned = true; s.v.set(s.v.x * -0.4 + (s.p.x - ship.local.x) * 8, 6, -s.v.z * 0.3); ship.turned(s); } // (the roll turns it aside)
        else if (ship.hit(s)) s.on = false;
      }
    }
    for (const r of this.outlines) {
      if (!r.on) continue;
      r.p.addScaledVector(r.v, dt); r.life -= dt;
      if (r.life <= 0 || r.p.z < -40 || r.p.z > 200) { this.endOutlined(r); continue; }
      if (r.back && r.from?.alive) { _d.copy(r.from.local).sub(r.p); const sp = r.v.length(); r.v.lerp(_d.multiplyScalar(sp / Math.max(_d.length(), 0.001)), Math.min(1, dt * 6)); } // (home: Sin & Punishment's return finds its thrower)
      // (sent home: a part says what its own shot does to it, the brig's bow 6, a gill 5; else it downs its thrower)
      if (r.back) { const f = waves?.hitAt(r.p, OUT_R + 0.2); if (f) { waves.strike(f, f.returned ?? 999, { cause: 'parry', at: r.p, dir: r.v, returned: true }); this.endOutlined(r); } continue; }
      if (ship && r.p.distanceTo(ship.local) < (ship.hull?.hurt ?? T.ship.hurt) + OUT_R && ship.hit(r)) this.endOutlined(r);
    }
    this.draw();
  }
  endLance(s, hit) { this.ribbons?.end(s); s.on = false; if (s.volley) { s.volley.flown++; if (hit) s.volley.hit++; } s.to = null; s.volley = null; }
  endOutlined(r) { r.on = false; r.from = null; r.mesh.visible = false; }

  /** Each live shot placed in the world (the frame moves with the rail every frame, so every one is written every frame): a plain shot
   *  of the ship's feeling now (absorbed) is drawn in the ship's form's kind, any other in the other's (RAIL-OVERHAUL.md section 4); turned or sent home, it
   *  is drawn spent. */
  draw() {
    const R = this.rail, L = this.look, S = this.ship, raw = this.game.rawDt ?? 1 / 60, form = S?.form || 'astral', other = form === 'astral' ? 'umbral' : 'astral';
    const kindOf = (aspect) => (aspect && aspect === S?.aspect ? form : other); // (the kind it is to you now: a shot you would drink wears your form's, every other the other's: RAIL-OVERHAUL.md 4)
    let n = 0, m = 0;
    for (const s of this.guns) if (s.on) L.gun(m++, R.toWorld(s.p, _w), R.dirWorld(s.v, _d));
    for (const s of this.plains) if (s.on) L.set(n++, R.toWorld(s.p, _w), R.dirWorld(s.v, _d), kindOf(s.aspect), false, undefined, s.turned ? 0.45 : 1);
    for (const [k, r] of this.outlines.entries()) if (r.on) L.set(n++, R.toWorld(r.p, _w), R.dirWorld(r.v, _d), kindOf(r.from?.aspect), true, OUT_R, r.back ? 0.45 : 1, (k * 0.618034) % 1); // (its film's phase is its record's own: the same through its flight)
    L.count = n; L.guns = m;
    L.color(COLOR[S?.aspect] ?? 0xffc65c);
    L.hurtbox(S && this.look.mesh.visible ? R.toWorld(S.local, _c3) : null, S?.hull?.hurt ?? T.ship.hurt);
    L.update(raw, this.game.camera);
    for (const s of this.lances) if (s.on) this.ribbons.push(s, R.toWorld(s.p, _w));
    this.ribbons.update(raw); this.telegraphs.update(raw);
  }

  clear() {
    for (const L of [this.guns, this.lances, this.plains]) for (const s of L) { s.on = false; s.to = null; s.volley = null; }
    for (const r of this.outlines) this.endOutlined(r);
    this.ribbons?.clear(); this.telegraphs?.clear();
    if (this.look) this.draw();
  }
  /** How many of the foes' shots are flying (the stress test's invariant: the pools never leak). */
  get live() { return this.plains.filter((s) => s.on).length + this.outlines.filter((r) => r.on).length; }
}
