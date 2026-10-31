// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, THE DOORS AND THE PENNANTS: Dovina's `door` placeholders and the goal flags' `mark` drawn as the toy
// theatre's (her plates and words over the doors stay as they are):
//   A STAGE DOOR   a door on the back flat (the wings' doors, a stage's way back) as a printed walnut door in a maple architrave under a
//                  walnut cornice, keylined, a maple step before it; it never moves, so it joins the lane's one mesh
//   A SHUTTER      a tall door that slides up (the Machine's switch door, the Flood's sluice) as walnut boards in brass straps, flown on
//                  two threads with a brass ring at its head: drawn as a child of her own mesh, so it rides wherever her mechanics move it
//   THE PENNANT    a goal flag as a theatre's swallowtail pennant in velvet, a gold button sewn on, a gold sleeve at its hoist, a child of
//                  her flag (the Brawl's flag hidden and raised with it), fluttering on the hoist
// Her mesh stays the collider's partner and the thing her code moves; only its own draw is put out (its material unseen, its hull hidden).
//
// Prior art: a Victorian stage door and its architrave, a flown flat on its lines, the pennants of a toy theatre's proscenium,
// Pollock's printed doors.
//
//   dressDoors(lane, palette, material, riders)   (riders: [{ pivot, phase }] the pennants the theatre flutters)   seen(mesh) (her draw
//   given back)   DOORS_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sheet, box, card, rgb, uvOf, V, hash } from './kit.js';
import { OUTLINES } from '../../../render/outline.js';

/** The numbers (m): the architrave's width, the cornice's, the step's; a shutter's boards, straps and threads; the pennant's tails. */
export const DOORS_LOOK = {
  architrave: 0.13, cornice: { h: 0.09, over: 0.08, out: 0.09 }, step: { h: 0.09, out: 0.28 }, tall: 4,
  shutter: { board: 0.2, strap: 1.6, threads: 0.9, fly: 16 },
  pennant: { tail: 0.16, notch: 0.78, button: 0.11 },
};
const D = DOORS_LOOK;

/** Her own mesh's draw put out (it keeps moving, and its children with it): its material unseen, its hull hidden and out of the
 *  outline reach's set (which would show again a hull it had culled). `seen(mesh)` gives it back. */
function unseen(mesh) {
  if (mesh.material) mesh.material.visible = false;
  for (const c of mesh.children) if (c.userData.isOutline) { c.visible = false; c.userData.farCulled = false; OUTLINES.delete(c); }
}
export function seen(mesh) {
  if (mesh.material) mesh.material.visible = true;
  for (const c of mesh.children) if (c.userData.isOutline) { c.visible = true; OUTLINES.add(c); }
}

function stageDoor(lane, P, mesh, { w, h, d }) {
  const S = lane.solid, c = mesh.getWorldPosition(new THREE.Vector3()), x0 = c.x - w / 2, x1 = c.x + w / 2, y0 = c.y - h / 2, y1 = c.y + h / 2, zf = c.z + d / 2;
  const a = D.architrave, C = D.cornice, top = y1 + a + C.h;
  S.quad(V(x0 - a - C.over - 0.05, y0, zf + 0.001), V(x1 + a + C.over + 0.05, y0, zf + 0.001), V(x1 + a + C.over + 0.05, top + 0.05, zf + 0.001), V(x0 - a - C.over - 0.05, top + 0.05, zf + 0.001), rgb(P.ink));
  S.quad(V(x0, y0, zf + 0.004), V(x1, y0, zf + 0.004), V(x1, y1, zf + 0.004), V(x0, y1, zf + 0.004), rgb(0xffffff, 1.0), uvOf('door'));
  const maple = (f) => rgb(P.maple, f === 'f' ? 0.92 : f === 'u' ? 0.45 : 0.62);
  box(S, x0 - a, x0, y0, y1 + a, zf, zf + 0.04, maple, 'ftlr');
  box(S, x1, x1 + a, y0, y1 + a, zf, zf + 0.04, maple, 'ftlr');
  box(S, x0, x1, y1, y1 + a, zf, zf + 0.04, maple, 'fu');
  box(S, x0 - a - C.over, x1 + a + C.over, y1 + a, top, zf, zf + C.out, (f) => rgb(P.walnut, f === 't' ? 1.25 : f === 'u' ? 0.4 : 1.0), 'ftulr');
  box(S, x0 - 0.06, x1 + 0.06, y0, y0 + D.step.h, zf, zf + D.step.out, (f) => rgb(P.maple, f === 't' ? 1.0 : 0.7), 'ftlr');
  lane.hide(mesh);
}

