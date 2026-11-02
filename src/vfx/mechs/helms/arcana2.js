// ---------------------------------------------------------------------------------------
// THE ARCANA'S HELMS, XI TO XXI (plain names; the set and its rules: vfx/mechs/helms/arcana.js): the second half of the twenty-two,
// one a Major Arcana card and a culture each, faceless and floating, in the kit's shapes and the house's magitech (crystals, gold
// circuits, a floating piece, the card's number on its plaque). The originals:
//   XI    greatHelm    Justice: a great helm, the knight's face guard shut, its sights a slit either side of the gold cross strap,
//                     the breaths pierced in the cheek (England, 14th c.; the Black Prince's helm, c. 1376, Canterbury Cathedral),
//                     the scales floated over it for its crest
//   XII   gjermundbu   the Hanged Man: the Gjermundbu helmet, its bowl in four plates and bands to a spike, the guard over the brow
//                     and nose (as one plate, never rings round eyes), the mail (Norway, 10th c.; the Museum of Cultural History,
//                     Oslo), Odin's ravens at its temples and crystals hung from a floating ring
//   XIII  sallet       Death: a Gothic sallet with its visor and bevor, the sight a slit between them, the tail swept back, the
//                     bowl fluted (South Germany, c. 1480-1500; the Wallace Collection's and the Met's), black, Death's rose
//                     floating over it
//   XIV   kamelaukion  Temperance: the Byzantine closed crown, its band of round-topped plaques, two arches over the cap and the
//                     pendilia (the mosaic of Justinian, San Vitale, Ravenna, 547; the Monomachos crown, the Hungarian National
//                     Museum), two cups floating and pouring one into the other
//   XV    waterloo     the Devil: the Waterloo Helmet, its low cap and two conical horns ending in knobs, its swirls in repousse
//                     (Iron Age Britain, 150-50 BCE; the British Museum), a flame of crystal between the horns
//   XVI   mural        the Tower: the mural crown of a city's Tyche, walls and towers round the head and a gate at the brow (the
//                     Tyche of Antioch, after Eutychides, c. 300 BCE; the Vatican Museums' copy), lightning floating over it
//   XVII  puabi        the Star: Queen Puabi's headdress, its rows of gold leaves on bead rings, the lunate earrings and the comb of
//                     rosettes behind (the Royal Cemetery at Ur, c. 2500 BCE; the Penn Museum, Philadelphia), its rosettes and a
//                     great star made Inanna's eight-pointed ones
//   XVIII sasanian     the Moon: a Sasanian king's crown, its stepped crenellations, the wings, the crescent holding the korymbos
//                     (here a floating globe of crystal) and the diadem's ribbons (the coins of Peroz and Khosrow II; the silver-gilt
//                     hunting plates of the Met and the Hermitage)
//   XIX   sapaInca     the Sun: the Sapa Inca's llautu wound round the head, the maskaypacha's fringe over the brow, the two
//                     feathers, the ear spools (Guaman Poma de Ayala's Nueva coronica, 1615; the Royal Danish Library), a rayed disc
//                     of gold floating behind (no face on it)
//   XX    benin        Judgement: the Oba's coral crown, a net of beads, its rosettes, strands and the high bead collar (the Benin
//                     Bronzes' commemorative heads, 16th-19th c.; many taken in 1897 and held abroad, some returned to Nigeria since
//                     2022), the brass of its bronzes in gold, an ivory side-blown horn (akohen) floating at its side for the trumpet
//   XXI   kireedam     the World: Kathakali's kireedam, a crown and its tall mudi, the great round back-piece with its rays and
//                     mirror-work floating behind as the World's wreath, its four crystals the card's four corners, the ear discs
//                     (Kerala, from the 17th c.)
// Prior art: the originals above; the tarot of Waite and Colman Smith (1909) for each card's sign; the house's Lachrymite and neuralese.
//
//   ARCANA_B[id] = { label, card }   BUILD_ARCANA_B[id](B)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { plate, sidePlate } from '../parts/kit.js';
import { L, PI, R, bez, taper, along, add, gem, facet, icoDome, bowl, shikoro, flat, orn, stage, onBowl, trace, circuits, crystal, aim, halo, plaque, onBand, yawTilt, across } from './kit.js';

export const ARCANA_B = {
  greatHelm: { label: 'Justice: great helm', card: 11 },
  gjermundbu: { label: 'The Hanged Man: Gjermundbu helm', card: 12 },
  sallet: { label: 'Death: Gothic sallet', card: 13 },
  kamelaukion: { label: 'Temperance: kamelaukion', card: 14 },
  waterloo: { label: 'The Devil: Waterloo horned helm', card: 15 },
  mural: { label: 'The Tower: mural crown', card: 16 },
  puabi: { label: "The Star: Puabi's headdress", card: 17 },
  sasanian: { label: 'The Moon: Sasanian crown', card: 18 },
  sapaInca: { label: "The Sun: Sapa Inca's llautu", card: 19 },
  benin: { label: "Judgement: the Oba's coral crown", card: 20 },
  kireedam: { label: 'The World: kireedam', card: 21 },
};

