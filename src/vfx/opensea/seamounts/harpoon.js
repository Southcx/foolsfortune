// ---------------------------------------------------------------------------------------
// THE HARPOON'S LOOK (the Sondelass at sea: Dovina's SEA_MOUNTS.sondelass, Petra's world/opensea/seamounts.js `c.tether`), a part of the
// mounts' look (vfx/opensea/seamounts.js). A barbed iron flies off the rail that bears on its line, arcing a little; in a beast's head it
// bites (chips, a spray), and while the tether holds the line hangs from the rail to the head as a catenary of a few segments: sagging
// when slack (the slack taken up as a hand hauls it), drawn straight and trembling when the beast pulls past its length, and where it
// cuts the water a spray and a wake. The tether run out (or the beast gone), the line parts at the head and whips home, slackening.
// A crate hooked rides back under the iron; a miss splashes and is hauled in.
// Prior art: Sea of Thieves' harpoon (a line that goes taut and you can see it), Moby-Dick's whale line (it hums and smokes in the
// chocks before it parts), the catenary's parabola for a line under its own weight (Huygens; shallow-sag approximation).
//
//   new HarpoonLook(M)   .fired(e)   .update(dt)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** fly: the iron's speed (m/s); seg: the line's segments; r: its radius (m); slack: the line paid out x the span at the bite; haul: slack
 *  taken up (m/s); reel: the iron hauled home (m/s); snap: the whip home (real s); miss: how far abeam a miss lands (m); cap: lines at once. */
export const HARPOON_LOOK = { fly: 75, seg: 18, r: 0.14, slack: 1.1, haul: 1.6, reel: 32, snap: 0.6, miss: 50, cap: 3, iron: 0x2e2c2e, rope: 0x9a7b55, crate: 0x8a6238 };
const HL = HARPOON_LOOK, UP = new THREE.Vector3(0, 1, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _sc = new THREE.Vector3();
const _hide = new THREE.Matrix4().makeScale(0, 0, 0);
const easeOut = (u) => 1 - (1 - u) * (1 - u);

/** The iron: a shaft, a head and two barbs, its tip at the origin pointing +Z. */
function ironGeometry() {
  const shaft = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6); shaft.translate(0, -2.3, 0);
  const head = new THREE.ConeGeometry(0.3, 1.0, 6); head.translate(0, -0.5, 0);
  const barb = (s) => { const b = new THREE.BoxGeometry(0.07, 0.8, 0.07); b.rotateZ(s * 0.55); b.translate(s * 0.32, -1.0, 0); return b; };
  const eye = new THREE.TorusGeometry(0.18, 0.05, 5, 10); eye.translate(0, -4.05, 0);
  const g = mergeGeometries([shaft, head, barb(1), barb(-1), eye].map((x) => x.toNonIndexed())); g.rotateX(Math.PI / 2); return g;
}

