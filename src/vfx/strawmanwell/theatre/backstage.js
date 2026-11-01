// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, BACKSTAGE: the wings (the Well's hub lane) dressed as the backstage of Pip's toy theatre, all of it light
// drawn as glow (the light material's: no lamp is added, CLAUDE.md, the light budget):
//   STRAWMAN'S SPOT   a brass thimble hung from the fly beam for a spotlight, aimed at Strawman centre stage: the glow at its mouth, a
//                     shaft of light down through the haze, a pool on the boards round its ball foot and the spill on the back flat
//   THE GHOST LIGHT   the one bare bulb on a stand a theatre leaves burning on an empty stage, in its wire cage on a walnut tripod
//   THE FLY RAIL      a walnut pin rail by the hub's door, its brass belaying pins, a hemp line up to the flies from each and its coil
//                     hung below (the fly lines and sandbags overhead are theatre/overhead.js's, the same as every lane's)
//
// Prior art: the ghost light (a theatre's superstition and its safety: one bulb on a stand, centre stage, all night), a followspot's
// shaft in haze, a hemp house's pin rail and coiled lines, Pollock's backstage scenes.
//
//   dressBackstage(lane, palette, ctx)   (lane: theatre.js's; its `solid` and `glow` sheets take what is drawn)   BACKSTAGE_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { box, rgb, V, hash } from './kit.js';
import { WINGS } from '../../../world/strawmanwell/layout.js';

/** The numbers (lane metres: x along the wings, y over the floor, dz off the plane): the spot's place and its light, the ghost light's,
 *  the fly rail's; the beam's underside the spot and the lines hang from. */
export const BACKSTAGE_LOOK = {
  beam: 9,
  spot: { dx: -1.6, y: 7.45, dz: 0.45, aim: 1.15, can: [0.2, 0.27, 0.6], shaft: { dz: -0.3, top: 0.24, foot: 1.3, k: [0.2, 0.08] }, mouth: [1.15, 0.65], core: [0.42, 1.25], pool: [1.9, 1.35, 0.55], spill: [5.2, 4.6, 0.2] },
  ghost: { x: 9.25, dz: -0.95, hub: 0.42, top: 1.86, bulb: 2.04, cage: 0.16, core: [0.36, 1.3], halo: [2.0, 0.36], floor: [2.4, 0.15], wall: [3.4, 0.12] },
  rail: { x0: 2.75, x1: 5.85, y: 1.1, dz: -1.75, pins: 8 },
  warm: 0xffcf96, white: 0xfff3dc,
};
const K = BACKSTAGE_LOOK;

/** A rod between two points (a pole, a leg, a wire), `r` thick, `sides` round. */
function rod(S, a, b, r, col, sides = 5) {
  const ax = new THREE.Vector3().subVectors(b, a), len = ax.length(), g = new THREE.CylinderGeometry(r, r, len, sides, 1, true);
  g.translate(0, len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), ax.normalize())).translate(a.x, a.y, a.z);
  S.add(g, typeof col === 'function' ? col : (p, n) => [col[0] * (0.7 + 0.4 * Math.max(0, n.z)), col[1] * (0.7 + 0.4 * Math.max(0, n.z)), col[2] * (0.7 + 0.4 * Math.max(0, n.z))]); g.dispose();
}
/** A glow facing the audience: a square of the light's soft spot, `size` across, `k` its strength. */
function glowAt(G, x, y, z, size, col, k) { const h = size / 2; G.quad(V(x - h, y - h, z), V(x + h, y - h, z), V(x + h, y + h, z), V(x - h, y + h, z), rgb(col, k), [0, 0, 1, 1]); }
/** A glow laid on the boards (facing up), `w` by `d`. */
function glowFloor(G, x, y, z, w, d, col, k) { G.quad(V(x - w / 2, y, z + d / 2), V(x + w / 2, y, z + d / 2), V(x + w / 2, y, z - d / 2), V(x - w / 2, y, z - d / 2), rgb(col, k), [0, 0, 1, 1]); }

