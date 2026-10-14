// ---------------------------------------------------------------------------------------
// THE BUOYS' DRESS (docs/plans/SKIFF-RACING.md section 12; Dovina's handoff of 2026-10-14, item 9): Dovina's buoy runs (world/raceway/
// buoys.js: a grey pole and a red or yellow ball, red passed on its right, yellow on its left) dressed as the Raceway's own kit, glazed
// stone and gold, read at speed with no words:
//   - THE POST: a low stone plinth, an eight-sided post glazed as the grind rails are (an iron-dark drip below, the amber ame glaze
//     above), gold bands at its foot and its capital.
//   - THE FLOAT: a glazed bulb on the capital, a copper red (sang de boeuf) or an iron yellow, banded cream at its waist: the colour is
//     the side, as Dovina's was.
//   - THE MARK: on the face toward the oncoming board, a double chevron pointing to the side to pass (cream on the red, iron-dark on the
//     yellow), and on its crown a gold vane, a flat arrowhead pointing the same way, so the side reads in silhouette from any angle.
//   - A buoy passed on its side (skiff.buoy { hit }): a ring and glints in the float's colour; missed, a dull puff.
// Every buoy of every track is one merged mesh in the plates' glyph's material (the vertex-coloured standard: vfx/racewaylooks.js), one
// draw call and its shadow; the passes are the library's (vfx/skiffboardeffects.js) on the shared particle pools.
//
// Prior art: Wave Race 64's buoys (red and yellow, a side each, the arrow on the float), the IALA lateral marks (a buoy's colour and its
// topmark say the side to pass), a weathervane's arrow, the Raceway's grind rails (vfx/racewaylooks.js) for the glaze.
//
//   const B = new RacewayBuoys(game, { parent, vfx })   B.dress(raceway)   B.pass(e)   B.dispose()   BUOY_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUOYS } from '../world/raceway/buoys.js';
import { RW } from '../world/raceway/track.js';

/** The numbers (m): the plinth, the post (radius, height), the float (radius, its squash, the height of its middle), the chevrons on its
 *  face and the vane on its crown; the colours; how near (m) a pass looks for its buoy. */
export const BUOY_LOOK = {
  plinth: { r: 0.6, h: 0.35 }, post: { r: 0.17, h: 2.9 }, float: { r: 0.62, squash: 0.86, y: 3.45 },
  chevron: { w: 0.22, h: 0.3, t: 0.09, gap: 0.2 }, vane: { len: 0.7, w: 0.32, up: 0.62 },
  colour: { stone: 0x5e5048, drip: 0x4a2414, body: 0xb8692e, gold: 0xffd696, red: 0xa8261c, yellow: 0xf0c23a, band: 0xfff0c8, onRed: 0xfff3d6, onYellow: 0x2a1810 },
  near: 24,
};

