// ---------------------------------------------------------------------------------------
// A SHIP'S PARTS' LOOKS (docs/plans/OPEN-SEA.md 14.4; Dovina's rules, progress/opensea/salvage.js SHIP_PARTS): the sail and the hull a
// ship of the Vessoul's wears on the open sea, drawn over its class's look (shipkit/shiplook.js), a look only (the polar, the turn and
// the hits are Dovina's numbers). Worn by `look.wearParts(worn)`; never worn, a look is exactly as built (the rail's crossing passes
// nothing). Each sail part is drawn in the one sail program ('sloop-sail', shipkit/vane.js) and its spars in the hull's ('ship-hull'):
// no new program.
//   SAIL   stock      the class's own vanes, as built
//          lateen     each mast's vanes struck and one LATEEN set in their place: a long yard slung slanting across the mast (its fore
//                     end low over the bow, its peak high aft) and a triangle of light-cloth under it, its clew sheeted aft to leeward
//          spinnaker  the class's vanes kept and a SPINNAKER flown forward of the foremost mast: a great three-cornered balloon from the
//                     masthead to two clews out wide over the bow, in a warm dyed light-cloth, bellied hard by the wind's fill and
//                     swung round the mast to fly downwind (the wind's way in the ship's frame), collapsing when it does not draw
//          storm      the vanes furled (canvas rolled along every yard, boom and stay, lashed) and a STORM TRYSAIL set low on each mast:
//                     a small heavy triangle of dark tarred canvas, opaque, a short belly
//   HULL   stock      as built
//          scaled     overlapping plates of Lachrymite laid in shingled rows down both sides above the waterline (each row's lower edge
//                     lifted proud of the one below, every other row offset half a plate), each plate dark with the film's schiller
//                     coming up through it by where it lies (oxidation.js schillerInk), and faintly lit in its own colour
//          light      the hull's paint paled to bleached ash and its planks drawn half as wide (hullmaterial.js uPale, uPlank)
//   KEEL   under the waterline, never seen at the helm's camera: no look (the deep and the shallow keel are numbers only)
// The sails go out with the vanes: under FURL or with the masts folding (`set`'s `furled`, the fold's u) they are hidden.
//
// Prior art: real rigs, drawn as rigged: the lateen of a dhow and a felucca (a long yard slung at its third, the tack at the stem's
// head, the sheet aft); a racing yacht's symmetric spinnaker (head at the masthead, the guy and sheet to two clews, flown forward of the
// forestay and squared to run before the wind); the storm trysail of a sea-going cutter (a small heavy sail hoisted on the mast in a
// track, sheeted low aft, everything else furled and lashed). The scaled hull: a pangolin's or a carp's scales (each over the next, the
// free edge down and aft) and the Sea of Thieves' cosmetic hulls (one silhouette, a part read from afar).
//
//   new ShipPartLooks(look)   .wear({ sail, hull, keel })   .pose({ sail, fill, luff, side, t, furled, u, rel })   .hidesVanes   .dispose()
//   (the ShipLook owns one: look.wearParts(worn); the open sea's helm is dressed by ShipPartWear, below)
//   new ShipPartWear(game)   .update()   (each frame: the free helm's look worn as game.shipParts.worn says, rebuilt only when it changes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Mesher, sideAt, loftAt } from './hullkit.js';
import { sailMaterial } from './vane.js';
import { schillerInk } from '../oxidation.js';

let blank = null; // (a 1x1 clear texture: the part sails carry no lotus; made once, never disposed)
const blankTex = () => (blank ||= new THREE.DataTexture(new Uint8Array(4), 1, 1));
/** The parts' colours: the spinnaker's dyed light-cloth and its rim, the storm trysail's tarred canvas, the furled canvas's rolls and
 *  their lashings, the lateen yard's and the trysail's track's wood. */
