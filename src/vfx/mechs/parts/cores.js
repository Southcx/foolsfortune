// ---------------------------------------------------------------------------------------
// A MECH'S CORES (the part library: progress/mechs/parts.js slot `core`): the chest each frame is built round, and the cradle every
// core carries in its back. A chest is a barrel of curved porcelain panels cut from one profile (vfx/mechs/parts/kit.js `band`,
// `panel`) over a darker barrel inside it, so the gaps between the panels are real grooves; its sockets (the neck's cup, the shoulders'
// cups facing out) are ivory, so any head and any arms seat in any core.
//   clayCore   the heroic trapezoid: a chest far wider at the shoulders than the waist, the breastplate split at the keel, two wrapped
//              abdomen bands, a kintsugi crack across the left pectoral
//   kilnCore   fired twice: heavier, a bottle kiln's rounded shoulders, banded in ash and bronze, the panels in a darker tenmoku glaze
//   lightCore  bisque thin: slim, its panels cut to narrow ribs and hoops, an open lattice the umber core shows through
// THE CRADLE (South, 2026-11-02, via the coordinator: Evangelion's entry plug): in the back, between the shoulder blades, a well
// tilted back 20 degrees from upright, at the Pneuka Jar's own size (vfx/pneukajar/shape.js JAR_ANATOMY: the Jar 1.2 m, its foot
// 0.257 round), so the Jar goes in base first and screws down until its shoulder line (0.82 up it) is flush with the lip, the head
// and face left showing. A screw thread cut round the inside at a pitch of two full turns over that depth, a gold collar on the lip,
// an octagonal boss round it (the cradle's look's octagon and four bronze tines, vfx/cradlelook.js), the well's floor lit while sealed.
// The front of every core is a plain chest.
// Prior art: Medabots' tinpet (the frame the parts hang on, the Medal in its back: the Jar is the Medal); Evangelion's entry plug
// (the pilot inserted at the back of the neck); the bottle kilns of Stoke-on-Trent (the kiln core's shoulders); bisque ware's
// openwork (the light core); Armored Core's cores (a core is the frame's weight class); Gundam's panel lines.
//
//   CORE_LOOKS[id] = { mounts: { neck [y, z], shoulder [x, y], back [y, z], gen [y, z], boost [y, z, x], plug [y, z], cradleZ }, chest(S), waist(S) }
//   cradle(S) (the boss, the thread, the floor's glow, in the well's frame)   cradleParts(mats) -> { collar, tines, bore } (own meshes)
//   CRADLE (the well's sizes: r, depth, turns, pitch, tilt, at [y, z] on the chest)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { JAR_ANATOMY } from '../../pneukajar/shape.js';
import { MECH_LOOK as L, band, panel, cup, seam, ball, threadGeometry, shell } from './kit.js';

const PI = Math.PI;
/** The well: its radius (the Jar's foot and a hand's width of room), its depth (to the Jar's shoulder line), two turns, its tilt back,
 *  and where its floor sits on the chest (the seat: 1.8 over the chest's base, so 3 m over the hip). */
export const CRADLE = { r: JAR_ANATOMY.footR + 0.035, depth: JAR_ANATOMY.shoulderY, turns: 2, tilt: 0.35, at: [L.cradleY, -1.02], boss: 0.52 };
CRADLE.pitch = CRADLE.depth / CRADLE.turns;
const BACK_GAP = 0.44; // (the back's panels stop this far either side of the spine: the cradle's boss stands in the gap)

/** A barrel of panels: the core inside (umber, open at the back for the well), then each [y0, y1, a0, a1, colour] panel, mirrored. */
function barrel(p, prof, sc, panels) {
  p.geo(shell(band(prof, prof[0][1], prof[prof.length - 1][1], 0.95, 14), 28, BACK_GAP - PI, 2 * (PI - BACK_GAP)), { sc, c: L.umber });
  for (const [y0, y1, a0, a1, c, k = 1.03] of panels) {
    const pr = band(prof, y0, y1, k, 8);
    p.geo(panel(pr, a0, a1, 12), { sc, c }); if (a0 > 0) p.geo(panel(pr, -a1, -a0, 12), { sc, c });
  }
}
/** The sockets every core has: the neck's cup (opening up) and the shoulders' (opening out). */
function sockets(p, M, r = 0.6) {
  p.geo(cup(0.4).rotateX(PI), { at: [0, M.neck[0], M.neck[1]], c: L.ivory });
  for (const s of [-1, 1]) p.geo(cup(r).rotateZ(s * PI / 2), { at: [s * M.shoulder[0], M.shoulder[1], 0], c: L.ivory });
}
const waist = (S, c = L.slate) => {
  ball(S.g, 0.5, [0, 0, 0]);
  S.p.cyl(0.5, 0.56, L.chestBase + 0.2, { at: [0, L.chestBase / 2, 0], c }, 20);
  for (let i = 0; i < 2; i++) S.p.lathe([[0.66, 0], [0.76, 0.05], [0.76, 0.2], [0.66, 0.25]], { at: [0, 0.12 + i * 0.3, 0], sc: [1, 1, 0.85], c: i ? L.terracotta : L.ivory }, 28);
};
const G = 0.035; // (a groove's half-width in phi)

