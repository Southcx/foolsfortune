// ---------------------------------------------------------------------------------------
// THE THORN PATCHES: the briar a planetoid grows below its harmony's briar line, drawn where its cause is, pruned by the god hand, and
// slowing the Pneuka Jar's hop through them (docs/plans/GARDEN-COZY.md A4; the rules are progress/harmony.js; built by Dovina for Petra on
// the owner's ask of 2026-10-22, to her conditions). What was carried in grows at the Dantian's gate (where you arrive), a spirit left
// waiting at the Mulberry Grove's cocoon tree, anything else at the planetoid's crown. A patch is a ring of thorny clumps round its
// place, one a thorn counted; GRAB's left button on one prunes it (harmony back a little, a briar cutting in the Pneuka Box: a material
// of Gall's kind). Nothing it does takes anything away: the hop through a patch is slowed by a multiplier (SLOW, the owner's to feel),
// exactly 1 outside one, the hop's own numbers untouched (the garden's controller, never the core movement). Drawn in one BatchedMesh
// on the decor layer's material (one program between them). THE LOOK IS A PLACEHOLDER, clumps of cones in olive and rust, until
// Calissa builds the briar behind `game.harmony.briarK`.
//
// Prior art: Animal Crossing's weeds (neglect costs a chore, never a thing), Okami's blight lifted by the brush (the lifting is the
// pleasure), Viva Pinata's sours (the bad state as a thing with its own life), Sleeping Beauty's briar wall.
//
//   const T = new ThornPatches(realm)  (game.thornPatches)   T.redraw()   T.prune(hit) -> bool   T.slowAt(planet, pos) -> 0.6 .. 1
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { makeMaterial } from '../../progress/econ/materials.js';
import { THORNS } from '../../progress/harmony.js';
import { stream } from '../../core/rng.js';
import { mergeParts } from './decorlayer.js';

const simRand = stream('world/garden/thornpatches'); // (a cutting's seed: core/rng.js, the same twice)
/** Where a cause grows (the site's fixed thing it gathers round), the ring's radius (metres), how near the hand's click must come,
 *  how near a clump slows the hop, and by how much (Petra's starting number, 0.6: the owner's to feel). */
export const PATCH = { at: { lotus: 'gate', spirit: 'cocoon' }, ring: 3.2, reach: 1.6, slowReach: 1.2, slow: 0.6 };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

const clump = () => mergeParts([[0, 0, 0, 0], [0.35, 0.25, 0.7, 0.6], [-0.3, -0.2, -0.6, 0.5], [0.1, 0.35, 0.2, -0.7]].map(([x, z, rx, rz]) => new THREE.ConeGeometry(0.12, 1.1, 4).translate(0, 0.55, 0).rotateX(rx * 0.5).rotateZ(rz * 0.5).translate(x, 0, z)));

export class ThornPatches {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.spots = [];
    const geo = clump(), cap = THORNS.max * 12; // (six a planetoid, room for twelve planetoids)
    this.mat = realm.decorLayer?.mat || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, name: 'garden-decor' });
    this.batch = new THREE.BatchedMesh(cap, geo.attributes.position.count, 0, this.mat); this.batch.name = 'garden-thorns'; this.batch.frustumCulled = false; this.batch.castShadow = false; this.batch.receiveShadow = true; // (as the decor's: one material, one program; a shadow flag that differs is a second program, compiled at first draw: perf, 2026-10-22)
    this.geoId = this.batch.addGeometry(geo); this.ids = [];
    for (let i = 0; i < cap; i++) { const k = this.batch.addInstance(this.geoId); this.batch.setVisibleAt(k, false); this.batch.setColorAt(k, _c.set(0x5d5a32)); this.ids.push(k); }
    realm.site.group.add(this.batch);
    const E = this.game.events; for (const n of ['garden.thorn', 'garden.prune', 'garden.enter', 'garden.sculpt', 'garden.reset']) E?.on(n, () => this.redraw());
    this.redraw();
  }
  /** The ground direction a cause's patch gathers round on a planetoid. */
  anchor(P, at) {
    const kind = PATCH.at[at], F = kind && this.R.site.features.find((f) => f.kind === kind && f.planet === P);
    return (F ? F.pos.clone().sub(P.c) : UP.clone()).normalize();
  }
  /** The patches drawn again from the harmony's thorns. */
  redraw() {
    const H = this.game.harmony, B = this.batch; this.spots = []; let k = 0;
    if (H) for (const P of this.R.site.planets) for (const t of H.thorns(P.id)) {
      const a = this.anchor(P, t.at), side = new THREE.Vector3().crossVectors(a, Math.abs(a.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize();
      for (let i = 0; i < t.n && k < this.ids.length; i++, k++) {
        const ang = (i / THORNS.max) * Math.PI * 2 + 0.4, off = side.clone().applyAxisAngle(a, ang).multiplyScalar(PATCH.ring / Math.max(4, P.r));
        _n.copy(a).add(off).normalize(); const r = P.radiusAt ? P.radiusAt(_n) : P.r;
        _p.copy(P.c).addScaledVector(_n, r - 0.05); _q.setFromUnitVectors(UP, _n); const sc = 0.9 + 0.25 * Math.sin(i * 2.3 + k);
        B.setMatrixAt(this.ids[k], _m.compose(_p, _q, _s.set(sc, sc, sc))); B.setColorAt(this.ids[k], _c.set(i % 2 ? 0x6b4a2a : 0x5d5a32)); B.setVisibleAt(this.ids[k], true);
        this.spots.push({ planet: P, pos: _p.clone() });
      }
    }
    for (let i = k; i < this.ids.length; i++) B.setVisibleAt(this.ids[i], false);
  }
  /** GRAB's click: a thorn clump under the hand pruned (the harmony's rule), a briar cutting given. True when one was. */
  prune(hit) {
    if (!hit || !this.spots.length) return false;
    const s = this.spots.find((x) => x.planet === hit.planet && x.pos.distanceTo(hit.point) < PATCH.reach); if (!s) return false;
    const r = this.game.harmony?.prune(s.planet.id); if (!r?.ok) return false;
    if (r.cutting) this.game.pneuka?.add('mat.finery', 'garden', 0, makeMaterial('finery', Math.floor(simRand() * 1e9), 0)); // (a briar cutting: Gall's kind, its own item's name and look Espada's and Calissa's)
    sfx.click?.(); this.redraw(); return true;
  }
  /** The hop's multiplier at a body's place: PATCH.slow within a clump's reach, exactly 1 elsewhere. */
  slowAt(P, pos) {
    for (const s of this.spots) if (s.planet === P && s.pos.distanceTo(pos) < PATCH.slowReach) return PATCH.slow;
    return 1;
  }
}
