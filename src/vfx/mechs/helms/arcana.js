// ---------------------------------------------------------------------------------------
// THE ARCANA'S HELMS (plain names; South, 2026-11-02: "Make a helmet or hat for each of the 22 Major Arcana, taking inspiration from 22
// different cultures across time, and again add that sci-fantasy magitech flare"): twenty-two helms and crowns for the hangar's mech
// (vfx/mechs/helms.js `wearHelm`), one a Major Arcana card, each from a different culture or age, built in the helms' own language (the
// kit, vfx/mechs/helms/kit.js): icosahedron bowls and faceted stages, chunky ornament grown by HELM_LOOK.orn about its seat, faceless
// (under every brim, behind every grille, slit and fringe only the dark and its one light; a crown worn over the dark as the whole
// head-piece) and floating over the collar. The magitech is the house's: Lachrymite crystals (the stone piece), gold inlay run as a
// circuit's bus and pins, one ring or piece floating apart from the bowl (it suits a helm on no neck), and the card's number on a stone
// plaque in neuralese numerals (the kit's `plaque`). Cards 0 to X here, XI to XXI in arcana2.js. The originals:
//   0     jester       the Fool: a court fool's hood with its three points and bells and a dagged collar (late-medieval France and
//                     Burgundy, as in the margins of the Books of Hours), its facets in Arlecchino's lozenges (the Commedia dell'arte)
//   I     sakaCap      the Magician: the Saka's tall pointed cap of the Issyk kurgan's "Golden Man", its gold arrows, winged steeds and
//                     mountain band (Kazakhstan, 4th-3rd c. BCE; found 1969, Kazakhstan's national collections), the lemniscate over it
//   II    hathor       the High Priestess: the khat and its lappets, the uraeus, a modius of cobras and the Isis-Hathor crown of cow's
//                     horns round the disc, the disc a moon of Lachrymite (Late Period and Ptolemaic Egypt; the Louvre's and the
//                     Met's bronzes of Isis)
//   III   silla        the Empress: the Silla gold crown, its three tree-shaped uprights (the 出) and two antlers, gogok and pendants
//                     over a tall cap (Gyeongju, 5th-6th c.; the Hwangnamdaechong crown, National Treasure 191, and Geumgwanchong's,
//                     87; the National Museum of Korea and the Gyeongju National Museum)
//   IV    mianguan     the Emperor: the Ming mianguan, its board over the cap and its strands of jade before and behind, the hairpin
//                     and its ear-jades (the nine-strand mianguan of Zhu Tan, Prince of Lu, 1389; the Shandong Museum), the board
//                     floated on a crystal
//   V     abuna        the Hierophant: an Ethiopian church crown, its drum of three tiers of arcades and the dome (Gondar, c. 1740;
//                     the Maqdala crown, the V&A, London), its cross left off for an orb and a crystal
//   VI    mughal       the Lovers: a Mughal turban, its wraps crossing at the brow, the sarpech and its jigha and a kalgi's heron
//                     plume (17th-18th c.; the V&A's sarpech; Shah Jahan in the Padshahnama, the Royal Collection), two rings linked
//   VII   murmillo     the Chariot: the murmillo's helmet, its broad brim, the grille over the face, the fish crest, the plume
//                     sockets and the neck guard (the gladiators' barracks at Pompeii, 1st c. CE; the National Archaeological
//                     Museum, Naples), the grille made one panel of bars (never two eyes), a wheel floated behind
//   VIII  jaguar       Strength: an ocelotl, the Mexica jaguar warrior's head-piece, the warrior in its open maw, its rosettes, the
//                     stepped fret and a quetzal tuft (the Codex Mendoza, c. 1541, the Bodleian, Oxford; the Florentine Codex)
//   IX    komuso       the Hermit: the komuso's tengai, the woven basket over the whole head with its reed window (Edo Japan, the
//                     Fuke school of Zen), the hermit's lantern floating beside it
//   X     chada        the Wheel of Fortune: the Thai chada, its band of upturned petals, the flame-shaped ear flanges and the tiered
//                     spire (the Great Crown of Victory, 1782, the Grand Palace, Bangkok; the khon dancers'), a wheel floated behind
// Chosen with care: no war bonnet or other closed regalia, no deity's face, no crosses on the church crowns; a mask's face (the
// jaguar's, the fool's) only as the open maw or hood round the dark.
// Prior art: the originals above; the tarot of Waite and Colman Smith (1909) for each card's sign (the lemniscate, the wheel, the
// lantern, the linked lovers); the house's Lachrymite and neuralese.
//
//   ARCANA[id] = { label, card }   BUILD_ARCANA[id](B)   ARCANA_HELMS[0..21] -> id
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { plate } from '../parts/kit.js';
import { L, PI, R, bez, taper, along, add, gem, facet, icoDome, bowl, shikoro, flat, orn, stage, onBowl, trace, circuits, crystal, aim, halo, plaque, onBand, yawTilt, across } from './kit.js';
import { ARCANA_B, BUILD_ARCANA_B } from './arcana2.js';