const nape = (B, n, r, h, e = 0.35, sc = [1, 1, 1], s) => plaque(B, n, onBowl(r, h, PI, e, 1.05, sc), [e * 0.8, PI, 0], s);
const rim = (g, r = R, sc = [1, 1, 1]) => g.ring(r, 0.07, { at: [0, 0.03, 0], sc }, 32);
const drum = (P, y0, y1, rb, rt, n, o = {}, ts = 0, tl = PI * 2) => P.geo(facet(new THREE.CylinderGeometry(rt, rb, y1 - y0, n, 1, true, ts, tl)), { ...o, at: [0, (y0 + y1) / 2, 0] });
/** A geometry with its faces at the front (within `half` of +Z, by their middles) cut away: a slit. */
function openAt(geo, half) {
  const q = facet(geo), P = q.attributes.position.array, keep = [];
  for (let i = 0; i < P.length; i += 9) { const x = (P[i] + P[i + 3] + P[i + 6]) / 3, z = (P[i + 2] + P[i + 5] + P[i + 8]) / 3; if (Math.abs(Math.atan2(x, z)) > half) keep.push(...P.slice(i, i + 9)); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); out.computeVertexNormals(); return out;
}
/** A star of n points in its own XY plane (facing +Z), gold, a crystal at its heart. */
function star(B, at, size, n = 8, rot = [0, 0, 0]) {
  const e = new THREE.Euler(...rot);
  for (let k = 0; k < n; k++) { const f = (k / n) * PI * 2 + PI / 2, d = new THREE.Vector3(Math.cos(f), Math.sin(f), 0).applyEuler(e), len = size * (k % 2 ? 0.7 : 1);
    B.g.cone(size * 0.22, len, { at: add(at, d.clone().multiplyScalar(len * 0.5).toArray()), rot: aim(d.toArray()) }, 4); }
  B.lab.geo(gem(size * 0.32), { at });
}

function greatHelm(B) {
  const { p, g, lab, c } = B;
  const r = R * 0.98, n = 10, bot = -1.45, top = 0.85, sy = [0.02, 0.24]; // (a ten-sided drum, its edge at the face: the ridge)
  p.geo(facet(new THREE.CylinderGeometry(r, r * 1.03, sy[0] - bot, n, 1, true)), { at: [0, (bot + sy[0]) / 2, 0], c: L.grey });
  p.geo(openAt(new THREE.CylinderGeometry(r, r, sy[1] - sy[0], n, 1, true), 0.7), { at: [0, (sy[0] + sy[1]) / 2, 0], c: L.grey }); // (the sights: the band cut open at the face)
  p.geo(facet(new THREE.CylinderGeometry(r, r, top - sy[1], n, 1, true)), { at: [0, (sy[1] + top) / 2, 0], c: L.bone });
  p.geo(facet(new THREE.ConeGeometry(r, 0.55, n, 1)), { at: [0, top + 0.275, 0], c: L.grey });
  g.box(0.22, top - bot + 0.1, 0.12, { at: [0, (top + bot) / 2, r + 0.03] }, 0.02); // (the cross strap down the ridge, splitting the sights)
  for (const y of [sy[0] - 0.04, sy[1] + 0.04]) for (let k = -2; k < 2; k++) { const a0 = (k / n) * PI * 2, a1 = ((k + 1) / n) * PI * 2; g.rod([Math.sin(a0) * r, y, Math.cos(a0) * r], [Math.sin(a1) * r, y, Math.cos(a1) * r], 0.035); }
  for (let j = 0; j < 3; j++) for (let k = 0; k < 3 - (j === 2 ? 1 : 0); k++) { const a = 0.42 + k * 0.17, y = -0.45 - j * 0.24; c.box(0.09, 0.15, 0.06, { at: [Math.sin(a) * r * 1.0, y, Math.cos(a) * r * 1.0], rot: [0, a, 0] }); } // (the breaths)
  for (let k = 0; k < n; k++) { const a = (k / n) * PI * 2 + PI / n; g.geo(gem(0.08), { at: [Math.sin(a) * r * 0.98, top, Math.cos(a) * r * 0.98] }); g.geo(gem(0.07), { at: [Math.sin(a) * r * 1.02, bot + 0.05, Math.cos(a) * r * 1.02] }); }
  for (const a of [PI / 2, -PI / 2, PI]) g.box(0.16, top - bot, 0.08, { at: [Math.sin(a) * r * 0.97, (top + bot) / 2, Math.cos(a) * r * 0.97], rot: [0, a, 0] }, 0.02); // (its straps, a circuit's buses)
  orn(B, [0, top + 0.6, 0], () => { // (the scales, floating over it for a crest)
    const y = top + 1.25; crystal(lab, [0, top + 0.9, 0], 0.6, 0.14);
    g.box(2.0, 0.13, 0.13, { at: [0, y, 0] }, 0.03); g.geo(gem(0.16), { at: [0, y + 0.05, 0] });
    for (const s of [-1, 1]) { const pan = [s * 0.92, top + 0.68, 0];
      for (const d of [[-0.2, 0.12], [0.2, 0.12], [0, -0.22]]) g.rod([s * 0.92, y, 0], add(pan, [d[0], 0.06, d[1]]), 0.02);
      lab.geo(facet(new THREE.ConeGeometry(0.34, 0.16, 6, 1).rotateX(PI)), { at: pan }); }
  });
  plaque(B, 11, [0, 0.5, -r - 0.06], [0, PI, 0], 0.48);
}

