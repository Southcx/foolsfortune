// ---------------------------------------------------------------------------------------
// THE SADDLE'S LOOK (plain name; Petra's round of 2026-11-02, v399: "the saddle's look on `game.jellyMount.rider.saddle`"; South's
// ruling the same day: the Pneuka Jar rides a mount in a saddle, the Courier only the Solar Skiff). Petra's placeholder clay ring
// (courier/jellymount/jarrider.js `ensureSaddle`) dressed as a Japanese lacquered riding saddle made for a pot, sat on the slip
// jelly's crown, the Jar seated in it:
//   THE CLOTH     the saddle cloth (shitagura) draped over the crown, vermilion lacquer red with a gold band at its hem, sagging down the
//                 jelly's shoulders on both sides so it reads as laid on a soft body
//   THE TREE      the saddle's two arches (the front's maewa, the back's shizuwa) in black lacquer with a gold rim and mother-of-pearl
//                 inlay (raden), the back one taller, standing either side of the Jar
//   THE WELL      a low clay well at the Jar's foot, a gold collar round its lip and four bronze tines (the cradle's look's own words,
//                 vfx/cradlelook.js, at the Jar's size): the Jar sits in a cradle on any mount
//   THE TASSELS   two red silk tassels (fusa) on gold cords off the back arch, swinging with the mount's motion (a damped pendulum each,
//                 driven by the saddle's own acceleration: a hop throws them up, a landing swings them down, a turn sways them out)
// Looks only: Petra's runtime places the Group (`place`), shows and hides it; this only puts its children in and swings the tassels.
//
// Prior art: the Japanese kura (lacquered saddle trees with raden inlay, the Edo period's in the Met and the Tokyo National Museum),
// the shitagura and the shirigai's silk tassels of Edo horse tack, Yoshi's saddle (Super Mario World), Dragon Quest's slime knight
// (a rider on a slime), the cradle's look (the Jar's well, the gold collar, the four tines).
//
//   dressSaddle(group, game)   (once: its placeholder children removed)   swingSaddle(group, dt)   (each frame while shown)
//   SADDLE_LOOK (its sizes, colours and the tassels' spring)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Sizes in metres (the Jar's foot is about 0.5 across), colours, and the tassels' damped pendulum. */
export const SADDLE_LOOK = {
  cloth: { rx: 0.62, rz: 0.5, sag: 0.26, hem: 0.045, red: 0xa8231c, gold: 0xd9b25a },
  tree: { front: 0.26, back: 0.4, w: 0.5, thick: 0.07, z: 0.33, black: 0x15110f, pearl: 0xcfe6ef },
  well: { r: 0.29, h: 0.08, clay: 0x9a5b3c, collar: 0xd9b25a, tine: 0x8a6a3a },
  tassel: { cord: 0.18, len: 0.2, r: 0.045, red: 0xc0262a, k: 38, damp: 3.2, push: 0.06, max: 1.25 },
};

const _p = new THREE.Vector3();

/** The saddle cloth: an ellipse laid over a dome and drooped at its edges, its hem a gold band. */
function clothGeometry(L) {
  const g = new THREE.CircleGeometry(1, 40, 0, Math.PI * 2); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    p.setXYZ(i, x * L.rx, -L.sag * r * r * (0.75 + 0.25 * Math.abs(x)), z * L.rz);
  }
  g.computeVertexNormals(); return g;
}
function hemGeometry(L) {
  const pts = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); pts.push(new THREE.Vector3(x * L.rx, -L.sag * (0.75 + 0.25 * Math.abs(x)) - 0.005, z * L.rz)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, L.hem * 0.5, 6, true);
}
/** One saddle arch: a thick lacquered half-ring standing across the mount, its feet on the cloth. */
function archGeometry(h, w, thick) {
  const s = new THREE.Shape(), r = w / 2, rin = r - thick * 1.6;
  s.moveTo(-r, 0); s.absellipse(0, 0, r, h, Math.PI, 0, true); s.lineTo(rin, 0); s.absellipse(0, 0, rin, h - thick * 1.4, 0, Math.PI, false); s.lineTo(-r, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 20 });
  g.translate(0, 0, -thick / 2); return g;
}

