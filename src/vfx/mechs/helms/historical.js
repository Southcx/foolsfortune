// ---------------------------------------------------------------------------------------
// A MECH'S HELM AFTER A REAL ONE (plain names; South, 2026-11-02: "generate some even more extravagant variants referencing real ornate
// historical examples"): eight helms for the hangar's mech (vfx/mechs/helms.js `wearHelm`), each a documented helmet named plainly
// after it, built in the helms' own language (the kit, vfx/mechs/helms/kit.js): an icosahedron's bowl, flat lames, chunky ornament
// grown by HELM_LOOK.orn about its seat, faceless (the dark under the brim, the parade face and the grotesque's face made plates round
// it, never eyes) and floating over the collar. The originals, and where they are held:
//   nagaEboshi   Kato Kiyomasa's naga-eboshi kabuto: the courtier's tall hat as a silvered crown climbing and leaning back, the snake's-
//                eye mon on each side (Momoyama, 16th c.; the Tokugawa Art Museum, Nagoya, from the Kii Tokugawa)
//   ichiNoTani   Kuroda Nagamasa's ichi-no-tani kabuto: a sheer cliff of silver-leafed wood standing fore and aft over the bowl, the
//                Ichi-no-Tani cliff ridden down in 1184 (Important Cultural Property; the Fukuoka City Museum, the Kuroda gift of 1978)
//   namazuO      the Maeda's namazu-o kabuto: a catfish's tail standing tall off the back of the crown, forked at its top (attributed
//                to Maeda Toshiie and his son Toshinaga of Kaga; the collection it is held in left open here, unconfirmed)
//   shida        Tokugawa Ieyasu's: the Daikoku hood bowl in black and the gold fern-leaf maedate (shida), from the iyozane kuro-ito
//                odoshi domaru gusoku of his dream (the Kunozan Toshogu Shrine, Shizuoka)
//   horned       Henry VIII's horned helmet: the armet with ram's horns curling at the temples, its grotesque mask made only a brow
//                over the dark (faceless), the rondel on its stem behind (Konrad Seusenhofer, Innsbruck, 1511-14, a gift
//                of Maximilian I; the Royal Armouries, Leeds, IV.22)
//   negroli      Filippo Negroli's burgonet: a siren lying along its comb, her tail curled up the back, holding Medusa's head over the
//                peak (here a gold boss and its snakes; Milan, 1543, signed; the Metropolitan Museum of Art, 17.190.1720)
//   suttonHoo    the Sutton Hoo helmet: the crest over the crown ending in dragon's heads, the eyebrows ending in boar's heads, the
//                flying dragon of the nose, the cheek guards (East Anglia, early 7th c.; the British Museum, 1939,1010.93)
//   turban       a turban helmet: the swelling fluted bowl climbing to a fluted cone and its finial, the inscribed band, the sliding
//                nasal and the mail (late 15th c., Ottoman arsenal or Aq Qoyunlu work; the Metropolitan Museum of Art, 04.3.211)
// Each reads from its outline at 40 m; plumes only where the original wore them (none here did).
// Prior art: the originals above; the kawari-kabuto's tradition of object crests; the helms' kit.
//
//   HISTORICAL[id] = { label }   BUILD_HISTORICAL[id](B)   (B: the helm's pieces, as helms.js builds them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { plate, sidePlate } from '../parts/kit.js';
import { L, PI, V, R, bez, taper, along, gem, facet, icoDome, bowl, shikoro, flat, fukigaeshi, orn } from './kit.js';

export const HISTORICAL = {
  nagaEboshi: { label: "Kiyomasa's naga-eboshi" },
  ichiNoTani: { label: "Kuroda's ichi-no-tani" },
  namazuO: { label: "Maeda's catfish tail" },
  shida: { label: "Ieyasu's fern kabuto" },
  horned: { label: "Henry VIII's horned helm" },
  negroli: { label: "Negroli's siren burgonet" },
  suttonHoo: { label: 'Sutton Hoo helm' },
  turban: { label: 'Turban helm' },
};