function gjermundbu(B) {
  const { p, t, g, lab } = B;
  const h = R * 1.02;
  bowl(p, R, h, L.grey, { ribs: 1, ribC: L.bone });
  for (const ry of [0, PI / 2]) p.arc(R * 0.99, 0.11, { rot: [0, ry, 0], sc: [1, h / R, 1], c: L.dark }, PI, 16); // (the bands to the crown)
  g.ring(R, 0.08, { at: [0, 0.03, 0] }, 32); circuits(g, R, h, { seed: 12, n: 6 });
  orn(B, [0, h, 0], () => { g.geo(gem(0.14), { at: [0, h, 0] }); g.cone(0.12, 0.5, { at: [0, h + 0.28, 0] }, 5); });
  drum(p, -0.24, 0.06, R * 1.03, R * 1.03, 12, { c: L.dark }, -1.1, 2.2); // (the guard as one plate: brow and nose)
  p.box(0.26, 0.85, 0.16, { at: [0, -0.62, R * 1.03], c: L.dark }, 0.05);
  g.rod([-0.07, -0.25, R * 1.12], [-0.07, -1.0, R * 1.12], 0.025); g.rod([0.07, -0.25, R * 1.12], [0.07, -1.0, R * 1.12], 0.025);
  shikoro(p, R, 4, 0.3, 0.06, [L.dark, L.grey], L.dark, 1.35); // (the mail)
  for (const s of [-1, 1]) orn(B, [s * 1.1, R * 0.62, 0.05], () => { // (a raven at each temple)
    const at = [s * 1.15, R * 0.68, 0.1];
    t.geo(gem(0.32), { at, sc: [0.75, 0.75, 1.5], c: L.trimDD });
    t.geo(gem(0.2), { at: add(at, [0, 0.2, 0.42]), c: L.trimDD }); g.cone(0.08, 0.36, { at: add(at, [0, 0.18, 0.72]), rot: [PI / 2, 0, 0] }, 4);
    flat(t, [[0, 0], [0.55, 0.45], [0.9, 0.4], [0.75, 0.15], [1.0, 0.05], [0.5, -0.15]], s, { at: add(at, [s * 0.08, 0.05, 0]), rot: [-0.4, s * -1.2, s * 0.3], c: L.trimDD }, 0.08);
    t.geo(plate([[-0.18, 0], [0.18, 0], [0.28, -0.5], [-0.28, -0.5]], 0.06, 0.02), { at: add(at, [0, -0.05, -0.42]), rot: [-1.2, 0, 0], c: L.trimDD });
  });
  orn(B, [0, h + 0.3, 0], () => { // (crystals hung from a floating ring)
    const y = h + 0.85, rr = 0.62;
    g.geo(facet(new THREE.TorusGeometry(rr, 0.08 * L.chunk, 4, 12)).rotateX(PI / 2), { at: [0, y, 0] });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2, q = [Math.sin(a) * rr, y, Math.cos(a) * rr]; g.rod(q, add(q, [0, -0.18, 0]), 0.02); crystal(lab, add(q, [0, -0.42, 0]), 0.42, 0.11, [PI, 0, 0]); }
  });
  nape(B, 12, R, h, 0.45);
}

function sallet(B) {
  const { p, t, g, lab } = B;
  const sc = [1, 1, 1.12], h = R * 0.82;
  bowl(p, R, h, L.dark, { sc });
  p.arc(R, 0.1, { rot: [0, PI / 2, 0], sc: [1.12, h / R, 1], c: L.grey }, PI, 16); // (the comb's keel)
  for (const a of [0.9, 1.5, 2.1, 2.6, -0.9, -1.5, -2.1, -2.6]) trace(g, R, h, [[a, 0.12], [a * 0.6, 1.2]], { sc, node: 0.07 }); // (the flutes, gold)
  g.ring(R, 0.06, { at: [0, 0.03, 0], sc }, 32);
  p.geo(facet(new THREE.CylinderGeometry(R * 1.05, R * 1.38, 0.7, 12, 1, true, PI - 1.45, 2.9)), { at: [0, -0.28, -0.2], rot: [-0.35, 0, 0], c: L.dark }); // (the tail, swept back)
  drum(p, -0.62, -0.13, R * 1.1, R * 1.06, 10, { c: L.dark }, -1.25, 2.5); // (the visor, the sight a slit over it)
  p.box(0.12, 0.5, 0.1, { at: [0, -0.38, R * 1.1] }, 0.03);
  for (let k = -3; k < 3; k++) { const a0 = (k / 6) * 1.25, a1 = ((k + 1) / 6) * 1.25; g.rod([Math.sin(a0) * R * 1.07, -0.14, Math.cos(a0) * R * 1.07], [Math.sin(a1) * R * 1.07, -0.14, Math.cos(a1) * R * 1.07], 0.03); }
  drum(p, -1.45, -0.72, R * 0.98, R * 1.12, 10, { c: L.grey }, -1.35, 2.7); // (the bevor, rising to the chin; a breath's dark line between)
  for (let k = -3; k < 3; k++) { const a0 = (k / 6) * 1.35, a1 = ((k + 1) / 6) * 1.35; g.rod([Math.sin(a0) * R * 1.13, -0.74, Math.cos(a0) * R * 1.13], [Math.sin(a1) * R * 1.13, -0.74, Math.cos(a1) * R * 1.13], 0.03); }
  for (const s of [-1, 1]) g.geo(gem(0.1), { at: [s * R * 1.0, -0.4, R * 0.5] });
  const at = [0, R * 1.25, R * 0.3];
  orn(B, [0, R * 0.9, 0.1], () => { // (Death's rose, floating over the brow, in its ring)
    for (let i = 0; i < 5; i++) t.geo(plate([[0, 0], [0.26, 0.22], [0.2, 0.55], [0, 0.64], [-0.2, 0.55], [-0.26, 0.22]], 0.1, 0.04), { at, rot: [0, 0, (i / 5) * PI * 2], c: L.trim });
    for (let i = 0; i < 5; i++) t.geo(plate([[0, 0], [0.15, 0.14], [0.12, 0.34], [0, 0.4], [-0.12, 0.34], [-0.15, 0.14]], 0.1, 0.03), { at: add(at, [0, 0, 0.09]), rot: [0, 0, (i / 5 + 0.1) * PI * 2], c: L.trimD });
    for (let i = 0; i < 5; i++) { const f = (i / 5 + 0.1) * PI * 2 + PI / 2, d = [Math.cos(f), Math.sin(f), 0]; g.cone(0.08, 0.3, { at: add(at, [d[0] * 0.66, d[1] * 0.66, -0.04]), rot: aim(d) }, 4); }
    lab.geo(gem(0.16), { at: add(at, [0, 0, 0.16]) });
    halo(B, at, 0.95, { rot: [0, 0, 0], gems: 5, len: 0.28, phase: PI / 2 });
  });
  nape(B, 13, R, h, 0.4, sc);
}