const A = {
  jester: { label: "The Fool: jester's hood", card: 0 },
  sakaCap: { label: 'The Magician: Saka cap', card: 1 },
  hathor: { label: 'The High Priestess: Hathor crown', card: 2 },
  silla: { label: 'The Empress: Silla crown', card: 3 },
  mianguan: { label: 'The Emperor: mianguan', card: 4 },
  abuna: { label: 'The Hierophant: Ethiopian crown', card: 5 },
  mughal: { label: 'The Lovers: Mughal turban', card: 6 },
  murmillo: { label: "The Chariot: murmillo's helm", card: 7 },
  jaguar: { label: 'Strength: jaguar warrior', card: 8 },
  komuso: { label: "The Hermit: komuso's tengai", card: 9 },
  chada: { label: 'The Wheel of Fortune: chada', card: 10 },
};
export const ARCANA = { ...A, ...ARCANA_B };
export const ARCANA_HELMS = Object.keys(ARCANA).sort((a, b) => ARCANA[a].card - ARCANA[b].card);

/** The card's number at the nape, on the bowl's back at elevation e. */
const nape = (B, n, r, h, e = 0.35, sc = [1, 1, 1], s) => plaque(B, n, onBowl(r, h, PI, e, 1.05, sc), [e * 0.8, PI, 0], s);
/** A gold rim round a bowl's foot. */
const rim = (g, r = R, sc = [1, 1, 1]) => g.ring(r, 0.07, { at: [0, 0.03, 0], sc }, 32);
/** An open faceted drum from y0 to y1 (a crown's tier, a basket's course), its radius rb at the foot and rt at the top. */
const drum = (P, y0, y1, rb, rt, n, o = {}, ts = 0, tl = PI * 2) => P.geo(facet(new THREE.CylinderGeometry(rt, rb, y1 - y0, n, 1, true, ts, tl)), { ...o, at: [0, (y0 + y1) / 2, 0] });

function jester(B) {
  const { p, t, g, lab } = B;
  bowl(p, R, R * 0.95, L.bone, { ribs: 1, ribC: L.grey }); // (the hood in lozenges: every other facet the second tone, Arlecchino's patches)
  rim(g); circuits(g, R, R * 0.95, { seed: 1, n: 5 });
  for (let i = 0; i < 11; i++) { // (the dagged collar, open at the face)
    const a = 0.85 + (i / 10) * (PI * 2 - 1.7);
    t.cone(0.3, 0.8, { at: [Math.sin(a) * R * 1.0, -0.36, Math.cos(a) * R * 1.0], rot: aim([Math.sin(a) * 0.35, -1, Math.cos(a) * 0.35]), c: i % 2 ? L.trim : L.trimD }, 4);
  }
  for (const [s, back] of [[-1, 0], [1, 0], [0, 1]]) { // (the three points, a bell of crystal at each tip)
    const root = back ? [0, R * 0.85, -0.45] : [s * 0.75, R * 0.8, 0];
    orn(B, root, () => {
      const pts = back ? bez([root, [0, R * 1.5, -0.95], [0, R * 1.05, -1.75], [0, 0.45, -1.7]], 10) : bez([root, [s * 1.25, R * 1.45, 0.1], [s * 1.7, R * 1.0, 0.2], [s * 1.6, 0.35, 0.35]], 10);
      taper(t, pts, 0.34, 0.1, { c: back ? L.trimD : L.trim });
      const end = pts[pts.length - 1]; g.geo(gem(0.25), { at: add(end, [0, -0.2, 0]) }); crystal(lab, add(end, [0, -0.55, 0]), 0.5, 0.13, [PI, 0, 0]);
    });
  }
  orn(B, [0, R * 0.95, 0], () => halo(B, [0, R * 1.42, 0.05], 0.62, { gems: 5, len: 0.34 }));
  nape(B, 0, R, R * 0.95);
}