export class HarpoonLook {
  constructor(M) {
    this.M = M; const g = M.game; this.lines = [];
    const rope = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true); rope.translate(0, 0.5, 0);
    this.rope = new THREE.InstancedMesh(rope, new THREE.MeshStandardMaterial({ color: HL.rope, roughness: 0.85 }), HL.seg * HL.cap);
    this.rope.frustumCulled = false; this.rope.count = 0; this.rope.userData.zone = 'opensea'; this.rope.name = 'harpoon-line';
    const iron = ironGeometry(), im = new THREE.MeshStandardMaterial({ color: HL.iron, roughness: 0.4, metalness: 0.8 });
    this.irons = Array.from({ length: HL.cap }, () => { const m = new THREE.Mesh(iron, im); m.visible = false; m.userData.zone = 'opensea'; g.scene?.add(m); return m; });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: HL.crate, roughness: 0.8 })); crate.visible = false; crate.userData.zone = 'opensea';
    this.crates = Array.from({ length: HL.cap }, () => { const m = crate.clone(); g.scene?.add(m); return m; });
    g.scene?.add(this.rope);
  }
  parked() { return [this.rope, this.irons[0], this.crates[0]]; }

  /** Where the line leaves the hull for a point (the rail on its side, forward of amidships). */
  railFor(p, side, out) { const z = this.M.L * 0.2; return this.M.shipPoint(side * this.M.beam * 0.5, this.M.deckAt(z) + 1.2, z, out); }

  fired(e) {
    const M = this.M, S = M.serpents, H = M.helm; if (!H) return;
    let c = null, at = null;
    if (e.hit === 'beast') for (const b of S?.list || []) if (b.alive && b.tether > 0 && (!c || b.tether > c.tether)) c = b;
    if (c) { at = S.at(c, 0).clone(); for (const l of this.lines) if (l.c === c) l.phase = 'gone'; }
    else if (e.hit === 'crate') { let bd = Infinity; for (const m of M.game.opensea?.props?.marks || []) if (m.feature?.kind === 'wreck') { const d = m.mesh.position.distanceTo(H.pos); if (d < bd) { bd = d; at = m.mesh.position.clone(); } } }
    const side = at ? M.sideOf(at) : M.camSide();
    if (!at) { at = M.shipPoint(side * (M.beam * 0.5 + HL.miss), 0, M.L * 0.25); at.y = M.surf(at.x, at.z); }
    const from = this.railFor(at, side, new THREE.Vector3());
    if (this.lines.length >= HL.cap) this.lines.shift();
    this.lines.push({ c, side, phase: 'fly', t: 0, from, from0: from.clone(), at, tip: from.clone(), dir: new THREE.Vector3().subVectors(at, from).normalize(), len: 0, strain: 0, sprayT: 0, crate: e.hit === 'crate', d0: Math.max(1, from.distanceTo(at)) });
  }

  update(dt) {
    const M = this.M, S = M.serpents, live = M.live; let n = 0;
    if (!live) for (const l of this.lines) l.phase = 'gone';
    for (const l of this.lines) {
      if (l.phase === 'gone') continue;
      l.t += dt; this.railFor(l.at, l.side, l.from);
      const head = l.c && l.c.alive && S ? S.at(l.c, 0) : null;
      if (l.phase === 'fly') {
        if (head) l.at.copy(head);
        const u = Math.min(1, (l.t * HL.fly) / l.d0);
        l.tip.lerpVectors(l.from, l.at, u).addScaledVector(UP, l.d0 * 0.08 * 4 * u * (1 - u));
        _a.subVectors(l.at, l.from).normalize(); l.dir.copy(_a).addScaledVector(UP, 0.32 * (1 - 2 * u)).normalize();
        if (u >= 1) this.arrive(l, head);
      } else if (l.phase === 'held') {
        if (!head || !(l.c.tether > 0)) { this.part(l); }
        else {
          _a.subVectors(l.from, head).normalize(); l.tip.copy(head).addScaledVector(_a, S.rOf(l.c, 0) * 0.55);
          const d = l.tip.distanceTo(l.from);
          if (d >= l.len) { l.len = d; l.strain = Math.min(1, l.strain + dt * 4); }
          else { l.len = Math.max(d * 1.01, l.len - HL.haul * dt); l.strain = Math.max(0, l.strain - dt * 2); }
          l.dir.subVectors(l.tip, l.from).normalize();
        }
      } else if (l.phase === 'reel') {
        _a.subVectors(l.from, l.tip); const d = _a.length();
        if (d < 1.5) { l.phase = 'gone'; continue; }
        l.tip.addScaledVector(_a, Math.min(1, (HL.reel * dt) / d)); l.tip.y = Math.max(l.tip.y, M.surf(l.tip.x, l.tip.z) + 0.4);
        l.dir.subVectors(l.tip, l.from).normalize();
      } else if (l.phase === 'snap') {
        const u = Math.min(1, l.t / HL.snap); if (u >= 1) { l.phase = 'gone'; continue; }
        l.tip.lerpVectors(l.snapAt, l.from, easeOut(u)); l.tip.y += Math.sin(u * Math.PI) * 6;
        l.dir.subVectors(l.tip, l.from).normalize();
      }
      n = this.lay(l, n, dt);
    }
    this.lines = this.lines.filter((l) => l.phase !== 'gone');
    this.irons.forEach((m, i) => { const l = this.lines[i]; m.visible = !!l; if (!l) return; m.position.copy(l.tip); m.quaternion.setFromUnitVectors(Z, l.phase === 'fly' || l.phase === 'held' ? l.dir : _b.copy(l.dir).negate()); });
    this.crates.forEach((m, i) => { const l = this.lines[i]; m.visible = !!l && l.crate && l.phase === 'reel'; if (m.visible) { m.position.copy(l.tip).y -= 0.9; m.rotation.y += dt * 1.5; } });
    this.rope.count = n; if (!n) this.rope.setMatrixAt(0, _hide); this.rope.instanceMatrix.needsUpdate = true;
  }

  /** The iron arrives: in a head it bites and the line is made fast; on the water (a miss, a crate) it splashes and is hauled in. */
  arrive(l, head) {
    const M = this.M, fx = M.fx, W = M.game.water;
    if (head) {
      l.phase = 'held'; l.t = 0; l.len = l.from.distanceTo(l.tip) * HL.slack;
      fx?.impact?.(l.tip, _a.copy(l.dir).negate(), { color: 0x9aa7b0, sparks: 8, dust: 3 });
      W?.disturb?.(l.tip.x, l.tip.z, 0.6, 'land', M.surf(l.tip.x, l.tip.z));
      return;
    }
    l.phase = 'reel'; l.t = 0;
    W?.disturb?.(l.tip.x, l.tip.z, 0.5, 'dive', M.surf(l.tip.x, l.tip.z));
    for (let i = 0; i < 10; i++) fx?.foam?.emit({ pos: l.tip.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, 4 + Math.random() * 4, (Math.random() - 0.5) * 3), life: 0.8, size: 0.4, sizeEnd: 0.12, color: 0xeef4f2, alpha: 0.85, drag: 0.8, gravity: 9, floor: -1e9 });
  }
  /** The tether ends: the line parts at the head and whips home. */
  part(l) {
    const fx = this.M.fx; l.phase = 'snap'; l.t = 0; l.snapAt = l.tip.clone();
    for (let i = 0; i < 8; i++) fx?.add?.emit({ pos: l.tip.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8), life: 0.3, size: 0.12, sizeEnd: 0.02, color: 0xffe0a0, alpha: 1, drag: 2, gravity: 8, floor: -1e9 });
    for (let i = 0; i < 5; i++) fx?.alpha?.emit({ pos: l.tip.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2), life: 0.8, size: 0.5, sizeEnd: 1.4, color: 0xc8b89c, alpha: 0.4, drag: 2, gravity: -0.5, floor: -1e9 });
  }

  /** The line from the rail to the iron as `seg` segments: a shallow catenary for its slack, trembling when it strains, never under the water
   *  by more than a hand (a spray and a wake where it cuts it, while it strains). */
  lay(l, n, dt) {
    const M = this.M, a = l.from, b = l.tip, d = a.distanceTo(b), N = HL.seg, fx = M.fx;
    let sag = l.phase === 'held' ? Math.sqrt(Math.max(0, (3 * d * (l.len - d)) / 8)) : l.phase === 'fly' ? d * 0.03 : d * 0.06;
    const whip = l.phase === 'snap' ? (1 - l.t / HL.snap) * 5 : 0, hum = l.strain * 0.12;
    _s.subVectors(b, a).cross(UP).normalize(); // (the line's side, for the whip and the hum)
    l.sprayT -= dt; let spray = l.strain > 0.3 && l.sprayT <= 0;
    let prev = _p.copy(a);
    for (let i = 1; i <= N && n < this.rope.instanceMatrix.count; i++) {
      const s = i / N, q = _a.lerpVectors(a, b, s);
      q.y -= sag * 4 * s * (1 - s);
      const wob = whip * Math.sin(s * Math.PI * 3 - l.t * 22) * s + hum * Math.sin(M.t * 90 + s * 9) * Math.sin(s * Math.PI);
      q.addScaledVector(_s, wob);
      const top = M.surf(q.x, q.z);
      if (q.y < top - 0.25) {
        if (spray) { spray = false; l.sprayT = 0.06; fx?.foam?.emit({ pos: new THREE.Vector3(q.x, top + 0.2, q.z), vel: new THREE.Vector3((Math.random() - 0.5) * 2 + _s.x * 3, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2 + _s.z * 3), life: 0.6, size: 0.35, sizeEnd: 0.1, color: 0xeef4f2, alpha: 0.8, drag: 1, gravity: 9, floor: -1e9 }); if (Math.random() < 0.2) M.game.water?.disturb?.(q.x, q.z, 0.4, 'wake', top); }
        q.y = top - 0.25;
      }
      _b.subVectors(q, prev); const len = _b.length();
      if (len > 1e-4) { _q.setFromUnitVectors(Y, _b.multiplyScalar(1 / len)); _m.compose(prev, _q, _sc.set(HL.r, len, HL.r)); this.rope.setMatrixAt(n++, _m); }
      prev = _p.copy(q);
    }
    return n;
  }
}
