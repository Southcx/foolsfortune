// ---------------------------------------------------------------------------------------
// THE PALM DIE'S LOOK (docs/plans/DICE.md 4 and 7; Dovina's rule `game.palmDie`, progress/dice.js; the owner, 2026-10-23: the stones are
// your dice, and in the god hand's form they are one die in its palm): the stone sat in the god hand's palm hole, the solid its size
// (a tetrahedron d4, a cube d6, an octahedron d8, a dodecahedron d12, an icosahedron d20), cut in the mineral of the stones you wear
// (the vessel's STONES glaze: its colour the body, its second colour the fire glowing in it), turning slowly in its socket.
//   A CONDENSE   palm.condense { n }: the stone breathes out a glint, brighter the more it made (the overflow pressed into cubes)
//   A GROWTH     palm.grow { from, to }: the stone swells and cracks white along its facets, and comes round as the next solid with a
//                flare of its fire (a stone re-cut, not a gem swapped)
// No words: a world mark (the log says "Your palm die grows into a d8.").
//
// Prior art: the owner's Entropy Tactics' Hungry Die (a die that grows on what it is fed); Plato's solids as the dice (Timaeus); the
// Mega Man Legends refractor in a palm; the house's own stones (courier/vessel/glazes.js gems: fire is dispersion).
//
//   const P = new PalmDieLook(game)   P.update(dt)   (it finds the hand's `handR` bone itself, and sits where the palm is)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLAZES } from '../../courier/vessel/glazes.js';

export const PALM_DIE = {
  at: [0.0, 0.48, -0.01],       // (the palm hole's middle in the handR bone's frame, measured on the owner's model: the hole goes through, so mid-thickness)
  size: { 4: 0.1, 6: 0.085, 8: 0.1, 12: 0.11, 20: 0.125 }, // (bone units: the solid's radius, a d20 the largest; the hole's is about 0.18)
  spin: 0.6,                    // (rad a real second, turning in its socket)
  grow: 0.8,                    // (real s the re-cut takes)
};
const S = PALM_DIE;
const SOLID = {
  4: (r) => new THREE.TetrahedronGeometry(r), 6: (r) => new THREE.BoxGeometry(r * 1.15, r * 1.15, r * 1.15), 8: (r) => new THREE.OctahedronGeometry(r),
  12: (r) => new THREE.DodecahedronGeometry(r), 20: (r) => new THREE.IcosahedronGeometry(r),
};

export class PalmDieLook {
  constructor(game) {
    this.game = game; this.bone = null; this.sides = 0; this.t = 0; this.glint = 0; this.cut = 1; this.next = 0;
    this.geos = {};
    this.mat = new THREE.MeshStandardMaterial({ name: 'palm-die', roughness: 0.12, metalness: 0.05, flatShading: true, emissiveIntensity: 0.25 });
    this.crack = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.mesh = new THREE.Mesh(undefined, this.mat); this.mesh.name = 'palm-die'; this.mesh.castShadow = false;
    this.edges = new THREE.LineSegments(undefined, this.crack); this.mesh.add(this.edges);
    this.mesh.raycast = () => {}; this.edges.raycast = () => {};
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
    this.crack.color.setHex(G?.color2 ?? 0xffffff);
  }

  update(dt) {
    const bone = this.game.god?.hand?.bones?.handR, P = this.game.palmDie;
    if (bone !== this.bone) { this.mesh.removeFromParent(); this.bone = bone; if (bone) { bone.add(this.mesh); this.mesh.position.fromArray(S.at); } }
    if (!bone || !P) { this.mesh.visible = false; return; }
    this.mesh.visible = true; this.t += dt;
    if (!this.sides) this.shape(P.sides || 4);
    this.dress();
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
    this.crack.opacity = Math.min(1, crack * 1.4 + 0.15 * this.glint);
  }
}
