// ---------------------------------------------------------------------------------------
// THE SHOTS' LOOK ON THE RAIL (docs/plans/RAIL-OVERHAUL.md section 8, "Readability"; the brief's "astral a white-gold core and a dark
// rim, umbral a black core and a pale rim, elongated along their speed, drawn over everything; outlined shots keep Cuphead's pink",
// which in this game is the parry mark: vfx/parrymark.js, its ink and its oil film). Every shot a crossing throws, in one instanced
// draw (vfx/railmark.js): the psygun's own first (under), then the foes', far to near (a near shot over a far one), then the hurtbox
// over all of it. Nothing here moves a shot or decides what it does: the runtime (Petra's: courier/ship/shots.js today) says where each
// is, every frame, and this draws it.
//
//   A FOE'S SHOT   a capsule from its tail to its head; the head is the hit sphere's centre and a little larger than it (a graze is
//                  honest: Touhou draws a bullet bigger than its hitbox, never smaller), the tail as long as the shot is fast (0.06 s of
//                  its flight, at most 3 m) and thinner, so it reads which way it flies even as a dot far off. Astral: white-gold core,
//                  dark rim, a soft glow (reads on the gold storm by its rim, on the black crude by its core). Umbral: black core, pale
//                  rim, no glow (on the gold by its core, on the black by its rim). Outlined: the parry mark round it, either kind.
//   THE PSYGUN'S   a needle in the ship's colour, white at its heart, light added: a thin streak going away, never a capsule with a rim
//   THE HURTBOX    the ship's: a pale core and a dark ring whose outer edge is exactly the hurtbox's radius (`T.ship.hurt`), drawn on
//                  top of the hull (RAIL-OVERHAUL.md: "never larger than shown"; the brief: never larger than the real one)
//
// Prior art: Touhou's and Cave's bullets (the core and the edge, the long bullet for the fast one, the player's shots faint and under
// the enemy's), Ikaruga's two polarities read by value as much as hue, Rez's player lasers, the hitbox dot of every modern danmaku.
//
//   const S = new RailShots({ cap: 400, guns: 128 })   parent.add(S.mesh)   (or S.build(scene))   S.parked() -> [mesh] (the warm-up)
//   every frame: S.set(i, pos, vel, kind, outlined, radius?, alpha?, seed?) for i < n, then S.count = n
//                S.gun(i, pos, vel) for i < m, then S.guns = m         S.hurtbox(pos, radius) | S.hurtbox(null)
//                S.update(rawDt, camera)   (sorts, writes, sends; camera optional: the last one that drew it)
//   S.color(hex)   the psygun's shots' colour (the ship's)         S.show(on)
//   (pos: the hit sphere's centre; vel: m/s in the frame the eye rides with (the rail's); both in the parent's frame: the world in the
//    game. kind: 'astral' | 'umbral' (or 0 | 1). radius: the drawn head, 0.36 m by default. alpha: 0.45 for a spent shot. seed: 0 to 1, an
//    outlined shot's own number (its record's index), so its film never changes colour when another shot ends.)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE, kindOf } from './railmark.js';

export const RAIL_SHOT = {
  radius: 0.36,         // a foe's shot's drawn head (m): its hit sphere is 0.3 (courier/ship/shots.js FOE_R)
  tail: 0.06,           // the tail: this many seconds of its flight
  tailMax: 3,           // ... and no longer than this (m)
  taper: 0.55,          // the tail's radius as a share of the head's
  gunRadius: 0.075,     // the psygun's needle (m) ...
  gunLength: 2.4,       // ... and its length
};

const _e = new THREE.Vector3();

export class RailShots {
  constructor({ cap = 400, guns = 128 } = {}) {
    this.cap = cap; this.gunCap = guns; this.count = 0; this.guns = 0;
    this.buf = new MarkBuffer(guns + cap + 1, { renderOrder: 43 });
    this.mesh = this.buf.mesh;
    this.fp = new Float32Array(cap * 3); this.fv = new Float32Array(cap * 3); this.fs = new Float32Array(cap * 5); // (kind, outlined, radius, alpha, seed)
    this.gp = new Float32Array(guns * 3); this.gv = new Float32Array(guns * 3);
    this.key = new Float32Array(cap); this.idx = new Uint16Array(cap);
    this.hb = { on: false, p: new THREE.Vector3(), r: 0.35 };
    this.gunRGB = new THREE.Color(0xffc65c);
    this.t = 0; this.camera = null;
    const draw = this.mesh.onBeforeRender;
    this.mesh.onBeforeRender = (r, s, cam, ...rest) => { this.camera = cam; draw(r, s, cam, ...rest); }; // (the camera that drew it: the sort's eye, when update is not given one)
  }

