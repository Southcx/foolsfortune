// ---------------------------------------------------------------------------------------
// MARGARITE'S PEOPLE: placeholder bodies for the slice's dock (docs/LORE.md, section 6; docs/plans/SLICE.md), rough on purpose, so the
// talks have someone to stand behind them until the owner's own models come. Margarite is the King's island, and these are his: the
// palette of his concept art (docs/ref/concept_king_magnus_margarite.png: white, sage, deep green, gold, a little red), flat graphic
// shapes, and NACRE, which is what they are made of: mother-of-pearl, Law's own method (an oyster coats the grit that hurts it until it
// is smooth). Not clay: the first figures in the game that are not.
//
//   LETTY MARQUE   a Contractor: shell-pale nacre with the rainbow film, a long deep-green coat trimmed gold with the King's letter in
//                  it (a scroll under a red seal), a feathered tricorn; leaning forward, itching to go
//   POLL           her Tulpa: a paper parrot folded from closed bounty notices (their ruled lines and red stamps), a little too big for
//                  her shoulder
//   THE PURSER     the King's buyer, a figure of Law: nacre buttoned up to the chin in white and sage, a purser's cap, a ledger under an
//                  arm and a small hourglass at the belt (the lighthouse's own lantern is an hourglass)
//   THE BOARD      Letty's bounty board: a white-and-sage frame, notices pinned in rows under red seals, a lantern on top
// The nacre is real thin-film iridescence (three.js's physical material: the film's thickness and index), so it shifts with the angle
// as a shell does, never a painted rainbow. Each figure's parts are named (head, body, armL, armR) for whoever poses them.
//
// Prior art: the owner's concept art (the King, his Figments: white hoods, deep green coats, gold), mother-of-pearl itself (aragonite
// layers, interference colours), origami's parrot (a few folds: body, head, beak, wings, a long tail), and the dock figures of the sixth
// generation's port towns (Skies of Arcadia's Nasrad, Wind Waker's Windfall: a silhouette that says the trade).
//
//   buildLetty() / buildPoll() / buildPurser() / buildBountyBoard() -> { group, parts }   (each about life size; +Z its front, feet at 0)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../render/outline.js';

const C = { white: 0xf2efe6, sage: 0x8fae9c, green: 0x24463a, gold: 0xe7b83f, red: 0xb8382a, dark: 0x1c1a1e, paper: 0xefe6d2, wood: 0xdfe6dc };

/** Nacre: shell-pale, and the thin film's colours where the light catches it (a real interference film, by its thickness). */
export function nacre(color = 0xe6e0d6) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.16, metalness: 0.05, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [320, 900], sheen: 0.5, sheenColor: new THREE.Color(0xffeef6), clearcoat: 0.4, clearcoatRoughness: 0.2 });
  // (and the film where the surface turns from the eye, whatever lights it: the physical film colours only what it reflects, and a
  // dock with little to reflect would leave it plain white; a shell's rainbow is at its edges)
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 nn = normalize(normal); float fr = pow(1.0 - clamp(abs(dot(nn, normalize(vViewPosition))), 0.0, 1.0), 1.3);
  vec3 film = 0.5 + 0.5 * cos(6.2832 * (fr * 1.2 + dot(nn, vec3(0.35, 0.55, 0.25)) * 0.8 + vec3(0.0, 0.33, 0.67)));
  totalEmissiveRadiance += (film - 0.35) * (0.1 + 0.35 * fr); } // (the colours lent, a little of their opposite taken: a film, not a glow)`);
  };
  m.customProgramCacheKey = () => 'nacre';
  return m;
}
const flat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, ...o });

function part(parent, geo, mat, x = 0, y = 0, z = 0, outline = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); if (outline) addOutline(m); return m;
}
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10);