function sakaCap(B) {
  const { p, t, g, lab } = B;
  bowl(p, R, R * 0.7, L.ivory);
  rim(g); circuits(g, R, R * 0.7, { seed: 2, n: 4, e1: 0.5 });
  const sp = bez([[0, R * 0.35, 0], [0, R * 1.3, -0.05], [0, R * 2.0, -0.3], [0, R * 2.5, -0.6]], 6), N = sp.length - 1; // (the cap: a felt cone climbing and leaning back)
  for (let i = 0; i < N; i++) stage(p, sp[i], sp[i + 1], R * (0.9 - 0.72 * (i / N)), R * (0.9 - 0.72 * ((i + 1) / N)), 7, { c: i % 2 ? L.ivory : L.bone });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; g.cone(0.17, 0.4, { at: [Math.sin(a) * R * 1.0, 0.24, Math.cos(a) * R * 1.0] }, 3); } // (the band of gold mountains)
  for (const s of [-1, 1]) { p.box(0.16, 1.15, 1.15, { at: [s * R * 0.94, -0.5, 0.0], rot: [0, 0, s * 0.08], c: L.bone }, 0.05); g.ball(0.09, { at: [s * R * 1.0, -0.2, 0.3] }, 6, 4); } // (the ear flaps)
  orn(B, [0, R * 0.5, R * 0.8], () => { // (the gold arrows up its front)
    for (const k of [-1.5, -0.5, 0.5, 1.5]) {
      const a = [k * 0.24, R * 0.45, R * 0.86], b = [k * 0.42, R * 1.75, R * 0.42];
      g.rod(a, b, 0.05); g.cone(0.15, 0.4, { at: b, rot: aim([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) }, 4);
    }
  });
  for (const s of [-1, 1]) orn(B, [s * R * 0.72, R * 0.85, -0.05], () => { // (the winged steeds' wings, a pair up its flanks)
    flat(t, [[0, 0], [0.75, 0.45], [1.15, 1.05], [0.95, 0.95], [0.85, 0.65], [0.55, 0.6], [0.65, 0.35], [0.25, 0.22]], s, { at: [s * R * 0.72, R * 0.85, -0.05], rot: [0, s * 0.35, s * 0.2], c: L.trim }, 0.12);
  });
  const top = sp[N];
  orn(B, top, () => {
    g.geo(gem(0.22), { at: top }); crystal(lab, add(top, [0, 0.55, 0]), 0.85, 0.17);
    const c = add(top, [0, 1.55, 0.1]), lem = []; // (the lemniscate floated over the point)
    for (let i = 0; i <= 24; i++) { const u = (i / 24) * PI * 2, d = 1 + Math.sin(u) ** 2; lem.push(add(c, [0.75 * Math.cos(u) / d, 0.75 * Math.sin(u) * Math.cos(u) / d, 0])); }
    for (let i = 1; i < lem.length; i++) g.rod(lem[i - 1], lem[i], 0.06);
    lab.geo(gem(0.12), { at: c });
  });
  nape(B, 1, R, R * 0.7, 0.25);
}

function hathor(B) {
  const { p, t, g, lab } = B;
  const sc = [1, 1, 1.05];
  bowl(p, R, R * 0.85, L.bone, { ribs: 1, ribC: L.ivory, sc }); // (the khat's cloth)
  rim(g, R, sc); circuits(g, R, R * 0.85, { seed: 3, sc, n: 5 });
  for (const s of [-1, 1]) { // (the lappets framing the dark, gold-banded)
    p.box(0.62, 1.7, 0.16, { at: [s * R * 0.86, -0.75, R * 0.45], rot: [0.05, s * 0.35, 0], c: L.bone }, 0.05);
    for (let i = 0; i < 5; i++) g.box(0.66, 0.07, 0.2, { at: [s * R * 0.86, -0.1 - i * 0.32, R * 0.45], rot: [0.05, s * 0.35, 0] }, 0.01);
  }
  p.box(0.75, 1.15, 0.2, { at: [0, -0.55, -R * 0.98], rot: [-0.15, 0, 0], c: L.ivory }, 0.05); // (the tail behind)
  orn(B, [0, 0.15, R * 1.04], () => { // (the uraeus rearing at the brow)
    taper(g, bez([[0, 0.1, R * 1.06], [0, 0.4, R * 1.2], [0, 0.7, R * 1.1], [0, 0.88, R * 1.2]], 5), 0.09, 0.05);
    g.geo(plate([[-0.22, 0], [0.22, 0], [0.16, 0.42], [0, 0.52], [-0.16, 0.42]], 0.07, 0.02), { at: [0, 0.62, R * 1.13], rot: [-0.2, 0, 0] });
    lab.geo(gem(0.1), { at: [0, 0.82, R * 1.18] });
  });
  const top = R * 0.85 + 0.05;
  t.geo(facet(new THREE.CylinderGeometry(R * 0.5, R * 0.56, 0.4, 10, 1)), { at: [0, top + 0.12, -0.05], c: L.trimD }); // (the modius)
  for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; g.cone(0.1, 0.3, { at: [Math.sin(a) * R * 0.55, top + 0.42, -0.05 + Math.cos(a) * R * 0.55] }, 4); }
  orn(B, [0, top + 0.3, -0.05], () => {
    const y = top + 0.3;
    for (const s of [-1, 1]) taper(t, bez([[s * 0.4, y, -0.05], [s * 1.2, y + 0.3, -0.05], [s * 1.25, y + 1.2, -0.05], [s * 0.55, y + 1.6, -0.05]], 10), 0.17, 0.06, { c: L.trim }); // (the cow's horns, a lyre)
    lab.geo(facet(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 10)), { at: [0, y + 0.85, -0.05], rot: [PI / 2, 0, 0] }); // (the disc, a moon of the stone, floating)
    g.geo(facet(new THREE.TorusGeometry(0.66, 0.08, 4, 10)), { at: [0, y + 0.85, -0.05] });
  });
  nape(B, 2, R, R * 0.85, 0.5, sc);
}