/** A geometry painted one colour (non-indexed, position, normal and colour only: so any of them merge). */
function painted(geo, colour) {
  const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(colour), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
/** Flat triangles ([x, y, z] each) facing `n`, painted; `both`: the back face too. */
function flat(tris, n, colour, both = false) {
  const pos = [], nor = [], col = [], c = new THREE.Color(colour), N = new THREE.Vector3(...n), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  const push = (a, b, d, s) => { for (const p of [a, b, d]) { pos.push(...p); nor.push(N.x * s, N.y * s, N.z * s); col.push(c.r, c.g, c.b); } };
  for (const [a, b, d] of tris) {
    A.fromArray(a); B.fromArray(b); C.fromArray(d);
    const front = B.sub(A).cross(C.sub(A)).dot(N) >= 0;
    if (front) push(a, b, d, 1); else push(a, d, b, 1);
    if (both) { if (front) push(a, d, b, -1); else push(a, b, d, -1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** One buoy in its own frame: +X the side to pass it (`side` +1, or -1), Y up, +Z toward the oncoming board. */
function buoyGeometry(red) {
  const L = BUOY_LOOK, C = L.colour, P = L.post, F = L.float, side = red ? 1 : -1, parts = [];
  parts.push(painted(new THREE.CylinderGeometry(L.plinth.r * 0.85, L.plinth.r, L.plinth.h, 8).translate(0, L.plinth.h / 2 - 0.08, 0), C.stone));
  parts.push(painted(new THREE.CylinderGeometry(P.r, P.r * 1.12, P.h * 0.38, 8).translate(0, L.plinth.h + P.h * 0.19 - 0.08, 0), C.drip)); // (the drip line below)
  parts.push(painted(new THREE.CylinderGeometry(P.r * 0.92, P.r, P.h * 0.62, 8).translate(0, L.plinth.h + P.h * 0.69 - 0.08, 0), C.body)); // (the amber glaze above)
  for (const y of [L.plinth.h + 0.06, L.plinth.h + P.h - 0.2]) parts.push(painted(new THREE.TorusGeometry(P.r * 1.15, 0.045, 4, 12).rotateX(Math.PI / 2).translate(0, y, 0), C.gold));
  parts.push(painted(new THREE.CylinderGeometry(P.r * 1.9, P.r * 1.2, 0.18, 8).translate(0, L.plinth.h + P.h - 0.02, 0), C.gold)); // (the capital the float sits in)
  parts.push(painted(new THREE.SphereGeometry(F.r, 16, 10).scale(1, F.squash, 1).translate(0, F.y, 0), red ? C.red : C.yellow));
  parts.push(painted(new THREE.TorusGeometry(F.r * 1.005, 0.05, 4, 24).rotateX(Math.PI / 2).translate(0, F.y, 0), C.band));
  // the double chevron on the face toward the board, pointing to the side to pass
  const K = L.chevron, z = F.r * 1.02 + 0.02, tris = [];
  for (let j = 0; j < 2; j++) {
    const x0 = side * (-K.gap * 0.5 + j * K.gap) - side * K.w * 0.5, tip = x0 + side * K.w, y = F.y, h = K.h, t = K.t;
    tris.push([[x0, y + h, z], [tip, y, z], [tip - side * t, y, z]], [[x0, y + h, z], [tip - side * t, y, z], [x0 - side * t, y + h, z]]);
    tris.push([[x0, y - h, z], [tip - side * t, y, z], [tip, y, z]], [[x0, y - h, z], [x0 - side * t, y - h, z], [tip - side * t, y, z]]);
  }
  parts.push(flat(tris, [0, 0, 1], red ? C.onRed : C.onYellow));
  // the gold vane on the crown: an arrowhead standing on its edge, pointing to the side (seen in silhouette from either face)
  const V = L.vane, yv = F.y + F.r * F.squash + 0.02, half = V.len / 2;
  const vane = [[[side * half, yv + V.w * 0.5, 0], [-side * half * 0.2, yv + V.w, 0], [-side * half * 0.2, yv, 0]], [[-side * half * 0.2, yv + V.w * 0.72, 0], [-side * half, yv + V.w * 0.72, 0], [-side * half * 0.2, yv + V.w * 0.28, 0]], [[-side * half, yv + V.w * 0.72, 0], [-side * half, yv + V.w * 0.28, 0], [-side * half * 0.2, yv + V.w * 0.28, 0]]];
  parts.push(flat(vane, [0, 0, 1], C.gold, true));
  parts.push(painted(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 5).translate(0, yv + 0.04, 0), C.gold));
  return mergeGeometries(parts);
}

let MAT = null;
/** The plates' glyph's program (vertex colours, a little emissive gold): a material of its own, so its glow is never the plates' shimmer. */
function material() {
  if (MAT) return MAT;
  MAT = new THREE.MeshStandardMaterial({ name: 'raceway-buoys', vertexColors: true, roughness: 0.35, metalness: 0.1, emissive: 0xffb84a, emissiveIntensity: 0.08 });
  MAT.userData.shared = true;
  return MAT;
}

export class RacewayBuoys {
  constructor(game, o = {}) { this.game = game; this.parent = o.parent || null; this.vfxOf = o.vfx || (() => game.vfx); this.mesh = null; this.list = []; }

  /** Built over Dovina's poles and balls (her group hidden): every track's buoys in one mesh. */
  dress(R) {
    if (!R?.buoys?.group) return this;
    this.dispose();
    const geo = { true: buoyGeometry(true), false: buoyGeometry(false) }, parts = [], m = new THREE.Matrix4(), x = new THREE.Vector3(), y = new THREE.Vector3(0, 1, 0), z = new THREE.Vector3();
    for (const [id, list] of Object.entries(BUOYS)) {
      const T = R.trackOf?.(id); if (!T) continue;
      for (const [s, lat, pass] of list) {
        const F = T.frame(s), px = RW.x + F.x - F.fz * lat, pz = RW.z + F.z + F.fx * lat, py = R.rideHeight(px, pz), red = pass === 'right';
        x.set(-F.fz, 0, F.fx).normalize(); z.crossVectors(x, y); // (+X the Courier's right as they come, +Z toward them)
        m.makeBasis(x, y, z).setPosition(px, py, pz);
        parts.push(geo[red].clone().applyMatrix4(m));
        this.list.push({ track: id, red, at: new THREE.Vector3(px, py + BUOY_LOOK.float.y, pz) });
      }
    }
    geo.true.dispose(); geo.false.dispose();
    if (!parts.length) return this;
    this.mesh = new THREE.Mesh(mergeGeometries(parts), material());
    for (const p of parts) p.dispose();
    Object.assign(this.mesh, { name: 'raceway-buoys', castShadow: true, receiveShadow: true, frustumCulled: false });
    this.mesh.userData.zone = 'raceway';
    (this.parent || this.game.scene).add(this.mesh);
    R.buoys.group.visible = false; R.buoys.group.userData.dressed = true;
    return this;
  }
  /** skiff.buoy: the buoy just passed (the nearest float on the Courier's track) answers: a ring in its colour, or a dull puff. */
  pass(e) {
    const at = this.game.player?.pos, V = this.vfxOf(); if (!at || !V || !this.list.length) return;
    const id = this.game.raceway?.track?.id; let best = null, bd = BUOY_LOOK.near * BUOY_LOOK.near;
    for (const b of this.list) { if (id && b.track !== id) continue; const d = (b.at.x - at.x) ** 2 + (b.at.z - at.z) ** 2; if (d < bd) { bd = d; best = b; } }
    if (!best) return;
    const C = BUOY_LOOK.colour;
    V.play(e?.hit ? 'raceway.buoy.pass' : 'raceway.buoy.miss', { pos: best.at, tint: best.red ? C.red : C.yellow });
  }
  dispose() { if (this.mesh) { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; } this.list = []; }
}