const _Y = new V(0, 1, 0), _q = new THREE.Quaternion(), _eu = new THREE.Euler();
/** A faceted frustum from a to b (an n-sided prism stage of a crown), radius ra at a and rb at b, `sc` stretching it across. */
function stage(P, a, b, ra, rb, n, o = {}) {
  const A = new V(...a), Bv = new V(...b), d = Bv.clone().sub(A), len = d.length();
  _q.setFromUnitVectors(_Y, d.normalize()); _eu.setFromQuaternion(_q, 'XYZ');
  P.geo(facet(new THREE.CylinderGeometry(rb, ra, len * 1.04, n, 1)), { ...o, at: A.add(Bv).multiplyScalar(0.5).toArray(), rot: [_eu.x, _eu.y, _eu.z] });
}
/** Gold along a run of points (an edge). */
const edge = (g, pts, r = 0.05) => { for (let i = 1; i < pts.length; i++) g.rod(pts[i - 1], pts[i], r, {}, 5); };
/** A peak over the brow. */
const peak = (p, g, c, w = R * 2.05, d = 0.75, tilt = -0.3) => { p.box(w, 0.08, d, { at: [0, 0.05, R * 0.95], rot: [tilt, 0, 0], c }, 0.02); g.box(w, 0.07, 0.1, { at: [0, 0.05 + Math.sin(-tilt) * d * 0.45, R * 0.95 + d * 0.45] }, 0.02); };
/** A cheek plate each side, gold-riveted. */
function cheeks(p, g, c, h = 1.2, d = 1.05, z = R * 0.35) {
  for (const s of [-1, 1]) { p.box(0.16, h, d, { at: [s * R * 0.93, -h * 0.45, z], rot: [0, 0, s * 0.1], c }, 0.05); for (const k of [-1, 1]) g.ball(0.08, { at: [s * R * 0.99, -0.2, z + k * d * 0.3] }, 6, 4); }
}

function nagaEboshi(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.8, L.bone, { sc: [1, 1, 1.05] });
  g.ring(R, 0.07, { at: [0, 0.03, 0], sc: [1, 1, 1.05] }, 32);
  shikoro(p, R, 4, 0.3, 0.17, [L.bone, L.grey], L.cord, 1.15); // (wide and flaring, as Kiyomasa's)
  fukigaeshi(p, g, R, 0.9, L.bone);
  peak(p, g, L.bone);
  orn(B, [0, R * 0.55, -0.1], () => {
    // the crown: six-sided stages, flattened side to side (a lacquered eboshi), narrowing as it climbs and leans back
    const sp = bez([[0, R * 0.45, 0.0], [0, R * 1.6, 0.05], [0, R * 2.4, -0.35], [0, R * 3.0, -1.0]], 6), N = sp.length - 1;
    for (let i = 0; i < N; i++) stage(p, sp[i], sp[i + 1], 1.1 - 0.5 * (i / N), 1.1 - 0.5 * ((i + 1) / N), 6, { sc: [0.6, 1, 1], c: i % 2 ? L.bone : L.ivory });
    stage(g, sp[0], along(sp, 0.06), 1.16, 1.15, 6, { sc: [0.62, 1, 1] }); // (a gold band at its foot)
    const top = sp[N]; p.box(0.62, 0.5, 1.25, { at: [0, top[1] + 0.05, top[2] + 0.25], rot: [0.5, 0, 0], c: L.ivory }, 0.06); // (its tip folded forward)
    // the snake's-eye mon (janome, the Kato's) on each side, chunky: a gold ring round a trim disc
    const m = along(sp, 0.5);
    for (const s of [-1, 1]) {
      g.geo(new THREE.TorusGeometry(0.48, 0.12, 4, 10).rotateY(PI / 2), { at: [s * 0.62, m[1], m[2]] });
      t.cyl(0.36, 0.36, 0.1, { at: [s * 0.6, m[1], m[2]], rot: [0, 0, PI / 2], c: L.trim }, 10);
    }
  });
}

function ichiNoTani(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.85, L.dark, { ribs: 1, ribC: L.grey });
  g.ring(R, 0.07, { at: [0, 0.03, 0] }, 32);
  shikoro(p, R, 4, 0.28, 0.13, [L.dark, L.grey], L.cord);
  fukigaeshi(p, g, R, 1.0, L.dark);
  peak(p, g, L.dark);
  orn(B, [0, R * 0.8, 0], () => {
    // the cliff: a sheer face over the brow, its top falling away behind (outline [z, y], standing fore and aft)
    const cliff = [[R * 0.8, R * 0.45], [R * 1.05, 2.55], [R * 0.75, 3.05], [0.25, 2.8], [-0.45, 2.9], [-1.25, 2.4], [-R * 0.9, R * 0.75], [0, R * 0.95]];
    t.geo(sidePlate(cliff, 0.36, 0.05), { c: L.trim });
    for (const s of [-1, 1]) t.geo(sidePlate([[R * 0.85, R * 0.9], [R * 0.98, 2.35], [0.3, 2.4], [-1.0, 2.05], [-R * 0.65, R * 1.0]], 0.12, 0.03), { at: [s * 0.2, 0, 0], c: L.trimD }); // (its strata, a step on each face)
    edge(g, cliff.slice(1, 6).map(([z, y]) => [0, y + 0.03, z]), 0.06);
  });
}

