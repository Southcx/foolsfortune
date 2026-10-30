// ---------------------------------------------------------------------------------------
// EARTH WALL'S SLAB, DRESSED: the King of Pentacles' wall (Petra's body, courier/classarts/body.js `wall`: a fixed box in the static group
// and a plain slab of the ground's colour that rises, stands and sinks) drawn as the island's own ground torn up and stood on end. Petra's
// mesh is kept (she moves it and takes it down); its box is swapped for a slab of the same size cut rough, its faces banded with the
// ground's strata (the Dunes' sands, clay and rust; on a floor, the floor's fired brick over its bed, kaolin and stone), its top the
// ground's surface; a lip of loose clods rides its top edge and crumbles off it, and dust rolls along its foot as it rises and as it sinks.
// Looks only: the box's size, place and collider are hers, untouched.
//
// Prior art: a road cut's strata (a cliff's bedding read in bands, tilted and wavy), Shadow of the Colossus's and God of War's ground
// torn up into walls, Avatar's earthbending (the slab carries its own topsoil up with it), the Dunes' stone kit (world/dunes/dunes.js).
//
//   const d = dressWall(game, w, at)   (w: a body.js `walls` entry { mesh, body, h, ... }; at: its foot, the art.use's place)
//   d.update(dt, shown)   d.dispose()   (when the runtime has let the wall go: Petra disposes the slab, this its lip)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { stoneMat, painted, rng } from './kit.js';

/** The ground's strata by where the wall stands: its surface (top, two tones) and its bands from the bottom up (sRGB hexes as seen). */
export const STRATA = {
  sand: { top: [0xd8b98a, 0xcdae80], loose: 0xc9a878, bands: [0xc39c68, 0xa86c40, 0xd2b183, 0x8a4a2a, 0xb88a58, 0x6e4a32, 0xc79a62, 0x9a6038] },
  floor: { top: [0x8a4a30, 0x7d4029], loose: 0x8a6a52, bands: [0x6a5a4e, 0xd8ccb8, 0xb08a60, 0x8a7a6a, 0xd0c2a8, 0xa89880, 0x9a9088] },
};
const TOP = 0.13;   // the share of the slab's height that is its surface layer
const JIT = 0.045;  // how rough its faces are cut (m)
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

/** Which ground stands under it: the sand's (the Dunes, the Raceway, a Well) or a floor's. */
export const groundKind = (game) => (game.dunes?.active || game.raceway?.active || game.well?.active ? 'sand' : 'floor');
const hash3 = (x, y, z, s) => { let h = (Math.round(x * 997) * 374761393 + Math.round(y * 991) * 668265263 + Math.round(z * 983) * 1442695041 + s * 2654435761) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const lin = (hex, k = 1) => _c.setHex(hex).multiplyScalar(k); // (a THREE.Color is linear: setHex reads the sRGB hex as seen)

/** The slab: the box's size cut rough (a vertex moved by its own place, so the faces stay joined), banded by height. */
function slabGeometry(w, h, t, kind, seed) {
  const S = STRATA[kind], g = new THREE.BoxGeometry(w, h, t, Math.max(3, Math.ceil(w / 0.3)), Math.max(5, Math.ceil(h / 0.15)), 2);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (y < -h / 2 + 1e-3) continue; // (its foot stays square: it is under the ground)
    const top = y > h / 2 - 1e-3;
    P.setXYZ(i, x + (hash3(x, y, z, seed) - 0.5) * JIT * 2, y + (top ? (hash3(z, x, y, seed) - 0.6) * 0.14 : (hash3(y, z, x, seed) - 0.5) * JIT), z + (hash3(z, y, x, seed + 1) - 0.5) * JIT * 2.2);
  }
  // the bands: thicknesses drawn once, tilted and waved along the slab as bedding is
  const r = rng(seed), bands = []; let y0 = 0; while (y0 < 1) { const th = 0.07 + r() * 0.16; bands.push({ to: y0 + th, hex: S.bands[bands.length % S.bands.length] }); y0 += th; }
  const tilt = (r() - 0.5) * 0.16, ph = r() * 6;
  return painted(g, (c, n, k) => {
    const lift = (c.y + h / 2) / h, grain = 0.92 + hash3(c.x, c.y, c.z, seed + 7) * 0.14;
    if (n.y > 0.65) return lin(S.top[k % 2], grain); // (its top: the ground's own surface, carried up with it)
    if (n.y < -0.65) return lin(S.bands[0], 0.6);
    if (lift > 1 - TOP + 0.03 * Math.sin(c.x * 2.1 + ph)) return lin(S.top[(k >> 1) % 2], grain * 0.96);
    const s = lift / (1 - TOP) + tilt * (c.x / w) + 0.03 * Math.sin(c.x * 1.7 + ph) + 0.02 * Math.sin(c.x * 4.3 + ph * 2);
    const b = bands.find((B) => s <= B.to) || bands[bands.length - 1];
    return lin(b.hex, grain);
  });
}

