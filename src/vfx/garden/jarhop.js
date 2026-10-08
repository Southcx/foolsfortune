// ---------------------------------------------------------------------------------------
// THE JAR, HOPPING: the Pneuka Jar's look as it hops round the garden's planetoids (the owner, 2026-10-07: "the Pneuka Jar as the
// character controller and have it hopping around"; docs/plans/SPIRIT-GARDEN.md section 1). Petra's controller moves it (gravity toward a
// planetoid's heart, the hop, the roll, the lotus's fling, the hand's throw); this is how the clay feels while it does: a toy with weight.
//
//   THE HOP     crouch(k) squashes it before a hop as the spring loads; hop() stretches it tall as it leaves the ground, easing back in
//               the air (Katamari's bounce, a Chao's waddle)
//   THE LAND    land(speed) squashes it flat by how hard it came down, wobbling back, and a ring of soft motes puffs from its foot
//   THE FLIGHT  in a long arc (a lotus, a throw) a thin trail of light follows it, your draught's colour
//   THE LIGHT   the Vessoul's glow, as the god hand carries it: a soft halo at its heart breathing slowly and a ring of light at its foot,
//               your draught's colour; it sets the Jar apart from the torii it starts before (the garden sweep's #2: the owner's vermilion
//               Jar read as the gate's foot). Shown only while the garden drives the hop (`update`), so god mode's Jar is untouched
//   THE CLIPS   a Jar with its own clips (`obj.userData.clips`: godhand/pneukajarclips.js, the owner's hop and land) is squashed by them,
//               never here: the hop and the landing go to its clips and this spring writes no scale (two squashes were one too many).
//               A stand-in with no clips (the workbench's lathe Jar) keeps the spring
//
// Prior art: the squash and stretch of the Disney animators' bouncing ball, Super Mario Galaxy's Mario on a small world, Katamari and
// Chao Garden's toy bounce, and Pikmin's sparkle trail.
//
//   const J = new JarHop(jarObject, { fx, color })   J.crouch(k)   J.hop()   J.land(speed)   J.trail(on)   J.update(rawDt)   (squash along its own +Y, or its clips')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class JarHop {
  constructor(obj, { fx = null, color = 0xf2c84a } = {}) {
    this.obj = obj; this.fx = fx; this.color = new THREE.Color(color); this.base = new THREE.Vector3(1, 1, 1); // (never its scale at entry: the god hand leaves it at 0.001)
    this.sq = 0; this.v = 0; this.crouchK = 0; this.trailOn = false; this.acc = 0; this.t = 0; this.shownAt = -1;
    const map = fx?.haloTexture ?? null, glow = (o) => ({ map, color: this.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, ...o });
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial(glow({ opacity: 0.32 })));
    this.halo.scale.setScalar(3.0); this.halo.position.y = 0.75;
    this.foot = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(glow({ opacity: 0.3 })));
    this.foot.position.y = 0.03; this.foot.renderOrder = 2;
    this.halo.visible = this.foot.visible = false;
    this.halo.onBeforeRender = () => { if (performance.now() - this.shownAt > 250) this.halo.visible = this.foot.visible = false; }; // (the garden stopped driving it: out of the garden, the light goes)
    obj.add(this.halo, this.foot);
  }
  get clips() { return this.obj.userData.clips || null; }
  /** Loading the hop: 0 .. 1 how far it is squashed down (a held hop loads deeper). */
  crouch(k) { this.crouchK = this.clips ? 0 : THREE.MathUtils.clamp(k, 0, 1); }
  /** It leaves the ground: a stretch, springing back (or its clips' hop). */
  hop() { this.crouchK = 0; if (this.clips) { this.clips.hop(); return; } this.sq = 0.28; this.v = 0; }
  /** It comes down at `speed` m/s: a squash by how hard, a wobble back (or its clips' landing, as hard), a puff of motes round its foot. */
  land(speed = 4) {
    const k = THREE.MathUtils.clamp(speed / 10, 0.05, 1);
    if (this.clips) this.clips.land(speed); else { this.sq = -0.35 * k; this.v = 0; }
    const fx = this.fx; if (!fx?.add) return; this.obj.updateWorldMatrix(true, false);
    const up = _u.set(0, 1, 0).transformDirection(this.obj.matrixWorld), at = this.obj.getWorldPosition(_p), side = _s.set(1, 0, 0).transformDirection(this.obj.matrixWorld), fwd = _f.crossVectors(side, up);
    for (let i = 0; i < 10 + 14 * k; i++) { const a = (i / 12) * Math.PI * 2; fx.add.emit({ pos: at.clone(), vel: side.clone().multiplyScalar(Math.cos(a) * 2.2 * k).addScaledVector(fwd, Math.sin(a) * 2.2 * k).addScaledVector(up, 0.6), life: 0.5, size: 0.09, sizeEnd: 0.02, color: new THREE.Color(0xfff0d8), alpha: 0.7, drag: 3, gravity: 0 }); }
  }
  /** A thin trail of light behind it in a long arc (a lotus, a throw). */
  trail(on) { this.trailOn = on; }

  update(raw = 1 / 60) {
    // a damped spring back to round: the squash (negative) or stretch (positive) along its own up, its girth the other way
    if (!this.clips) {
      const a = -90 * this.sq - 9 * this.v; this.v += a * raw; this.sq += this.v * raw;
      const s = this.sq - 0.22 * this.crouchK, y = 1 + s, xz = 1 / Math.sqrt(Math.max(0.3, y));
      this.obj.scale.set(this.base.x * xz, this.base.y * y, this.base.z * xz);
    }
    this.t += raw; this.shownAt = performance.now(); this.halo.visible = this.foot.visible = true;
    this.halo.material.opacity = 0.62 + 0.12 * Math.sin(this.t * 1.6); this.foot.material.opacity = 0.7 + 0.12 * Math.sin(this.t * 1.6 + 0.8); // (a slow breath)
    const fx = this.fx; if (!fx?.add || !this.trailOn) return;
    this.acc += raw * 40;
    while (this.acc >= 1) { this.acc -= 1; fx.add.emit({ pos: this.obj.getWorldPosition(_p).clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3), life: 0.6, size: 0.08, sizeEnd: 0.01, color: this.color.clone(), alpha: 0.8, drag: 1, gravity: 0 }); }
  }
  dispose() { if (!this.clips) this.obj.scale.copy(this.base); this.obj.remove(this.halo, this.foot); this.halo.material.dispose(); this.foot.geometry.dispose(); this.foot.material.dispose(); }
}
const _u = new THREE.Vector3(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _f = new THREE.Vector3();
