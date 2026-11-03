// ---------------------------------------------------------------------------------------
// THE SIGHT'S HARMONY ARC (docs/plans/GARDEN-COZY.md A7, the overlay avenue; GAPS G113; the gauge is Dovina's, progress/harmony.js):
// while you are in the Spirit Garden the Sight (vfx/sight.js) reads the harmony of the planetoid your Pneuka Jar stands on, as an arc
// on the dial's left edge, outside the clock ring (the yoke's Dissonance arc is the right's):
//   THE TRACK      a dark clay groove from the dial's lower left up to its upper left, a bronze notch where briar begins (0.35) and
//                  where bloom begins (0.75)
//   THE FILL       a glaze run up the groove from the bottom to the planetoid's harmony, its colour by where it stands: the bramble's
//                  rust in briar, bisque between, the bloom's jade over 0.75 (never gold: gold means won); eased, so a pruning is seen
//                  creeping up and a carried-in mood seen sinking
//   THE ENDS       a thorn at the foot, a five-petalled flower at the head: which way is which, without a word
// No number and no word: an instrument (GARDEN-COZY.md A7: "shown, never said as a number"). It fades in on entering the garden and out
// on leaving.
//
// Prior art: a thermometer's glaze-run scale; the moisture gauge of a plant's pot; Viva Piñata's garden-value ladder (a rising mark,
// read at a glance); Okami's bloom (the flower end).
//
//   new SightHarmony(sight)   (made by the Sight, on its clock ring's group)   .update(dt)   .shown (0..1)   SIGHT_HARMONY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { overlayFlat } from './lachrimetertube.js';
import { HARMONY, bandOf } from '../progress/harmony.js';

const LIN = THREE.LinearSRGBColorSpace, DEG = Math.PI / 180;
/** r0, r1: the groove's radii (the dial's outer edge is 1.46); a0, a1: its foot and head, degrees round from the dial's +x (counter-
 *  clockwise), the foot lower left; colours raw linear as the Sight's. */
export const SIGHT_HARMONY = { r0: 1.5, r1: 1.68, a0: 224, a1: 138, ease: 1.5,
  track: 0x1e1410, notch: 0xb08646, briar: 0xc4643f, between: 0xe6d6b4, bloom: 0x8ed6a0, thorn: 0xa0482c, petal: 0xf2b8c8, heart: 0xf0d27a };
const col = (hex) => new THREE.Color().setHex(hex, LIN);
const at = (deg, r) => [Math.cos(deg * DEG) * r, Math.sin(deg * DEG) * r];

/** A sector of the groove between two angles (degrees), the foot to the head clockwise. */
function sector(a, b, r0, r1) {
  const lo = Math.min(a, b), len = Math.max(0.5, Math.abs(a - b));
  return new THREE.RingGeometry(r0, r1, Math.max(3, Math.ceil(len / 3)), 1, lo * DEG, len * DEG);
}

export class SightHarmony {
  constructor(sight) {
    const H = SIGHT_HARMONY, grp = this.group = new THREE.Group(); grp.visible = false; grp.position.z = 0.06;
    this.sight = sight; this.game = sight.game; this.shown = 0; this.h = HARMONY.rest; this.drawn = -1; this.col = new THREE.Color();
    (sight.ringGrp || sight.root)?.add(grp);
    const mat = (c, o = {}) => overlayFlat({ color: col(c), opacity: 0, depthWrite: false, ...o });
    this.mats = [];
    const add = (geo, m, order) => { const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = order; grp.add(mesh); this.mats.push([m, 1]); return mesh; };
    add(sector(H.a0 + 1.5, H.a1 - 1.5, H.r0 - 0.025, H.r1 + 0.025), mat(H.track), 5.3);
    this.fillMat = mat(H.between); this.fill = add(sector(H.a0, H.a0 - 1, H.r0, H.r1), this.fillMat, 5.4);
    // the notches at the briar's edge and the bloom's
    const span = H.a1 - H.a0, notch = (k) => { const a = H.a0 + span * k, [x0, y0] = at(a, H.r0 - 0.03), [x1, y1] = at(a, H.r1 + 0.03), g = new THREE.PlaneGeometry(0.03, Math.hypot(x1 - x0, y1 - y0));
      g.rotateZ(a * DEG - Math.PI / 2); g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0.002); return g; };
    add(mergeGeometries([notch(HARMONY.briar), notch(HARMONY.bloom)]), mat(H.notch), 5.5);
    // the thorn at the foot: a hooked spike pointing down the groove
    { const [x, y] = at(H.a0 + 4, (H.r0 + H.r1) / 2), s = new THREE.Shape(); s.moveTo(-0.07, 0); s.quadraticCurveTo(0.0, 0.03, 0.08, -0.16); s.quadraticCurveTo(0.02, -0.03, 0.07, 0); s.closePath();
      const g = new THREE.ShapeGeometry(s); g.rotateZ((H.a0 + 4) * DEG); g.translate(x, y, 0.003); add(g, mat(H.thorn), 5.6); }
    // the flower at the head: five petals round a heart
    { const [x, y] = at(H.a1 - 5, (H.r0 + H.r1) / 2), petals = [];
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, g = new THREE.CircleGeometry(0.045, 10); g.scale(1, 1.35, 1); g.translate(0, 0.05, 0); g.rotateZ(a); petals.push(g); }
      const pg = mergeGeometries(petals); pg.translate(x, y, 0.003); add(pg, mat(H.petal), 5.6);
      const heart = new THREE.CircleGeometry(0.03, 10); heart.translate(x, y, 0.004); add(heart, mat(H.heart), 5.65); }
  }

  /** The planetoid the Pneuka Jar stands on (or was last over), its harmony. */
  read() {
    const g = this.game, id = g.realm?.jarBody?.planet?.id; if (id) this.planet = id;
    return g.harmony?.of ? g.harmony.of(this.planet) : HARMONY.rest;
  }

  update(dt) {
    const g = this.game, on = !!(g.realm?.active && g.harmony);
    this.shown += ((on ? 1 : 0) - this.shown) * Math.min(1, dt * 3);
    this.group.visible = this.shown > 0.01; if (!this.group.visible) return;
    const H = SIGHT_HARMONY, want = this.read();
    this.h += (want - this.h) * Math.min(1, dt * H.ease);
    if (Math.abs(this.h - this.drawn) > 0.003) {
      this.drawn = this.h; const k = Math.max(0.01, Math.min(1, this.h)), a = H.a0 + (H.a1 - H.a0) * k;
      this.fill.geometry.dispose(); this.fill.geometry = sector(H.a0, a, H.r0, H.r1);
    }
    const band = bandOf(this.h);
    this.col.copy(col(band === 'briar' ? H.briar : band === 'bloom' ? H.bloom : H.between));
    this.fillMat.color.lerp(this.col, Math.min(1, dt * 4));
    for (const [m, o] of this.mats) m.opacity = o * this.shown;
  }
}