/** A shutter, in her mesh's own frame (its middle the origin): boards, straps, the ring and its two threads up into the flies. */
function shutter(lane, P, mesh, { w, h, d }, mat) {
  const S = new Sheet(), hw = w / 2, hh = h / 2, hd = d / 2, Sh = D.shutter, n = Math.max(2, Math.round(w / Sh.board));
  for (let i = 0; i < n; i++) {
    const xa = -hw + (i * w) / n, xb = xa + w / n, k = 0.82 + 0.2 * hash(i * 3.7 + lane.k);
    for (let y = -hh; y < hh - 1e-3; y += 2.4) { const ye = Math.min(hh, y + 2.4); S.quad(V(xb, y, hd), V(xb, ye, hd), V(xa, ye, hd), V(xa, y, hd), rgb(0xffffff, k), uvOf('walnut', 0, 0, (ye - y) / 2.4, 1)); }
    S.quad(V(xa, -hh, hd + 0.002), V(xa + 0.025, -hh, hd + 0.002), V(xa + 0.025, hh, hd + 0.002), V(xa, hh, hd + 0.002), rgb(P.ink, 0.8));
  }
  for (let y = -hh; y < hh - 1e-3; y += 1.2) {
    const ye = Math.min(hh, y + 1.2), uv = uvOf('walnut', 0, 0, 1, (ye - y) / 1.2), k = rgb(0xffffff, 0.66);
    S.quad(V(hw, y, hd), V(hw, y, -hd), V(hw, ye, -hd), V(hw, ye, hd), k, uv);
    S.quad(V(-hw, y, -hd), V(-hw, y, hd), V(-hw, ye, hd), V(-hw, ye, -hd), k, uv);
  }
  box(S, -hw, hw, -hh, hh, -hd, hd, rgb(P.walnut, 0.8), 'tu');
  for (let y = -hh + Sh.strap / 2; y < hh; y += Sh.strap) box(S, -hw - 0.014, hw + 0.014, y - 0.06, y + 0.06, -hd - 0.014, hd + 0.014, (f) => rgb(P.brass, f === 'f' ? 1.05 : f === 't' ? 1.2 : 0.75), 'ftulr');
  const ring = new THREE.TorusGeometry(0.15, 0.035, 4, 10).translate(0, hh + 0.17, hd * 0.5); S.add(ring, (p, nm) => rgb(P.brass, 0.75 + 0.4 * Math.max(0, nm.z))); ring.dispose();
  for (const z of [-Sh.threads, Sh.threads]) box(S, -0.035, 0.035, hh, hh + Sh.fly, z - 0.035, z + 0.035, (f) => rgb(P.mustard, f === 'f' ? 0.95 : 0.6), 'flr');
  const m = new THREE.Mesh(S.geometry(), mat); m.receiveShadow = true; m.userData.zone = 'strawmanwell'; m.name = 'theatre.shutter';
  mesh.add(m); unseen(mesh);
  return m;
}

/** The pennant on a goal flag, in her flag's frame: a velvet swallowtail on a pivot at the hoist (the theatre flutters it). */
function pennant(lane, P, mesh, { w, h }, mat, riders) {
  const S = new Sheet(), Pn = D.pennant, L = w + 0.12, hh = h / 2 - 0.02, vr = uvOf('velvet');
  const pts = [[0, -hh], [L, -Pn.tail], [L * Pn.notch, 0], [L, Pn.tail], [0, hh]];
  card(S, pts, 0, {
    thick: 0.04, face: (x) => rgb(P.velvet, 1.2 - 0.35 * (x / L)), edge: rgb(P.linen, 0.9), ink: rgb(P.ink), keyline: 0.035,
    uv: (x) => [vr[0] + (vr[2] - vr[0]) * 0.22 * (x / L), (vr[1] + vr[3]) / 2],
  });
  box(S, -0.035, 0.085, -hh - 0.02, hh + 0.02, -0.04, 0.04, (f) => rgb(P.gold, f === 'f' ? 1.05 : 0.7), 'ftulr');
  const bx = L * 0.36, br = Pn.button;
  const rim = new THREE.CircleGeometry(br + 0.025, 12).translate(bx, 0, 0.026); S.add(rim, rgb(P.ink)); rim.dispose();
  const btn = new THREE.CircleGeometry(br, 12).translate(bx, 0, 0.03); S.add(btn, (p) => rgb(P.gold, 1.1 + 0.35 * (p.y / br))); btn.dispose();
  for (const [dx, dy] of [[-0.03, -0.03], [0.03, -0.03], [-0.03, 0.03], [0.03, 0.03]]) box(S, bx + dx - 0.012, bx + dx + 0.012, dy - 0.012, dy + 0.012, 0.03, 0.033, rgb(P.ink), 'f');
  const pivot = new THREE.Group(); pivot.name = 'theatre.pennant'; pivot.position.set(-w / 2, 0, 0); mesh.add(pivot);
  const m = new THREE.Mesh(S.geometry(), mat); m.receiveShadow = true; m.userData.zone = 'strawmanwell'; pivot.add(m);
  unseen(mesh);
  riders.push({ pivot, phase: hash(lane.k * 5.3) * 6.28 });
  return m;
}

/** The lane's doors and goal flags dressed: a static door merged into the lane's mesh, a tall one and a pennant riding her own. */
export function dressDoors(lane, P, mat, riders) {
  for (const { mesh, box: b } of lane.doors) {
    mesh.updateWorldMatrix(true, false);
    if (b.h > D.tall) shutter(lane, P, mesh, b, mat); else stageDoor(lane, P, mesh, b);
  }
  for (const { mesh, box: b } of lane.flags) pennant(lane, P, mesh, b, mat, riders);
}