function kamelaukion(B) {
  const { p, t, g, lab } = B;
  const h = R * 0.95;
  p.geo(icoDome(R * 0.94, h), { c: L.dark }); // (the cap inside the closed crown)
  for (let i = 0; i < 12; i++) { // (the band: round-topped plaques, tall and short by turns, a crystal in each)
    const a = (i / 12) * PI * 2, tall = i % 2 === 0, ph = tall ? 0.85 : 0.6;
    t.geo(plate([[-0.37, 0], [0.37, 0], [0.37, ph - 0.3], [0.25, ph - 0.08], [0, ph], [-0.25, ph - 0.08], [-0.37, ph - 0.3]], 0.1, 0.03), { at: onBand(a, R * 1.0, 0, -0.02), rot: [0, a, 0], c: tall ? L.trim : L.trimD });
    lab.geo(gem(tall ? 0.16 : 0.12), { at: onBand(a, R * 1.0, 0, ph * 0.46, 0.08) });
    g.geo(gem(0.07), { at: onBand(a, R * 1.0, 0, ph + 0.02, 0.04) });
  }
  g.ring(R * 1.03, 0.07, { at: [0, 0.03, 0] }, 32); g.ring(R * 0.99, 0.05, { at: [0, 0.6, 0] }, 32);
  for (const ry of [0, PI / 2]) { // (two arches over it, crystals along them)
    g.arc(R * 0.97, 0.09, { rot: [0, ry, 0], sc: [1, (h + 0.05) / (R * 0.97), 1] }, PI, 16);
    for (let k = 1; k < 8; k++) { const f = (k / 8) * PI, q = new THREE.Vector3(Math.cos(f) * R * 0.99, Math.sin(f) * (h + 0.09), 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); if (k !== 4) lab.geo(gem(0.09), { at: q.toArray() }); }
  }
  orn(B, [0, h + 0.05, 0], () => { g.geo(gem(0.25), { at: [0, h + 0.22, 0] }); crystal(lab, [0, h + 0.75, 0], 0.7, 0.14); });
  for (const s of [-1, 1]) for (const d of [-0.18, 0, 0.18]) { // (the pendilia)
    const a = s * (PI / 2 - 0.3) + d, top = onBand(a, R * 1.06, 0, 0.02), bot = onBand(a, R * 1.1, 0, -1.2 + Math.abs(d));
    g.rod(top, bot, 0.025); for (let k = 1; k < 5; k++) lab.geo(gem(0.085), { at: along([top, bot], k / 5) });
    crystal(lab, add(bot, [0, -0.2, 0]), 0.38, 0.11, [PI, 0, 0]);
  }
  orn(B, [0, h + 0.2, 0.3], () => { // (two cups floating, one pouring into the other)
    const cup = (at, tip) => { lab.geo(facet(new THREE.ConeGeometry(0.3, 0.42, 6, 1).rotateX(PI)), { at, rot: [0, 0, tip] }); g.ring(0.3, 0.04, { at: add(at, [-Math.sin(tip) * 0.21, Math.cos(tip) * 0.21, 0]), rot: [0, 0, tip] }, 8); g.cone(0.18, 0.12, { at: add(at, [Math.sin(tip) * 0.32, -Math.cos(tip) * 0.32, 0]), rot: [0, 0, tip] }, 6); };
    cup([-1.3, h + 0.55, 0.45], -0.75); cup([1.25, h - 0.1, 0.45], 0.15);
    taper(g, bez([[-1.08, h + 0.78, 0.45], [-0.4, h + 1.25, 0.6], [0.6, h + 0.85, 0.6], [1.22, h + 0.22, 0.45]], 9), 0.07, 0.035);
  });
  plaque(B, 14, onBowl(R * 0.94, h, PI, 0.75, 1.06), [0.65, PI, 0], 0.42);
}

