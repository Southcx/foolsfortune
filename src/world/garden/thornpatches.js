// ---------------------------------------------------------------------------------------
// THE THORN PATCHES: the briar a planetoid grows below its harmony's briar line, drawn where its cause is, pruned by the god hand, and
// slowing the Pneuka Jar's hop through them (docs/plans/GARDEN-COZY.md A4; the rules are progress/harmony.js; built by Dovina for Petra on
// the owner's ask of 2026-10-22, to her conditions). What was carried in grows at the Dantian's gate (where you arrive), a spirit left
// waiting at the Mulberry Grove's cocoon tree, anything else at the planetoid's crown. A patch is a ring of thorny clumps round its
// place, one a thorn counted; GRAB's left button on one prunes it (harmony back a little, a briar cutting in the Pneuka Box: a material
// of Gall's kind). Nothing it does takes anything away: the hop through a patch is slowed by a multiplier (SLOW, the owner's to feel),
// exactly 1 outside one, the hop's own numbers untouched (the garden's controller, never the core movement). Drawn in one BatchedMesh
// on the decor layer's material (one program between them). The look is Calissa's (vfx/garden/thornlook.js): arching hooked canes in three sizes,
// olive and rust by vertex colour (the instance colour a near-white tint); a clump's size is its slot's (young, grown, old), its scale grows with the patch's n.
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
import { thornClumps } from '../../vfx/garden/thornlook.js';

const simRand = stream('world/garden/thornpatches'); // (a cutting's seed: core/rng.js, the same twice)
/** Where a cause grows (the site's fixed thing it gathers round), the ring's radius (metres), how near the hand's click must come,
 *  how near a clump slows the hop, and by how much (Petra's starting number, 0.6: the owner's to feel). */
export const PATCH = { at: { lotus: 'gate', spirit: 'cocoon' }, ring: 3.2, reach: 1.6, slowReach: 1.2, slow: 0.6 };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

/** A patch's tint by its planetoid's briar (0..1): at the briar's edge the canes still half green, at the bottom dry and dark; every
 *  other clump a shade lighter, so a patch never reads as one flat colour. (The canes' own olive and rust are their vertex colours.) */
const GRADE = { edge: new THREE.Color(0xe4ecd0), deep: new THREE.Color(0x9a7c6c) };
function thornGrade(briarK, i) { const b = Math.min(1, Math.max(0, (briarK - 0.45) / 0.55)); return _c.copy(GRADE.edge).lerp(GRADE.deep, b).multiplyScalar(i % 2 ? 0.92 : 1); }

export class ThornPatches {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.spots = [];
    const geos = thornClumps(), cap = THORNS.max * 12; // (six a planetoid, room for twelve planetoids)
    this.mat = realm.decorLayer?.mat || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, name: 'garden-decor' });
    this.batch = new THREE.BatchedMesh(cap, geos.reduce((n, g) => n + g.attributes.position.count, 0), 0, this.mat); this.batch.name = 'garden-thorns'; this.batch.frustumCulled = false; this.batch.castShadow = false; this.batch.receiveShadow = true; // (as the decor's: one material, one program; a shadow flag that differs is a second program, compiled at first draw: perf, 2026-10-22)
    this.geoIds = geos.map((g) => this.batch.addGeometry(g)); this.ids = []; // (young, grown, old: vfx/garden/thornlook.js)
    for (let i = 0; i < cap; i++) { const k = this.batch.addInstance(this.geoIds[i % 3]); this.batch.setVisibleAt(k, false); this.batch.setColorAt(k, _c.set(0xffffff)); this.ids.push(k); }
    realm.site.group.add(this.batch);
    const E = this.game.events; for (const n of ['garden.thorn', 'garden.prune', 'garden.enter', 'garden.sculpt', 'garden.reset']) E?.on(n, () => this.redraw());
    this.redraw();
  }
  /** The ground direction a cause's patch gathers round on a planetoid. */
  anchor(P, at) {
    const kind = PATCH.at[at], F = kind && this.R.site.features.find((f) => f.kind === kind && f.planet === P);
    return (F ? F.pos.clone().sub(P.c) : UP.clone()).normalize();
  }
  /** The patches drawn again from the harmony's thorns (each tinted by its planetoid's briar: Calissa's grade below). */
  redraw() {
    const H = this.game.harmony, B = this.batch; this.spots = []; let k = 0;
    if (H) for (const P of this.R.site.planets) for (const t of H.thorns(P.id)) {
      const a = this.anchor(P, t.at), side = new THREE.Vector3().crossVectors(a, Math.abs(a.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize();
      for (let i = 0; i < t.n && k < this.ids.length; i++, k++) {
        const ang = (i / THORNS.max) * Math.PI * 2 + 0.4, off = side.clone().applyAxisAngle(a, ang).multiplyScalar(PATCH.ring / Math.max(4, P.r));
        _n.copy(a).add(off).normalize(); const r = P.radiusAt ? P.radiusAt(_n) : P.r;
        _p.copy(P.c).addScaledVector(_n, r - 0.05); _q.setFromUnitVectors(UP, _n); const sc = (0.85 + 0.07 * t.n) * (0.9 + 0.2 * Math.sin(i * 2.3 + k));
        B.setMatrixAt(this.ids[k], _m.compose(_p, _q, _s.set(sc, sc, sc))); B.setColorAt(this.ids[k], thornGrade(H.briarK?.(P.id) ?? 0.5, i)); B.setVisibleAt(this.ids[k], true);
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