export const CORE_LOOKS = {
  clayCore: {
    mounts: { neck: [3.28, 0.12], shoulder: [2.55, 2.45], back: [1.05, -1.32], gen: [0.62, -1.2], boost: [0.32, -1.2, 0.85], plug: [0.4, -1.3], cradleZ: -1.02 },
    prof: [[1.0, 0], [1.12, 0.5], [1.42, 1.0], [1.82, 1.7], [1.98, 2.3], [1.86, 2.8], [1.38, 3.15], [0.5, 3.32]],
    chest(S) {
      const { p, g } = S, P = this.prof, sc = [1.25, 1, 0.55];
      barrel(p, P, sc, [
        [1.05, 3.24, G, 1.0, L.bone], [1.05, 3.1, 1.0 + 2 * G, 1.95, L.ivory], [1.05, 3.0, 1.95 + 2 * G, PI - BACK_GAP, L.ivory], // (breastplate, flank, shoulder blade)
        [0.06, 0.46, G, PI - 0.2, L.grey, 1.05], [0.52, 0.98, G, PI - 0.2, L.ivory, 1.06], // (the abdomen's two wrapped bands)
      ]);
      p.lathe([[0.4, 3.26], [0.95, 3.27], [1.0, 3.4], [0.55, 3.5]], { at: [0, 0, 0.08], sc: [1, 1, 0.8], c: L.terracotta }, 28); // (the gorget)
      sockets(p, this.mounts, 0.6);
      seam(g, [[0.5, 3.0, 0.88], [0.85, 2.7, 1.04], [1.05, 2.35, 1.1], [1.5, 2.1, 1.1], [1.62, 1.7, 1.06], [2.0, 1.45, 0.98]]);
      seam(g, [[0, 0.1, 1.1], [0, 0.95, 1.12]], 0.04);
    },
    waist(S) { waist(S); },
  },
  kilnCore: {
    mounts: { neck: [3.36, 0.1], shoulder: [2.72, 2.4], back: [1.05, -1.48], gen: [0.62, -1.36], boost: [0.32, -1.34, 0.95], plug: [0.4, -1.45], cradleZ: -1.15 },
    prof: [[1.2, 0], [1.4, 0.4], [1.75, 0.9], [2.05, 1.6], [2.12, 2.2], [2.0, 2.75], [1.55, 3.15], [0.6, 3.4]],
    chest(S) {
      const { p, g } = S, P = this.prof, sc = [1.22, 1, 0.62];
      barrel(p, P, sc, [
        [1.05, 2.0, G, 1.15, L.tenmoku], [2.1, 3.3, G, 1.15, L.tenmoku], [1.05, 3.2, 1.15 + 2 * G, PI - BACK_GAP, L.tenmoku], // (the glaze run dark)
        [0.06, 0.95, G, PI - 0.2, L.ash, 1.05],
      ]);
      for (const y of [0.98, 2.05, 3.0]) g.geo(shell(band(P, y - 0.04, y + 0.04, 1.06, 2), 32), { sc, c: y === 2.05 ? L.bronze : L.ash }); // (the kiln's bands)
      p.geo(shell(band(P, 2.0, 2.1, 1.065, 2), 32), { sc, c: L.sand });
      for (let k = 0; k < 4; k++) p.box(0.26, 0.4, 0.14, { at: [-0.75 + k * 0.5, 1.5, 1.27], c: L.umber }, 0.06); // (the firing holes, bricked)
      p.lathe([[0.45, 3.36], [1.1, 3.37], [1.15, 3.5], [0.6, 3.6]], { sc: [1, 1, 0.8], c: L.ash }, 28);
      sockets(p, this.mounts, 0.66);
      seam(g, [[-0.4, 3.1, 1.04], [-0.7, 2.6, 1.28], [-0.55, 2.2, 1.32], [-0.9, 1.8, 1.3]]);
    },
    waist(S) { waist(S, L.tenmoku); },
  },
  lightCore: {
    mounts: { neck: [3.12, 0.1], shoulder: [2.15, 2.4], back: [1.05, -1.12], gen: [0.62, -1.08], boost: [0.32, -1.06, 0.7], plug: [0.4, -1.1], cradleZ: -0.92 },
    prof: [[0.85, 0], [0.92, 0.5], [1.2, 1.1], [1.55, 1.8], [1.68, 2.35], [1.55, 2.8], [1.1, 3.05], [0.45, 3.18]],
    chest(S) {
      const { p, g } = S, P = this.prof, sc = [1.25, 1, 0.6], ribs = 7;
      barrel(p, P, sc, []);
      for (let i = 0; i < ribs; i++) { const a = 0.06 + (i / ribs) * (PI - BACK_GAP - 0.12); p.geo(panel(band(P, 1.0, 3.1, 1.03, 10), a, a + 0.12, 12), { sc, c: L.sand }); p.geo(panel(band(P, 1.0, 3.1, 1.03, 10), -a - 0.12, -a, 12), { sc, c: L.sand }); } // (the ribs)
      for (const [y, c] of [[1.05, L.bone], [2.0, L.ivory], [2.9, L.bone], [0.5, L.ivory]]) p.geo(shell(band(P, y - 0.07, y + 0.07, 1.06, 2), 32, BACK_GAP - PI, 2 * (PI - BACK_GAP)), { sc, c }); // (the hoops)
      p.geo(panel(band(P, 1.6, 2.7, 1.07, 6), -0.42, 0.42, 12), { sc, c: L.bone }); // (the sternum's one plate)
      sockets(p, this.mounts, 0.52);
      seam(g, [[0, 1.65, 1.0], [0, 2.65, 1.04]], 0.03);
    },
    waist(S) { waist(S, L.grey); },
  },
};