/** A spiral of gold over a bowl, about (a0, e0), its arm turning out from the heart. */
function spiral(g, r, h, a0, e0, size, phase) {
  const path = []; for (let i = 0; i <= 14; i++) { const u = i / 14, f = phase + u * PI * 2.2, rr = size * (0.15 + u * 0.85); path.push([a0 + (Math.cos(f) * rr) / Math.cos(e0), e0 + Math.sin(f) * rr]); }
  trace(g, r, h, path, { node: 0, steps: 1, w: 0.036 });
}
function waterloo(B) {
  const { p, t, g, lab } = B;
  const h = R * 0.78;
  bowl(p, R, h, L.grey);
  rim(g); shikoro(p, R, 2, 0.28, 0.08, [L.grey, L.bone], L.dark, 1.3);
  for (const [a0, e0] of [[PI / 2, 0.45], [-PI / 2, 0.45], [PI, 0.5]]) { // (the triskeles, in repousse gold)
    for (let k = 0; k < 3; k++) { const f = (k / 3) * PI * 2; spiral(g, R, h, a0 + Math.cos(f) * 0.28, e0 + Math.sin(f) * 0.22, 0.17, f + PI); }
    lab.geo(gem(0.11), { at: onBowl(R, h, a0, e0, 1.03) });
  }
  for (let i = 0; i < 12; i++) g.geo(gem(0.07), { at: onBowl(R, h, 0.6 + (i / 11) * (PI * 2 - 1.2), 0.08, 1.02) }); // (its rivets)
  for (const s of [-1, 1]) orn(B, [s * 0.6, R * 0.62, 0], () => { // (the horns: straight cones off the crown, each ending in its knob)
    const pts = bez([[s * 0.6, R * 0.62, 0], [s * 1.0, R * 1.1, 0.05], [s * 1.4, R * 1.6, 0.1]], 5);
    for (let i = 0; i < 5; i++) stage(t, pts[i], pts[i + 1], 0.38 - i * 0.055, 0.38 - (i + 1) * 0.055, 6, { c: i % 2 ? L.trimD : L.trim });
    g.geo(gem(0.2), { at: add(pts[5], [s * 0.06, 0.14, 0.02]) });
  });
  orn(B, [0, R * 0.8, 0], () => { // (a flame of crystal between them, in a floating ring)
    crystal(lab, [0, R * 1.22, 0.05], 0.95, 0.2);
    for (const [x, z] of [[-0.24, 0.12], [0.24, 0.12], [0, -0.22]]) crystal(lab, [x, R * 1.08, z + 0.05], 0.55, 0.13, aim([x * 1.6, 1, z * 1.6]));
    halo(B, [0, R * 0.95, 0.05], 0.48, { gems: 0 });
  });
  nape(B, 15, R, h, 0.25);
}

function mural(B) {
  const { p, t, g, lab, c } = B;
  p.geo(icoDome(R * 0.9, R * 0.95), { c: L.dark }); // (the cap under the walls)
  circuits(g, R * 0.9, R * 0.95, { seed: 16, e0: 0.7, n: 5 });
  const r = R * 1.0, wh = 0.75;
  drum(t, 0, wh, r, r * 0.98, 16, { c: L.trimD });
  g.ring(r * 1.01, 0.05, { at: [0, 0.04, 0] }, 32); g.ring(r * 1.0, 0.03, { at: [0, wh * 0.5, 0] }, 32);
  const tw = [];
  for (let i = 0; i < 6; i++) { // (six towers, crenellated, a window each)
    const a = ((i + 0.5) / 6) * PI * 2; tw.push(a);
    t.box(0.52, 1.15, 0.5, { at: onBand(a, r, 0, 0.575, 0.03), rot: [0, a, 0], c: L.trim }, 0.04);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.box(0.15, 0.2, 0.15, { at: onBand(a, r, dx * 0.18, 1.25, 0.03 + dz * 0.17), rot: [0, a, 0], c: L.trim }, 0.02);
    c.box(0.13, 0.24, 0.05, { at: onBand(a, r, 0, 0.78, 0.29), rot: [0, a, 0] });
  }
  for (let j = 0; j < 36; j++) { const a = (j / 36) * PI * 2; if (tw.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.25) || Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.15) continue; t.box(0.2, 0.2, 0.16, { at: onBand(a, r * 0.99, 0, wh + 0.1), rot: [0, a, 0], c: L.trimD }, 0.02); }
  c.box(0.36, 0.48, 0.06, { at: [0, 0.24, r + 0.02] }); g.arc(0.2, 0.06, { at: [0, 0.48, r + 0.05] }, PI, 8); // (the gate)
  orn(B, [0, R * 1.0, 0.45], () => taper(lab, [[0.3, 3.25, 0.55], [-0.2, 2.7, 0.6], [0.22, 2.45, 0.6], [-0.15, 1.85, 0.62]], 0.13, 0.06)); // (the lightning)
  plaque(B, 16, [0, 0.38, -r - 0.05], [0, PI, 0], 0.45);
}

