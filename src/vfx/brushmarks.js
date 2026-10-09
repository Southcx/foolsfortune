// ---------------------------------------------------------------------------------------
// THE BRUSH'S MARKS: the Soul Brush's load shown on the ground it works, as world marks (no words, no numbers: CLAUDE.md, Feedback).
// Petra's mechanics say where and how much (tools/soulbrush/paintspray.js, feedback/loadgauge.js, tools/soulbrush/load.js); these
// only draw it. All three are one shader program, the ribbons' (vfx/ribbonlight.js: looks 'reticle', 'jetring', 'shine').
//
//   THE PAINT RETICLE  laid on what the stream lands on: an inner POINT where its centre lands and an outer RING the spread's width there,
//                      four ticks on the ring (the far one longer, down the throw), in the picked feeling's colour lifted light, keylined
//                      dark (casebook rule 105), the spread's disc faintly tinted. The point and the line keep a size the eye can read
//                      at nine metres (they grow with the camera's distance, never under a pixel); the ring eases between the spreads.
//   THE JET RING       at the feet while a jet runs: the hover's fuel draining over its 1.6 s, the rocket's gather filling over its 0.55 s,
//                      drawn in the Lachryma ring's language (vfx/hudring.js): a dark track in eight segments (Breath of the Wild's
//                      stamina wheel) between two fine lines of the Mind, the filled part light with a bright head, filling from the
//                      near side and clockwise on the screen; the hover's last third pulses; the rocket's full gather bursts outward.
//   THE SHINE          where the mop or Clean takes the last of a blot or of paint: a ring going out over the cleaned ground with a few
//                      glints, and a four-pointed twinkle standing over it (Super Mario Sunshine's sparkle on washed goop; PowerWash
//                      Simulator's "done"). A few at once at most, and never two on top of each other.
//
// Prior art: Splatoon's ground reticle (the point where the shot lands, the ring of its swerve, read before you fire), Super Mario
// Sunshine's FLUDD gauge and its washed-goop sparkle, Breath of the Wild's stamina wheel (segments, shown only while it is spent),
// PowerWash Simulator's completion ping.
//
//   const R = new PaintReticle(game)   R.set(on, point, normal, { ring, along, color }, rawDt)   R.dispose()
//   const J = new JetRing(game)        J.set(k (0..1, < 0 none), kind ('hover' | 'rocket'), feetPos, rawDt)
//   const S = new CleanShine(game)     S.at(pos, size)  (a shine where ground was cleaned)   S.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ribbonLightMaterial } from './ribbonlight.js';

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Matrix4(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _lean = new THREE.Quaternion();
const ease = (v, to, rate, raw) => v + (to - v) * (1 - Math.exp(-rate * raw));
const flatMark = (look, u, name, order) => {
  const m = ribbonLightMaterial(look, u, { name });
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -4; // (above the paint and the floor, never fighting them)
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
  mesh.name = name; mesh.renderOrder = order; mesh.frustumCulled = false; mesh.visible = false;
  return mesh;
};

export class PaintReticle {
  constructor(game) {
    this.game = game; this.alpha = 0; this.ring = 0; this.on = false;
    this.u = { uC: { value: new THREE.Color(1, 1, 1) }, uK: { value: 0 }, uP: { value: new THREE.Vector4() } };
    this.mesh = flatMark('reticle', this.u, 'paint-reticle', 30);
    game.scene?.add(this.mesh);
  }

  /** Shown (`on`) at `point` on a surface of `normal`: the spread's ring `ring` metres across its middle, the stream thrown along
   *  `along` (the far tick points down it), in `color` (a THREE.Color or hex). Hidden when `point` is null. */
  set(on, point, normal, { ring = 0.5, along = null, color = 0xffffff } = {}, raw = 1 / 60) {
    const want = on && point ? 1 : 0;
    this.alpha = ease(this.alpha, want, want ? 18 : 10, raw);
    this.mesh.visible = this.alpha > 0.01 && !!(point || this.on);
    if (!point) { this.u.uK.value = this.alpha; if (this.alpha <= 0.01) this.on = false; return; }
    this.on = true;
    this.ring = this.ring > 0 && want ? ease(this.ring, ring, 14, raw) : ring; // (it eases between the spreads: standing, moving, in the air)
    const cam = this.game.camera, dist = cam ? cam.getWorldPosition(_c).distanceTo(point) : 6;
    const pointR = Math.max(0.06, dist * 0.0075), line = Math.max(0.022, dist * 0.0026); // (read at nine metres: they grow with the eye's distance)
    const H = this.ring + Math.max(0.08, line * 3);
    _n.copy(normal || _y.set(0, 1, 0)).normalize();
    _y.copy(along || _x.set(0, 0, 1)).addScaledVector(_n, -_n.dot(along || _x)); if (_y.lengthSq() < 1e-6) _y.set(1, 0, 0).addScaledVector(_n, -_n.x); _y.normalize();
    _x.crossVectors(_y, _n);
    this.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _n));
    this.mesh.position.copy(point).addScaledVector(_n, 0.03);
    this.mesh.scale.setScalar(H);
    this.u.uP.value.set(this.ring / H, pointR / H, line / H, 0);
    if (color != null) { if (color.isColor) this.u.uC.value.copy(color); else this.u.uC.value.set(color); }
    this.u.uK.value = this.alpha;
  }

  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