/** Paper printed with notices: ruled lines, a block of print, a red stamp across each (closed). No words: a notice's look, not its text. */
let _paper = null;
function paperTexture() {
  if (_paper) return _paper;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 128, 128);
  for (let n = 0; n < 4; n++) {
    const ox = (n % 2) * 64, oy = Math.floor(n / 2) * 64;
    g.fillStyle = 'rgba(60,50,40,0.55)'; g.fillRect(ox + 10, oy + 8, 44, 6);
    for (let i = 0; i < 5; i++) g.fillRect(ox + 8, oy + 20 + i * 6, 30 + ((i * 13 + n * 7) % 18), 2);
    g.strokeStyle = 'rgba(184,56,42,0.85)'; g.lineWidth = 3; g.beginPath(); g.arc(ox + 44, oy + 44, 10, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(ox + 36, oy + 52); g.lineTo(ox + 52, oy + 36); g.stroke();
  }
  _paper = new THREE.CanvasTexture(c); _paper.colorSpace = THREE.SRGBColorSpace; _paper.magFilter = THREE.NearestFilter;
  return _paper;
}

export function buildLetty() {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const shell = nacre(), coat = flat(C.green), gold = flat(C.gold, { metalness: 0.5, roughness: 0.4 }), dark = flat(C.dark), white = flat(C.white);
  body.rotation.x = 0.2; // (leaning forward: itching to go)
  // legs and boots
  for (const s of [-1, 1]) { part(group, capsule(0.08, 0.5), flat(0x2e2a30), s * 0.11, 0.42, 0); part(group, new THREE.BoxGeometry(0.15, 0.22, 0.26), dark, s * 0.11, 0.11, 0.04); } // (dark breeches, tall boots)
  // the coat: a long flared cone, its skirts open at the front, gold at the hem
  const coatG = new THREE.CylinderGeometry(0.19, 0.36, 0.95, 12, 1, true, 0.22, Math.PI * 2 - 0.44); part(body, coatG, coat, 0, 0.9, 0).material.side = THREE.DoubleSide;
  part(body, new THREE.TorusGeometry(0.355, 0.018, 4, 24, Math.PI * 2 - 0.44), gold, 0, 0.43, 0).rotation.set(Math.PI / 2, 0, 0.22 + Math.PI / 2);
  // the body under it: nacre; a sage waistcoat; the King's letter in the coat (a scroll and its red seal)
  part(body, capsule(0.15, 0.32), shell, 0, 1.12, 0);
  part(body, new THREE.CylinderGeometry(0.16, 0.18, 0.46, 10), flat(C.sage), 0, 1.0, 0.01); // (the waistcoat, long, to the coat's opening)
  const letter = part(body, new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), white, 0.1, 1.2, 0.15); letter.rotation.z = 0.5;
  part(body, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), flat(C.red), 0.1, 1.2, 0.165, false).rotation.x = Math.PI / 2;
  // the arms: one on the hip, one forward (a hand that wants the next notice)
  const armL = new THREE.Group(); armL.position.set(0.21, 1.28, 0); body.add(armL); part(armL, capsule(0.055, 0.42), coat, 0, -0.24, 0); armL.rotation.set(0, 0, 0.6);
  const armR = new THREE.Group(); armR.position.set(-0.21, 1.28, 0); body.add(armR); part(armR, capsule(0.055, 0.42), coat, 0, -0.24, 0); armR.rotation.set(-1.0, 0, -0.15);
  part(armR, new THREE.SphereGeometry(0.06, 8, 6), shell, 0, -0.5, 0);
  // the head: a smooth shell egg, a gold earring
  const head = new THREE.Group(); head.position.set(0, 1.5, 0.02); body.add(head);
  part(head, new THREE.SphereGeometry(0.13, 14, 10), shell, 0, 0.06, 0).scale.set(1, 1.15, 1);
  part(head, new THREE.TorusGeometry(0.025, 0.007, 4, 10), gold, 0.125, 0.0, 0, false);
  // the tricorn: three brims turned up, gold edged, a white plume with a sage tip
  const hat = new THREE.Group(); hat.position.set(0, 0.2, 0); head.add(hat);
  part(hat, new THREE.CylinderGeometry(0.11, 0.13, 0.12, 10), coat, 0, 0.05, 0);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6, brim = new THREE.Group(); brim.rotation.y = a; hat.add(brim);
    const b = part(brim, new THREE.BoxGeometry(0.26, 0.1, 0.02), coat, 0, 0.03, 0.17); b.rotation.x = -0.55;
    part(brim, new THREE.BoxGeometry(0.26, 0.012, 0.022), gold, 0, 0.08, 0.15, false).rotation.x = -0.55;
  }
  const plume = new THREE.Group(); plume.position.set(-0.08, 0.08, -0.05); plume.rotation.set(-0.6, 0, 0.5); hat.add(plume);
  part(plume, new THREE.ConeGeometry(0.045, 0.42, 6), white, 0, 0.21, 0);
  part(plume, new THREE.ConeGeometry(0.03, 0.12, 6), flat(C.sage), 0, 0.44, 0, false);
  // where Poll perches
  const shoulder = new THREE.Object3D(); shoulder.position.set(0.2, 1.42, -0.02); body.add(shoulder);
  return { group, parts: { body, head, armL, armR, hat, shoulder } };
}