function silla(B) {
  const { p, t, g, lab } = B;
  p.geo(icoDome(R * 0.9, R * 1.35), { c: L.dark }); // (the tall cap inside it, Cheonmachong's)
  circuits(g, R * 0.9, R * 1.35, { seed: 4, e0: 0.45, n: 5, skip: 0.9 });
  g.geo(facet(new THREE.CylinderGeometry(R * 0.98, R * 1.0, 0.5, 16, 1, true)), { at: [0, 0.25, 0] }); // (the band)
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; lab.geo(gem(0.1), { at: onBand(a, R * 1.0, 0, 0.25, 0.04) }); }
  for (const a of [0, 1.25, -1.25]) orn(B, onBand(a, R, 0, 0.5), () => { // (the three trees, the 出: a stem and three tiers of branches turned up)
    const rot = [0, a, 0];
    g.box(0.26, 2.3, 0.12, { at: onBand(a, R, 0, 1.6), rot }, 0.03);
    for (let j = 0; j < 3; j++) { const y = 1.0 + j * 0.62; for (const s of [-1, 1]) {
      g.box(0.4, 0.15, 0.12, { at: onBand(a, R, s * 0.28, y), rot }, 0.02); g.box(0.15, 0.48, 0.12, { at: onBand(a, R, s * 0.48, y + 0.18), rot }, 0.02);
      lab.geo(gem(0.13), { at: onBand(a, R, s * 0.48, y + 0.5, 0.04), sc: [0.75, 1.1, 0.75] });
    } }
    lab.geo(gem(0.16), { at: onBand(a, R, 0, 2.85, 0.04), sc: [0.75, 1.1, 0.75] });
  });
  for (const s of [-1, 1]) { const a = s * 2.4; orn(B, onBand(a, R, 0, 0.5), () => { // (the two antlers behind)
    g.box(0.24, 1.9, 0.12, { at: onBand(a, R, 0, 1.4), rot: [0, a, 0] }, 0.03);
    for (let j = 0; j < 3; j++) for (const k of [-1, 1]) g.box(0.15, 0.6, 0.12, { at: onBand(a, R, k * 0.26, 1.05 + j * 0.5), rot: [0, a, -k * 0.6] }, 0.02);
  }); }
  for (const s of [-1, 1]) for (const d of [-0.22, 0.22]) { // (the pendants, gogok at their ends)
    const a = s * PI / 2 + d, top = onBand(a, R * 1.02, 0, 0.02), bot = onBand(a, R * 1.06, 0, -1.15);
    g.rod(top, bot, 0.03); for (let i = 1; i < 4; i++) g.geo(gem(0.09), { at: along([top, bot], i / 4) });
    crystal(lab, add(bot, [0, -0.2, 0]), 0.42, 0.12, [PI, 0, 0]);
  }
  orn(B, [0, R * 1.35, 0], () => halo(B, [0, R * 1.35 + 0.5, 0], 0.5, { gems: 5, len: 0.3 }));
  plaque(B, 3, [0, 0.25, -R * 1.04], [0, PI, 0], 0.48);
}

function mianguan(B) {
  const { p, t, g, lab } = B;
  const sc = [1, 1, 1.05];
  bowl(p, R * 0.95, R * 1.0, L.dark, { sc });
  g.ring(R * 0.95, 0.07, { at: [0, 0.03, 0], sc }, 32); circuits(g, R * 0.95, R * 1.0, { seed: 5, sc, n: 6 });
  t.geo(facet(new THREE.CylinderGeometry(R * 0.55, R * 0.72, 0.65, 8, 1)), { at: [0, R * 1.02, -0.1], c: L.trimDD }); // (the crown on the cap)
  g.ring(R * 0.72, 0.06, { at: [0, R * 1.02 - 0.3, -0.1] }, 16);
  crystal(lab, [0, R * 1.02 + 0.5, -0.05], 0.55, 0.16); // (the board floated on a crystal)
  const by = R * 1.02 + 0.92, tilt = 0.07;
  p.box(1.9, 0.14, 3.0, { at: [0, by, 0.05], rot: [tilt, 0, 0], c: L.dark }, 0.03);
  lab.box(1.5, 0.06, 2.55, { at: [0, by + 0.07, 0.05], rot: [tilt, 0, 0] }, 0.02);
  for (const z of [-1.5, 1.5]) g.box(1.96, 0.1, 0.12, { at: [0, by - Math.sin(tilt) * z, 0.05 + z], rot: [tilt, 0, 0] }, 0.02);
  for (const s of [-1, 1]) g.box(0.12, 0.1, 3.0, { at: [s * 0.95, by, 0.05], rot: [tilt, 0, 0] }, 0.02);
  for (const k of [-0.45, 0, 0.45]) g.box(0.05, 0.04, 2.3, { at: [k, by + 0.11, 0.05], rot: [tilt, 0, 0] }, 0.01); // (its traces)
  for (const [z, end] of [[1.5, -0.95], [-1.45, 0.15]]) for (let i = 0; i < 9; i++) { // (nine strands of jade before and behind)
    const x = -0.82 + (i / 8) * 1.64, y0 = by - Math.sin(tilt) * z - 0.06, top = [x, y0, 0.05 + z], bot = [x, end, 0.05 + z * 1.02];
    g.rod(top, bot, 0.016); const n = Math.round((y0 - end) / 0.3);
    for (let k = 1; k <= n; k++) lab.geo(gem(0.09), { at: along([top, bot], k / n) });
  }
  g.rod([-1.75, R * 0.62, -0.05], [1.75, R * 0.62, -0.05], 0.05); // (the hairpin through it, its ear-jades on cords)
  for (const s of [-1, 1]) { g.geo(gem(0.16), { at: [s * 1.78, R * 0.62, -0.05] }); g.rod([s * 1.72, R * 0.62, -0.05], [s * 1.72, -0.45, -0.05], 0.02); crystal(lab, [s * 1.72, -0.7, -0.05], 0.45, 0.14, [PI, 0, 0]); }
  plaque(B, 4, [0, R * 1.02, -1.3], [0.2, PI, 0], 0.45);
}

