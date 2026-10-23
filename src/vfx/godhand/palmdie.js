// ---------------------------------------------------------------------------------------
// THE PALM DIE'S LOOK (docs/plans/DICE.md 4 and 7; Dovina's rule `game.palmDie`, progress/dice.js; the owner, 2026-10-23: the stones are
// your dice, and in the god hand's form they are one die in its palm): the stone sat in the god hand's palm hole, the solid its size
// (a tetrahedron d4, a cube d6, an octahedron d8, a dodecahedron d12, an icosahedron d20), cut in the mineral of the stones you wear
// (the vessel's STONES glaze: its colour the body, its second colour the fire glowing in it), turning slowly in its socket.
//   A CONDENSE   palm.condense { n }: the stone breathes out a glint, brighter the more it made (the overflow pressed into cubes)
//   A GROWTH     palm.grow { from, to }: the stone swells and cracks white along its facets, and comes round as the next solid with a
//                flare of its fire (a stone re-cut, not a gem swapped)
// THE FINGERS  the other five of the standard set on the hand (the owner, 2026-10-23: d4 the little finger, d6 the ring finger, d8 the
//              middle, d10 the index, d12 the thumb; the d20 is the palm's), small stones on the back of each finger's first joint,
//              in the same mineral; each die's edges inked in its suit's colour (d4 Wands, d6 Pentacles, d8 Swords, d10 Cups, the
//              palm's d20 the Majors' gold, the thumb's d12 the zodiac's: the film's schiller, as any suit), so the hand teaches the suits without a word.
// No words: a world mark (the log says "Your palm die grows into a d8.").
//
// Prior art: the owner's Entropy Tactics' Hungry Die (a die that grows on what it is fed); Plato's solids as the dice (Timaeus); the
// Mega Man Legends refractor in a palm; the house's own stones (courier/vessel/glazes.js gems: fire is dispersion).
//
//   const P = new PalmDieLook(game)   P.update(dt)   (it finds the hand's `handR` bone itself, and sits where the palm is)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLAZES } from '../../courier/vessel/glazes.js';
import { SUIT_LOOK } from '../readingview.js';

/** Each die's ink, its edges, in its suit's colour (Dovina, 2026-10-23: the body the mineral, the ink the suit; the d20 the Majors' gold, the d12 unruled: none). */
const INK = { 4: SUIT_LOOK.wands, 6: SUIT_LOOK.pentacles, 8: SUIT_LOOK.swords, 10: SUIT_LOOK.cups, 12: 0xffffff, 20: 0xffd36a }; // (the d12, the zodiac, lights any suit: its ink the film's schiller, walked in update, as a wild cell's on the cloth)