function puabi(B) {
  const { p, g, lab } = B;
  const sc = [1.04, 1, 1.08], r0 = R * 1.02, h = R * 0.95;
  bowl(p, r0, h, L.dark, { sc }); // (the wig it was worn over)
  const leaf = [[0, 0], [0.17, -0.12], [0.2, -0.4], [0.1, -0.65], [0, -0.76], [-0.1, -0.65], [-0.2, -0.4], [-0.17, -0.12]];
  for (const [row, y, n] of [[0, -0.05, 16], [1, 0.42, 14], [2, 0.85, 12]]) { // (the rows of gold leaves on their bead rings, the lowest a fringe over the dark)
    const rr = Math.max(across(r0, h, Math.max(0, y)), 0) + 0.07;
    for (let i = 0; i < n; i++) { const a = ((i + row * 0.5) / n) * PI * 2; g.geo(plate(leaf, 0.06, 0.02), { at: [Math.sin(a) * rr * sc[0], y, Math.cos(a) * rr * sc[2]], rot: yawTilt(a, -0.15 - row * 0.2) }); }
    lab.geo(facet(new THREE.TorusGeometry(rr - 0.02, 0.06, 4, 20)).rotateX(PI / 2), { at: [0, y + 0.04, 0], sc });
  }
  for (const s of [-1, 1]) g.geo(facet(new THREE.TorusGeometry(0.42, 0.15, 4, 10, PI)).rotateZ(PI), { at: [s * R * 1.08, -0.5, 0.15], rot: [0, PI / 2, 0] }); // (the lunate earrings)
  const base = [0, R * 0.72, -R * 0.82];
  orn(B, base, () => { // (the comb behind: stems fanned up, a star at each tip)
    g.box(0.9, 0.3, 0.12, { at: base, rot: [0.4, 0, 0] }, 0.04);
    for (let k = 0; k < 5; k++) { const f = -0.75 + (k / 4) * 1.5, tip = add(base, [Math.sin(f) * 1.25, Math.cos(f) * 1.25, -0.15]); g.rod(add(base, [Math.sin(f) * 0.25, 0.1, 0]), tip, 0.035); star(B, tip, 0.26); }
  });
  orn(B, [0, R * 1.3, -R * 0.6], () => { const at = [0, R * 1.3 + 1.0, -R * 0.75]; star(B, at, 0.55); halo(B, at, 0.88, { rot: [0, 0, 0], gems: 8, len: 0.22, phase: PI / 8 }); }); // (the great star)
  plaque(B, 17, [0, R * 0.58, -R * 1.18], [0.45, PI, 0], 0.42);
}

function sasanian(B) {
  const { p, t, g, lab } = B;
  const h = R * 1.0;
  p.geo(icoDome(R * 0.94, h), { c: L.ivory });
  circuits(g, R * 0.94, h, { seed: 18, e0: 0.78, e1: 1.2, n: 5 });
  g.geo(facet(new THREE.CylinderGeometry(R * 1.0, R * 1.02, 0.45, 16, 1, true)), { at: [0, 0.22, 0] }); // (the diadem's band, pearled)
  for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; for (const y of [0.04, 0.42]) p.geo(gem(0.07), { at: onBand(a, R * 1.03, 0, y), c: L.bone }); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; for (let k = 0; k < 3; k++) t.box(0.52 - k * 0.15, 0.2, 0.14, { at: onBand(a, R * 0.99, 0, 0.55 + k * 0.2), rot: [0, a, 0], c: L.trim }, 0.02); lab.geo(gem(0.1), { at: onBand(a, R * 0.99, 0, 0.58, 0.1) }); } // (the stepped crenellations)
  for (const s of [-1, 1]) orn(B, [s * R * 0.8, 0.8, -0.3], () => flat(t, [[0, 0], [0.3, 0.9], [0.55, 1.7], [0.75, 1.5], [0.7, 1.0], [0.95, 1.2], [0.9, 0.7], [1.1, 0.75], [0.9, 0.25], [0.4, -0.1]], s, { at: [s * R * 0.8, 0.8, -0.3], rot: [-0.35, s * 0.5, s * -0.15], c: L.trim }, 0.13)); // (the wings)
  for (const s of [-1, 1]) { const top = [], bot = []; for (let i = 0; i <= 8; i++) { const u = i / 8, z = -R * 1.0 - 1.6 * u, y = 0.35 - 1.0 * u + 0.15 * Math.sin(u * PI * 2); top.push([z, y]); bot.unshift([z + 0.05, y - 0.26]); } t.geo(sidePlate([...top, ...bot], 0.08, 0.02), { at: [s * 0.25, 0, 0], c: L.trimD }); } // (the ribbons)
  orn(B, [0, h, 0], () => { // (the crescent, the korymbos a globe of crystal floating in it)
    const c = [0, h + 0.85, 0], arc = PI * 1.25;
    g.geo(facet(new THREE.TorusGeometry(0.62, 0.15, 4, 12, arc)).rotateZ(PI * 1.5 - arc / 2), { at: c });
    lab.geo(new THREE.IcosahedronGeometry(0.4, 1), { at: c });
  });
  plaque(B, 18, [0, 0.22, -R * 1.05], [0, PI, 0], 0.4);
}