function abuna(B) {
  const { p, t, g, lab } = B;
  const tiers = [[-0.15, 0.62, R * 1.0, R * 0.98], [0.5, 0.55, R * 0.92, R * 0.9], [1.08, 0.5, R * 0.82, R * 0.8]];
  for (const [y, h, rb, rt] of tiers) { // (the drum, three tiers of arcades, a crystal in every arch)
    drum(t, y, y + h, rb, rt, 12, { c: L.trim });
    g.ring(rb + 0.02, 0.07, { at: [0, y + 0.03, 0] }, 24);
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * PI * 2, r = (rb + rt) / 2;
      g.arc(0.22, 0.06, { at: onBand(a, r, 0, y + h * 0.4, 0.04), rot: [0, a, 0] }, PI, 6);
      for (const s of [-1, 1]) g.box(0.08, h * 0.38, 0.08, { at: onBand(a, r, s * 0.22, y + h * 0.22, 0.04), rot: [0, a, 0] }, 0.01);
      lab.geo(gem(0.1), { at: onBand(a, r, 0, y + h * 0.36, 0.05) });
    }
  }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; g.rod(onBand(a, R * 1.0, 0, -0.13), onBand(a, R * 1.0, 0, -0.32), 0.025); crystal(lab, onBand(a, R * 1.0, 0, -0.5), 0.34, 0.1, [PI, 0, 0]); } // (its bells, crystals)
  g.ring(R * 0.82, 0.07, { at: [0, 1.58, 0] }, 24);
  p.geo(icoDome(R * 0.78, R * 0.6), { at: [0, 1.58, 0], c: L.ivory });
  const top = 1.58 + R * 0.6;
  orn(B, [0, top, 0], () => { g.geo(gem(0.3), { at: [0, top + 0.22, 0] }); crystal(lab, [0, top + 0.95, 0], 0.95, 0.18); halo(B, [0, top + 0.75, 0], 0.55, { gems: 4, len: 0.3 }); });
  plaque(B, 5, onBand(PI, R * 0.81, 0, 1.33, 0.1), [0.05, PI, 0], 0.4);
}

function mughal(B) {
  const { p, t, g, lab } = B;
  const h = R * 0.9;
  bowl(p, R, h, L.ivory);
  for (let i = 0; i < 5; i++) { // (the wraps, crossing at the brow)
    const y = 0.12 + i * 0.27, r = across(R, h, y) + 0.06, tilt = (i % 2 ? 1 : -1) * 0.2;
    p.geo(facet(new THREE.TorusGeometry(r, 0.25 - i * 0.02, 4, 16)), { at: [0, y, -0.04 * i], rot: [PI / 2 + 0.1, 0, tilt], c: i % 2 ? L.bone : L.ivory });
  }
  p.geo(icoDome(R * 0.55, R * 0.4), { at: [0, h - 0.15, -0.15], c: L.bone });
  g.ring(across(R, h, 0.66) + 0.3, 0.05, { at: [0, 0.66, -0.08], rot: [0.1, 0, -0.2] }, 24); // (a gold thread through the wraps)
  const pearls = bez([[-1.4, 0.2, 0.6], [-0.6, 1.25, 1.2], [0.6, 1.3, 0.9], [1.25, 0.65, 0.2]], 14);
  for (const q of pearls) p.geo(gem(0.1), { at: q, c: L.bone }); // (a string of pearls across it)
  orn(B, [0, 0.55, R * 1.02], () => { // (the sarpech, its jigha curling over and the kalgi's plume)
    g.geo(plate([[-0.32, 0], [0.32, 0], [0.24, 0.55], [0, 0.78], [-0.24, 0.55]], 0.09, 0.03), { at: [0, 0.35, R * 1.04], rot: [-0.15, 0, 0] });
    lab.geo(gem(0.2), { at: [0, 0.65, R * 1.1], sc: [0.8, 1.2, 0.6] }); crystal(lab, [0, 0.12, R * 1.08], 0.35, 0.1, [PI, 0, 0]);
    const jigha = bez([[0, 0.95, R * 1.04], [0.1, 1.6, R * 0.95], [-0.2, 2.15, R * 0.7], [-0.65, 2.3, R * 0.45]], 8);
    taper(g, jigha, 0.09, 0.03);
    for (const k of [0.25, 0.5, 0.75]) lab.geo(gem(0.09), { at: along(jigha, k) });
    B.plumes.push({ at: [0.05, 1.0, R * 1.0], dir: [0.1, 1, -0.25], len: 1.8, n: 5, w: 0.4, c: L.plume.ivory, kind: 'feather', count: 1 });
  });
  orn(B, [0, R * 1.0, -R * 0.8], () => { // (two rings linked, floating behind)
    halo(B, [-0.28, R * 1.15, -R * 1.0], 0.5, { rot: [0, 0.6, 0], gems: 3, len: 0.3 });
    halo(B, [0.28, R * 1.15, -R * 1.0], 0.5, { rot: [0, -0.6, 0], gems: 3, len: 0.3, phase: PI / 3 });
  });
  plaque(B, 6, onBowl(R, h, PI, 0.5, 1.18), [0.4, PI, 0], 0.45);
}