/** Strawman's spot: the fixture, its glow, the shaft down to the boards, the pool and the spill behind. */
function spot(lane, P, sx, sz) {
  const S = lane.solid, G = lane.glow, Sp = K.spot, y0 = lane.Y(0);
  const at = V(sx + Sp.dx, lane.Y(Sp.y), lane.Z(Sp.dz)), aim = V(sx, lane.Y(Sp.aim), sz), dir = new THREE.Vector3().subVectors(aim, at).normalize();
  const [r1, r0, h] = Sp.can, can = new THREE.CylinderGeometry(r1, r0, h, 10, 1, false);
  can.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().negate())).translate(at.x, at.y, at.z);
  S.add(can, (p, n) => rgb(P.brass, 0.55 + 0.45 * Math.max(0, n.z) + 0.2 * Math.max(0, n.y))); can.dispose();
  box(S, at.x - 0.035, at.x + 0.035, at.y + 0.1, lane.Y(K.beam), at.z - 0.035, at.z + 0.035, (f) => rgb(P.steel, f === 'f' ? 0.8 : 0.55), 'flr');
  const mouth = at.clone().addScaledVector(dir, h / 2 + 0.02);
  glowAt(G, mouth.x, mouth.y, mouth.z + 0.05, Sp.mouth[0], K.warm, Sp.mouth[1]);
  glowAt(G, mouth.x, mouth.y, mouth.z + 0.06, Sp.core[0], K.white, Sp.core[1]);
  // the shaft: a sheet of light in the haze facing the audience, from the mouth to the boards, bright down its middle
  const Sh = Sp.shaft, z = lane.Z(Sh.dz), top = new THREE.Vector2(mouth.x, mouth.y), foot = new THREE.Vector2(sx + 0.15, y0);
  const along = foot.clone().sub(top), perp = new THREE.Vector2(-along.y, along.x).normalize(), NI = 4, NJ = 6;
  const pt = (i, j) => { const u = j / NJ, w = Sh.top + (Sh.foot - Sh.top) * u, c = top.clone().addScaledVector(along, u).addScaledVector(perp, (i / NI - 0.5) * 2 * w); return V(c.x, c.y, z); };
  const col = (j) => rgb(K.warm, Sh.k[0] + (Sh.k[1] - Sh.k[0]) * (j / NJ));
  const ccw = (() => { const a = pt(0, 0), b = pt(1, 0), d = pt(0, 1); return (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x) > 0; })();
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
    const u0 = i / NI, u1 = (i + 1) / NI, c0 = col(j), c1 = col(j + 1);
    if (ccw) G.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), [c0, c0, c1, c1], [u0, 0.5, u1, 0.5]);
    else G.quad(pt(i + 1, j), pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), [c0, c0, c1, c1], [u1, 0.5, u0, 0.5]);
  }
  const [pw, pd, pk] = Sp.pool, [ww, wh, wk] = Sp.spill;
  glowFloor(G, sx, y0 + 0.008, sz + 0.2, pw * 2, pd * 2, K.warm, pk);
  G.quad(V(sx + 0.5 - ww / 2, y0 + 2.6 - wh / 2, lane.Z(-2.09)), V(sx + 0.5 + ww / 2, y0 + 2.6 - wh / 2, lane.Z(-2.09)), V(sx + 0.5 + ww / 2, y0 + 2.6 + wh / 2, lane.Z(-2.09)), V(sx + 0.5 - ww / 2, y0 + 2.6 + wh / 2, lane.Z(-2.09)), rgb(K.warm, wk), [0, 0, 1, 1]);
}

