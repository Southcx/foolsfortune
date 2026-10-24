// ---------------------------------------------------------------------------------------
// A SAIL'S CUT (the owner, 2026-10-24: "more sails, new paintjobs for the skiff ... build, build, build"): the Solar Skiff's sail's
// silhouette as worn (`game.skiffPaint.worn.cut`, Dovina's PAINT row when it is there; the stock cut until then and for any id it does not
// know). A look only, never a number: the sail's numbers are its part's (progress/skiffparts.js PARTS, SAIL), never its cut's.
//   stock     the owner's lug, as made
//   lateen    a long yard slung low from the mast's foot and raised aft, the cloth a triangle under it (the dhow's, the felucca's)
//   junk      the yard dropped a little and peaked aft, the luff stood forward of the mast (a balanced lug), the leech bowed out and cut
//             into panels: battens across the cloth (drawn into the baked cloth by vfx/skiffpaintlook.js) and the cloth sagging between
//             them at the leech (the Chinese junk's)
//   crabclaw  the yard slung from the tack and raised steep, the boom the lower spar, the free edge between them hollowed into a claw
//             (the Polynesian and Micronesian crab-claw, the proa's)
// HOW: the same cloth mesh, the same material and program, the same bones. A cut is (1) where the yard goes, as a delta over its pose
// (`yard`: its pivot moved along and down the boom, tilted aft-up about its own beam axis, lengthened), applied each frame after the
// clip and the code's hoist and scaled by the hoist (furled, the delta is none: the yard comes down as ever); and (2) the cloth's bind
// positions solved so that, under that yard at full hoist, the cloth lands on the cut's silhouette. Linear blend skinning puts a vertex
// at (1 - w) p + w E p (w its weight on the yard and yard_2, E the yard's change since bind, the boom's family unchanged), so for a wanted
// place q the bind place is p = ((1 - w) I + w E)^-1 q: the cloth hangs from the yard where the yard now is, and the spar and the cloth
// agree without a new mesh. The silhouette is laid by rows (the sail is a grid of 8 x 7: luff to leech `s`, foot to head `h`): the
// foot along the boom (`foot`), the head along the yard as moved (the stock head's points carried by E), the rows between straight, and
// a cut's own shaping on top (a roach, scallops, the claw's hollow). Each cut's geometry is a copy (built once, kept): the stock
// geometry is kept on the copy's userData (`stockCloth`) so a clone of the board (the rivals', the ghost's) can put it back.
//
// Prior art: the dhow's lateen, the junk's battened lug and the Pacific crab-claw (Haddon and Hornell's Canoes of Oceania; the junk rig
// in Hasler and McLeod's Practical Junk Rig); Wind Waker's King of Red Lions' one cloth on one rig; retargeting a skin by solving its
// bind pose (the inverse of linear blend skinning, as a rig's corrective shapes are baked).
//
//   const cut = new SailCut(skiff)   cut.set(id)  (vfx/skiffpaintlook.js apply)   cut.pose(bones, L)  (boat.js own, after the hoist)
//   SAIL_CUT_LOOK (the numbers)   SAIL_CUT_IDS   cutBattens(id) -> [v, v] | null (the junk's battens in the cloth's UVs)
//   cutGeometry(stockGeo, id, { yardBind, yardBones, bindMatrix }) -> BufferGeometry (pure: scripts can run it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The numbers, in the model's metres (z forward, y up, the sail in the plane x = 0). `yard`: its pivot moved aft (dy, - forward) and up
 *  the mast (dz, - down) in the boom's frame, tilted aft-up (rad) and lengthened (x). `foot`: the foot's forward end and aft end (z) and
 *  how far its aft end curls up (m, by s^3). The shaping: `roach` the leech bowed aft (m at mid-height), `scallop` the leech pulled in on
 *  the rows between battens (m), `hollow` the free edge drawn toward the tack (m at mid-height), `battenRows` the rows that are
 *  battens. */