function namazuO(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.9, L.ivory);
  g.ring(R, 0.07, { at: [0, 0.03, 0] }, 32);
  shikoro(p, R, 4, 0.29, 0.12, [L.grey, L.ivory], L.cord);
  fukigaeshi(p, g, R, 0.95, L.ivory);
  peak(p, g, L.ivory);
  orn(B, [0, R * 0.8, -R * 0.4], () => {
    // the tail: a tall flattened column off the back of the crown, swelling, curving back, forked at the top (outline [z, y])
    const tail = [[R * 0.25, R * 0.95], [0.15, 2.2], [-0.2, 3.2], [-0.15, 4.1], [0.35, 4.6], [-0.55, 4.35], [-1.35, 4.75], [-1.05, 3.7], [-1.05, 2.6], [-R * 0.85, R * 0.55], [-R * 0.3, R * 0.9]];
    t.geo(sidePlate(tail, 0.55, 0.08), { c: L.trim });
    t.geo(sidePlate([[0.05, 2.2], [-0.25, 3.3], [-0.8, 3.6], [-0.85, 2.5], [-0.6, R * 1.0]], 0.75, 0.05), { c: L.trimD }); // (its swell, the fish's thickness)
    for (let i = 0; i < 4; i++) t.box(0.8, 0.12, 0.12, { at: [0, 4.05 + i * 0.12, -0.25 - i * 0.28], rot: [0.5, 0, 0], c: L.trimDD }, 0.03); // (the fork's rays)
    edge(g, tail.slice(0, 5).map(([z, y]) => [0, y, z + 0.06]), 0.06);
  });
}

function shida(B) {
  const { p, t, g, lab } = B;
  bowl(p, R, R * 0.95, L.dark, { sc: [1.05, 1, 1.08] });
  p.geo(icoDome(R * 0.85, R * 0.6), { at: [0, R * 0.55, -0.25], sc: [1.05, 1, 1], c: L.dark }); // (the Daikoku hood's soft crown)
  g.ring(R, 0.07, { at: [0, 0.03, 0], sc: [1.05, 1, 1.08] }, 32);
  shikoro(p, R, 5, 0.27, 0.14, [L.dark, L.grey], L.cord);
  fukigaeshi(p, g, R, 1.2, L.dark);
  peak(p, g, L.dark);
  lab.box(0.34, 0.42, 0.12, { at: [0, 0.4, R * 1.05] }, 0.05); // (the maedate's mount)
  orn(B, [0, 0.4, R * 1.05], () => {
    // the fern: a gold stem climbing over the brow, its fronds paired up it, shorter as they climb, the tip curled
    const stem = bez([[0, 0.4, R * 1.08], [0, 1.5, R * 1.25], [0, 2.5, R * 1.15], [0, 3.0, R * 0.85]], 10);
    taper(g, stem, 0.11, 0.04);
    for (let i = 0; i < 7; i++) {
      const k = i / 6, at = along(stem, 0.08 + k * 0.78), len = 1.15 - k * 0.75;
      for (const s of [-1, 1]) flat(g, [[0, 0], [len * 0.45, 0.2], [len, 0.08], [len * 0.55, -0.12]], s, { at: [at[0], at[1], at[2] + 0.02], rot: [-0.15, 0, s * (0.35 + k * 0.55)] }, 0.12);
    }
  });
}