const JET_R = 0.85; // (metres: the quad's half-size; the band runs 0.57 to 0.68 m from the feet, inside the Lachryma ring's 0.62 to 0.71)
export class JetRing {
  constructor(game) {
    this.game = game; this.alpha = 0; this.pop = 0; this.popped = false; this.t = 0; this.k = 0;
    this.u = { uK: { value: 0 }, uT: { value: 0 }, uP: { value: new THREE.Vector4() } };
    this.mesh = flatMark('jetring', this.u, 'jet-ring', 30);
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.scale.set(-JET_R, JET_R, 1); // (mirrored: the fill runs clockwise on the screen)
    game.scene?.add(this.mesh);
  }

  /** k: the share of the turn shown (the hover's fuel left, the rocket's gather), < 0 when no jet runs; at the feet, `pos`. */
  set(k, kind, pos, raw = 1 / 60) {
    this.t = (this.t + raw) % 120; // (a whole number of the pulse's periods: casebook rule 119)
    const running = k >= 0 && !!pos;
    if (kind === 'rocket' && k >= 0.999 && !this.popped) { this.popped = true; this.pop = 0.001; } // (the gather is full: it bursts)
    if (!running || kind !== 'rocket' || k < 0.999) { if (!running || k < 0.5) this.popped = false; }
    if (this.pop > 0) this.pop = Math.min(1, this.pop + raw / 0.35);
    const spent = kind === 'rocket' && this.popped && this.pop >= 1; // (the burst done, the gather is spent: the ring goes)
    this.alpha = ease(this.alpha, running && !spent ? 1 : 0, running ? 16 : 8, raw);
    if (this.pop >= 1 && !running) this.pop = 0;
    this.mesh.visible = this.alpha > 0.01;
    if (!this.mesh.visible) return;
    if (running) { this.k = k; this.mesh.position.set(pos.x, pos.y + 0.05, pos.z); }
    const cam = this.game.camera;
    cam?.getWorldDirection(_c); _c.y = 0; if (_c.lengthSq() < 1e-6) _c.set(0, 0, -1); _c.normalize();
    this.u.uP.value.set(Math.max(0, Math.min(1, this.k)), kind === 'hover' ? THREE.MathUtils.smoothstep(0.32 - this.k, 0, 0.22) : 0, this.pop > 0 && this.pop < 1 ? this.pop : 0, Math.atan2(_c.z, _c.x));
    this.u.uT.value = this.t; this.u.uK.value = this.alpha;
  }

  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

const SHINE_MAX = 6, SHINE_LIFE = 0.9, SHINE_COLOR = 0xe8fbff; // (at once at most; real seconds; Clean's clear water, a pale aqua white)
export class CleanShine {
  constructor(game) {
    this.game = game; this.pool = [];
    for (let i = 0; i < SHINE_MAX; i++) {
      const gu = { uC: { value: new THREE.Color(SHINE_COLOR) }, uK: { value: 0.9 }, uP: { value: new THREE.Vector4(0, 0, Math.random(), 0) } };
      const su = { uC: { value: new THREE.Color(SHINE_COLOR) }, uK: { value: 1 }, uP: { value: new THREE.Vector4(0, 1, Math.random(), 0) } };
      const ground = flatMark('shine', gu, 'shine-ring', 29), star = flatMark('shine', su, 'shine-star', 31);
      ground.rotation.x = -Math.PI / 2;
      game.scene?.add(ground); game.scene?.add(star);
      this.pool.push({ ground, star, gu, su, age: 1, pos: new THREE.Vector3(), size: 1 });
    }
  }

  /** A shine where ground was just cleaned, `size` metres across (a splat's, a blot's). Not on top of a young one. */
  at(pos, size = 1) {
    if (!pos) return;
    for (const s of this.pool) if (s.age < 0.45 && s.pos.distanceToSquared(pos) < Math.max(0.25, size * size * 0.16)) return;
    const s = this.pool.reduce((a, b) => (b.age > a.age ? b : a));
    s.age = 0; s.pos.set(pos.x, pos.y, pos.z); s.size = Math.max(0.5, Math.min(5, size));
    s.gu.uP.value.z = Math.random(); s.su.uP.value.z = Math.random();
  }

  update(raw = 1 / 60) {
    const cam = this.game.camera;
    for (const s of this.pool) {
      if (s.age >= 1) { s.ground.visible = s.star.visible = false; continue; }
      s.age = Math.min(1, s.age + raw / SHINE_LIFE);
      s.ground.visible = s.star.visible = s.age < 1;
      s.ground.position.set(s.pos.x, s.pos.y + 0.03, s.pos.z); s.ground.scale.setScalar(s.size * 0.6);
      s.gu.uP.value.x = s.age; s.su.uP.value.x = s.age;
      // the twinkle stands over it, facing the eye but leaned back a little toward the ground, and smaller near the eye (casebook rule 122)
      const h = 0.18 + s.size * 0.12;
      s.star.position.set(s.pos.x, s.pos.y + h, s.pos.z);
      if (cam) {
        cam.getWorldQuaternion(_q); s.star.quaternion.copy(_q).multiply(_lean.setFromAxisAngle(_x.set(1, 0, 0), -0.25));
        const d = cam.getWorldPosition(_c).distanceTo(s.star.position);
        s.star.scale.setScalar((0.16 + s.size * 0.08) * THREE.MathUtils.smoothstep(d, 0.6, 2.2));
      }
    }
  }

  dispose() { for (const s of this.pool) for (const m of [s.ground, s.star]) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); } }
}
