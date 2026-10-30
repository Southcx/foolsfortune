// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S SPORES: what drifts off the tree always, as the Sea of Corruption's spores fall. Three sources, each on its own breath:
//
//   SPORE-FALL   from under every open cap, slow motes falling and drifting (amber, or the tincture's colour once it has one)
//   THE SPONGES  puffs rising out of the tube sponges' throats, teal and violet, swelling as they climb
//   THE MOUTH    a few motes wandering out of the roots' mouth into the light
//
// Drawn by the game's own sprite particles (vfx/sprites.js: stateless on the GPU, each mote's whole life worked out in its vertex shader
// from what it was born with), one more pool on the same program; only near the tree (MYGG.sporesNear: past it a mote is less than a
// pixel, and would sparkle), and none written at all while it is far.
//
// Prior art: Nausicaa's Fukai (spores falling like snow through shafts of light), Princess Mononoke's kodama forest's drifting motes, and
// the library's particles themselves (Latta 2004's stateless GPU particle).
//
//   const S = new MyggSpores(group, emitters)   S.update(raw, { near, open: (cap) => 0..1, tint: Color | null })   S.dispose()
//   (emitters: [{ p, kind: 'gill' | 'sponge' | 'mouth', cap?, up?, out? }], the tree's frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sprites } from '../../sprites.js';
import { lcg } from './layout.js';

/** Motes a real second from each source (a gill's rate is per open cap), and how long each lives (real seconds). */
export const SPORES = { gill: 0.9, crown: 2.6, sponge: 1.2, mouth: 1.4, max: 720 };
const AMBER = new THREE.Color(0xffc867), TEAL = new THREE.Color(0x63f2dc), VIOLET = new THREE.Color(0xbc94ff);
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();

export class MyggSpores {
  constructor(parent, emitters) {
    this.S = new Sprites(parent, { max: SPORES.max, additive: true }); this.S.mesh.name = 'myggdrasil-spores';
    this.E = { gill: emitters.filter((e) => e.kind === 'gill'), sponge: emitters.filter((e) => e.kind === 'sponge'), mouth: emitters.filter((e) => e.kind === 'mouth') };
    this.acc = { gill: 0, sponge: 0, mouth: 0 }; this.rnd = lcg(613);
  }
  update(raw = 1 / 60, { near = true, open = () => 1, tint = null } = {}) {
    const S = this.S, r = this.rnd;
    if (near && raw > 0) {
      // spore-fall: each open cap's gills, the Crown's more
      const gills = this.E.gill.filter((e) => open(e.cap) > 0.6);
      this.acc.gill += raw * gills.reduce((n, e) => n + (e.crown ? SPORES.crown : SPORES.gill) / e.of, 0);
      while (this.acc.gill >= 1 && gills.length) {
        this.acc.gill -= 1; const e = gills[Math.floor(r() * gills.length)];
        _c.copy(tint || AMBER).lerp(AMBER, tint ? 0.25 : 0);
        S.emit({ pos: _p.copy(e.p).add(_v.set((r() - 0.5) * 1.6, -0.2, (r() - 0.5) * 1.6)), vel: _v.set((r() - 0.5) * 0.5, -0.18 - r() * 0.14, (r() - 0.5) * 0.5), life: 14 + r() * 9,
          size: 0.24 + r() * 0.16, sizeEnd: 0.18, color: _c, alpha: 0.85, alphaEnd: 0, drag: 0.12, gravity: 0.025, shape: 'soft', twinkle: 0.7 });
      }
      // the sponges' breath
      this.acc.sponge += raw * SPORES.sponge * this.E.sponge.length * 0.35;
      while (this.acc.sponge >= 1 && this.E.sponge.length) {
        this.acc.sponge -= 1; const e = this.E.sponge[Math.floor(r() * this.E.sponge.length)], up = e.up || _v.set(0, 1, 0);
        S.emit({ pos: _p.copy(e.p), vel: _v.copy(up).multiplyScalar(0.7 + r() * 0.5).add(_p.set((r() - 0.5) * 0.35, 0, (r() - 0.5) * 0.35)), life: 9 + r() * 6,
          size: 0.28 + r() * 0.14, sizeEnd: 0.55, color: r() < 0.6 ? TEAL : VIOLET, alpha: 0.6, alphaEnd: 0, drag: 0.28, gravity: -0.05, shape: 'soft', twinkle: 0.5 });
      }
      // the mouth's motes
      this.acc.mouth += raw * SPORES.mouth;
      while (this.acc.mouth >= 1 && this.E.mouth.length) {
        this.acc.mouth -= 1; const e = this.E.mouth[0];
        _c.copy(tint || AMBER);
        S.emit({ pos: _p.copy(e.p).add(_v.set((r() - 0.5) * 2.2, r() * 1.4, (r() - 0.5) * 2.2)), vel: _v.copy(e.out).multiplyScalar(0.25 + r() * 0.25).add(_p.set(0, 0.18 + r() * 0.12, 0)), life: 8 + r() * 5,
          size: 0.16 + r() * 0.1, sizeEnd: 0.12, color: _c, alpha: 0.9, alphaEnd: 0, drag: 0.1, gravity: -0.02, shape: 'soft', twinkle: 0.9 });
      }
    }
    S.update(Math.max(0, raw));
    if (!near) S.mesh.visible = false;
  }
  dispose() { this.S.mesh.parent?.remove(this.S.mesh); this.S.geo.dispose(); this.S.mat.dispose(); }
}