export function dressSaddle(group, game) {
  if (!group || group.userData.dressed) return;
  for (const c of [...group.children]) { group.remove(c); c.geometry?.dispose?.(); }
  const L = SADDLE_LOOK, add = (geo, mat, at, rot) => { const m = new THREE.Mesh(geo, mat); if (at) m.position.set(...at); if (rot) m.rotation.set(...rot); m.castShadow = true; group.add(m); return m; };
  const lacquer = (c, rough = 0.28) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: L.cloth.gold, roughness: 0.3, metalness: 0.85 });
  // the cloth, a little above the crown so the jelly's melt does not swallow it
  add(clothGeometry(L.cloth), lacquer(L.cloth.red, 0.45), [0, 0.02, 0]); add(hemGeometry(L.cloth), gold, [0, 0.02, 0]);
  // the two arches, front lower, back taller, gold rims and pearl dots
  const T = L.tree, black = lacquer(T.black, 0.22), pearl = new THREE.MeshStandardMaterial({ color: T.pearl, roughness: 0.15, metalness: 0.2, emissive: 0x223038, emissiveIntensity: 0.4 });
  for (const [h, z] of [[T.front, T.z], [T.back, -T.z]]) {
    add(archGeometry(h, T.w, T.thick), black, [0, 0.02, z]);
    const rim = new THREE.TorusGeometry(T.w / 2 + 0.004, 0.012, 6, 28, Math.PI); rim.scale(1, h / (T.w / 2), 1);
    add(rim, gold, [0, 0.02, z + Math.sign(z) * (T.thick / 2 + 0.012)]);
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.15 + 0.7 * (k / 4)); add(new THREE.SphereGeometry(0.016, 8, 6), pearl, [Math.cos(a) * T.w * 0.38, 0.02 + Math.sin(a) * h * 0.78, z + Math.sign(z) * (T.thick / 2 + 0.008)]); }
  }
  // the well at the Jar's foot: clay, a gold collar, four tines
  const W = L.well, clay = new THREE.MeshStandardMaterial({ color: W.clay, roughness: 0.85 });
  add(new THREE.CylinderGeometry(W.r * 1.15, W.r * 1.25, W.h, 8), clay, [0, W.h / 2, 0]);
  add(new THREE.TorusGeometry(W.r, 0.018, 6, 28), gold, [0, W.h, 0], [Math.PI / 2, 0, 0]);
  const tine = new THREE.MeshStandardMaterial({ color: W.tine, roughness: 0.4, metalness: 0.75 });
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, m = add(new THREE.ConeGeometry(0.022, 0.13, 5), tine, [Math.cos(a) * W.r, W.h + 0.05, Math.sin(a) * W.r]); m.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); }
  // the tassels: a pivot at each end of the back arch, a cord and a silk tassel hanging from it
  const S = L.tassel, red = new THREE.MeshStandardMaterial({ color: S.red, roughness: 0.7 }), tassels = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * T.w * 0.48, 0.02 + T.back * 0.35, -T.z - 0.05); group.add(pivot);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, S.cord, 5), gold); cord.position.y = -S.cord / 2; pivot.add(cord);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(S.r * 0.7, 8, 6), gold); knot.position.y = -S.cord; pivot.add(knot);
    const body = new THREE.Mesh(new THREE.ConeGeometry(S.r, S.len, 10, 1, true), red); body.rotation.x = Math.PI; body.position.y = -S.cord - S.len / 2 - 0.01; pivot.add(body);
    for (const m of [cord, knot, body]) m.castShadow = true;
    tassels.push({ pivot, ax: 0, az: 0, vx: 0, vz: 0, side: s });
  }
  group.userData.dressed = true; group.userData.tassels = tassels; group.userData.last = null; group.userData.vel = new THREE.Vector3();
}

/** The tassels swung by the saddle's own acceleration (in its frame), a damped pendulum each. */
export function swingSaddle(group, dt) {
  const U = group?.userData; if (!U?.tassels || !group.visible || !(dt > 0)) return;
  const S = SADDLE_LOOK.tassel; group.updateMatrixWorld(true); _p.setFromMatrixPosition(group.matrixWorld);
  if (!U.last) { U.last = _p.clone(); return; }
  const v = _p.clone().sub(U.last).divideScalar(dt); U.last.copy(_p);
  if (v.length() > 60) { U.vel.copy(v.set(0, 0, 0)); return; } // (a placement jump, not motion: no swing from a teleport)
  const acc = v.clone().sub(U.vel).divideScalar(dt); U.vel.copy(v);
  const inv = new THREE.Quaternion().setFromRotationMatrix(group.matrixWorld).invert(); acc.applyQuaternion(inv);
  for (const t of U.tassels) {
    // a pendulum's angle answers the frame's acceleration against it, gravity pulling it home
    t.vx += (-S.k * t.ax - S.damp * t.vx + acc.z * S.push * (1 + 0.3 * acc.y * 0.02)) * dt;
    t.vz += (-S.k * t.az - S.damp * t.vz - acc.x * S.push) * dt;
    t.ax = Math.max(-S.max, Math.min(S.max, t.ax + t.vx * dt)); t.az = Math.max(-S.max, Math.min(S.max, t.az + t.vz * dt));
    t.pivot.rotation.set(t.ax, 0, t.az);
  }
}
