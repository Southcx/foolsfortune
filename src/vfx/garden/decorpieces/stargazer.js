// ---------------------------------------------------------------------------------------
// THE STARGAZER SET (Dovina's decor.js holds its pieces): an amateur astronomer's corner of
// eight, brass and night-blue glaze. An armillary sphere whose inner rings turn about its tilted pole (kit.js MOTION.polar), a brass
// telescope, a garden sundial, a star-chart table, a crescent gate, glass orbs on stakes, a fallen meteor stone still warm in its veins,
// and its centrepiece the constellation pavement, a round paving inlaid with a star chart whose stars light at dusk. The body (white, so
// the set's indigo x tint paints it) is the glazed ware: the sphere's pedestal and globe, the tube, the dial's stone, the table, the gate's
// ring, the orbs' glass and the paving; brass, iron and paper fixed. What lights is `g` (the lamps' dusk path, decorpieces.js).
// Prior art: the armillary spheres of Tycho Brahe's Uraniborg and of the Ming observatory in Beijing (a fixed meridian and horizon round
// rings that turn on the pole), Galileo's and the Victorian brass refractors on their tripods, the garden sundial of English country
// houses, the Suzhou moon gate, Animal Crossing's Celeste set (star fragments, the wand) and its constellation rug, the zodiac pavements
// of Renaissance churches (Siena's floor), and Townscaper's flat inlays read from above.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { K, MOTION } from './kit.js';

const TAU = Math.PI * 2;
const TILT = 0.698; // (the pole's tilt off +Y toward +Z: 40 degrees, as MOTION.polar turns)