export const SAIL_CUT_LOOK = {
  lateen: { yard: { dy: -0.35, dz: -1.66, tilt: 0.667, len: 2.13 }, foot: [0.78, -1.545, 0], roach: 0.1 },
  junk: { yard: { dy: -0.25, dz: -0.4, tilt: 0.297, len: 1.3 }, foot: [0.66, -1.5, 0], roach: 0.28, scallop: 0.13, battenRows: [2, 4] },
  crabclaw: { yard: { dy: -0.25, dz: -1.7, tilt: 0.873, len: 1.75 }, foot: [0.66, -1.62, 0.2], hollow: 0.5 },
};
export const SAIL_CUT_IDS = ['stock', ...Object.keys(SAIL_CUT_LOOK)];
const ROWS = 7; // (the sail's grid: rows foot to head)

/** The junk's battens as v in the cloth's UVs (the rows' own v: foot 0.98, head 0.02), or null for a cut with none. */
export function cutBattens(id, v0 = 0.98, v1 = 0.02) {
  const C = SAIL_CUT_LOOK[id]; if (!C?.battenRows) return null;
  return C.battenRows.map((r) => v0 + (v1 - v0) * (r / (ROWS - 1)));
}

/** The yard's change since bind (E) for a cut at full hoist, in the cloth's bind space: Yb . T(dy, dz) R_x(tilt) S(1, len, 1) . Yb^-1. */
function yardChange(C, yardBind) {
  const Y = C.yard, D = new THREE.Matrix4().compose(new THREE.Vector3(0, Y.dy, Y.dz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Y.tilt), new THREE.Vector3(1, Y.len, 1));
  return new THREE.Matrix4().copy(yardBind).multiply(D).multiply(new THREE.Matrix4().copy(yardBind).invert());
}

/** A cut's cloth: the stock geometry copied, its sail's bind positions solved for the cut (the pennant's strip as it was). */
export function cutGeometry(stock, id, { yardBind, yardBones, bindMatrix = new THREE.Matrix4(), penU = 0.75 }) {
  const C = SAIL_CUT_LOOK[id]; if (!C) return stock;
  const geo = stock.clone(); geo.userData = { stockCloth: stock, cut: id };
  const P = geo.attributes.position, U = geo.attributes.uv, J = geo.attributes.skinIndex, W = geo.attributes.skinWeight;
  const bind = bindMatrix, unbind = new THREE.Matrix4().copy(bind).invert();
  const E = yardChange(C, yardBind);
  // the stock sail's frame, read off the cloth (bind space): its luff, foot and head, its leech's ends, and its UVs' corners
  const sail = []; for (let i = 0; i < P.count; i++) if (U.getX(i) < penU) sail.push(i);
  const v3 = (i) => new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(bind);
  let u0 = 1, u1 = 0, va = 0, vb = 1; for (const i of sail) { u0 = Math.min(u0, U.getX(i)); u1 = Math.max(u1, U.getX(i)); va = Math.max(va, U.getY(i)); vb = Math.min(vb, U.getY(i)); }
  const sOf = (i) => (U.getX(i) - u0) / (u1 - u0), hOf = (i) => (va - U.getY(i)) / (va - vb);
  const corner = (s, h) => { let best = null, bd = 9; for (const i of sail) { const d = Math.abs(sOf(i) - s) + Math.abs(hOf(i) - h); if (d < bd) { bd = d; best = i; } } return v3(best); };
  const footL = corner(0, 0), headL = corner(0, 1), headA = corner(1, 1);
  const lerp = THREE.MathUtils.lerp, q = new THREE.Vector3(), M = new THREE.Matrix4(), I = new THREE.Matrix4(), chord = new THREE.Vector3();
  const headAt = (s) => new THREE.Vector3(0, headL.y, lerp(headL.z, headA.z, s)).applyMatrix4(E);
  const footAt = (s) => new THREE.Vector3(0, footL.y + (C.foot[2] || 0) * s * s * s, lerp(C.foot[0], C.foot[1], s));
  const tack = footAt(0);
  for (const i of sail) {
    const s = sOf(i), h = hOf(i), r = Math.round(h * (ROWS - 1));
    // the head: the stock head's point carried by the yard as moved; the foot: along the boom, its aft end curled up (the claw's horn)
    const head = headAt(s), foot = footAt(s);
    q.lerpVectors(foot, head, h); q.x = 0;
    const mid = Math.sin(Math.PI * h);
    if (C.roach) q.z -= C.roach * mid * s;                                        // (the leech bowed aft)
    if (C.scallop && r % 2 === 1) q.z += C.scallop * s * s;                       // (between battens the cloth sags in at the leech)
    if (C.hollow) { const d = tack.clone().sub(chord.lerpVectors(footAt(1), headAt(1), h)).normalize(); q.addScaledVector(d, C.hollow * mid * s * s); } // (the claw's hollow: its free edge drawn toward the tack)
    // the bind place for it: p = ((1 - w) I + w E)^-1 q, w its weight on the yard
    let w = 0; for (let k = 0; k < 4; k++) if (yardBones.has(J.getComponent(i, k))) w += W.getComponent(i, k);
    const sum = W.getX(i) + W.getY(i) + W.getZ(i) + W.getW(i); w /= sum || 1;
    for (let k = 0; k < 16; k++) M.elements[k] = I.elements[k] * (1 - w) + E.elements[k] * w;
    const p = q.clone().applyMatrix4(M.invert()).applyMatrix4(unbind);
    P.setXYZ(i, p.x, p.y, p.z);
  }
  P.needsUpdate = true;
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  return geo;
}

