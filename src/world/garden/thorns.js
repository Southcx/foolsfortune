// ---------------------------------------------------------------------------------------
// THE THORNS: the briar a planetoid grows below its harmony's briar line, drawn where its cause is, and pruned by the god hand (docs/plans/
// GARDEN-COZY.md A4; the rules are progress/harmony.js; built by Dovina for Petra, the owner's ask of 2026-10-22). What was carried in
// grows at the Dantian's gate (where you arrive), a spirit left waiting at the Mulberry Grove's cocoon tree, anything else at the
// planetoid's crown. A patch is a ring of thorny clumps round its place, one a thorn counted; GRAB's left button on one prunes it
// (harmony back a little, a briar cutting in the Pneuka Box: a material of Gall's kind). Nothing it does takes anything away. The clumps
// are placeholders in olive and rust (Calissa's look: her briar, behind `game.harmony.briarK`).
//
// Prior art: Animal Crossing's weeds (neglect costs a chore, never a thing), Okami's blight lifted by the brush (the lifting is the
// pleasure), Viva Pinata's sours (the bad state as a thing with its own life), Sleeping Beauty's briar wall.
//
//   const T = new ThornPatches(realm)   T.redraw()   T.prune(hit) -> bool (GRAB's click on a clump)   T.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { makeMaterial } from '../../progress/econ/materials.js';
import { THORNS } from '../../progress/harmony.js';
import { stream } from '../../core/rng.js';

const simRand = stream('world/garden/thorns'); // (a cutting's seed: core/rng.js, the same twice)

/** Where a cause grows (the site's fixed thing it gathers round), the ring's radius, and how near the hand's click must come. */
export const PATCH = { at: { lotus: 'gate', spirit: 'cocoon' }, ring: 3.2, reach: 1.6, cap: 64 };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

function clump() {
  const parts = [[0, 0, 0, 0], [0.35, 0.25, 0.7, 0.6], [-0.3, -0.2, -0.6, 0.5], [0.1, 0.35, 0.2, -0.7]].map(([x, z, rx, rz]) => new THREE.ConeGeometry(0.12, 1.1, 4).translate(0, 0.55, 0).rotateX(rx * 0.5).rotateZ(rz * 0.5).translate(x, 0, z).toNonIndexed());
  const g = new THREE.BufferGeometry(), pos = [], nor = [];
  for (const p of parts) { pos.push(...p.attributes.position.array); nor.push(...p.attributes.normal.array); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

export class ThornPatches {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.spots = [];
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, name: 'garden-thorns' });
    this.mesh = new THREE.InstancedMesh(clump(), this.mat, PATCH.cap); this.mesh.name = 'garden-thorns'; this.mesh.count = 0; this.mesh.frustumCulled = false;
    this.mesh.setColorAt(0, _c.set(0x5d5a32)); realm.site.group.add(this.mesh);
    const E = this.game.events; for (const n of ['garden.thorn', 'garden.prune', 'garden.enter', 'garden.sculpt', 'garden.reset']) E?.on(n, () => this.redraw());
    this.redraw();
  }
  /** The ground point a cause's patch gathers round on a planetoid. */
  anchor(P, at) {
    const kind = PATCH.at[at], F = kind && this.R.site.features.find((f) => f.kind === kind && f.planet === P);
    const d = (F ? F.pos.clone().sub(P.c) : UP.clone()).normalize();
    return d;
  }
  /** The patches drawn again from the harmony's thorns. */
  redraw() {
    const H = this.game.harmony; this.spots = []; let k = 0;
    if (H) for (const P of this.R.site.planets) for (const t of H.thorns(P.id)) {
      const a = this.anchor(P, t.at), side = new THREE.Vector3().crossVectors(a, Math.abs(a.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize();
      for (let i = 0; i < t.n && k < PATCH.cap; i++, k++) {
        const ang = (i / THORNS.max) * Math.PI * 2 + 0.4, off = side.clone().applyAxisAngle(a, ang).multiplyScalar(PATCH.ring / Math.max(4, P.r) );
        _n.copy(a).add(off).normalize(); const r = P.radiusAt ? P.radiusAt(_n) : P.r;
        _p.copy(P.c).addScaledVector(_n, r - 0.05); _q.setFromUnitVectors(UP, _n); const sc = 0.9 + 0.25 * Math.sin(i * 2.3 + k);
        this.mesh.setMatrixAt(k, _m.compose(_p, _q, _s.set(sc, sc, sc))); this.mesh.setColorAt(k, _c.set(i % 2 ? 0x6b4a2a : 0x5d5a32));
        this.spots.push({ planet: P, pos: _p.clone() });
      }
    }
    this.mesh.count = k; this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  /** GRAB's click: a thorn clump under the hand pruned (the harmony's rule), a briar cutting given. True when one was. */
  prune(hit) {
    if (!hit || !this.spots.length) return false;
    const s = this.spots.find((x) => x.planet === hit.planet && x.pos.distanceTo(hit.point) < PATCH.reach); if (!s) return false;
    const r = this.game.harmony?.prune(s.planet.id); if (!r?.ok) return false;
    if (r.cutting) this.game.pneuka?.add('mat.finery', 'garden', 0, makeMaterial('finery', Math.floor(simRand() * 1e9), 0)); // (a briar cutting: Gall's kind, its own item's name and look Espada's and Calissa's)
    sfx.click?.(); this.redraw(); return true;
  }
  update() {}
}