function horned(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.9, L.grey, { sc: [1, 1, 1.1] });
  p.arc(R * 0.92, 0.13, { rot: [0, PI / 2, 0], sc: [1, 0.98, 1.12], c: L.bone }, PI, 18); // (the armet's comb)
  g.ring(R, 0.06, { at: [0, 0.03, 0], sc: [1, 1, 1.1] }, 32);
  cheeks(p, g, L.grey, 1.25, 1.2);
  shikoro(p, R, 2, 0.3, 0.07, [L.grey, L.bone], L.dark, 1.5);
  g.rod([0, 0.15, -R * 1.05], [0, 0.15, -R * 1.45], 0.05, {}, 5); g.cyl(0.42, 0.42, 0.1, { at: [0, 0.15, -R * 1.5], rot: [PI / 2, 0, 0] }, 10); // (the rondel on its stem)
  // the grotesque's brow only, a scowl over the dark (its jowls, jaw and moustache cut: the helm stays faceless, South's rule)
  for (const s of [-1, 1]) t.box(1.15, 0.36, 0.6, { at: [s * 0.55, 0.05, R * 0.95], rot: [-0.25, s * 0.3, s * -0.3], c: L.trimD }, 0.12);
  // the ram's horns: from the temples back, down and round in a spiral, thinning
  for (const s of [-1, 1]) orn(B, [s * 0.9, 0.9, 0.1], () => {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, a = -0.4 + u * PI * 1.75, r = 0.78 * (1 - u * 0.62); pts.push([s * (0.9 + u * 0.9), 0.2 + Math.cos(a) * r, -0.2 - Math.sin(a) * r]); }
    taper(t, pts, 0.3, 0.07, { c: L.trim });
  });
}

function negroli(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.92, L.grey, { sc: [1, 1, 1.08] });
  g.ring(R, 0.07, { at: [0, 0.03, 0], sc: [1, 1, 1.08] }, 32);
  peak(p, g, L.grey, R * 1.9, 1.0, -0.22);
  cheeks(p, g, L.bone, 1.35, 1.15);
  shikoro(p, R, 3, 0.26, 0.12, [L.grey, L.bone], L.dark, 1.55);
  orn(B, [0, R * 0.85, 0], () => {
    // the siren: her body the comb, arched from the brow to the nape
    const comb = [[R * 0.8, R * 0.55], [R * 0.78, R * 0.95], [0.75, 2.75], [0.05, 2.95], [-0.8, 2.6], [-R * 0.85, R * 1.0], [-R * 0.95, R * 0.4], [0, R * 0.9]];
    t.geo(sidePlate(comb, 0.28, 0.05), { c: L.trim });
    edge(g, comb.slice(1, 6).map(([z, y]) => [0, y + 0.03, z]), 0.05);
    t.geo(gem(0.36), { at: [0, 2.8, 0.95], c: L.trim }); // (her head, leaning out over the brow)
    taper(t, bez([[0, 2.45, 1.15], [0, 2.0, R * 0.95], [0, 1.75, R * 0.98]], 4), 0.1, 0.06, { c: L.trimD }); // (her arm, down to Medusa)
    // Medusa: a gold boss over the peak, her snakes thrown out round it
    g.geo(gem(0.34), { at: [0, R * 1.0, R * 0.98], sc: [1, 1, 0.6] });
    const mc = [0, R * 1.0, R * 1.02];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + 0.2; taper(g, bez([mc, [Math.cos(a) * 0.42, mc[1] + Math.sin(a) * 0.42, mc[2] + 0.08], [Math.cos(a + 0.6) * 0.66, mc[1] + Math.sin(a + 0.6) * 0.6, mc[2] + 0.04]], 3), 0.05, 0.02); }
    // her tail, curled up the back to its fluke
    const tail = bez([[0, R * 0.55, -R * 0.95], [0, 0.0, -R * 1.65], [0, 1.1, -R * 2.0], [0, 2.0, -R * 1.6]], 8);
    taper(t, tail, 0.18, 0.08, { c: L.trim });
    t.geo(plate([[-0.85, 0.6], [-0.15, 0], [0.15, 0], [0.85, 0.6], [0, 0.28]], 0.14, 0.03), { at: tail[8], rot: [-0.4, 0, 0], c: L.trim });
  });
}