export class SailCut {
  constructor(skiff) {
    this.skiff = skiff; this.id = 'stock'; this.geos = {}; this.Q = new THREE.Quaternion(); this.X = new THREE.Vector3(1, 0, 0);
    skiff.model?.traverse((o) => { if (!this.mesh && o.isSkinnedMesh && !o.userData.isOutline && o.material?.name === 'Skiff_Cloth') this.mesh = o; });
    this.stock = this.mesh?.geometry ?? null;
  }
  /** Wear a cut (an id it does not know: the stock cut). */
  set(id) {
    const m = this.mesh; if (!m || !this.stock) return;
    if (!SAIL_CUT_LOOK[id]) id = 'stock';
    if (id === this.id && m.geometry === (this.geos[id] ?? this.stock)) return;
    this.id = id;
    if (id === 'stock') { m.geometry = this.stock; return; }
    if (!this.geos[id]) {
      const bones = m.skeleton.bones, yardBones = new Set(bones.map((b, k) => (/^yard/.test(b.name) ? k : -1)).filter((k) => k >= 0));
      const yi = bones.findIndex((b) => b.name === 'yard'); if (yi < 0) { this.id = 'stock'; return; }
      this.geos[id] = cutGeometry(this.stock, id, { yardBind: m.skeleton.boneInverses[yi].clone().invert(), yardBones, bindMatrix: m.bindMatrix });
    }
    m.geometry = this.geos[id];
  }
  /** The yard as the cut wears it, by the hoist (L 0..1): after the clip and the code's hoist (boat.js own), which write it every frame. */
  pose(B, L) {
    const C = SAIL_CUT_LOOK[this.id], y = B?.yard; if (!C || !y) return;
    const k = THREE.MathUtils.clamp(L, 0, 1), Y = C.yard;
    y.position.y += Y.dy * k; y.position.z += Y.dz * k;
    y.quaternion.multiply(this.Q.setFromAxisAngle(this.X, Y.tilt * k));
    y.scale.y *= 1 + (Y.len - 1) * k;
  }
  dispose() { if (this.mesh && this.stock) this.mesh.geometry = this.stock; for (const g of Object.values(this.geos)) g.dispose(); this.geos = {}; }
}