function murmillo(B) {
  const { p, t, g, lab } = B;
  const sc = [1, 1, 1.05];
  bowl(p, R, R * 0.92, L.grey, { sc });
  circuits(g, R, R * 0.92, { seed: 7, sc, n: 4, skip: 0.9 });
  p.geo(facet(new THREE.CylinderGeometry(R * 1.3, R * 1.34, 0.1, 16, 1)), { at: [0, 0.0, -0.05], rot: [0.1, 0, 0], c: L.grey }); // (the broad brim, down at the front)
  g.ring(R * 1.34, 0.06, { at: [0, 0, -0.05], rot: [0.1, 0, 0] }, 32);
  const rv = R * 1.0, w = 0.7; // (the face guard: plates round a grille of bars over the dark)
  for (const s of [-1, 1]) drum(p, -1.35, -0.05, rv, rv, 4, { c: L.grey }, s > 0 ? w : -1.25, 1.25 - w);
  drum(p, -0.18, -0.05, rv, rv, 6, { c: L.grey }, -w, w * 2); drum(p, -1.35, -1.05, rv * 1.0, rv, 6, { c: L.grey }, -w, w * 2);
  for (let k = 0; k <= 8; k++) { const a = -w + (k / 8) * w * 2; g.rod([Math.sin(a) * rv, -0.12, Math.cos(a) * rv], [Math.sin(a) * rv, -1.1, Math.cos(a) * rv], 0.03); }
  for (const y of [-0.34, -0.56, -0.78, -0.98]) barRow(g, rv, w, y);
  drum(p, -0.75, -0.02, R * 1.0, R * 1.25, 10, { c: L.bone }, PI - 1.3, 2.6); // (the neck guard, flared)
  plaque(B, 7, [0, -1.2, rv + 0.06], [0, 0, 0], 0.4);
  orn(B, [0, R * 0.9, 0], () => { // (the crest: a fish, its fins rayed with crystal, its tail forked)
    const fish = [[R * 0.8, R * 0.55], [1.3, 2.25], [0.2, 2.8], [-0.8, 2.5], [-1.45, 3.05], [-1.25, 2.4], [-1.7, 2.0], [-R * 0.85, R * 0.55], [0, R * 0.92]];
    t.geo(sidePlateOf(fish, 0.3), { c: L.trim });
    for (let i = 0; i < 5; i++) { const k = 0.15 + i * 0.17, base = [0, R * 0.95, R * 0.75 - k * R * 1.6], tip = [0, 2.0 + Math.sin(k * PI) * 0.6, base[2] + 0.15]; g.rod(base, tip, 0.04); crystal(lab, tip, 0.3, 0.09, aim([0, 1, 0.3])); }
    for (const s of [-1, 1]) { g.cyl(0.1, 0.12, 0.45, { at: [s * R * 0.8, R * 0.55, 0], rot: [0, 0, -s * 0.25] }, 6); B.plumes.push({ at: [s * R * 0.84, R * 0.72, 0], dir: [s * 0.25, 1, -0.1], len: 1.3, n: 4, w: 0.45, c: L.plume.ochre, kind: 'feather', count: 1 }); }
  });
  orn(B, [0, 0.3, -R * 1.05], () => halo(B, [0, 0.35, -R * 1.5], 0.62, { rot: [0, PI / 2, 0], spokes: 6, hub: 0.14, gems: 6, len: 0.26 })); // (the chariot's wheel, floating behind)
}
/** A bar of the murmillo's grille across its face at height y. */
function barRow(g, rv, w, y) { for (let k = 1; k <= 6; k++) { const a0 = -w + ((k - 1) / 6) * w * 2, a1 = -w + (k / 6) * w * 2; g.rod([Math.sin(a0) * rv, y, Math.cos(a0) * rv], [Math.sin(a1) * rv, y, Math.cos(a1) * rv], 0.03); } }
const sidePlateOf = (pts, width) => plate(pts, width, 0.05).rotateY(-PI / 2);