function sapaInca(B) {
  const { p, t, g, lab } = B;
  const h = R * 0.92;
  bowl(p, R, h, L.dark); // (the hair the llautu is wound round)
  const ys = [0.05, 0.22, 0.39, 0.56, 0.73];
  ys.forEach((y, i) => t.geo(facet(new THREE.TorusGeometry(across(R, h, y) + 0.08, 0.11, 4, 18)).rotateX(PI / 2), { at: [0, y, 0], c: [L.trim, L.trimD, L.trimDD][i % 3] })); // (the braid, five turns)
  for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; g.box(0.16, 0.12, 0.08, { at: onBand(a, across(R, h, 0.39) + 0.2, 0, 0.39), rot: [0, a, 0] }, 0.01); } // (its tocapu)
  for (let k = 0; k <= 10; k++) { const x = -0.75 + k * 0.15, z = Math.sqrt(R * R - x * x) + 0.08; g.cyl(0.07, 0.07, 0.16, { at: [x, -0.02, z] }, 6); t.box(0.11, 0.9, 0.09, { at: [x, -0.55, z + 0.02], c: L.trim }, 0.02); } // (the maskaypacha's fringe over the brow)
  for (const s of [-1, 1]) { g.cyl(0.36, 0.36, 0.12, { at: [s * R * 1.0, -0.38, 0.1], rot: [0, 0, PI / 2] }, 10); lab.geo(gem(0.16), { at: [s * (R * 1.0 + 0.08), -0.38, 0.1] }); } // (the ear spools)
  orn(B, [0, 0.9, R * 0.62], () => { g.rod([0, 0.85, R * 0.66], [0, 1.55, R * 0.72], 0.05); g.geo(gem(0.12), { at: [0, 1.58, R * 0.72] });
    B.plumes.push({ at: [0, 1.6, R * 0.72], dir: [0, 1, 0.1], len: 1.35, n: 5, w: 0.4, c: L.plume.ivory, tint: [L.plume.ivory, L.plume.slate], kind: 'feather', count: 2, spread: 0.45 }); }); // (the two feathers)
  orn(B, [0, R * 0.9, -R * 0.8], () => { // (the sun, a rayed disc of gold floating behind, a crystal at its heart)
    const at = [0, R * 1.3, -R * 1.25];
    g.geo(facet(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 12)), { at, rot: [PI / 2, 0, 0] });
    for (let k = 0; k < 12; k++) { const f = (k / 12) * PI * 2, d = [Math.cos(f), Math.sin(f), 0], len = k % 2 ? 0.32 : 0.55; g.cone(0.13, len, { at: add(at, [d[0] * (0.72 + len / 2), d[1] * (0.72 + len / 2), 0]), rot: aim(d) }, 4); }
    lab.geo(gem(0.32), { at: add(at, [0, 0, 0.1]) });
  });
  plaque(B, 19, [0, 0.4, -(across(R, h, 0.4) + 0.24)], [0, PI, 0], 0.4);
}

function benin(B) {
  const { p, t, g, lab } = B;
  const h = R * 1.08;
  bowl(p, R, h, L.bone); // (the cap the net is strung over)
  const knots = [];
  for (let j = 0; j < 6; j++) { const e = 0.1 + j * 0.24, n = Math.max(6, Math.round(16 * Math.cos(e))), row = [];
    for (let i = 0; i < n; i++) { const a = ((i + (j % 2) * 0.5) / n) * PI * 2, at = onBowl(R, h, a, e, 1.03); row.push(at); t.geo(gem(0.12), { at, c: L.trim }); }
    knots.push(row); }
  for (let j = 0; j < knots.length - 1; j++) for (let i = 0; i < knots[j].length; i++) { // (the net's strands, knot to knot)
    const a = knots[j][i], up = knots[j + 1], n = up.length, k = Math.round((i / knots[j].length) * n) % n;
    t.rod(a, up[k], 0.03, { c: L.trimD }); t.rod(a, up[(k + n - 1) % n], 0.03, { c: L.trimD });
  }
  for (const s of [-1, 1]) { const c = onBowl(R, h, s * PI / 2, 0.35, 1.08); t.geo(gem(0.3), { at: c, c: L.trim }); lab.geo(gem(0.12), { at: onBowl(R, h, s * PI / 2, 0.35, 1.2) }); // (the rosettes at the temples, its strands down to the shoulders)
    for (let k = 0; k < 8; k++) { const f = (k / 8) * PI * 2; t.geo(gem(0.11), { at: add(c, [0, Math.sin(f) * 0.38, Math.cos(f) * 0.38]), c: L.trimD }); }
    for (const d of [-0.25, 0, 0.25]) for (let k = 0; k < 7; k++) t.geo(gem(0.09), { at: [s * R * 1.02, -0.1 - k * 0.17, d + 0.2], c: k % 3 ? L.trim : L.trimD }); }
  for (const s of [-1, 1]) orn(B, [s * 0.75, h * 0.85, -0.2], () => { // (the winged flanges rising off the crown)
    flat(t, [[0, 0], [0.25, 1.15], [0.5, 1.3], [0.58, 0.2]], s, { at: [s * 0.7, h * 0.82, -0.2], rot: [0, s * 0.3, s * -0.25], c: L.trimD }, 0.14);
    for (let k = 0; k < 4; k++) t.geo(gem(0.1), { at: [s * (0.75 + 0.07 * k), h * 0.82 + 0.25 + k * 0.3, -0.12], c: L.trim });
  });
  for (let i = 0; i < 6; i++) { const y = -1.5 + i * 0.14, rr = R * (0.74 + i * 0.03); // (the high collar of beads, up to the chin)
    for (let k = 0; k < 18; k++) { const a = (k / 18) * PI * 2 + i * 0.17; t.geo(gem(0.1), { at: [Math.sin(a) * rr, y, Math.cos(a) * rr], c: i % 2 ? L.trim : L.trimD }); }
    if (i % 2 === 0) g.ring(rr, 0.035, { at: [0, y, 0] }, 24);
  }
  orn(B, [R * 1.25, 0.3, 0.2], () => { // (an ivory horn floating at its side, Judgement's trumpet: its bell gold-banded)
    const pts = bez([[R * 1.2, -0.55, 0.65], [R * 1.42, 0.2, 0.55], [R * 1.38, 1.0, 0.15], [R * 1.15, 1.45, -0.35]], 8);
    for (let i = 0; i < 8; i++) stage(p, pts[i], pts[i + 1], 0.08 + 0.025 * i, 0.08 + 0.025 * (i + 1), 6, { c: L.ivory });
    for (const k of [2, 5, 8]) stage(g, pts[k], along(pts, Math.min(1, k / 8 + 0.03)), 0.1 + 0.026 * k, 0.1 + 0.026 * k, 6);
    g.box(0.1, 0.16, 0.12, { at: add(pts[2], [-0.12, 0, 0]) }, 0.02); crystal(lab, add(pts[8], [0, 0.18, -0.12]), 0.4, 0.12, aim([0, 1, -0.6]));
  });
  plaque(B, 20, [0, -1.1, -R * 0.86 - 0.12], [0, PI, 0], 0.4);
}