/** The ghost light: a walnut tripod, a brass pole, the bulb in its wire cage, and its glow on the stand, the boards and the flat. */
function ghostLight(lane, P) {
  const S = lane.solid, G = lane.glow, Gh = K.ghost, x = lane.X(Gh.x), z = lane.Z(Gh.dz), y0 = lane.Y(0), hub = V(x, y0 + Gh.hub, z);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; rod(S, hub, V(x + Math.cos(a) * 0.4, y0, z + Math.sin(a) * 0.4), 0.035, rgb(P.walnut, 1.1)); }
  rod(S, hub, V(x, y0 + Gh.top, z), 0.04, rgb(P.brass, 1.0), 6);
  rod(S, V(x, y0 + Gh.top, z), V(x, y0 + Gh.top + 0.1, z), 0.06, rgb(P.ink, 1.0), 6);
  const bulb = new THREE.IcosahedronGeometry(0.11, 1).scale(1, 1.2, 1).translate(x, y0 + Gh.bulb, z); S.add(bulb, rgb(P.chalk, 1.35)); bulb.dispose();
  const c = Gh.cage;
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; rod(S, V(x + Math.cos(a) * c, y0 + Gh.top + 0.06, z + Math.sin(a) * c), V(x + Math.cos(a) * c, y0 + Gh.bulb + 0.2, z + Math.sin(a) * c), 0.02, rgb(P.steel, 0.8), 4); }
  for (const y of [y0 + Gh.top + 0.08, y0 + Gh.bulb + 0.2]) { const ring = new THREE.TorusGeometry(c, 0.02, 3, 12).rotateX(Math.PI / 2).translate(x, y, z); S.add(ring, rgb(P.steel, 0.85)); ring.dispose(); }
  const by = y0 + Gh.bulb;
  glowAt(G, x, by, z + 0.2, Gh.halo[0], K.warm, Gh.halo[1]);
  glowAt(G, x, by, z + 0.22, Gh.core[0], K.white, Gh.core[1]);
  glowFloor(G, x, y0 + 0.008, z, Gh.floor[0], Gh.floor[0] * 0.8, K.warm, Gh.floor[1]);
  glowAt(G, x, by - 0.2, lane.Z(-2.09), Gh.wall[0], K.warm, Gh.wall[1]);
}

/** The fly rail by the hub's door: the rail on its brackets, the belaying pins, a line up from each and its coil hung below. */
function flyRail(lane, P) {
  const S = lane.solid, R = K.rail, x0 = lane.X(R.x0), x1 = lane.X(R.x1), y = lane.Y(R.y), z = lane.Z(R.dz);
  box(S, x0, x1, y - 0.1, y + 0.1, z - 0.11, z + 0.11, (f) => rgb(P.walnut, f === 't' ? 1.25 : f === 'u' ? 0.45 : 1.0), 'ftulr');
  for (const bx of [x0 + 0.2, x1 - 0.2]) box(S, bx - 0.07, bx + 0.07, y - 0.45, y - 0.1, z - 0.4, z + 0.05, rgb(P.walnut, 0.7), 'flr');
  const hemp = rgb(P.linen, 0.78);
  for (let i = 0; i < R.pins; i++) {
    const px = x0 + 0.2 + ((x1 - x0 - 0.4) * i) / (R.pins - 1), pz = z + 0.06;
    rod(S, V(px, y - 0.22, pz), V(px, y + 0.2, pz), 0.032, rgb(P.brass, 1.05), 6);
    box(S, px - 0.03, px + 0.03, y + 0.12, lane.Y(K.beam), pz - 0.03, pz + 0.03, (f) => rgb(P.linen, f === 'f' ? 0.8 : 0.55), 'flr');
    // the coil hung on its pin as a hank: two turns of thick hemp, uneven, so it reads as rope and never as a letter
    for (const [r, dx, dy, dz] of [[0.16, 0, 0, 0.05], [0.13, 0.04 * (hash(i * 7) - 0.5), -0.05, 0.09]]) {
      const coil = new THREE.TorusGeometry(r + 0.03 * hash(i + dy), 0.062, 4, 10).scale(1.05, 1.2, 1).rotateZ(0.25 * (hash(i * 5) - 0.5)).translate(px + dx, y - 0.4 + dy - 0.06 * hash(i * 3), pz + dz);
      S.add(coil, (p, n) => [hemp[0] * (0.62 + 0.45 * Math.max(0, n.z)), hemp[1] * (0.62 + 0.45 * Math.max(0, n.z)), hemp[2] * (0.62 + 0.45 * Math.max(0, n.z))]); coil.dispose();
    }
  }
}

/** The wings' backstage: Strawman's spot, the ghost light, the fly rail. */
export function dressBackstage(lane, P, ctx) {
  const sm = ctx.well?.wings?.strawman?.group, at = sm ? sm.getWorldPosition(new THREE.Vector3()) : null;
  spot(lane, P, at ? at.x : lane.X(WINGS.strawman), at ? at.z : lane.Z(-1.1));
  ghostLight(lane, P);
  flyRail(lane, P);
}