export function buildPoll() {
  const group = new THREE.Group(), paper = new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  // folds: a squashed octahedron for the body, a tetrahedron head, a cone beak, two triangle wings, a long split tail
  const bodyM = part(group, new THREE.OctahedronGeometry(0.16, 0), paper, 0, 0.18, 0); bodyM.scale.set(0.8, 1.1, 1.3);
  const head = part(group, new THREE.TetrahedronGeometry(0.11, 0), paper, 0, 0.36, 0.09); head.rotation.set(0.6, 0.8, 0);
  part(head, new THREE.ConeGeometry(0.035, 0.1, 4), flat(C.red), 0, -0.02, 0.1).rotation.x = Math.PI / 2 + 0.4;
  const tri = (w, h) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, w, 0, -h * 0.3, 0, 0, -h], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0.3, 0, 1], 2)); g.computeVertexNormals(); return g; };
  const wingL = part(group, tri(0.32, 0.36), paper, 0.1, 0.24, 0.08); wingL.rotation.set(0.2, 0, -0.5);
  const wingR = part(group, tri(-0.32, 0.36), paper, -0.1, 0.24, 0.08); wingR.rotation.set(0.2, 0, 0.5);
  for (const s of [-1, 1]) { const t = part(group, tri(s * 0.06, 0.42), paper, 0, 0.1, -0.12); t.rotation.set(-0.5, 0, 0); }
  return { group, parts: { body: bodyM, head, wingL, wingR } };
}

