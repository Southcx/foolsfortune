// ---------------------------------------------------------------------------------------
// THE DUNES' FULGURITES (plain name): glass tubes of sand fused where lightning struck it, lying half out of the sand and branching like
// roots, pale green-white glass that glints in the sun. A few are there from storms before (laid from a fixed seed over the open sand);
// more are left wherever Fury's hail-lightning comes down in the Dunes (the weather's own bolts, vfx/weather.js thunder: a strike seen
// while the hail runs is where one is left), the newest replacing the oldest past FULG.live. At a strike, the sand there flashes and
// smokes (vfx/dunes/effects.js 'dunes.fulgurite.strike'). By day, near ones glint now and then ('dunes.fulgurite.glint', the library's
// star on the shared pools: one a few real seconds, never a beat). Kept for the session only: a look, not a record.
// ONE DRAW: an InstancedMesh of one branching tube, a plain flat standard glassy and a little metallic (the clay chips' program,
// vfx/particles.js): no program added.
//
// Prior art: real fulgurites (sand fulgurites: rough outside, glassy within, branching down along the strike's path; found after desert
// storms, the Sahara's and Florida's), Minecraft 1.21's lightning glass in mods, and the house's thunder (its bolts' places, never a flash).
//
//   const F = new Fulgurites(game, parent)   F.update(dt, { day, fury })   (watches the weather's bolts itself)   F.prewarm() -> undo
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DUNE, OASIS, BARRIER } from '../../world/dunes/dunes.js';

/** The numbers: the ones from storms before and the most kept from strikes now, their size (m), a glint's rest near (real s) and its
 *  reach (m from the camera); the glass's colour and finish. */
export const FULG = { seeded: 14, live: 12, size: [0.8, 1.6], glintEvery: [1.6, 4], glintNear: 55, colour: 0xcfdcc4, rough: 0.16, metal: 0.35 };

const bare = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); return n; };
/** One fulgurite, about a metre: a main tube bending down into the sand, two branches off it, all thinning to their ends. */
function tubeGeometry() {
  const parts = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  const run = (pts, r0, r1) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], len = a.distanceTo(b), k0 = i / (pts.length - 1), k1 = (i + 1) / (pts.length - 1);
    const c = new THREE.CylinderGeometry(r0 + (r1 - r0) * k1, r0 + (r1 - r0) * k0, len * 1.08, 6, 1); q.setFromUnitVectors(up, b.clone().sub(a).normalize()); c.applyQuaternion(q).translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); parts.push(bare(c)); } };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  run([V(0, 0.22, 0), V(0.18, 0.08, 0.05), V(0.42, -0.08, 0.02), V(0.7, -0.3, -0.06), V(0.9, -0.55, -0.02)], 0.075, 0.025); // (the main tube, its top out of the sand)
  run([V(0.18, 0.08, 0.05), V(0.3, 0.02, 0.24), V(0.42, -0.14, 0.42)], 0.045, 0.015);
  run([V(0.42, -0.08, 0.02), V(0.55, -0.12, -0.2), V(0.62, -0.3, -0.36)], 0.04, 0.012);
  parts.push(bare(new THREE.SphereGeometry(0.085, 6, 4).translate(0, 0.22, 0))); // (its open top: a rough knob of glass)
  return mergeGeometries(parts);
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

export class Fulgurites {
  constructor(game, parent) {
    this.game = game; this.parent = parent; this.list = []; this.next = 0; this.glintT = 2; this.seenStrike = -1;
    this.mat = new THREE.MeshStandardMaterial({ name: 'dunes-fulgurite', color: FULG.colour, roughness: FULG.rough, metalness: FULG.metal, flatShading: true });
    this.mesh = new THREE.InstancedMesh(tubeGeometry(), this.mat, FULG.seeded + FULG.live); this.mesh.name = 'dunes-fulgurites';
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = false; this.mesh.receiveShadow = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);
  }

  /** The ones from storms before, laid once the sand is there. */
  seed() {
    const D = this.game.dunes; if (this.seeded || !D) return; this.seeded = true;
    let s = 51721; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < FULG.seeded; i++) { const a = rnd() * Math.PI * 2, r = OASIS.flat + 40 + rnd() * (BARRIER - OASIS.flat - 80); this.lay(DUNE.x + Math.cos(a) * r, DUNE.z + Math.sin(a) * r, rnd() * 6.28, FULG.size[0] + rnd() * (FULG.size[1] - FULG.size[0]), i); }
  }

  /** One laid at x, z: slot `i` (a seeded one) or the next of the live ring. */
  lay(x, z, yaw, size, i = null) {
    const D = this.game.dunes, slot = i ?? FULG.seeded + (this.next++ % FULG.live), y = D.heightAt(x, z);
    _e.set((Math.random() - 0.5) * 0.3, yaw, (Math.random() - 0.5) * 0.3); _q.setFromEuler(_e);
    this.mesh.setMatrixAt(slot, _m.compose(_p.set(x, y, z), _q, _s.setScalar(size))); this.mesh.instanceMatrix.needsUpdate = true;
    const f = (this.list[slot] ||= { x: 0, y: 0, z: 0 }); f.x = x; f.y = y + 0.22 * size; f.z = z;
    this.mesh.count = Math.max(this.mesh.count, slot + 1);
    return f;
  }

  prewarm() { this.seed(); return () => {}; }

  /** `day` 0..1 (the sun's share), `fury` 0..1 (the hail's amount here); the weather's look watched for its bolts. */
  update(dt, { day = 1, fury = 0, here = true } = {}) {
    const g = this.game, W = g.weatherLook, cam = g.camera;
    this.seed();
    // a bolt struck (the thunder's clock moved on) while the hail runs: a fulgurite where it came down, if that is the Dunes' open sand
    const S = W?.strike;
    if (S && S.n !== this.seenStrike) {
      const fresh = this.seenStrike >= 0; this.seenStrike = S.n;
      const b = W.bolts?.[S.n % W.bolts.length];
      if (fresh && b && here && fury > 0.15) {
        const x = b.mesh.position.x, z = b.mesh.position.z, lx = x - DUNE.x, lz = z - DUNE.z, r = Math.hypot(lx - OASIS.x, lz - OASIS.z);
        if (r > OASIS.flat && Math.hypot(lx, lz) < BARRIER - 10) { const f = this.lay(x, z, Math.random() * 6.28, FULG.size[0] + Math.random() * (FULG.size[1] - FULG.size[0])); g.vfx?.play('dunes.fulgurite.strike', { pos: _p.set(f.x, f.y - 0.1, f.z) }); }
      }
    }
    // a glint now and then on a near one, by day
    if (day > 0.3 && (this.glintT -= dt) <= 0) {
      this.glintT = FULG.glintEvery[0] + Math.random() * (FULG.glintEvery[1] - FULG.glintEvery[0]);
      let best = null, bd = FULG.glintNear;
      for (let i = 0; i < this.mesh.count; i++) { const f = this.list[i]; if (!f) continue; const d = Math.hypot(f.x - cam.position.x, f.z - cam.position.z); if (d < bd && Math.random() < 0.6) { bd = d; best = f; } }
      if (best) g.vfx?.play('dunes.fulgurite.glint', { pos: _p.set(best.x, best.y + 0.05, best.z), power: 0.6 + 0.6 * day });
    }
  }
}