export const STARGAZER = {
  /** medium: the armillary sphere: a glazed pedestal (the body), the fixed meridian and horizon rings in brass, and inside them the
   *  equator, the ecliptic and a colure with the globe at their heart, turning slowly about the tilted pole (MOTION.polar). */
  armillarySphere(p) {
    const C = [0, 1.18, 0], POL = { m: [MOTION.polar, ...C] };
    p.cyl(0.5, 0.56, 0.12, { sit: true, c: K.stone }, 10); p.cyl(0.36, 0.42, 0.1, { at: [0, 0.12, 0], sit: true, c: K.stoneL }, 10);
    p.lathe([[0.2, 0], [0.13, 0.12], [0.1, 0.4], [0.12, 0.5], [0.2, 0.56], [0.06, 0.56]], { at: [0, 0.22, 0] }, 10);
    for (const s of [-1, 1]) p.rod([0, 0.76, 0], [s * 0.5, 1.18, 0], 0.025, { c: K.brass }, 4); // (the arms up to the horizon ring)
    p.ring(0.62, 0.035, { at: C, c: K.brass }, 24, 4);
    p.arc(0.58, 0.03, { at: C, rot: [0, Math.PI / 2, 0], c: K.brass }, TAU, 24); // (the meridian, in the YZ plane)
    for (const sg of [-1, 1]) p.ball(0.04, { at: [0, C[1] + sg * Math.cos(TILT) * 0.58, sg * Math.sin(TILT) * 0.58], c: K.gold }, 5, 4); // (the pole's pins)
    // the turning rings: the equator square to the pole, the ecliptic crossing it, a colure through the pole; the polar rod and globe
    p.ring(0.5, 0.025, { at: C, rot: [TILT, 0, 0], c: K.gold, ...POL }, 22, 4);
    p.ring(0.48, 0.03, { at: C, rot: [TILT, 0, 0.41], ...POL }, 22, 4);
    p.arc(0.46, 0.02, { at: C, rot: [TILT, 0, 0], c: K.brass, ...POL }, TAU, 20); // (a colure: the plane of the pole and +X)
    p.rod([0, C[1] - Math.cos(TILT) * 0.62, -Math.sin(TILT) * 0.62], [0, C[1] + Math.cos(TILT) * 0.62, Math.sin(TILT) * 0.62], 0.015, { c: K.brass, ...POL }, 4);
    p.ball(0.13, { at: C, ...POL }, 10, 7); p.ring(0.135, 0.012, { at: C, rot: [TILT, 0, 0], c: K.gold, ...POL }, 12, 3);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.ball(0.018, { at: [Math.cos(a) * 0.62, C[1] + 0.04, Math.sin(a) * 0.62], c: K.gold }, 4, 3); } // (the horizon's hour studs)
  },
  /** small: the brass telescope on its wooden tripod, its tube (the body) pointed up at the sky, a finder and an eyepiece. */
  brassTelescope(p) {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.3; p.rod([Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36], [0, 0.72, 0], 0.025, { c: K.wood }, 5); p.ball(0.03, { at: [Math.cos(a) * 0.36, 0.01, Math.sin(a) * 0.36], c: K.brass }, 4, 3); }
    p.ring(0.13, 0.012, { at: [0, 0.35, 0], c: K.brass }, 9, 3);
    p.cyl(0.06, 0.07, 0.08, { at: [0, 0.75, 0], c: K.brass }, 7); p.box(0.08, 0.1, 0.08, { at: [0, 0.82, 0], c: K.brass }, 0.02);
    const tube = [0.95, 0, 0]; // (pitched up toward +Z, about 55 degrees)
    p.cyl(0.075, 0.06, 0.86, { at: [0, 0.98, 0.1], rot: tube }, 10);
    p.cyl(0.085, 0.085, 0.1, { at: [0, 1.22, 0.42], rot: tube, c: K.brass }, 10); p.cyl(0.082, 0.082, 0.015, { at: [0, 1.26, 0.46], rot: tube, c: K.waterD }, 10); // (the dew cap and the objective's glass)
    p.ring(0.068, 0.012, { at: [0, 0.98, 0.1], rot: [tube[0] + Math.PI / 2, 0, 0], c: K.brass }, 10, 3);
    p.cyl(0.04, 0.04, 0.12, { at: [0, 0.71, -0.26], rot: tube, c: K.brass }, 7); p.cyl(0.03, 0.025, 0.08, { at: [0, 0.65, -0.33], rot: tube, c: K.black }, 6);
    p.cyl(0.02, 0.02, 0.26, { at: [0.08, 1.05, 0.12], rot: tube, c: K.brass }, 5);
  },
  /** small: the garden sundial: a stone pillar (the body), its brass dial with the hours struck in black and the gnomon's blade. */
  gardenSundial(p) {
    p.cyl(0.3, 0.34, 0.08, { sit: true, c: K.stone }, 8);
    p.lathe([[0.17, 0], [0.12, 0.08], [0.1, 0.55], [0.14, 0.62], [0.2, 0.66], [0, 0.66]], { at: [0, 0.08, 0] }, 9);
    p.cyl(0.25, 0.24, 0.035, { at: [0, 0.76, 0], c: K.brass }, 16);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.slab(0.006, 0.006, 0.05, { at: [Math.cos(a) * 0.2, 0.78, Math.sin(a) * 0.2], rot: [0, -a + Math.PI / 2, 0], c: K.black }); }
    p.ring(0.225, 0.008, { at: [0, 0.78, 0], c: K.black }, 16, 3);
    p.geo(blade(), { at: [0, 0.78, 0], c: K.brass });
    p.ball(0.08, { at: [0.22, 0.04, 0.2], sc: [1.3, 0.5, 1], c: K.moss }, 5, 3);
  },
  /** medium: a star-chart table: the table (the body) with a chart spread on it, its stars in gold lit at dusk, a brass astrolabe, a
   *  little lantern weighting the corner, a stool. */
  starChartTable(p) {
    p.box(1.3, 0.07, 0.8, { at: [0, 0.68, -0.1] }, 0.025);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.box(0.06, 0.66, 0.06, { at: [sx * 0.56, 0, -0.1 + sz * 0.32], sit: true, c: K.woodD }, 0.015);
    p.slab(1.0, 0.012, 0.62, { at: [-0.05, 0.72, -0.1], rot: [0, 0.06, 0], c: K.paper }); p.slab(0.98, 0.014, 0.05, { at: [-0.05, 0.725, 0.22], rot: [0, 0.06, 0], c: K.woodL });
    for (const [x, z] of [[-0.4, -0.25], [-0.25, -0.05], [-0.05, -0.18], [0.1, 0.02], [0.28, -0.15], [0.05, -0.32]]) p.ball(0.018, { at: [x, 0.73, z], sc: [1, 0.4, 1], c: K.gold, g: 0.8 }, 4, 3);
    for (const [a, b] of [[[-0.4, -0.25], [-0.25, -0.05]], [[-0.25, -0.05], [-0.05, -0.18]], [[-0.05, -0.18], [0.1, 0.02]], [[0.1, 0.02], [0.28, -0.15]], [[-0.05, -0.18], [0.05, -0.32]]]) p.rod([a[0], 0.728, a[1]], [b[0], 0.728, b[1]], 0.004, { c: K.brass }, 3);
    p.ring(0.13, 0.015, { at: [0.42, 0.75, 0.05], rot: [0.2, 0, 0], c: K.brass }, 14, 3); p.cyl(0.1, 0.1, 0.01, { at: [0.42, 0.74, 0.05], rot: [0.2, 0, 0], c: K.brass }, 10); p.rod([0.32, 0.76, 0.05], [0.52, 0.76, 0.05], 0.006, { c: K.black }, 3);
    p.box(0.14, 0.18, 0.14, { at: [-0.5, 0.82, -0.36], c: K.lamp, g: 1 }, 0.03); p.cone(0.12, 0.08, { at: [-0.5, 0.95, -0.36], rot: [0, Math.PI / 4, 0], c: K.iron }, 4); p.arc(0.05, 0.008, { at: [-0.5, 0.99, -0.36], c: K.iron }, Math.PI, 6);
    p.cyl(0.2, 0.18, 0.06, { at: [0.1, 0.42, 0.6] }, 10); for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; p.rod([0.1 + Math.cos(a) * 0.15, 0, 0.6 + Math.sin(a) * 0.15], [0.1 + Math.cos(a) * 0.1, 0.4, 0.6 + Math.sin(a) * 0.1], 0.02, { c: K.woodD }, 4); }
  },
  /** medium: the crescent gate: a round gate's ring (the body) on two feet, a crescent moon hung in it lit at dusk, stars on its crown. */
  crescentMoonGate(p) {
    p.arc(0.8, 0.12, { at: [0, 0.98, 0], c: undefined }, TAU, 28);
    p.arc(0.8, 0.05, { at: [0, 0.98, 0.1], c: K.brass }, TAU, 28); p.arc(0.8, 0.05, { at: [0, 0.98, -0.1], c: K.brass }, TAU, 28);
    for (const s of [-1, 1]) { p.box(0.42, 0.22, 0.42, { at: [s * 0.62, 0, 0], sit: true, c: K.stoneD }, 0.05); p.box(0.3, 0.32, 0.3, { at: [s * 0.62, 0.18, 0], sit: true, c: K.stone }, 0.05); }
    p.rod([0, 1.78, 0], [0, 1.45, 0], 0.008, { c: K.iron }, 3);
    p.geo(crescent(0.26, 0.05), { at: [0.04, 1.2, 0], rot: [0, 0, 0.35], c: K.paper, g: 1 });
    for (const [x, y, s] of [[0, 1.94, 0.09], [-0.42, 1.78, 0.06], [0.42, 1.78, 0.06]]) p.geo(star(s, 0.025), { at: [x, y, 0], c: K.gold, g: 0.6 });
    p.cyl(0.4, 0.44, 0.06, { at: [0, 0, 0], sit: true, c: K.stoneL }, 10);
  },
  /** small: glass orbs on iron stakes, three heights, the glass (the body) lit from within at dusk. */
  glassOrbStakes(p) {
    for (const [x, z, h, r] of [[-0.18, -0.12, 0.95, 0.12], [0.2, -0.05, 0.7, 0.1], [0.0, 0.22, 0.5, 0.085]]) {
      p.rod([x, 0, z], [x, h, z], 0.014, { c: K.iron }, 4); p.ring(0.04, 0.01, { at: [x, h - 0.02, z], c: K.iron }, 6, 3);
      p.ball(r, { at: [x, h + r * 0.85, z], g: 0.9 }, 10, 7); p.ball(r * 0.45, { at: [x, h + r * 0.85, z], c: K.lamp, g: 1 }, 6, 4);
    }
    p.ball(0.16, { at: [0.15, 0, 0.2], sc: [1.4, 0.35, 1], sit: true, c: K.moss }, 6, 3); p.ball(0.09, { at: [-0.25, 0.03, 0.2], sc: [1.3, 0.6, 1], c: K.stoneD }, 5, 3);
  },
  /** small: a meteor stone fallen in a ring of thrown earth, dark iron tinted by the set, its cracks still glowing at dusk. */
  meteorStone(p) {
    p.ring(0.34, 0.09, { at: [0, 0.03, 0], sc: [1, 0.5, 1], c: K.soil }, 12, 4); p.cyl(0.34, 0.36, 0.03, { sit: true, c: K.soil }, 12);
    p.ball(0.26, { at: [0, 0.08, 0], sc: [1.1, 0.85, 0.95], rot: [0.3, 0.6, 0.2], c: K.iron, t: 0.55 }, 7, 5);
    p.ball(0.15, { at: [0.13, 0.22, 0.08], sc: [1, 0.8, 0.9], rot: [0, 1.2, 0.5], c: K.iron, t: 0.55 }, 6, 4);
    for (const [a, y, l] of [[0.3, 0.2, 0.22], [1.9, 0.14, 0.18], [3.6, 0.25, 0.16], [5.1, 0.12, 0.2]]) p.slab(l, 0.018, 0.02, { at: [Math.cos(a) * 0.2, y, Math.sin(a) * 0.2], rot: [0.4, -a + Math.PI / 2, 0.5], c: K.ember, g: 0.85 });
    p.ball(0.03, { at: [0.0, 0.33, 0.0], c: K.lamp, g: 0.9 }, 4, 3);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; p.ball(0.04, { at: [Math.cos(a) * 0.42, 0.02, Math.sin(a) * 0.42], sc: [1, 0.6, 1], c: K.iron, t: 0.55 }, 4, 3); }
  },
  /** centre: the constellation pavement: a round paving (the body) in a stone kerb, a compass rose, a star chart inlaid in brass lines
   *  and gold studs that light at dusk, the four quarters marked by low posts, a brass disc at its heart. */
  constellationPavement(p) {
    p.cyl(1.92, 1.95, 0.1, { sit: true, c: K.stoneD }, 24); p.cyl(1.78, 1.8, 0.06, { at: [0, 0.1, 0], sit: true }, 24);
    p.ring(1.72, 0.02, { at: [0, 0.165, 0], c: K.brass }, 32, 3); p.ring(1.1, 0.015, { at: [0, 0.165, 0], c: K.brass }, 28, 3);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.rod([Math.cos(a) * 1.1, 0.165, Math.sin(a) * 1.1], [Math.cos(a) * 1.72, 0.165, Math.sin(a) * 1.72], 0.008, { c: K.brass }, 3); p.ball(0.03, { at: [Math.cos(a + 0.26) * 1.42, 0.165, Math.sin(a + 0.26) * 1.42], sc: [1, 0.4, 1], c: K.gold, g: 0.7 }, 4, 3); }
    // the compass rose at the heart: eight points, the north one gold
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, L = i % 2 ? 0.45 : 0.85; p.geo(point(L, i % 2 ? 0.07 : 0.11), { at: [0, 0.165, 0], rot: [0, -a, 0], c: i === 0 ? K.gold : K.stoneL }); }
    p.cyl(0.16, 0.16, 0.03, { at: [0, 0.18, 0], c: K.brass }, 12); p.ball(0.05, { at: [0, 0.2, 0], sc: [1, 0.5, 1], c: K.lamp, g: 1 }, 6, 3);
    // two constellations in the ring between: lines and their stars (the Plough and Cassiopeia's W)
    const sky = [[[-0.75, -0.95], [-0.45, -1.15], [-0.15, -1.05], [0.1, -1.3], [0.45, -1.25], [0.55, -0.95], [0.25, -0.88]], [[0.9, 0.55], [1.05, 0.85], [0.8, 1.05], [0.65, 1.38], [0.35, 1.3]]];
    for (const c of sky) { for (let i = 0; i < c.length - 1; i++) p.rod([c[i][0], 0.17, c[i][1]], [c[i + 1][0], 0.17, c[i + 1][1]], 0.01, { c: K.brass }, 3); for (const [x, z] of c) p.geo(star(0.07, 0.02), { at: [x, 0.175, z], rot: [-Math.PI / 2, 0, 0], c: K.gold, g: 1 }); }
    for (const [x, z] of [[-1.0, 0.7], [-0.6, 1.1], [-1.25, 0.2], [1.25, -0.3], [-1.3, -0.5]]) p.ball(0.035, { at: [x, 0.165, z], sc: [1, 0.4, 1], c: K.lamp, g: 1 }, 4, 3);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; p.cyl(0.07, 0.09, 0.32, { at: [Math.cos(a) * 1.86, 0, Math.sin(a) * 1.86], sit: true, c: K.stone }, 6); p.ball(0.06, { at: [Math.cos(a) * 1.86, 0.36, Math.sin(a) * 1.86], c: K.brass }, 5, 4); }
  },
};