export const PALM_DIE = {
  at: [0.0, 0.48, -0.01],       // (the palm hole's middle in the handR bone's frame, measured on the owner's model: the hole goes through, so mid-thickness)
  size: { 4: 0.1, 6: 0.085, 8: 0.1, 12: 0.11, 20: 0.125 }, // (bone units: the solid's radius, a d20 the largest; the hole's is about 0.18)
  spin: 0.6,                    // (rad a real second, turning in its socket)
  grow: 0.8,                    // (real s the re-cut takes)
  // the other five on the fingers (the owner, 2026-10-23, DICE.md 4.1): set on the back of each finger's first joint like a ring's stone
  fingers: { pinky: 4, ring: 6, middle: 8, index: 10, thumb: 12 },
  finger: { size: 0.045, back: 0.05, along: 0.45 }, // (bone units: its radius; out from the finger's back; how far from the knuckle to the next joint)
};
const S = PALM_DIE;
const SOLID = {
  4: (r) => new THREE.TetrahedronGeometry(r), 6: (r) => new THREE.BoxGeometry(r * 1.15, r * 1.15, r * 1.15), 8: (r) => new THREE.OctahedronGeometry(r),
  12: (r) => new THREE.DodecahedronGeometry(r), 20: (r) => new THREE.IcosahedronGeometry(r), 10: (r) => trapezohedron(r),
};
/** The d10's solid: two apexes and two rings of five, each face a kite (a pentagonal trapezohedron). */
function trapezohedron(r) {
  const h = r, k = r * 0.105, ring = (y, a0) => Array.from({ length: 5 }, (_, i) => { const a = a0 + (i * Math.PI * 2) / 5; return [Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.9]; });
  const top = [0, h, 0], bot = [0, -h, 0], U = ring(k, 0), D = ring(-k, Math.PI / 5), pos = [];
  for (let i = 0; i < 5; i++) {
    const u0 = U[i], u1 = U[(i + 1) % 5], d0 = D[i], d1 = D[(i + 4) % 5];
    pos.push(...top, ...u1, ...d0, ...top, ...d0, ...u0); // (an upper kite: the apex, two upper corners, the lower one between)
    pos.push(...bot, ...d1, ...u0, ...bot, ...u0, ...d0); // (a lower kite)
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}

export class PalmDieLook {
  constructor(game) {
    this.game = game; this.bone = null; this.sides = 0; this.t = 0; this.glint = 0; this.cut = 1; this.next = 0;
    this.geos = {};
    this.mat = new THREE.MeshStandardMaterial({ name: 'palm-die', roughness: 0.12, metalness: 0.05, flatShading: true, emissiveIntensity: 0.25 });
    this.crack = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.mesh = new THREE.Mesh(undefined, this.mat); this.mesh.name = 'palm-die'; this.mesh.castShadow = false;
    this.edges = new THREE.LineSegments(undefined, this.crack); this.mesh.add(this.edges);
    this.mesh.raycast = () => {}; this.edges.raycast = () => {};
    this.fingerDice = []; this.hand = null;
    game.events?.on?.('palm.condense', (e) => { this.glint = Math.min(1, this.glint + 0.35 + 0.1 * (e?.n || 1)); });
    game.events?.on?.('palm.grow', (e) => { this.next = e?.to || this.sides; this.cut = 0; });
  }

  geo(sides) {
    if (!this.geos[sides]) { const g = (SOLID[sides] || SOLID[20])(S.size[sides] || S.size[20]); this.geos[sides] = { g, e: new THREE.EdgesGeometry(g) }; }
    return this.geos[sides];
  }
  shape(sides) { const G = this.geo(sides); this.mesh.geometry = G.g; this.edges.geometry = G.e; this.sides = sides; }
  /** The mineral of the stones you wear. */
  dress() {
    const G = GLAZES[this.game.vessel?.look?.stones] || GLAZES.maker;
    this.mat.color.setHex(G?.color ?? 0xffffff); this.mat.emissive.setHex(G?.color2 ?? 0xffffff); this.mat.roughness = Math.max(0.06, G?.rough ?? 0.1);
    this.crack.color.setHex(this.cut < 1 ? (G?.color2 ?? 0xffffff) : INK[this.sides] ?? (G?.color2 ?? 0xffffff)); // (its ink at rest, the mineral's fire through a re-cut)
  }

  /** The five on the fingers: each parented to its finger's first bone, set at its back between the knuckle and the next joint. */
  setFingers(B) {
    for (const d of this.fingerDice) d.removeFromParent();
    this.fingerDice = [];
    const F = S.finger, back = new THREE.Vector3(0, 0, 1).transformDirection(B.handR.matrixWorld), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (const [finger, sides] of Object.entries(S.fingers)) {
      const b1 = B[`${finger === 'thumb' ? 'thumb' : 'f_' + finger}01R`], b2 = B[`${finger === 'thumb' ? 'thumb' : 'f_' + finger}02R`]; if (!b1 || !b2) continue;
      b1.updateWorldMatrix(true, false); b2.updateWorldMatrix(true, false);
      a.setFromMatrixPosition(b1.matrixWorld); b.setFromMatrixPosition(b2.matrixWorld);
      const len = a.distanceTo(b), p = a.lerp(b, F.along).addScaledVector(back, F.back * len / 0.17); // (the offset scaled by the segment, the world's units)
      const g = (SOLID[sides])(F.size), m = new THREE.Mesh(g, this.mat); m.name = `finger-die-d${sides}`; m.raycast = () => {};
      if (INK[sides]) { const e = (m.userData.ink = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: INK[sides], transparent: true, opacity: 0.85, toneMapped: false }))); e.raycast = () => {}; m.add(e); } // (its suit's ink on its edges)
      b1.add(m); m.position.copy(b1.worldToLocal(p)); m.userData.sides = sides; m.scale.setScalar(1 / Math.max(1e-6, b1.getWorldScale(new THREE.Vector3()).x) * B.handR.getWorldScale(new THREE.Vector3()).x);
      this.fingerDice.push(m);
    }
  }

  update(dt) {
    const bone = this.game.god?.hand?.bones?.handR, P = this.game.palmDie, B = this.game.god?.hand?.bones;
    if (B?.handR && this.hand !== B) { this.hand = B; this.setFingers(B); }
    if (B?.handR) this.dress(); // (the fingers' stones wear the mineral whether the palm die is yet or not)
    for (const [i, d] of this.fingerDice.entries()) { d.rotation.set(0.5, this.t * 0.3 + i, 0.3); if (d.userData.sides === 12) d.userData.ink?.material.color.setHSL((this.t * 0.05) % 1, 0.8, 0.65); }
    if (bone !== this.bone) { this.mesh.removeFromParent(); this.bone = bone; if (bone) { bone.add(this.mesh); this.mesh.position.fromArray(S.at); } }
    if (!bone || !P) { this.mesh.visible = false; return; }
    this.mesh.visible = true; this.t += dt;
    if (!this.sides) this.shape(P.sides || 4);
    // the re-cut: swell and crack to the half, the new solid from there
    let swell = 0, crack = 0;
    if (this.cut < 1) {
      const was = this.cut; this.cut = Math.min(1, this.cut + dt / S.grow);
      if (was < 0.5 && this.cut >= 0.5) this.shape(this.next || P.sides || 4);
      swell = Math.sin(Math.PI * this.cut); crack = this.cut < 0.5 ? this.cut * 2 : (1 - this.cut) * 2;
    } else if (P.sides && P.sides !== this.sides) this.shape(P.sides); // (a save loaded, or a growth missed)
    this.glint = Math.max(0, this.glint - dt * 1.6);
    this.mesh.scale.setScalar(1 + 0.35 * swell + 0.08 * this.glint);
    this.mesh.rotation.set(0.4 + Math.sin(this.t * 0.7) * 0.2, this.t * S.spin, 0.2);
    this.mat.emissiveIntensity = 0.25 + 1.2 * this.glint + 2.5 * swell;
    this.crack.opacity = Math.min(1, (INK[this.sides] ? 0.6 : 0) + crack * 1.4 + 0.15 * this.glint);
  }
}
