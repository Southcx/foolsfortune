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
// Drawn as instanced meshes (one draw each), the outlined as a small pool of marked meshes (the mark is a shell per mesh: made once,
// at boot, never on first need: casebook 17). Nothing here decides what a hit means: the ship (`hit`, `absorb`) and the waves (`hitAt`,
// `strike`) do.
//
// Prior art: every shmup's bullet pool (a fixed array, no allocation in the loop), Ikaruga's polarity, RayStorm's lock-on lasers that
// curve onto their targets, Star Fox 64's barrel roll, Sin & Punishment's returned shot.
//
//   const S = new Shots(game, rail)   S.build(scene)   S.gun(p, dir)   S.lance(p, foe)   S.foe(p, vel, { aspect, outlined, from })
//   S.update(dt, { ship, waves })   S.parry(at, radius) -> n   S.clear()   S.show(on)
//   (rail.toWorld(local, out), rail.dirWorld(local, out): the frame's map to the world)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { COLOR } from '../../progress/weather.js';

const CAP = { gun: 128, lance: 16, plain: 192, outlined: 24 };
const FOE_R = 0.3, OUT_R = 0.36;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Color();
const Z = new THREE.Vector3(0, 0, 1);
const pool = (n, make) => Array.from({ length: n }, make);

export class Shots {
  constructor(game, rail) {
    this.game = game; this.rail = rail;
    this.guns = pool(CAP.gun, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0 }));
    this.lances = pool(CAP.lance, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, to: null, volley: null }));
    this.plains = pool(CAP.plain, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, aspect: null, turned: false }));
    this.outlines = pool(CAP.outlined, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, from: null, back: false, mesh: null }));
  }

  /** The meshes (at boot, parked hidden: their programs compiled with the warm-up). */
  build(scene) {
    const add = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; m.userData.zoneFree = true; m.visible = false; scene.add(m); return m; };
    const bolt = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 6); bolt.rotateX(Math.PI / 2);
    this.gunMesh = add(bolt, new THREE.MeshBasicMaterial({ color: 0xffd67a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), CAP.gun);
    const lance = new THREE.CylinderGeometry(0.12, 0.05, 2.6, 6); lance.rotateX(Math.PI / 2);
    this.lanceMesh = add(lance, new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), CAP.lance);
    this.plainMesh = add(new THREE.IcosahedronGeometry(FOE_R, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), CAP.plain);
    this.plainMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP.plain * 3), 3);
    // the outlined: ink with the parry mark round it (one shell each, made now and kept)
    const ink = new THREE.MeshBasicMaterial({ color: 0x160c1e }), geo = new THREE.IcosahedronGeometry(OUT_R, 1);
    for (const r of this.outlines) {
      r.mesh = new THREE.Mesh(geo, ink); r.mesh.visible = false; r.mesh.userData.zoneFree = true; r.mesh.frustumCulled = false;
      scene.add(r.mesh); this.game.parryMark?.mark(r.mesh);
    }
    this.meshes = [this.gunMesh, this.lanceMesh, this.plainMesh];
  }
  show(on) { for (const m of this.meshes || []) m.visible = on; if (!on) for (const r of this.outlines) r.mesh.visible = false; }

  // ---------------------------------------------------------------- firing
  gun(p, dir) {
    const s = this.guns.find((x) => !x.on); if (!s) return null;
    const G = T.ship.shot;
    s.on = true; s.p.copy(p); s.v.copy(dir).normalize().multiplyScalar(G.speed); s.life = G.life;
    return s;
  }
  /** A lance at a painted foe (its volley keeps the count). */
  lance(p, to, volley = null) {
    const s = this.lances.find((x) => !x.on); if (!s) return null;
    s.on = true; s.p.copy(p); s.v.set(0, 6, 22); s.life = 2.5; s.to = to; s.volley = volley;
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
    // the gun
    for (const s of this.guns) {
      if (!s.on) continue;
      s.p.addScaledVector(s.v, dt); s.life -= dt;
      if (s.life <= 0) { s.on = false; continue; }
      const f = waves?.hitAt(s.p, T.ship.shot.radius);
      if (f) { waves.strike(f, 1, { cause: 'shot', at: s.p, dir: s.v }); s.on = false; }
    }
    // the lances turn onto what they were sent at, and keep going if it is gone
    for (const s of this.lances) {
      if (!s.on) continue;
      s.life -= dt;
      if (s.to?.alive) {
        _d.copy(s.to.local).sub(s.p); const d = _d.length();
        s.v.lerp(_d.multiplyScalar(60 / Math.max(d, 0.001)), Math.min(1, dt * 9));
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
  endLance(s, hit) { s.on = false; if (s.volley) { s.volley.flown++; if (hit) s.volley.hit++; } s.to = null; s.volley = null; }
  endOutlined(r) { r.on = false; r.from = null; r.mesh.visible = false; }

  /** Each live shot placed in the world (the frame moves with the rail every frame, so every instance is written every frame). */
  draw() {
    const R = this.rail;
    const put = (mesh, list, scaleOf) => {
      let n = 0;
      for (const s of list) {
        if (!s.on) continue;
        R.toWorld(s.p, _w); R.dirWorld(s.v, _d);
        _q.setFromUnitVectors(Z, _d.lengthSq() > 1e-6 ? _d.normalize() : Z);
        _m.compose(_w, _q, _s.setScalar(scaleOf ? scaleOf(s) : 1));
        mesh.setMatrixAt(n, _m);
        if (mesh.instanceColor) mesh.setColorAt(n, _c.setHex(s.turned ? 0x6a6470 : COLOR[s.aspect] ?? 0xffe0a0));
        n++;
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    put(this.gunMesh, this.guns); put(this.lanceMesh, this.lances); put(this.plainMesh, this.plains);
    for (const r of this.outlines) if (r.on) R.toWorld(r.p, r.mesh.position);
  }

  clear() {
    for (const L of [this.guns, this.lances, this.plains]) for (const s of L) { s.on = false; s.to = null; s.volley = null; }
    for (const r of this.outlines) this.endOutlined(r);
    if (this.gunMesh) this.draw();
  }
  /** How many of the foes' shots are flying (the stress test's invariant: the pools never leak). */
  get live() { return this.plains.filter((s) => s.on).length + this.outlines.filter((r) => r.on).length; }
}