function jaguar(B) {
  const { p, t, g, lab } = B;
  const sc = [1, 1, 1.08], h = R * 0.9;
  bowl(p, R, h, L.ivory, { sc });
  for (const [e, n, off] of [[0.28, 9, 0], [0.62, 8, 0.5], [0.98, 5, 0.25]]) for (let i = 0; i < n; i++) { // (the rosettes, a crystal at each heart)
    const a = 0.75 + ((i + off) / n) * (PI * 2 - 1.5), at = onBowl(R, h, a, e, 1.0, sc);
    t.cyl(0.2, 0.2, 0.07, { at, rot: aim(at), c: L.trimDD }, 6); lab.geo(gem(0.08), { at: onBowl(R, h, a, e, 1.04, sc) });
  }
  const fret = []; // (the stepped fret round its foot, a gold circuit)
  for (let i = 0; i <= 18; i++) { const a = 0.75 + (i / 18) * (PI * 2 - 1.5), d = (PI * 2 - 1.5) / 36; fret.push([a, i % 2 ? 0.2 : 0.07], [a + d, i % 2 ? 0.2 : 0.07]); }
  trace(g, R, h, fret, { sc, node: 0, steps: 1 });
  for (const s of [-1, 1]) orn(B, [s * 0.78, R * 0.75, -0.15], () => { // (the ears)
    flat(t, [[0, 0], [0.22, 0.6], [0.55, 0.72], [0.66, 0.15]], s, { at: [s * 0.72, R * 0.72, -0.15], rot: [0.15, s * 0.3, s * -0.35], c: L.trim }, 0.16);
    flat(t, [[0.12, 0.08], [0.26, 0.45], [0.48, 0.52], [0.52, 0.16]], s, { at: [s * 0.72, R * 0.72, -0.06], rot: [0.15, s * 0.3, s * -0.35], c: L.trimDD }, 0.08);
  });
  for (const s of [-1, 1]) t.box(1.2, 0.36, 0.66, { at: [s * 0.58, 0.32, R * 0.84], rot: [-0.2, s * 0.3, s * -0.2], c: L.trimD }, 0.12); // (the brow)
  p.box(R * 1.42, 0.42, 1.05, { at: [0, -0.02, R * 0.9], rot: [-0.05, 0, 0], c: L.ivory }, 0.18); // (the upper jaw over the dark, its fangs)
  for (const s of [-1, 1]) orn(B, [s * 0.72, -0.2, R * 1.12], () => p.cone(0.14, 0.75, { at: [s * 0.72, -0.55, R * 1.12], rot: [PI, 0, 0], c: L.bone }, 5));
  for (let i = 0; i < 6; i++) { const x = -0.45 + i * 0.18; p.cone(0.08, 0.3, { at: [x, -0.36, R * 1.14 - Math.abs(x) * 0.2], rot: [PI, 0, 0], c: L.bone }, 5); }
  p.box(R * 1.15, 0.3, 0.75, { at: [0, -1.38, R * 0.8], c: L.ivory }, 0.12); // (the lower jaw, floating apart under the dark)
  for (const s of [-1, 1]) p.cone(0.11, 0.5, { at: [s * 0.62, -1.05, R * 1.02], c: L.bone }, 5);
  orn(B, [0, R * 0.75, -R * 0.75], () => B.plumes.push({ at: [0, R * 0.75, -R * 0.78], dir: [0, 0.75, -1], len: 2.3, n: 6, w: 0.6, c: L.plume.slate, kind: 'tuft', count: 5, spread: 0.32,
    tint: [L.plume.slate, L.plume.ochre, L.plume.slate, L.plume.rust, L.plume.slate] })); // (a quetzal tuft)
  orn(B, [0, R * 1.05, 0], () => halo(B, [0, R * 1.32, -0.1], 0.66, { gems: 7, len: 0.32 }));
  nape(B, 8, R, h, 0.3, sc);
}