function suttonHoo(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 0.92, L.grey, { ribs: 1, ribC: L.bone }); // (the pressed-foil panels, a facet a panel)
  g.ring(R, 0.07, { at: [0, 0.03, 0] }, 32);
  cheeks(p, g, L.grey, 1.55, 1.25, R * 0.25);
  shikoro(p, R, 2, 0.42, 0.08, [L.grey, L.bone], L.dark, 1.6);
  // the flying dragon of the nose: its body a plate down between the eyebrows, gold-edged (the dark either side of it)
  p.box(0.34, 1.05, 0.22, { at: [0, -0.4, R * 1.0], c: L.bone }, 0.06);
  for (const s of [-1, 1]) g.rod([s * 0.18, 0.1, R * 1.06], [s * 0.18, -0.9, R * 1.06], 0.035, {}, 5);
  // the crest over the crown, a dragon's head at each end
  orn(B, [0, R * 0.9, 0], () => {
    const crest = []; for (let i = 0; i <= 10; i++) { const a = -PI / 2 + 0.25 + (i / 10) * (PI - 0.5); crest.push([0, Math.cos(a) * R * 0.98 + 0.05, Math.sin(a) * R * 1.0]); }
    for (let i = 1; i < crest.length; i++) t.rod(crest[i - 1], crest[i], 0.14, { c: L.trim }, 5);
    for (const [end, dir] of [[crest[10], 1], [crest[0], -1]]) {
      g.geo(gem(0.3), { at: end, sc: [0.8, 1, 1.2] });
      g.cone(0.18, 0.55, { at: [0, end[1] - 0.15, end[2] + dir * 0.3], rot: [dir * 2.1, 0, 0] }, 5);
    }
  });
  // the eyebrows over the dark, a gold boar's head at each outer end
  for (const s of [-1, 1]) orn(B, [s * 0.2, 0.22, R * 1.0], () => {
    const brow = bez([[s * 0.2, 0.22, R * 1.04], [s * 0.6, 0.3, R * 0.98], [s * 0.95, 0.05, R * 0.8]], 5);
    for (let i = 1; i < brow.length; i++) t.rod(brow[i - 1], brow[i], 0.1, { c: L.trim }, 5);
    const e = brow[5]; g.geo(gem(0.2), { at: e }); g.cone(0.12, 0.35, { at: [e[0] - s * 0.15, e[1] - 0.08, e[2] + 0.12], rot: [0, 0, s * 1.6] }, 5);
  });
}

/** A fluted cone (the turban helmet's spire): a star of 2n points round its foot, every other flute in the second tone. */
function fluted(P, r, h, y, n, c0, c1) {
  const pos = [[], []];
  for (let i = 0; i < n * 2; i++) {
    const a0 = (i / (n * 2)) * PI * 2, a1 = ((i + 1) / (n * 2)) * PI * 2, r0 = i % 2 ? r * 0.9 : r, r1 = i % 2 ? r : r * 0.9;
    pos[(i >> 1) % 2].push(Math.cos(a0) * r0, y, Math.sin(a0) * r0, 0, y + h, 0, Math.cos(a1) * r1, y, Math.sin(a1) * r1);
  }
  pos.forEach((arr, j) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); geo.computeVertexNormals(); P.geo(geo, { c: j ? c1 : c0 }); });
}

function turban(B) {
  const { p, t, g } = B;
  bowl(p, R * 1.03, R * 0.72, L.grey, { ribs: 1, ribC: L.bone });
  fluted(p, R * 0.86, R * 1.45, R * 0.55, 12, L.grey, L.bone);
  t.geo(facet(new THREE.CylinderGeometry(R * 1.01, R * 1.05, 0.42, 20, 1, true)), { at: [0, 0.22, 0], c: L.trimD }); // (the inscribed band)
  g.ring(R * 1.05, 0.06, { at: [0, 0.02, 0] }, 32); g.ring(R * 1.01, 0.05, { at: [0, 0.43, 0] }, 32);
  shikoro(p, R * 1.02, 4, 0.24, 0.08, [L.dark, L.grey], L.dark, 1.2); // (the mail)
  peak(p, g, L.grey, R * 1.6, 0.55, -0.25);
  cheeks(p, g, L.grey, 0.9, 0.8);
  // the sliding nasal, its head a gold leaf
  g.box(0.14, 1.5, 0.1, { at: [0, -0.4, R * 1.12] }, 0.03); g.cone(0.22, 0.45, { at: [0, 0.55, R * 1.12] }, 4); g.cone(0.14, 0.3, { at: [0, -1.2, R * 1.12], rot: [PI, 0, 0] }, 4);
  orn(B, [0, R * 1.95, 0], () => { g.geo(gem(0.24), { at: [0, R * 2.02, 0] }); g.cone(0.13, 0.75, { at: [0, R * 2.02 + 0.5, 0] }, 6); }); // (the finial)
}

export const BUILD_HISTORICAL = { nagaEboshi, ichiNoTani, namazuO, shida, horned, negroli, suttonHoo, turban };