export function buildPurser() {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const shell = nacre(), white = flat(C.white), sage = flat(C.sage), gold = flat(C.gold, { metalness: 0.5, roughness: 0.4 }), dark = flat(C.dark), green = flat(C.green);
  for (const s of [-1, 1]) { part(group, capsule(0.08, 0.42), dark, s * 0.11, 0.36, 0); part(group, new THREE.BoxGeometry(0.15, 0.12, 0.24), dark, s * 0.11, 0.06, 0.03); }
  // the coat, buttoned to the chin: a straight column, a row of gold buttons, a high collar, a sage sash
  part(body, new THREE.CylinderGeometry(0.22, 0.26, 0.85, 12), white, 0, 1.0, 0);
  for (let i = 0; i < 5; i++) part(body, new THREE.SphereGeometry(0.018, 6, 4), gold, 0, 0.72 + i * 0.12, 0.235, false);
  part(body, new THREE.CylinderGeometry(0.13, 0.17, 0.12, 12), white, 0, 1.47, 0);
  part(body, new THREE.TorusGeometry(0.245, 0.03, 4, 20), sage, 0, 0.82, 0).rotation.x = Math.PI / 2;
  // the arms: the ledger held under one, the other at the side
  const armL = new THREE.Group(); armL.position.set(0.27, 1.32, 0); body.add(armL); part(armL, capsule(0.06, 0.4), white, 0, -0.24, 0); armL.rotation.z = 0.15;
  const armR = new THREE.Group(); armR.position.set(-0.27, 1.32, 0); body.add(armR); part(armR, capsule(0.06, 0.4), white, 0, -0.24, 0); armR.rotation.set(-0.5, 0, -0.1);
  const ledger = part(armR, new THREE.BoxGeometry(0.06, 0.3, 0.22), green, -0.02, -0.44, 0.1); part(ledger, new THREE.BoxGeometry(0.065, 0.31, 0.02), gold, 0, 0, 0.1, false);
  // the hourglass at the belt (the lighthouse's lantern is one)
  const hg = new THREE.Group(); hg.position.set(0.2, 0.86, 0.14); body.add(hg);
  part(hg, new THREE.ConeGeometry(0.035, 0.06, 8), flat(0xd8e8f0, { transparent: true, opacity: 0.8 }), 0, 0.03, 0, false).rotation.x = Math.PI;
  part(hg, new THREE.ConeGeometry(0.035, 0.06, 8), flat(0xd8e8f0, { transparent: true, opacity: 0.8 }), 0, -0.03, 0, false);
  for (const y of [0.065, -0.065]) part(hg, new THREE.CylinderGeometry(0.045, 0.045, 0.012, 8), gold, 0, y, 0, false);
  // the head: nacre, a purser's flat cap, deep green with a gold band
  const head = new THREE.Group(); head.position.set(0, 1.66, 0); body.add(head);
  part(head, new THREE.SphereGeometry(0.13, 14, 10), shell, 0, 0, 0).scale.set(1, 1.1, 1);
  part(head, new THREE.CylinderGeometry(0.15, 0.14, 0.08, 14), green, 0, 0.13, 0);
  part(head, new THREE.CylinderGeometry(0.145, 0.145, 0.02, 14), gold, 0, 0.1, 0, false);
  part(head, new THREE.BoxGeometry(0.16, 0.012, 0.08), green, 0, 0.09, 0.15, false).rotation.x = 0.2;
  return { group, parts: { body, head, armL, armR, ledger, hourglass: hg } };
}

export function buildBountyBoard() {
  const group = new THREE.Group(), wood = flat(C.wood), sage = flat(C.sage), gold = flat(C.gold, { metalness: 0.5, roughness: 0.4 });
  for (const s of [-1, 1]) part(group, new THREE.BoxGeometry(0.1, 2.0, 0.1), sage, s * 0.85, 1.0, 0);
  part(group, new THREE.BoxGeometry(1.8, 1.1, 0.05), wood, 0, 1.25, 0);
  part(group, new THREE.BoxGeometry(1.9, 0.08, 0.12), sage, 0, 1.84, 0); part(group, new THREE.BoxGeometry(1.9, 0.06, 0.1), sage, 0, 0.68, 0);
  // the notices, pinned in rows, each under a red seal
  const paper = new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: 0.9, side: THREE.DoubleSide }), seal = flat(C.red);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const n = part(group, new THREE.PlaneGeometry(0.32, 0.42), paper, -0.6 + i * 0.4, 1.47 - r * 0.48, 0.03, false); n.rotation.z = ((i * 7 + r * 3) % 5 - 2) * 0.03;
    part(group, new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8), seal, n.position.x, n.position.y + 0.17, 0.036, false).rotation.x = Math.PI / 2;
  }
  // a lantern on top: Margarite's light
  part(group, new THREE.CylinderGeometry(0.08, 0.1, 0.18, 8), gold, 0, 2.0, 0);
  part(group, new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd98a }), 0, 2.0, 0, false);
  return { group, parts: {} };
}