function komuso(B) {
  const { p, t, g, lab } = B;
  const N = 11, y0 = -1.45, y1 = 1.0, rad = (y) => R * (1.02 - 0.12 * ((y - y0) / (y1 - y0)) ** 2), win = 0.75;
  for (let i = 0; i < N; i++) { // (the basket, course by course; the window's courses open at the face, reeds over the dark)
    const ya = y0 + (i / N) * (y1 - y0), yb = y0 + ((i + 1) / N) * (y1 - y0), open = ya > -0.8 && yb < 0.2;
    drum(p, ya, yb, rad(ya), rad(yb), 14, { c: i % 2 ? L.ivory : L.bone }, open ? win : 0, open ? PI * 2 - win * 2 : PI * 2);
    if (i % 3 === 0) g.ring(rad(ya) + 0.03, 0.04, { at: [0, ya, 0] }, 28);
  }
  for (let k = 0; k <= 6; k++) { const a = -win + (k / 6) * win * 2, r = rad(-0.3); p.rod([Math.sin(a) * r, -0.82, Math.cos(a) * r], [Math.sin(a) * r, 0.22, Math.cos(a) * r], 0.04, { c: L.bone }); }
  p.geo(icoDome(rad(y1), 0.5), { at: [0, y1, 0], c: L.ivory }); g.ring(rad(y1), 0.06, { at: [0, y1 + 0.02, 0] }, 28);
  for (const a of [1.6, -1.6, 2.6, -2.6]) { const ya = -1.2, yb = 0.85, r = (y) => rad(y) + 0.04; // (the gold pins up its sides)
    for (let i = 0; i < 6; i++) { const u0 = ya + (i / 6) * (yb - ya), u1 = ya + ((i + 1) / 6) * (yb - ya); g.rod([Math.sin(a) * r(u0), u0, Math.cos(a) * r(u0)], [Math.sin(a) * r(u1), u1, Math.cos(a) * r(u1)], 0.03); }
    g.geo(gem(0.09), { at: [Math.sin(a) * r(yb), yb, Math.cos(a) * r(yb)] });
  }
  for (const s of [-1, 1]) p.rod([s * rad(0.9), 0.9, 0.2], [s * rad(-1.3) * 1.02, -1.3, 0.3], 0.05, { c: L.dark }); // (its cords)
  orn(B, [R * 1.3, -0.1, 0.35], () => { // (the hermit's lantern, floating at its side)
    const c = [R * 1.3, -0.2, 0.35];
    g.cone(0.28, 0.22, { at: add(c, [0, 0.46, 0]) }, 6); g.geo(gem(0.14), { at: add(c, [0, -0.42, 0]) }); g.geo(gem(0.1), { at: add(c, [0, 0.66, 0]) });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.rod(add(c, [dx * 0.18, 0.36, dz * 0.18]), add(c, [dx * 0.18, -0.36, dz * 0.18]), 0.025);
    crystal(lab, c, 0.55, 0.13);
  });
  plaque(B, 9, [0, 0.55, -rad(0.55) - 0.06], [0, PI, 0], 0.45);
}

function chada(B) {
  const { p, t, g, lab } = B;
  drum(t, 0, 0.75, R * 1.0, R * 0.92, 14, { c: L.trim }); // (the cap's drum)
  p.geo(icoDome(R * 0.92, 0.25), { at: [0, 0.74, 0], c: L.bone });
  g.ring(R * 1.0, 0.08, { at: [0, 0.04, 0] }, 28); g.ring(R * 0.93, 0.06, { at: [0, 0.73, 0] }, 28);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; g.cone(0.17, 0.44, { at: onBand(a, R * 1.0, 0, 0.2, 0.02), rot: aim([Math.sin(a) * 0.25, 1, Math.cos(a) * 0.25]) }, 4); lab.geo(gem(0.07), { at: onBand(a + PI / 14, R * 0.97, 0, 0.5, 0.03) }); } // (the upturned petals)
  g.geo(plate([[-0.36, 0], [0.36, 0], [0, 0.72]], 0.08, 0.03), { at: [0, 0.3, R * 1.0] }); lab.geo(gem(0.14), { at: [0, 0.52, R * 1.06] }); // (the brow piece)
  let y = 0.8, r = R * 0.72; // (the spire: tiers, smaller as it climbs, a gold ring and a crown of petals at each)
  for (let i = 0; i < 6; i++) {
    const h = 0.36 - i * 0.03, r2 = r * 0.78;
    t.geo(facet(new THREE.CylinderGeometry(r2, r, h, 10, 1)), { at: [0, y + h / 2, 0], c: i % 2 ? L.trimD : L.trim });
    g.ring(r2 + 0.03, 0.05, { at: [0, y + h, 0] }, 16);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2 + i * 0.2; g.cone(0.07, 0.2, { at: [Math.sin(a) * r2, y + h + 0.08, Math.cos(a) * r2] }, 4); }
    y += h; r = r2;
  }
  orn(B, [0, y, 0], () => { taper(g, [[0, y, 0], [0, y + 0.55, 0], [0, y + 1.0, 0.04]], 0.12, 0.04); crystal(lab, [0, y + 0.5, 0], 0.45, 0.12); });
  for (const s of [-1, 1]) orn(B, [s * R * 0.92, -0.05, R * 0.25], () => { // (the flame-shaped ear flanges)
    flat(t, [[0, 0.3], [0.3, 0.55], [0.55, 0.38], [0.7, 0.9], [0.92, 0.5], [0.7, -0.2], [0.32, -0.72], [0.05, -0.6]], s, { at: [s * R * 0.92, -0.15, R * 0.25], rot: [0, s * 0.65, 0], c: L.trim }, 0.13);
    lab.geo(gem(0.11), { at: [s * (R * 0.92 + 0.35), 0.0, R * 0.25 - 0.25] });
  });
  orn(B, [0, 1.6, -R * 0.6], () => halo(B, [0, 2.0, -R * 0.95], 0.85, { rot: [0, 0, 0], spokes: 8, hub: 0.16, gems: 8, len: 0.28 })); // (the wheel, floating behind)
  plaque(B, 10, [0, 0.4, -R * 1.0], [0.08, PI, 0], 0.45);
}

export const BUILD_ARCANA = { jester, sakaCap, hathor, silla, mianguan, abuna, mughal, murmillo, jaguar, komuso, chada, ...BUILD_ARCANA_B };
