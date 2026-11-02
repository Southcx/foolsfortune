// ---------------------------------------------------------------------------------------
// A SMEAR FRAME (plain name; KEY-POSES.md 8, Calissa's piece: "smears, one or two frames, the heaviest blows only"): on a finisher's
// contact (vfx/blowfeel.js's weight class), the blade or limb drawn for two display frames as a solid fan from its hilt (the hand, the
// body's chest for a fist or a foot) through the arc it just swept, hot white at its leading edge running into the blow's damage type's
// colour and gone at the back: the drawn in-between the eye fills a fast swing with. It sits over the frozen hitstop, so the stop holds
// the smear as a held key holds its drawing. Looks only; nothing else of the blow changes. Real time (a frame is a frame however slow
// the game runs); never on a light, heavy or launcher blow.
// Prior art: the animator's smear frame (Chuck Jones's The Dover Boys, 1942; Guilty Gear Xrd's hand-drawn smear models on its heavy
// normals, GDC 2015; Spider-Verse's multiples and smears), Street Fighter III's swing smears on its fierce attacks.
//
//   game.smears = new SmearFrames(game)   (boot/creatures.js; joins the looks phase)
//   game.smears.play(hilt, tip, dir, tint)   (vfx/blowfeel.js on a finisher: the blade's two ends now, its travel, the type's colour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The smear's numbers: its arc swept back (rad), how long it shows (real s: about two frames at 60), its fan's steps. */
export const SMEAR = { arc: 1.1, life: 0.035, steps: 10, pool: 4, core: 0xfff6e0 };

const _ax = new THREE.Vector3(), _in = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color(), _t = new THREE.Color();

class Smear {
  constructor(scene) {
    const n = SMEAR.steps + 1;
    const g = (this.geo = new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 2 * 4), 4));
    const idx = [];
    for (let i = 0; i < SMEAR.steps; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.NormalBlending }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 5;
    scene.add(this.mesh); this.t = 0;
  }

  /** The fan from `hilt`: the blade (hilt -> tip) turned back against its travel `dir` by SMEAR.arc, step by step to where it is now. */
  set(hilt, tip, dir, tint) {
    const P = this.geo.attributes.position.array, C = this.geo.attributes.color.array, n = SMEAR.steps;
    const blade = _v.subVectors(tip, hilt), len = blade.length() || 1;
    _ax.crossVectors(blade, dir); if (_ax.lengthSq() < 1e-8) _ax.set(0, 1, 0); _ax.normalize();
    _t.set(tint);
    for (let i = 0; i <= n; i++) {
      const u = i / n; // (0 the back of the arc, 1 the blade now)
      _q.setFromAxisAngle(_ax, -SMEAR.arc * (1 - u));
      const b = _v.subVectors(tip, hilt).applyQuaternion(_q);
      const inner = _in.copy(hilt).addScaledVector(b, 0.25 / Math.max(1, len)), outer = b.add(hilt);
      P[i * 6] = inner.x; P[i * 6 + 1] = inner.y; P[i * 6 + 2] = inner.z; P[i * 6 + 3] = outer.x; P[i * 6 + 4] = outer.y; P[i * 6 + 5] = outer.z;
      _c.set(SMEAR.core).lerp(_t, Math.min(1, (1 - u) * 1.6));
      const a = Math.pow(u, 1.4) * 0.9; // (solid at the leading edge, gone at the back)
      const o = i * 8; C[o] = C[o + 4] = _c.r; C[o + 1] = C[o + 5] = _c.g; C[o + 2] = C[o + 6] = _c.b; C[o + 3] = a * 0.5; C[o + 7] = a;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
    this.mesh.visible = true; this.t = SMEAR.life;
  }

  update(raw) { if (this.t > 0 && (this.t -= raw) <= 0) this.mesh.visible = false; }
}

export class SmearFrames {
  constructor(game) {
    this.game = game; this.list = []; this.i = 0;
    game.systems?.add('looks', this, { clock: 'raw', name: 'smears' });
  }

  play(hilt, tip, dir, tint = 0xffffff) {
    if (!hilt || !tip || !dir || !this.game.scene) return;
    if (this.list.length < SMEAR.pool) this.list.push(new Smear(this.game.scene));
    const s = this.list[this.i = (this.i + 1) % this.list.length];
    s.set(hilt, tip, dir, tint);
  }

  update(raw = 1 / 60) { for (const s of this.list) s.update(raw); }
}
