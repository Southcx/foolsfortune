// ---------------------------------------------------------------------------------------
// THE PALM DIE'S LOOK (docs/plans/DICE.md 4 and 7; Dovina's rule `game.palmDie`, progress/dice.js; the owner, 2026-10-23: the stones are
// your dice, and in the god hand's form they are one die in its palm): the stone sat in the god hand's palm hole, the solid its size
// (a tetrahedron d4, a cube d6, an octahedron d8, a dodecahedron d12, an icosahedron d20), cut in the mineral of the stones you wear
// (the vessel's STONES glaze: its colour the body, its second colour the fire glowing in it, its mineral over it: vfx/stoneminerals.js,
// drawn in the vessel's finish program), turning slowly in its socket. Its body is
// Raku's (vfx/bazaarpieces.js `dieTpl`, the atlas's stone skin: GROWN 2026-10-24), so every face carries its numeral (the d6 its pips),
// opposite faces summing to one more than the sides, and the palm's dice and the house's are one family.
//   A CONDENSE   palm.condense { n }: the stone breathes out a glint, brighter the more it made (the overflow pressed into cubes)
//   A ROLL       palm.roll { face, held } (the island's answer rolled against): a quick tumble, then settled with `face` turned to the god
//                hand's camera, its numeral upright (`dieFace`: the face's normal and its numeral's foot, from the template), held a beat,
//                then eased back to turning; a glint when it held (1 or 2). The d4 is read at its top vertex, turned to the camera. While it
//                is held, the number rolled is said in Arabic beside it (a sprite: the face wears the neuralese numeral, South 2026-10-29).
//   A GROWTH     palm.grow { from, to }: the stone swells and cracks white along its facets, and comes round as the next solid with a
//                flare of its fire (a stone re-cut, not a gem swapped)
// THE FINGERS  the other five of the standard set on the hand (the owner, 2026-10-23: d4 the little finger, d6 the ring finger, d8 the
//              middle, d10 the index, d12 the thumb; the d20 is the palm's), small stones on the back of each finger's first joint,
//              in the same mineral and the same numbered bodies; each die's edges inked in its suit's colour (d4 Wands, d6 Pentacles, d8 Swords, d10 Cups, the
//              palm's d20 the Majors' gold, the thumb's d12 the zodiac's: the film's schiller, as any suit), so the hand teaches the suits without a word.
// No words but the rolled number beside a held roll: a world mark (the log says "Your palm die grows into a d8.").
//
// Prior art: the owner's Entropy Tactics' Hungry Die (a die that grows on what it is fed); Plato's solids as the dice (Timaeus); the
// Mega Man Legends refractor in a palm; the house's own stones (courier/vessel/glazes.js gems: fire is dispersion); Baldur's Gate 3's
// die that rolls and then turns its face to you; Raku's dice (vfx/bazaarpieces.js, vfx/bazaarfaces.js) as the bodies.
//
//   const P = new PalmDieLook(game)   P.update(dt)   (it finds the hand's `handR` bone itself, and sits where the palm is)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../ui/theme.js';
import { GLAZES } from '../../courier/vessel/glazes.js';
import { SUIT_LOOK } from '../readingview.js';
import { dieTpl, dieFace, PIECE } from '../bazaarpieces.js';
import { stoneAtlas } from '../bazaarfaces.js';
import { dressFinish } from '../finish.js';
import { dressStone } from '../stoneminerals.js';

/** Each die's ink, its edges, in its suit's colour (Dovina, 2026-10-23: the body the mineral, the ink the suit; the d20 the Majors' gold, the d12 unruled: none). Every die
 *  of your set wears it: the palm die and the fingers here, the stones' dice on the vessel (vfx/vesseldice.js). */
export const DIE_INK = { 4: SUIT_LOOK.wands, 6: SUIT_LOOK.pentacles, 8: SUIT_LOOK.swords, 10: SUIT_LOOK.cups, 12: 0xffffff, 20: 0xffd36a }; // (the d12, the zodiac, lights any suit: its ink the film's schiller, walked in update, as a wild cell's on the cloth)