/** A gnomon's blade: a right triangle standing on the dial along +Z, its edge raised to the pole. */
function blade() {
  const s = new THREE.Shape(); s.moveTo(-0.18, 0); s.lineTo(0.16, 0); s.lineTo(-0.18, 0.2); s.lineTo(-0.18, 0);
  return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }).translate(0, 0, -0.01).rotateY(Math.PI / 2);
}
/** A crescent moon, standing in the XY plane, `r` across and `d` thick. */
function crescent(r, d) {
  const s = new THREE.Shape(), k = Math.atan2(1, 0.35); // (the outer arc's left half, then the inner arc back through (-0.71 r, 0))
  s.absarc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false); s.absarc(r * 0.35, 0, r * Math.hypot(1, 0.35), Math.PI + k, Math.PI - k, true);
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 14 }).translate(0, 0, -d / 2);
}
/** A five-pointed star in the XY plane. */
function star(r, d) {
  const s = new THREE.Shape();
  for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + (i / 10) * TAU, q = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * q, Math.sin(a) * q) : s.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2);
}
/** One point of a compass rose lying flat, from the heart out along -Z (north), `L` long and `w` wide. */
function point(L, w) {
  const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(0, L); s.lineTo(w, 0); s.lineTo(0, -w * 0.4); s.lineTo(-w, 0);
  return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, 0, 0).scale(1, 1, 1);
}
