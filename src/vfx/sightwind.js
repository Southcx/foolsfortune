// ---------------------------------------------------------------------------------------
// THE SIGHT'S WIND VANE (docs/plans/OPEN-SEA.md section 14; the wind's rules: progress/opensea/wind.js, Dovina's): while you sail the open
// sea at the free helm, the Sight (vfx/sight.js) reads the wind too, in the needle's own plane and frame (the globe's equator, bearings
// from where the camera faces, as the needle's are):
//   THE VANE           an ivory arrow with a bronze tail on the globe's rim, standing where the wind blows FROM and pointing in, the way
//                      it blows; longer as it blows harder, the tail's fins spread in a gale (a weathercock's arrow)
//   THE BAND           round the rim, the points of sail laid about the wind's eye, soft-edged: in irons a brick red, close-hauled amber,
//                      the beam and broad reach the film's jade, running gold (polar's shape: where a sail gives nothing to where it
//                      gives most); the band turns with the wind
//   THE BOW MARK       a small bronze chevron on the band at the ship's heading, lit in the colour of the point it sits on, so the
//                      sailor sees which point the bow is on and which way to bear off
// No words: an instrument (CLAUDE.md, the overlay). It fades in at the helm and out when you step off.
//
// Prior art: the weathercock's arrow and the wind rose of a compass card; a dinghy's telltales and a yacht's wind instrument (the
// apparent-wind dial, its red and green close-hauled sectors); a polar diagram's lobes (wind.js); The Legend of Zelda: The Wind Waker's
// wind arrow on the compass.
//
//   new SightWind(sight)   (made by the Sight, in its root)   .update(dt)   .shown (0..1)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { pointOf, offWind } from '../progress/opensea/wind.js';

const LIN = THREE.LinearSRGBColorSpace;
/** r0, r1: the band's inner and outer radius (the globe's, 1.0); vane: its arrow's radius at the tip and its length at no wind and at a
 *  gale; tex: the band's texels from the wind's eye to dead downwind; points: each point of sail's colour (raw linear, as the Sight's). */
const SW = { r0: 1.015, r1: 1.085, vane: { r: 1.1, lo: 0.22, hi: 0.62 }, tex: 64,
  points: { irons: 0xb8443a, closeHauled: 0xd0903c, beamReach: 0x6fc8a4, broadReach: 0x8ed6a0, running: 0xf0c24a } };
const col = (hex) => new THREE.Color().setHex(hex, LIN);

/** The band's picture: one row from the wind's eye (0) to dead downwind (1), each point's colour eased into the next. */
function bandTexture() {
  const n = SW.tex, px = new Uint8Array(n * 4), c = new THREE.Color(), b = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const off = (i / (n - 1)) * Math.PI, p = pointOf(off), next = pointOf(Math.min(Math.PI, off + 0.12));
    c.copy(col(SW.points[p])); if (next !== p) c.lerp(b.copy(col(SW.points[next])), 0.5);
    const a = p === 'irons' ? 0.75 : 0.6;
    px.set([Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), Math.round(a * 255)], i * 4);
  }
  const t = new THREE.DataTexture(px, n, 1); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}

/** A ring in the xz plane, its uv.x the angle off -z (0 the wind's eye at -z, 1 dead aft), uv.y across (0 inner, 1 outer). */
function bandGeometry(n = 96) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, sx = Math.sin(a), cz = -Math.cos(a), off = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) / Math.PI;
    pos.push(sx * SW.r0, 0, cz * SW.r0, sx * SW.r1, 0, cz * SW.r1); uv.push(off, 0, off, 1);
    if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); return g;
}

