// ---------------------------------------------------------------------------------------
// THE RACEWAY'S LANTERNS (plain name; "a Raceway lantern", never bare "lantern": the Lantern Wisp is a creature): paper-and-clay lanterns
// hung from posts along each track's start straight and its first stretch, and in a ring round the park's hub, lit at dusk and through
// the night. They come on ALONG the track as the light goes: the lanterns of a stretch in LIGHT.groups steps from the start outward,
// each step a little later in the dusk (lightAt), its lanterns flaring once as they catch ('raceway.lantern.light'); they go out the same
// way at dawn. Their glow is their emissive (one material a step, the same program) under the glow pass; a few of them near each start
// carry a real lamp: a plain PointLight lent by the light budget (render/lightbudget.js) like any lamp in the world, never around it,
// its intensity the lantern's own. A look only: no collider, no rule.
// THREE DRAWS and the poles' one (this module's Poles, shared with the banners): the posts' InstancedMesh, the lanterns' bodies a step
// an InstancedMesh (LIGHT.groups of them), their caps; a plain flat standard (the clay chips' program, vfx/particles.js): no program
// added. Lamps: LIGHT.lamps PointLights in the scene, adopted by the budget, scored by distance like the rest.
//
// Prior art: the paper lanterns of a night festival and of Japanese street racing's touge (lit in a run down the road at dusk), Mario
// Kart's night tracks and Diddy Kong Racing's lamp-lit courses, a lamplighter's round; the house's light budget (sixth-generation
// consoles' few lights a draw, lent to the nearest).
//
//   const poles = new Poles(parent)   poles.add(x, y, z, h, r)   poles.finish()
//   const L = new RacewayLanterns(game, parent, poles)   L.build(raceway)   L.update(dt, { light })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sideOf } from '../../world/raceway/kit.js';
import { RW } from '../../world/raceway/track.js';

/** The numbers: lanterns from `along[0]` to `along[1]` m along each track's line, `every` apart, `out` m past its edge, both sides; the
 *  hub's ring (its radius past the plaza's, how many); the post's height; the steps they light in and the dusk they span (lightAt: the
 *  first step at `dusk[1]`, the last at `dusk[0]`); the glow's colour and strength; the lamps (how many in all, their range, strength). */