  build(scene) { scene.add(this.mesh); return this; }
  parked() { return [this.mesh]; }
  show(on) { this.mesh.visible = on; }
  color(hex) { this.gunRGB.set(hex); }

  /** A foe's shot, the i-th this frame. `seed` (0 to 1) is the outline film's phase: a number the shot keeps for its whole flight (its
   *  record's own), never its place in this frame's list, or the film's colour jumps whenever another shot ends ahead of it. */
  set(i, pos, vel, kind = 'astral', outlined = false, radius = RAIL_SHOT.radius, alpha = 1, seed = 0) {
    if (i >= this.cap) return;
    const o = i * 3, f = this.fp, v = this.fv, s = this.fs, q = i * 5;
    f[o] = pos.x; f[o + 1] = pos.y; f[o + 2] = pos.z; v[o] = vel.x; v[o + 1] = vel.y; v[o + 2] = vel.z;
    s[q] = kindOf(kind); s[q + 1] = outlined ? 1 : 0; s[q + 2] = radius; s[q + 3] = alpha; s[q + 4] = seed;
  }
  /** The psygun's shot, the i-th this frame. */
  gun(i, pos, vel) {
    if (i >= this.gunCap) return;
    const o = i * 3; this.gp[o] = pos.x; this.gp[o + 1] = pos.y; this.gp[o + 2] = pos.z; this.gv[o] = vel.x; this.gv[o + 1] = vel.y; this.gv[o + 2] = vel.z;
  }
  /** The ship's hurtbox: where (the hit test's centre) and its radius; null hides it. */
  hurtbox(pos, radius = this.hb.r) { this.hb.on = !!pos; if (pos) { this.hb.p.copy(pos); this.hb.r = radius; } }

  /** Once a frame, after the sets: the foes' shots sorted far to near, everything written and sent. */
  update(raw = 1 / 60, camera = null) {
    this.t += raw; this.buf.time(this.t);
    const B = this.buf, n = Math.min(this.count, this.cap), m = Math.min(this.guns, this.gunCap), cam = camera || this.camera, Z = RAIL_SHOT;
    let k = 0;
    // the psygun's, under everything
    const gl = Z.gunLength, gr = Z.gunRadius, c = this.gunRGB;
    for (let i = 0; i < m; i++, k++) {
      const o = i * 3, x = this.gp[o], y = this.gp[o + 1], z = this.gp[o + 2];
      let vx = this.gv[o], vy = this.gv[o + 1], vz = this.gv[o + 2]; const sp = Math.hypot(vx, vy, vz) || 1; vx /= sp; vy /= sp; vz /= sp;
      const ax = x - vx * gl, ay = y - vy * gl, az = z - vz * gl;
      B.put(k, ax, ay, az, gr * 0.4, x, y, z, gr, ax, ay, az, 1, x, y, z, 1, STYLE.gun, c.r, c.g, c.b);
    }
    // the foes', far to near
    if (cam) { _e.setFromMatrixPosition(cam.matrixWorld); this.mesh.parent?.worldToLocal(_e); }
    for (let i = 0; i < n; i++) { const o = i * 3; this.idx[i] = i; this.key[i] = cam ? (this.fp[o] - _e.x) ** 2 + (this.fp[o + 1] - _e.y) ** 2 + (this.fp[o + 2] - _e.z) ** 2 : 0; }
    if (cam && n > 1) { const key = this.key; this.idx.subarray(0, n).sort((a, b) => key[b] - key[a]); }
    for (let j = 0; j < n; j++, k++) {
      const i = this.idx[j], o = i * 3, q = i * 5, x = this.fp[o], y = this.fp[o + 1], z = this.fp[o + 2];
      const vx = this.fv[o], vy = this.fv[o + 1], vz = this.fv[o + 2], sp = Math.hypot(vx, vy, vz);
      const len = sp > 1e-3 ? Math.min(sp * Z.tail, Z.tailMax) / sp : 0, r = this.fs[q + 2];
      const ax = x - vx * len, ay = y - vy * len, az = z - vz * len, al = this.fs[q + 3];
      B.put(k, ax, ay, az, r * Z.taper, x, y, z, r, ax, ay, az, al, x, y, z, al, this.fs[q], this.fs[q + 1], 0, this.fs[q + 4]);
    }
    // the hurtbox, over all of it
    if (this.hb.on) { const p = this.hb.p; B.put(k++, p.x, p.y, p.z, this.hb.r, p.x, p.y, p.z, 0, p.x, p.y, p.z, 1, p.x, p.y, p.z, 1, STYLE.hurtbox); }
    B.count = k; B.flush();
  }

  dispose() { this.buf.dispose(); }
}