export const PART_LOOK = {
  spinnaker: { fill: 0xff8a52, edge: 0xffd36a, fillA: 0.62 }, storm: 0x4a4038, furl: 0xd8ccb4, lash: 0x5a4a38, yard: 0x6a4a30,
  pale: { plank: 0.55 }, scale: { size: 0.34, glow: 0.27 },
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Matrix4(), _col = new THREE.Color();

/** A sail's grid: (nu + 1) x (nv + 1) vertices, uv (s, v) with uv.x moved by 2 (no lotus: vane.js), indexed. */
function sheet(nu, nv) {
  const n = (nu + 1) * (nv + 1), uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.push(i / nu + 2, j / nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.userData.nu = nu; g.userData.nv = nv;
  return g;
}
/** A sheet laid between two edges: A(s) what it hangs from, B(s) its free edge, at v between them; its one normal turned to `toward`. */
const _t = new THREE.Vector3();
function lay(g, edgeA, edgeB, toward) {
  _t.copy(toward); const { nu, nv } = g.userData, P = g.attributes.position, N = g.attributes.normal;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const s = i / nu; edgeA(s, _a); edgeB(s, _b); _a.lerp(_b, j / nv); P.setXYZ(j * (nu + 1) + i, _a.x, _a.y, _a.z); }
  edgeA(0.5, _a); edgeA(0.62, _c); edgeB(0.5, _b); _c.sub(_a); _b.sub(_a); _n.crossVectors(_c, _b).normalize();
  if (!Number.isFinite(_n.x) || _n.lengthSq() < 0.5) _n.copy(_t); else if (_n.dot(_t) < 0) _n.negate();
  for (let k = 0; k < P.count; k++) N.setXYZ(k, _n.x, _n.y, _n.z);
  P.needsUpdate = N.needsUpdate = true; g.computeBoundingSphere();
}

export class ShipPartLooks {
  constructor(look) {
    this.look = look; this.group = new THREE.Group(); this.group.name = 'ship-parts'; look.body.add(this.group);
    this.worn = { sail: 'stock', hull: 'stock', keel: 'stock' }; this.items = []; this.mats = []; this.key = ''; this.hidesVanes = false;
    const hu = look.hullMat.userData.u; this.plank = hu.uPlank.value;
  }
  get H() { return Math.max(...(this.look.rig?.masts || [{ height: 10 }]).map((M) => M.height)); }

  /** The parts worn: the sail's and the hull's looks built again (only when they change). */
  wear(worn = {}) {
    const w = { sail: worn.sail || 'stock', hull: worn.hull || 'stock', keel: worn.keel || 'stock' };
    if (this.built && w.sail === this.worn.sail && w.hull === this.worn.hull) { this.worn = w; this.paint(); return this; }
    this.built = true;
    this.clear(); this.worn = w; this.key = '';
    const rig = this.look.rig;
    if (rig && w.sail === 'lateen') this.buildLateen(rig);
    if (rig && w.sail === 'spinnaker') this.buildSpinnaker(rig);
    if (rig && w.sail === 'storm') this.buildStorm(rig);
    if (w.hull === 'scaled' && this.look.spec.hull) this.buildScales();
    this.hidesVanes = !!rig && (w.sail === 'lateen' || w.sail === 'storm');
    this.paint();
    return this;
  }
  /** The hull's paint: paled and thin-planked for the light hull, as built otherwise. */
  paint() { const hu = this.look.hullMat.userData.u, pale = this.worn.hull === 'light'; if (hu.uPale) hu.uPale.value = pale ? 1 : 0; hu.uPlank.value = this.plank * (pale ? PART_LOOK.pale.plank : 1); }

  clear() {
    for (const it of this.items) it.mesh.geometry.dispose();
    this.group.clear(); // (the meshes and the spinnaker's pivot)
    for (const m of this.mats) m.dispose();
    this.items = []; this.mats = []; this.hidesVanes = false;
  }
  add(kind, geo, mat, extra = {}) { const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = kind !== 'scales'; mesh.receiveShadow = true; this.group.add(mesh); const it = { kind, mesh, ...extra }; this.items.push(it); return it; }
  sailMat(o) { const m = sailMaterial(blankTex(), o); m.userData.u.uBellyN.value = 1; this.mats.push(m); return m; } // (the belly along each sheet's own normal, in canvas and vane alike)

  // ---------------------------------------------------------------- the lateen
  buildLateen(rig) {
    const V = this.look.spec.vane || {}, mat = this.sailMat({ vane: true, fill: V.fill ?? 0xe8f2ff, edge: V.edge ?? 0xd8f0ff, fillA: V.fillA ?? 0.34, belly: 0.75 * this.look.scale });
    const zs = rig.masts.map((M) => M.z), bow = this.look.length / 2, stern = -this.look.length / 2, M2 = new Mesher();
    rig.masts.forEach((M, mi) => {
      const fwd = Math.min(...zs.filter((z) => z > M.z + 0.1), bow + 0.12 * this.look.length) - M.z, aft = M.z - Math.max(...zs.filter((z) => z < M.z - 0.1), stern);
      const H = M.height, h = 0.42 * H, tilt = 0.72, f = Math.min(0.5 * H, 0.95 * fwd / Math.cos(tilt)), a = Math.min(0.62 * H, 0.95 * aft / Math.cos(tilt));
      const F = rig.mastPoint(mi, h - Math.sin(tilt) * f, new THREE.Vector3(), 0, Math.cos(tilt) * f), P = rig.mastPoint(mi, h + Math.sin(tilt) * a, new THREE.Vector3(), 0, -Math.cos(tilt) * a);
      const r = Math.max(0.05, (M.segs[0].r0 ?? 0.3) * 0.55);
      M2.cyl(F, P, r * 0.8, r * 0.5, 6, PART_LOOK.yard, 0, { smooth: true }); M2.cyl(rig.mastPoint(mi, h - 0.012 * H, _a).toArray(), rig.mastPoint(mi, h + 0.012 * H, _b).toArray(), r * 2, r * 2, 6, PART_LOOK.lash, 0); // (the yard, and the parrel that slings it at its third)
      F.y = Math.max(F.y, M.y0 + 0.08 * H); // (the tack never under the deck)
      this.add('lateen', sheet(8, 7), mat, { F, P, mi, a });
    });
    this.add('spar', M2.geometry(), this.look.hullMat);
  }
  /** The lateen's sheets laid to leeward: luff along the yard, foot from the tack aft to the clew low over the quarter. */
  layLateen(it, side) {
    const M = this.look.rig.masts[it.mi], C = this.look.rig.mastPoint(it.mi, M.base[0] + 0.07 * M.height, _d, side * 0.03 * M.height, -it.a * 0.82);
    lay(it.mesh.geometry, (s, o) => o.copy(it.F).lerp(it.P, s), (s, o) => o.copy(it.F).lerp(C, s), _n.set(side, 0, 0));
  }

  // ---------------------------------------------------------------- the spinnaker
  buildSpinnaker(rig) {
    const L = PART_LOOK.spinnaker, mi = rig.masts.reduce((b, M, i) => (M.z > rig.masts[b].z ? i : b), 0), M = rig.masts[mi], H = M.height;
    const head = rig.topOf(mi, new THREE.Vector3()), out = Math.min(0.42 * H, this.look.length / 2 + 0.1 * this.look.length - M.z), wide = Math.max(this.look.beam * 0.62, 0.22 * H), lo = M.y0 + 0.14 * H;
    head.y -= 0.03 * H;
    const mat = this.sailMat({ vane: true, fill: L.fill, edge: L.edge, fillA: L.fillA, belly: 0.11 * H });
    const pivot = new THREE.Group(); pivot.position.set(M.x, 0, M.z); this.group.add(pivot);
    const local = (p) => p.sub(_c.set(M.x, 0, M.z));
    const hd = local(head.clone()), tack = new THREE.Vector3(-wide / 2, lo, out), clew = new THREE.Vector3(wide / 2, lo, out);
    const it = this.add('spinnaker', sheet(8, 8), mat, { pivot }); this.group.remove(it.mesh); pivot.add(it.mesh);
    lay(it.mesh.geometry, (s, o) => o.copy(tack).lerp(clew, s), () => _b.copy(hd), _n.set(0, 0, 1)); // (the foot between the clews, every line up to the head; bellied forward)
    const G = new Mesher(); G.cyl([0, M.y0 + 0.3 * H, 0], [-wide * 0.46, lo + 0.01 * H, out * 0.92], 0.004 * H, 0.004 * H, 5, PART_LOOK.yard, 0); // (the pole out to the windward clew)
    const pole = this.add('spar', G.geometry(), this.look.hullMat, { pivot }); this.group.remove(pole.mesh); pivot.add(pole.mesh);
  }

  // ---------------------------------------------------------------- the storm trysail and the furled canvas
  buildStorm(rig) {
    const mat = this.sailMat({ vane: false, belly: 0.25 * this.look.scale }); mat.color.setHex(PART_LOOK.storm);
    const F = new Mesher(), roll = (a, b, r) => { F.cyl(a, b, r, r, 7, PART_LOOK.furl, 0, { smooth: true }); for (let k = 1; k < 6; k++) { const p = _c.copy(a).lerp(_d.copy(b), k / 6); F.cyl(_a.copy(p).addScaledVector(_n.copy(b).sub(a).normalize(), -r * 0.35).toArray(), _b.copy(p).addScaledVector(_n, r * 0.35).toArray(), r * 1.12, r * 1.12, 7, PART_LOOK.lash, 0); } };
    rig.masts.forEach((M, mi) => {
      for (const Y of M.yards) { if (Y.lateen || !Y.w) continue; const h = M.base[Y.seg] + Y.at * M.segs[Y.seg].len; roll(rig.mastPoint(mi, h, new THREE.Vector3(), -Y.w / 2, 0, Y.seg).add(_n.set(0, -Y.r * 2.4, 0)), rig.mastPoint(mi, h, new THREE.Vector3(), Y.w / 2, 0, Y.seg).add(_n.set(0, -Y.r * 2.4, 0)), Y.r * 1.6); }
      this.add('storm', sheet(6, 5), mat, { mi });
    });
    for (const W of rig.vanes) if (W.kind === 'jib') roll(new THREE.Vector3(...W.tack), rig.mastPoint(W.mast, rig.masts[W.mast].height * W.head, new THREE.Vector3()), 0.006 * this.H); // (the headsail rolled on its stay)
    this.add('spar', F.geometry(), this.look.hullMat);
    rig.booms.forEach((B) => { const G = new Mesher(), r = B.r * 1.7; G.cyl([0, B.r + r * 0.7, -B.len * 0.08], [0, B.r + r * 0.7, -B.len * 0.92], r, r * 0.8, 7, PART_LOOK.furl, 0, { smooth: true }); for (let k = 1; k < 6; k++) G.cyl([0, B.r + r * 0.7, -B.len * (0.08 + 0.84 * k / 6) + r * 0.3], [0, B.r + r * 0.7, -B.len * (0.08 + 0.84 * k / 6) - r * 0.3], r * 1.1, r * 1.1, 7, PART_LOOK.lash, 0);
      const it = this.add('boomRoll', G.geometry(), this.look.hullMat, { B }); it.mesh.matrixAutoUpdate = false; }); // (the main flaked and lashed on its boom: it swings with it)
  }
  /** A trysail on its mast: luff on the mast low down, its head at four tenths, its clew sheeted aft and low to leeward. */
  layStorm(it, side) {
    const rig = this.look.rig, M = rig.masts[it.mi], H = M.height, lo = M.base[0] + 0.1 * H, hi = M.base[0] + 0.4 * H, head = rig.mastPoint(it.mi, hi, new THREE.Vector3());
    const clew = rig.mastPoint(it.mi, M.base[0] + 0.12 * H, new THREE.Vector3(), side * 0.02 * H, -0.2 * H);
    lay(it.mesh.geometry, (s, o) => rig.mastPoint(it.mi, THREE.MathUtils.lerp(lo, hi, s), o), (s, o) => o.copy(clew).lerp(head, s), _n.set(side, 0, 0));
  }

  // ---------------------------------------------------------------- the scaled hull
  buildScales() {
    const spec = this.look.spec.hull, S = spec.stations, k = this.look.scale, sz = PART_LOOK.scale.size * k, G = new Mesher();
    const z0 = S[0][0] + sz * 0.6, z1 = S[S.length - 1][0] - sz * 1.2, dy = sz * 0.62, dz = sz * 0.86, d = sz * 0.05;
    let row = 0;
    for (let y = 0.08 * k; ; y += dy, row++) {
      let any = false;
      for (let z = z0 + (row % 2) * dz * 0.5; z < z1; z += dz) {
        const sheer = loftAt(spec, z)[2] * spec.shape[spec.shape.length - 1][1]; if (y > sheer - 0.06 * k) continue;
        const w = sideAt(spec, z, y); if (w < 0.1) continue; any = true;
        const wy = (sideAt(spec, z, y + 0.05) - sideAt(spec, z, y - 0.05)) / 0.1, wz = (sideAt(spec, z + 0.05, y) - sideAt(spec, z - 0.05, y)) / 0.1;
        schillerInk(z * 0.021 + row * 0.13 + Math.sin(z * 1.7 + row) * 0.04, _col, { floor: 0.42, sheen: 0.95 });
        for (const sx of [1, -1]) {
          const tz = _a.set(sx * wz, 0, 1).normalize(), ty = _b.set(sx * wy, 1, 0).normalize(), n = _n.crossVectors(ty, tz).normalize(); if (n.x * sx < 0) n.negate();
          const at = (u, v, lift) => [sx * (w + d) + tz.x * u * sz + ty.x * v * sz + n.x * lift * sz, y + ty.y * v * sz, z + tz.z * u * sz + n.z * lift * sz];
          const pts = [[-0.5, 0.55, 0], [0.5, 0.55, 0], [0.52, -0.05, 0.08], [0.3, -0.38, 0.12], [0, -0.5, 0.14], [-0.3, -0.38, 0.12], [-0.52, -0.05, 0.08]].map(([u, v, l]) => at(u, v, l)); // (a fish scale: tucked at its top, its rounded free edge lifted proud)
          G.poly(pts, _col, PART_LOOK.scale.glow, [0, y, z]);
        }
      }
      if (!any && row > 1) break; if (row > 40) break;
    }
    this.add('scales', G.geometry(), this.look.hullMat);
  }

  // ---------------------------------------------------------------- each frame (ShipLook.set)
  pose({ sail = 1, fill = 1, luff = 0, side = 1, t = 0, furled = false, u = 0, rel = null } = {}) {
    const show = !furled && u < 0.02, sd = side < 0 ? -1 : 1, key = `${sd}|${sail.toFixed(2)}`;
    for (const it of this.items) if (it.kind !== 'spar' && it.kind !== 'scales' && it.kind !== 'boomRoll') it.mesh.visible = show;
    for (const it of this.items) if (it.kind === 'spar' && it.pivot) it.mesh.visible = show;
    if (key !== this.key) {
      this.key = key;
      for (const it of this.items) {
        if (it.kind === 'lateen') this.layLateen(it, sd);
        else if (it.kind === 'storm') this.layStorm(it, sd);
        else if (it.kind === 'boomRoll') { this.look.rig.boomMatrix(it.B, Math.max(0.3, sail), sd, _m); it.mesh.matrix.copy(_m); }
      }
    }
    const f = THREE.MathUtils.clamp(fill, 0, 1), l = THREE.MathUtils.clamp(luff, 0, 1);
    for (const m of this.mats) { const U = m.userData.u; U.uFill.value = show ? sail * (0.25 + 0.75 * f) * (1 - 0.7 * l) : 0; U.uLuff.value = show ? l : 0; U.uT.value = t; }
    const sp = this.items.find((it) => it.kind === 'spinnaker');
    if (sp) { const want = rel == null ? 0 : THREE.MathUtils.clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1.1, 1.1) * 0.8; sp.pivot.rotation.y += (want - sp.pivot.rotation.y) * 0.05; } // (swung round the mast to fly downwind, slowly)
  }

  dispose() { this.clear(); this.look.body.remove(this.group); this.worn.hull = 'stock'; this.paint(); }
}

/** The free helm's look worn as the ship's parts say (game.shipParts.worn), checked each frame, rebuilt only on a change or a new helm. */
export class ShipPartWear {
  constructor(game) { this.game = game; this.look = null; this.key = ''; }
  update() {
    const look = this.game.opensea?.helm?.look, worn = this.game.shipParts?.worn; if (!look?.wearParts || !worn) return;
    const key = `${worn.sail}|${worn.hull}|${worn.keel}`;
    if (look === this.look && key === this.key) return;
    this.look = look; this.key = key; look.wearParts(worn);
  }
}
