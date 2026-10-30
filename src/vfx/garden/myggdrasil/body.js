// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S BODY: everything static of the tree built into one geometry, near (lod 0) or far (lod 1: fewer sides and rings, the
// smallest things left out, the sea fans solid). Both are built from the same chances, part by part (`streams`: each part draws from a
// stream of its own, so leaving a small thing out of the far body never moves a big one), and so match where the one gives way to the
// other.
//
//   roots and trunk (./roots.js), corals (./coral.js), fungi (./fungi.js), the ten caps (./caps.js), into one TreeKit (./kit.js)
//
// Prior art: the console way with a big static prop (one draw per material, an LOD swap at a distance: Breath of the Wild's far trees),
// and seeded generation by sub-stream (each feature its own seed, as No Man's Sky and Minecraft derive a chunk's from its position).
//
//   const B = buildBody(F, lod, seed)   B.geometry   B.caps   B.emit (spore sources)   B.tips (root tips: { az, s })   B.mouthAt   B.tris
// ---------------------------------------------------------------------------------------
import { TreeKit } from './kit.js';
import { lcg } from './layout.js';
import { buildRoots } from './roots.js';
import { buildCorals } from './coral.js';
import { buildFungi } from './fungi.js';
import { buildCaps, capSpores } from './caps.js';

/** A stream for part `k` of the tree of `seed`. */
export const streams = (seed) => (k) => lcg(seed * 7919 + k * 31.7 + 3);

export function buildBody(F, lod, seed = 1) {
  const K = new TreeKit(), S = streams(seed);
  const R = buildRoots(K, F, lod, S);
  const C = buildCorals(K, F, lod, S, R.limbs);
  buildFungi(K, F, lod, S, { limbs: R.limbs, under: C.under, hollow: R.hollow });
  const caps = buildCaps(K, F, lod, S);
  const geometry = K.geometry(); geometry.boundingSphere.radius += 6; // (a shut bud stands higher than its open cap: the Crown's by 3 m)
  geometry.boundingBox.expandByScalar(6);
  const emit = [...C.emit];
  for (const cap of caps) { const n = cap.C.top ? 14 : 5, pts = capSpores(cap, n, S(1300 + cap.i)); for (const e of pts) emit.push({ ...e, kind: 'gill', of: n, crown: !!cap.C.top }); }
  emit.push({ p: R.mouthIn, kind: 'mouth', out: R.mouthOut });
  return { geometry, caps, emit, tips: R.tips, mouthAt: R.mouthAt, tris: K.I.length / 3, verts: K.n };
}