function kireedam(B) {
  const { p, t, g, lab } = B;
  const h = R * 0.95;
  bowl(p, R, h, L.ivory, { ribs: 1, ribC: L.bone });
  g.geo(facet(new THREE.CylinderGeometry(R * 1.0, R * 1.02, 0.42, 16, 1, true)), { at: [0, 0.21, 0] }); // (the band)
  for (let i = 0; i < 16; i++) lab.geo(gem(0.09), { at: onBand((i / 16) * PI * 2, R * 1.03, 0, 0.21) });
  for (const [a, sz] of [[0, 1], [0.6, 0.75], [-0.6, 0.75]]) { t.geo(plate([[-0.32, 0], [0.32, 0], [0.18, 0.55], [0, 0.95], [-0.18, 0.55]].map(([x, y]) => [x * sz, y * sz]), 0.09, 0.03), { at: onBand(a, R * 0.98, 0, 0.38, 0.02), rot: yawTilt(a, 0.25), c: L.trim }); lab.geo(gem(0.11 * sz), { at: onBand(a, R * 0.98, 0, 0.38 + 0.4 * sz, 0.12) }); } // (its front pieces)
  const sp = [[0, h * 0.7, 0], [0, h * 1.05, 0], [0, h * 1.35, 0], [0, h * 1.6, 0], [0, h * 1.8, 0]]; // (the mudi, tier on tier)
  for (let i = 0; i < 4; i++) { stage(t, sp[i], sp[i + 1], R * (0.62 - i * 0.13), R * (0.52 - i * 0.12), 8, { c: i % 2 ? L.trimD : L.trim }); g.ring(R * (0.52 - i * 0.12) + 0.03, 0.05, { at: sp[i + 1] }, 16); }
  orn(B, sp[4], () => crystal(lab, add(sp[4], [0, 0.4, 0]), 0.7, 0.15));
  for (const s of [-1, 1]) { const at = [s * R * 1.03, -0.22, 0.1]; g.cyl(0.4, 0.4, 0.1, { at, rot: [0, 0, PI / 2] }, 10); lab.geo(gem(0.16), { at: add(at, [s * 0.08, 0, 0]) }); // (the ear discs)
    for (let k = 0; k < 8; k++) { const f = (k / 8) * PI * 2; t.cone(0.08, 0.22, { at: add(at, [s * 0.02, Math.sin(f) * 0.48, Math.cos(f) * 0.48]), rot: aim([0, Math.sin(f), Math.cos(f)]), c: L.trimD }, 4); } }
  orn(B, [0, R * 0.8, -R * 0.85], () => { // (the great round back-piece, floating behind: the World's wreath, its four crystals the corners)
    const at = [0, R * 0.85, -R * 1.18];
    t.geo(facet(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 16)), { at, rot: [PI / 2, 0, 0], c: L.trimD });
    for (const rr of [0.85, 0.5]) g.geo(facet(new THREE.TorusGeometry(rr, 0.06, 4, 16)), { at: add(at, [0, 0, 0.08]) });
    for (let k = 0; k < 16; k++) { const f = (k / 16) * PI * 2; g.box(0.07, 0.32, 0.05, { at: add(at, [Math.cos(f) * 0.68, Math.sin(f) * 0.68, 0.08]), rot: [0, 0, f - PI / 2] }, 0.01); lab.geo(gem(0.07), { at: add(at, [Math.cos(f + 0.2) * 1.03, Math.sin(f + 0.2) * 1.03, 0.08]) }); }
    halo(B, at, 1.22, { rot: [0, 0, 0], gems: 4, len: 0.42, phase: PI / 4 });
    plaque(B, 21, add(at, [0, 0, -0.1]), [0, PI, 0], 0.42);
  });
}

export const BUILD_ARCANA_B = { greatHelm, gjermundbu, sallet, kamelaukion, waterloo, mural, puabi, sasanian, sapaInca, benin, kireedam };