/** The lip: loose clods along both edges of its top, squashed and tumbled, in the loose ground's colour. */
function lipGeometry(w, h, t, kind, seed) {
  const S = STRATA[kind], r = rng(seed + 3), parts = [], n = Math.max(6, Math.round(w / 0.22));
  for (let i = 0; i < n * 2; i++) {
    const side = i % 2 ? 1 : -1, s = 0.07 + r() * 0.1, g = new THREE.IcosahedronGeometry(s, 0);
    g.scale(1 + r() * 0.5, 0.55 + r() * 0.3, 1 + r() * 0.4); g.rotateY(r() * 6.28); g.rotateX((r() - 0.5) * 0.8);
    g.translate((Math.floor(i / 2) / (n - 1) - 0.5) * w * 0.94 + (r() - 0.5) * 0.12, h / 2 + s * 0.25, side * t * (0.25 + r() * 0.22));
    const hex = r() < 0.3 ? S.top[0] : S.loose, k = 0.85 + r() * 0.25;
    parts.push(painted(g, () => lin(hex, k)));
  }
  return mergeGeometries(parts);
}

export function dressWall(game, w, at = null) {
  const mesh = w.mesh, box = mesh.geometry.parameters || {}, W = box.width ?? 4, H = box.height ?? w.h ?? 2.5, T = box.depth ?? 0.8, kind = groundKind(game), seed = (Math.random() * 1e6) | 0;
  mesh.geometry.dispose(); // (the plain box the slab replaces: one of a wall's, Petra's own to make)
  mesh.geometry = slabGeometry(W, H, T, kind, seed); mesh.material = stoneMat();
  const lip = new THREE.Mesh(lipGeometry(W, H, T, kind, seed), stoneMat()); lip.castShadow = true; lip.name = 'earthwall-lip'; mesh.add(lip);
  const foot = at ? at.y : w.y - H / 2 + 0.3, tint = STRATA[kind].loose, r = rng(seed + 9);
  let crumbleT = 0.3, sank = false, rose = false;
  /** Dust rolled along its foot (the art's own one-shot, from end to end). */
  const dustAlong = (k) => {
    mesh.updateWorldMatrix(true, false);
    const from = mesh.localToWorld(_a.set(-W / 2, 0, 0)).setY(foot + 0.1).clone(), to = mesh.localToWorld(_b.set(W / 2, 0, 0)).setY(foot + 0.1).clone();
    game.vfx?.play?.('art.stronghold.dust', { pos: from.clone().lerp(to, 0.5), from, to, dir: new THREE.Vector3(0, 1, 0), tint, power: k, floor: foot });
  };
  return {
    w,
    update(dt, shown) {
      if (!shown) return;
      if (!rose) { rose = true; dustAlong(1); }
      if (!w.body && !sank) { sank = true; dustAlong(1.2); crumbleT = 0; } // (the body let go: the slab sinks back the way it came)
      if ((crumbleT -= dt) > 0) return;
      crumbleT = sank ? 0.06 + r() * 0.08 : 0.22 + r() * 0.35;
      mesh.updateWorldMatrix(true, false);
      const p = mesh.localToWorld(_v.set((r() - 0.5) * W * 0.95, H / 2 + 0.02, (r() < 0.5 ? -1 : 1) * T * 0.48));
      if (p.y < foot + 0.2) return; // (still under the ground, or gone back into it)
      game.vfx?.play?.('art.stronghold.crumble', { pos: p.clone(), dir: new THREE.Vector3(0, 1, 0), tint, power: 1, floor: foot });
    },
    dispose() { mesh.remove(lip); lip.geometry.dispose(); },
  };
}