export class SightWind {
  constructor(sight) {
    this.sight = sight; this.game = sight.game; this.shown = 0; this.from = 0; this.bow = 0; this.k = 0; this.f3 = new THREE.Vector3();
    const root = sight.root, group = this.group = new THREE.Group(); group.visible = false; root.add(group);
    // the band, turned so its eye is at the wind's bearing; its points eased into each other (the texture's one row, linear)
    this.bandMat = overlayFlat({ map: bandTexture(), opacity: 0, depthWrite: false });
    this.band = new THREE.Mesh(bandGeometry(), this.bandMat); this.band.renderOrder = 5.4; group.add(this.band);
    // the vane: shaft, head and tail, laid along -z (outward at the wind's bearing), its head at the rim pointing in
    const ivory = this.ivory = overlayFlat({ color: col(0xf4ecd8), opacity: 0, depthWrite: false }), bronze = this.bronze = overlayFlat({ color: col(0xb08646), opacity: 0, depthWrite: false });
    const vane = this.vane = new THREE.Group(); group.add(vane);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6).rotateX(Math.PI / 2).translate(0, 0, -0.5), ivory); shaft.renderOrder = 5.6;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8).rotateX(Math.PI / 2).translate(0, 0, 0.0), ivory); head.renderOrder = 5.6; // (its point at +z: inward)
    this.shaft = shaft; this.head = head; vane.add(shaft, head);
    const fin = (s) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s * 0.09, 0.05, -0.12, 0, 0, -0.16, 0, 0, 0, s * 0.09, -0.05, -0.12, 0, 0, -0.16], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(12).fill(0.5), 2)); g.computeVertexNormals(); return g; };
    this.tail = new THREE.Group(); for (const s of [1, -1]) { const m = new THREE.Mesh(fin(s), bronze); m.renderOrder = 5.6; this.tail.add(m); } vane.add(this.tail);
    // the bow mark: a chevron at the heading, on the band
    const chev = new THREE.BufferGeometry(); chev.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.01, -SW.r1 - 0.09, -0.06, 0.01, -SW.r1 - 0.17, 0, 0.01, -SW.r0 + 0.01, 0, 0.01, -SW.r1 - 0.09, 0, 0.01, -SW.r0 + 0.01, 0.06, 0.01, -SW.r1 - 0.17], 3));
    chev.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(12).fill(0.5), 2)); chev.computeVertexNormals();
    this.bowMat = overlayFlat({ color: col(0xe8b84a), opacity: 0, depthWrite: false }); this.bowMark = new THREE.Mesh(chev, this.bowMat); this.bowMark.renderOrder = 5.7; group.add(this.bowMark);
    this.bowCol = new THREE.Color();
  }

  /** A world bearing (yaw: forward (sin, cos)) as the needle's angle: from where the camera faces. */
  bearing(yaw) {
    const cam = this.game.camera; if (!cam) return 0;
    const f = cam.getWorldDirection(this.f3), dx = Math.sin(yaw), dz = Math.cos(yaw);
    return Math.atan2(f.x * dz - f.z * dx, f.x * dx + f.z * dz);
  }

  update(dt) {
    const S = this.game.opensea, wind = S?.wind, H = S?.helm, on = !!(S?.sailing && wind && H);
    this.shown += ((on ? 1 : 0) - this.shown) * Math.min(1, dt * 3);
    this.group.visible = this.shown > 0.01; if (!this.group.visible || !wind || !H) return;
    const e = Math.min(1, dt * 6), ease = (a, b) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * e;
    this.from = ease(this.from, this.bearing(wind.from)); this.bow = ease(this.bow, this.bearing(H.yaw));
    this.k += (wind.k - this.k) * Math.min(1, dt * 2);
    this.band.rotation.y = -this.from; this.vane.rotation.y = -this.from; this.bowMark.rotation.y = -this.bow;
    const len = SW.vane.lo + (SW.vane.hi - SW.vane.lo) * this.k, r = SW.vane.r;
    this.head.position.z = -r; this.shaft.position.z = -r - 0.08; this.shaft.scale.z = len; this.tail.position.z = -r - 0.08 - len + 0.12;
    this.tail.scale.set(0.8 + 0.6 * this.k, 1, 1);
    const sway = Math.sin(this.sight.t * (2 + 5 * this.k)) * 0.03 * (1 - this.k * 0.5); this.vane.rotation.y += sway; // (a vane hunts a little about the wind)
    const point = H.sail?.point ?? pointOf(offWind(H.yaw, wind)); this.bowCol.copy(col(SW.points[point] ?? 0xe8b84a));
    this.bowMat.color.lerp(this.bowCol, Math.min(1, dt * 4));
    const s = this.shown; this.bandMat.opacity = 0.75 * s; this.ivory.opacity = 0.95 * s; this.bronze.opacity = 0.95 * s; this.bowMat.opacity = s;
  }
}
