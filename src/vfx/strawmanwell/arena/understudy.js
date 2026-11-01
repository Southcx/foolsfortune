// ---------------------------------------------------------------------------------------
// THE ARENA'S STRAW FIGHTERS AS UNDERSTUDIES (South, 2026-11-01: "go wild on theatre rehearsal themes"; the fighter kit's foes,
// world/strawmanwell/fighter/foebody.js, are Strawman's doll): each straw fighter is restitched (StrawmanModel.restyle) as an understudy
// at rehearsal, learning Strawman's part:
//   rehearsal blacks   the sack and the sleeves in charcoal jersey, a seam of chalk down it, the cuffs taped in white
//   the part           a paper copy of Strawman's red and cream target pinned on the chest with two safety pins, a corner dog-eared
//                      (they wear the part they are learning: the lead's own target, on paper)
//   the side           a sweatband round the head in the fighter's side's colour (the foes cinnabar: the duel's convention, fxkit.js)
//   the cast number    chalk pips on the back of the sack (one, two or three), never a word
//   no hat, no heart   the hat is the lead's, and the heart charm is Pip's gift to the one that worked
// One canvas a fighter's body, one band mesh; restyled once (`model.group.userData.understudy`), what it makes the model's own.
//
// Prior art: the understudy and the rehearsal blacks of any stage company, the paper character name pinned on at a read-through, the
// sweatband of the fight rehearsal; the house's Pip's tries (vfx/strawmanwell/pipstries.js: one doll restitched by restyle).
//
//   dressUnderstudy(model, i, team)   UNDERSTUDY (the look's numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The costume's colours and the band's size (m, in the head's own frame: its radius is 0.23). */
export const UNDERSTUDY = {
  black: 0x2a2630, chalk: 0xf4efe2, red: 0xb8402e, cream: 0xf3e6c8, paper: 0xf6f0e0, pin: 0xc8d0d8, tape: 0xe9e4d6,
  sides: [0x5a6ab0, 0xd0503a], band: { r: 0.236, tube: 0.034, y: 0.07 },
};
const U = UNDERSTUDY;
const hex = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

/** The sack: charcoal jersey, a chalk seam, the paper target pinned on the front (u 0.5: the sack's front, vfx/strawman.js) and
 *  the cast number's pips on the back (u 0). */
function blacksTexture(i) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = hex(U.black); g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < S; x += 4) { g.fillStyle = hex(0x46404e, 0.35); g.fillRect(x, y, 2, 3); } // (the jersey's knit)
  g.strokeStyle = hex(U.chalk, 0.5); g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(S * 0.25, 0); g.lineTo(S * 0.27, S); g.stroke(); g.setLineDash([]);
  // the paper part, pinned on (an ellipse narrow across: it reads round on the sack, as Strawman's own)
  const cx = S * 0.5, cy = S * 0.56;
  g.save(); g.translate(cx, cy); g.rotate(-0.06);
  g.fillStyle = hex(U.paper); g.beginPath(); g.moveTo(-30, -66); g.lineTo(30, -66); g.lineTo(30, 52); g.lineTo(18, 66); g.lineTo(-30, 66); g.closePath(); g.fill();
  g.fillStyle = hex(0xd8ccb0); g.beginPath(); g.moveTo(30, 52); g.lineTo(18, 66); g.lineTo(18, 52); g.closePath(); g.fill(); // (a corner dog-eared)
  for (const [r, col] of [[56, U.red], [43, U.cream], [30, U.red], [18, U.cream], [7, U.red]]) { g.fillStyle = hex(col, 0.92); g.beginPath(); g.ellipse(0, 0, r * 0.42, r, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = hex(0x2a1a12, 0.35); g.lineWidth = 1.5; g.strokeRect(-30, -66, 60, 132);
  g.strokeStyle = hex(U.pin); g.lineWidth = 2.5; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 20, -58, 6, 3, 0, 0, Math.PI * 2); g.moveTo(sx * 14, -58); g.lineTo(sx * 30, -54); g.stroke(); }
  g.restore();
  // the cast number on the back, in chalk pips
  for (let k = 0; k <= i % 3; k++) { g.fillStyle = hex(U.chalk, 0.85); g.beginPath(); g.arc(S * (0.02 + k * 0.05) + 6, S * 0.4, 7, 0, Math.PI * 2); g.fill(); }
  for (const u of [0.98]) { g.fillStyle = hex(U.chalk, 0.85); for (let k = 0; k <= i % 3; k++) { g.beginPath(); g.arc(S * u - 6 - k * S * 0.05, S * 0.4, 7, 0, Math.PI * 2); g.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** A cuff taped round in white, over the black. */
function cuffTexture() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = hex(U.black); g.fillRect(0, 0, S, S);
  for (let y = 6; y < S; y += 18) { g.fillStyle = hex(U.tape); g.fillRect(0, y, S, 9); g.fillStyle = hex(0xb8b2a4); g.fillRect(0, y + 8, S, 1); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Restitch `model` (a StrawmanModel) as understudy `i` of side `team`; once. */
export function dressUnderstudy(model, i = 0, team = 1) {
  if (!model?.restyle || model.group.userData.understudy) return model;
  const band = new THREE.Mesh(new THREE.TorusGeometry(U.band.r, U.band.tube, 6, 28), new THREE.MeshStandardMaterial({ color: U.sides[team] ?? U.sides[1], roughness: 0.8 }));
  band.rotation.x = Math.PI / 2; band.position.y = U.band.y; band.name = 'understudy.band';
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), band.material); knot.position.set(-U.band.r, 0, 0); knot.scale.set(0.7, 1, 1.4); band.add(knot);
  model.restyle({ body: { map: blacksTexture(i) }, sleeves: [U.black, U.black], cuffs: [cuffTexture(), cuffTexture()], hat: false, heart: false, on: { head: [band] } });
  model.group.userData.understudy = i + 1;
  return model;
}