export const PALM_DIE = {
  at: [0.0, 0.48, -0.01],       // (the palm hole's middle in the handR bone's frame, measured on the owner's model: the hole goes through, so mid-thickness)
  size: { 4: 0.1, 6: 0.085, 8: 0.1, 10: 0.1, 12: 0.11, 20: 0.125 }, // (bone units: the solid's radius, a d20 the largest; the hole's is about 0.18)
  spin: 0.6,                    // (rad a real second, turning in its socket)
  grow: 0.8,                    // (real s the re-cut takes)
  roll: { tumble: 0.6, hold: 1.0, ease: 0.4, turns: 3.5 }, // (real s tumbling down to the face; held still on it; easing back to turning; turns in the tumble)
  // the other five on the fingers (the owner, 2026-10-23, DICE.md 4.1): set on the back of each finger's first joint like a ring's stone
  fingers: { pinky: 4, ring: 6, middle: 8, index: 10, thumb: 12 },
  finger: { size: 0.045, back: 0.05, along: 0.45 }, // (bone units: its radius; out from the finger's back; how far from the knuckle to the next joint)
};
const S = PALM_DIE;
/** A numbered solid of radius r: Raku's die body in the stone skin (its triangles, normals and the atlas's uvs). */
function solidGeo(sides, r) {
  const T = dieTpl(sides, `stone${sides}`, r / PIECE.die), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(T.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(T.nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(T.uv, 2));
  return g;
}
const _qw = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), _vd = new THREE.Vector3();
/** The local turn (under `parent`) that shows `face` of a `sides` die to `cam` from `at`, its numeral upright on the screen. */
function facingCamera(sides, face, parent, at, cam, out) {
  const F = dieFace(sides, face), view = _va.copy(cam.position).sub(at).normalize(); // (world: the way to the camera)
  out.setFromUnitVectors(F.n, view); // (the face's normal onto the view)
  if (F.up) { // (then turned about the view so the numeral's up is the camera's up, laid on the face's plane)
    const camUp = _vb.set(0, 1, 0).applyQuaternion(cam.quaternion).projectOnPlane(view).normalize(), up = _vc.copy(F.up).applyQuaternion(out);
    const ang = Math.atan2(_vd.crossVectors(up, camUp).dot(view), up.dot(camUp)); out.premultiply(_qa.setFromAxisAngle(view, ang));
  }
  return out.premultiply(parent.getWorldQuaternion(_qw).invert()); // (into the bone's frame)
}