/** The cradle's porcelain and glow, in the well's frame (its floor at the origin, +Y up the well's axis out of the back): the
 *  octagonal boss, the thread cut round the inside, the floor's ring lit while sealed. */
export function cradle(S) {
  const { p, g, e } = S, R = CRADLE.r, D = CRADLE.depth, B = CRADLE.boss;
  p.geo(shell([[R, D], [B - 0.04, D], [B, D - 0.05], [B + 0.03, D - 0.2], [B + 0.06, -0.3]], 8, PI / 8), { c: L.ivory }); // (the boss, an octagon)
  p.geo(shell([[B + 0.07, D - 0.26], [B + 0.08, D - 0.34]], 8, PI / 8), { c: L.umber }); // (a groove round it)
  g.geo(threadGeometry(R - 0.03, CRADLE.turns, CRADLE.pitch, 0.03).rotateX(-PI / 2), { at: [0, D - 0.02, 0], c: L.gold });
  e.ring(R * 0.7, 0.03, { at: [0, 0.01, 0], c: 0xffffff }, 32, 4);
}
/** The cradle's own meshes: its gold collar on the lip and its four tines (each its own mesh, for the runtime's cinematic), the bore
 *  (the dark of the well seen from inside: its own program, drawn on its back faces). */
export function cradleParts(mats) {
  const R = CRADLE.r, D = CRADLE.depth;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.05, 8, 40).rotateX(PI / 2).translate(0, D + 0.01, 0), mats.g);
  const tg = [];
  for (let k = 0; k < 4; k++) {
    const a = PI / 4 + (k / 4) * PI * 2, c = Math.cos(a), s = Math.sin(a);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * (R + 0.12), D - 0.05, c * (R + 0.12)), new THREE.Vector3(s * (R + 0.16), D + 0.3, c * (R + 0.16)), new THREE.Vector3(s * (R - 0.02), D + 0.38, c * (R - 0.02)));
    tg.push(new THREE.TubeGeometry(curve, 8, 0.04, 6, false));
  }
  const tines = tg.map((t) => { const m = new THREE.Mesh(t, mats.g); m.castShadow = true; return m; });
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(R, R, D, 32, 1, false).translate(0, D / 2, 0), mats.bore);
  collar.castShadow = true; bore.receiveShadow = true;
  return { collar, tines, bore };
}