export const LIGHT = {
  along: [-60, 260], every: 22, out: 6.2, hub: { r: -8, n: 16 }, post: 3.6, groups: 4, dusk: [0.22, 0.42],
  glow: 0xffb45a, k: 2.2, body: 0xf3dcb0, lamps: 12, range: 16, lampK: 7,
};
const ARM = 0.62; // (m: the lantern out from its post)
const bare = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); return n; };
const std = (color, name, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, flatShading: true, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

/** Posts and poles of every banner and lantern: one InstancedMesh, laid once. */
export class Poles {
  constructor(parent) { this.parent = parent; this.list = []; this.mat = std(0x5a3a2a, 'raceway-poles'); }
  add(x, y, z, h, r) { this.list.push([x, y, z, h, r]); }
  clear() { if (this.mesh) { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.dispose(); } this.mesh = null; this.list = []; }
  finish() {
    if (this.mesh || !this.list.length) return;
    const geo = bare(new THREE.CylinderGeometry(0.8, 1, 1, 6).translate(0, 0.5, 0));
    const m = (this.mesh = new THREE.InstancedMesh(geo, this.mat, this.list.length)); m.name = 'raceway-poles'; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
    this.list.forEach(([x, y, z, h, r], i) => m.setMatrixAt(i, _m.compose(_p.set(x, y - 0.3, z), _q.identity(), _s.set(r, h + 0.3, r))));
    this.parent.add(m);
  }
}

export class RacewayLanterns {
  constructor(game, parent, poles) {
    this.game = game; this.parent = parent; this.poles = poles; this.built = false; this.on = [];
    this.mats = Array.from({ length: LIGHT.groups }, (_, i) => std(LIGHT.body, `raceway-lantern-${i}`, { emissive: LIGHT.glow, emissiveIntensity: 0, roughness: 0.6 }));
    this.capMat = std(0x3a2418, 'raceway-lantern-caps');
  }

  build(R) {
    if (this.built || !R?.tracks?.length) return; this.built = true;
    const groups = Array.from({ length: LIGHT.groups }, () => []);
    const hang = (p, g, yaw) => groups[g].push({ x: p.x + Math.sin(yaw) * ARM, y: p.y + LIGHT.post - 0.55, z: p.z + Math.cos(yaw) * ARM, yaw, post: p }); // (out on its arm, toward the road)
    for (const T of R.tracks) {
      const s0 = T.line + LIGHT.along[0], span = LIGHT.along[1] - LIGHT.along[0];
      for (let u = 0; u <= span; u += LIGHT.every) for (const sd of [-1, 1]) {
        const s = (((s0 + u) % T.length) + T.length) % T.length, F = T.frame(s), p = sideOf(R, T, s, sd * (F.w + LIGHT.out));
        hang(p, Math.min(LIGHT.groups - 1, Math.floor((u / span) * LIGHT.groups)), Math.atan2(sd * F.fz, -sd * F.fx));
      }
    }
    const H = R.P?.hub; if (H) for (let i = 0; i < LIGHT.hub.n; i++) { const a = (i / LIGHT.hub.n) * Math.PI * 2, r = (H.r ?? 70) + LIGHT.hub.r, x = RW.x + H.x + Math.cos(a) * r, z = RW.z + H.z + Math.sin(a) * r; hang(new THREE.Vector3(x, R.heightAt(x, z), z), 0, Math.atan2(-Math.cos(a), -Math.sin(a))); }
    // (an arm off the post to hang from: the post a pole, the lantern a lathe of paper on a clay cap)
    const body = bare(new THREE.LatheGeometry([[0.0, -0.3], [0.16, -0.27], [0.24, -0.12], [0.26, 0.05], [0.2, 0.22], [0.0, 0.26]].map(([x, y]) => new THREE.Vector2(x, y)), 8));
    const cap = mergeGeometries([bare(new THREE.CylinderGeometry(0.1, 0.13, 0.07, 8).translate(0, 0.29, 0)), bare(new THREE.CylinderGeometry(0.1, 0.13, 0.06, 8).translate(0, -0.32, 0)), bare(new THREE.BoxGeometry(0.05, 0.05, ARM).translate(0, 0.55, -ARM / 2)), bare(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 4).translate(0, 0.42, 0))]);
    const all = groups.flat();
    this.bodies = groups.map((L, g) => { const m = new THREE.InstancedMesh(body, this.mats[g], Math.max(1, L.length)); m.count = L.length; L.forEach((l, i) => m.setMatrixAt(i, this.at(l))); return m; });
    this.caps = new THREE.InstancedMesh(cap, this.capMat, all.length); all.forEach((l, i) => this.caps.setMatrixAt(i, this.at(l)));
    for (const m of [...this.bodies, this.caps]) { m.name = 'raceway-lanterns'; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; this.parent.add(m); }
    for (const l of all) this.poles.add(l.post.x, l.post.y, l.post.z, LIGHT.post, 0.07);
    this.groups = groups;
    // the lamps: the first lanterns of each start's first step, a few a track (the budget lends eight at a time to the nearest)
    const firsts = groups[0].filter((l, i) => i % 3 === 0).slice(0, LIGHT.lamps);
    this.lamps = firsts.map((l) => { const L = new THREE.PointLight(LIGHT.glow, 0, LIGHT.range, 2); L.position.set(l.x, l.y - 0.1, l.z); L.name = 'raceway-lantern-lamp'; this.parent.add(L); this.game.lights?.adopt?.(L); return L; }); // (adopted at once: a real light for even a frame would rebuild every lit program)
    this.on = groups.map(() => 0);
  }
  /** The lanterns taken down (stage 2's teardown): their meshes and lamps out of the group (the budget forgets them: the dressing's
   *  teardown asks it), their geometry let go; the materials kept. */
  clear() {
    for (const m of [...(this.bodies || []), ...(this.caps ? [this.caps] : [])]) { m.parent?.remove(m); m.geometry.dispose(); m.dispose(); }
    for (const L of this.lamps || []) L.parent?.remove(L);
    this.bodies = this.caps = this.groups = null; this.lamps = []; this.on = []; this.built = false;
  }
  /** A lantern hung on its arm, facing the road. */
  at(l) { _e.set(0, l.yaw, 0); _q.setFromEuler(_e); return _m.compose(_p.set(l.x, l.y, l.z), _q, _s.setScalar(1)); }

  update(dt, R, { light = 1 } = {}) {
    if (!this.built) this.build(R); if (!this.built) return;
    const D = LIGHT.dusk;
    for (let g = 0; g < LIGHT.groups; g++) {
      const at = D[1] - (D[1] - D[0]) * (g / Math.max(1, LIGHT.groups - 1)), want = light < at ? 1 : 0; // (the first step lights first, at the most light)
      const was = this.on[g], k = (this.on[g] += (want - was) * Math.min(1, dt * 1.6));
      if (was < 0.5 && k >= 0.5 && R.active) this.flare(g);
      this.mats[g].emissiveIntensity = LIGHT.k * THREE.MathUtils.smoothstep(k, 0, 1) * (1 + 0.04 * Math.sin(performance.now() * 0.0013 + g)); // (a slow breath, never a flicker)
    }
    const k0 = this.on[0];
    for (const L of this.lamps) L.intensity = LIGHT.lampK * k0;
  }
  /** A step's lanterns catching: a small flare at each one in sight. */
  flare(g) {
    const cam = this.game.camera.position, V = this.game.vfx;
    for (const l of this.groups[g]) if (Math.hypot(l.x - cam.x, l.z - cam.z) < 180) V?.play('raceway.lantern.light', { pos: _p.set(l.x, l.y, l.z) });
  }
}