export class PalmDieLook {
  constructor(game) {
    this.game = game; this.bone = null; this.sides = 0; this.t = 0; this.glint = 0; this.cut = 1; this.next = 0;
    this.geos = {};
    this.mat = new THREE.MeshStandardMaterial({ name: 'palm-die', map: stoneAtlas().tex, roughness: 0.12, metalness: 0.05, flatShading: true, emissiveIntensity: 0.25 }); // (the stone skin's pale body, tinted by the mineral; its numerals dark)
    this.crack = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.mesh = new THREE.Mesh(undefined, this.mat); this.mesh.name = 'palm-die'; this.mesh.castShadow = false;
    this.edges = new THREE.LineSegments(undefined, this.crack); this.mesh.add(this.edges);
    this.mesh.raycast = () => {}; this.edges.raycast = () => {};
    this.fingerDice = []; this.hand = null;
    this.said = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 0 })); // (the rolled number said in Arabic beside the die: Espada's rule, South 2026-10-29)
    this.said.center.set(-0.35, 0.5); this.said.renderOrder = 60; this.said.visible = false; this.said.raycast = () => {}; this.mesh.add(this.said);
    game.events?.on?.('palm.condense', (e) => { this.glint = Math.min(1, this.glint + 0.35 + 0.1 * (e?.n || 1)); });
    game.events?.on?.('palm.roll', (e) => { const R = Math.random; this.roll = { t: 0, face: e?.face ?? 1, held: e?.held ?? 0, axis: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), q: new THREE.Quaternion() }; if (e?.held === 1 || e?.held === 2) this.glint = 1; }); // (the island's answer rolled against: a tumble, then still on its face; a glint when it held)
    game.events?.on?.('palm.grow', (e) => { this.next = e?.to || this.sides; this.cut = 0; });
  }

  geo(sides) {
    if (!this.geos[sides]) { const n = S.size[sides] ? sides : 20, g = solidGeo(n, S.size[n]); this.geos[sides] = { g, e: new THREE.EdgesGeometry(g) }; }
    return this.geos[sides];
  }
  shape(sides) { const G = this.geo(sides); this.mesh.geometry = G.g; this.edges.geometry = G.e; this.sides = sides; }
  /** The mineral of the stones you wear. */
  dress() {
    const id = this.game.vessel?.look?.stones, G = GLAZES[id] || GLAZES.maker;
    if (id !== this.worn) { this.worn = id; dressStone(this.finU ||= dressFinish(this.mat, 'gem'), this.mat, id, { radius: S.size[20], ink: true }); } // (the gem and its mineral, the numerals kept: vfx/stoneminerals.js)
    this.mat.emissive.setHex(G?.color2 ?? 0xffffff);
    this.crack.color.setHex(this.cut < 1 ? (G?.color2 ?? 0xffffff) : DIE_INK[this.sides] ?? (G?.color2 ?? 0xffffff)); // (its ink at rest, the mineral's fire through a re-cut)
  }

  /** The rolled number in Arabic, in the System's type on a gold keyline, drawn into the readout's sprite. */
  sayNumber(n) {
    if (typeof document === 'undefined') return;
    const c = (this.saidCanvas ||= document.createElement('canvas')); c.width = c.height = 128; const x = c.getContext('2d');
    x.clearRect(0, 0, 128, 128); x.font = `bold 84px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 14; x.strokeStyle = '#17111f'; x.strokeText(String(n), 64, 70); x.fillStyle = '#ffd36a'; x.fillText(String(n), 64, 70);
    const M = this.said.material; if (!M.map) { M.map = new THREE.CanvasTexture(c); M.map.colorSpace = THREE.SRGBColorSpace; M.needsUpdate = true; } else M.map.needsUpdate = true;
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
      const g = solidGeo(sides, F.size), m = new THREE.Mesh(g, this.mat); m.name = `finger-die-d${sides}`; m.raycast = () => {};
      if (DIE_INK[sides]) { const e = (m.userData.ink = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: DIE_INK[sides], transparent: true, opacity: 0.85, toneMapped: false }))); e.raycast = () => {}; m.add(e); } // (its suit's ink on its edges)
      b1.add(m); m.position.copy(b1.worldToLocal(p)); m.userData.sides = sides; m.scale.setScalar(1 / Math.max(1e-6, b1.getWorldScale(new THREE.Vector3()).x) * B.handR.getWorldScale(new THREE.Vector3()).x);
      this.fingerDice.push(m);
    }
  }

  /** For the boot's warm-up: dressed in the stones you wear and shown 50 m down, so its finish program is compiled with the rest (it was
   *  first dressed on the first frame the hand showed, in the Spirit Garden: a compile in play, perf 2026-10-25). */
  prewarm() {
    this.dress(); if (!this.sides) this.shape(20);
    const at = this.mesh.parent, was = this.mesh.visible, scene = this.game.scene;
    if (!at && scene) { scene.add(this.mesh); this.mesh.position.set(0, -50, 0); this.mesh.userData.zoneFree = true; }
    this.mesh.visible = true;
    return () => { if (!at) this.mesh.removeFromParent(); this.mesh.visible = was; };
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
    const RL = this.roll, Rs = S.roll;
    this.mesh.rotation.set(0.4 + Math.sin(this.t * 0.7) * 0.2, this.t * S.spin, 0.2); // (at rest: turning in its socket)
    if (RL) { // (a roll: a tumble decaying onto the face turned to the camera, held still a beat, then eased back to turning)
      RL.t += dt; const cam = this.game.camera;
      if (cam) {
        const face = Math.min(Math.max(1, RL.face | 0), this.sides), at = this.mesh.getWorldPosition(_vd);
        facingCamera(this.sides, face, bone, at, cam, RL.q);
        const k = Math.min(1, RL.t / Rs.tumble), w = Math.PI * 2 * Rs.turns * (1 - k) ** 2.2, back = Math.min(1, Math.max(0, (RL.t - Rs.tumble - Rs.hold) / Rs.ease));
        _qb.copy(RL.q).multiply(_qa.setFromAxisAngle(RL.axis, w));
        this.mesh.quaternion.slerp(_qb, 1 - back * back * (3 - 2 * back)); // (the turning's pose as the base: it eases back in at the end)
      }
      const shown = Math.min(1, Math.max(0, (RL.t - Rs.tumble) / 0.12)) * (1 - Math.min(1, Math.max(0, (RL.t - Rs.tumble - Rs.hold) / Rs.ease)));
      if (shown > 0 && RL.said !== RL.face) { RL.said = RL.face; this.sayNumber(RL.face); }
      this.said.visible = shown > 0; this.said.material.opacity = shown; this.said.scale.setScalar(S.size[20] * 1.8 / Math.max(0.01, this.mesh.scale.x));
      if (RL.t > Rs.tumble + Rs.hold + Rs.ease) { this.roll = null; this.said.visible = false; }
    }
    this.mat.emissiveIntensity = 0.25 + 1.2 * this.glint + 2.5 * swell;
    this.crack.opacity = Math.min(1, (DIE_INK[this.sides] ? 0.6 : 0) + crack * 1.4 + 0.15 * this.glint);
  }
}
