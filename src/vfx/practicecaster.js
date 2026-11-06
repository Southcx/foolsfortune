// ---------------------------------------------------------------------------------------
// THE PRACTICE CASTER: the Figment telegraph floor's training creature dressed (docs/plans/COMBAT-LAB.md section 3; the casting is
// Petra's, world/throwingroom/telegraphfloor.js, its marks the house's, vfx/figmenttelegraph.js). Looks only: it reads the floor's cast
// (`cast.t` of `pick.eta`, its shape's damage type) and the floor's `telegraph.cast`, and draws the body that is winding up.
//
//   THE BODY      a clay haniwa grown out of the stand-in's urn, on the floor's turntable: the urn's own silhouette in a cream slip
//                 glaze with two oxblood bands (the wing's colours), crazed all over, a haniwa's face cut into its shoulder (two hollow
//                 eyes, an open mouth) and two stubby clay arms, one up and one down as the dancing haniwa holds them. It reads as a
//                 practice thing, never a Figment: no feeling's colour, the training yard's clay.
//   THE WINDUP    the tell is on the body, so the mark over the floor reads as its: the light builds in its crazing and its hollows
//                 over the windup (the square of the windup's share, so the last third is the loud one), in the cast's damage type's
//                 light colour (the telegraph's own: TYPE_TINTS), both arms rising overhead, the body drawing up and trembling as it
//                 nears, embers rising out of the cracks at the end. Answered or landed (`telegraph.cast`): the arms come down, the body
//                 stamps (a squash, dust off the turntable) and the light drains out of it.
//
// Prior art: the dancing haniwa of the Kofun period (the raised and lowered arms, the hollow eyes and mouth), a kiln's crazing lit
// from inside (the glaze's crackle as a lamp), Dark Souls' and Monster Hunter's windups read off the body (the arm drawn up, a glow
// before the blow), FFXIV's striking dummies (a thing that only throws shapes), the stand-in urn (vfx/combatwingkit.js) it grew from.
//
//   const C = new PracticeCaster(game)   C.update(rawDt)   C.dispose()   C.group   (set down by ThrowingRoomDress, vfx/throwingroomkit.js)
//   CASTER_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TR } from '../world/throwingroom/layout.js';
import { CASTS } from '../world/throwingroom/telegraphfloor.js';
import { TYPE_TINTS } from './figmenttelegraph/figmenttelegraphshader.js';
import { addOutline } from '../render/outline.js';

/** The glow at the windup's end (emissive), the ember colour of a cast with no type, the arms' angles (rad out from hanging down: at rest the right and the left, raised), the stamp's
 *  squash and how long it takes (real s), the tremble's size (m). */
export const CASTER_LOOK = { glow: 2.2, untyped: 0xffb45a, rest: [2.2, 0.35], raised: 2.7, squash: 0.12, stamp: 0.45, tremble: 0.012 };
const C = { slip: 0xd9c7a2, oxblood: 0x7a2a1e, hollow: 0x140c08, clay: 0xb4643c };
const URN = [[0.001, 0], [0.22, 0], [0.3, 0.1], [0.42, 0.55], [0.44, 0.9], [0.34, 1.25], [0.2, 1.42], [0.21, 1.55], [0.27, 1.62], [0.25, 1.65]];
const TOP = 0.22; // (the turntable's top: vfx/combatwingkit.js telegraphCaster)

/** The glaze and its crazing, painted once: a cream slip, two oxblood bands, the crackle dark on the map and white on the glow's map. */
function glazeMaps() {
  const W = 512, H = 256, a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = W; a.height = b.height = H;
  const g = a.getContext('2d'), e = b.getContext('2d');
  g.fillStyle = '#d9c7a2'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${150 + (i % 40)},${120 + (i % 30)},90,0.06)`; g.fillRect((i * 97) % W, (i * 57) % H, 9, 5); }
  for (const v of [0.42, 0.66]) { g.fillStyle = '#7a2a1e'; g.fillRect(0, H * (1 - v) - 5, W, 10); }
  let s = 12345; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 70; k++) { // (the crackle: short wandering lines that branch)
    let x = r() * W, y = r() * H, ang = r() * Math.PI * 2;
    g.beginPath(); e.beginPath(); g.moveTo(x, y); e.moveTo(x, y);
    for (let j = 0; j < 9; j++) { ang += (r() - 0.5) * 1.4; x += Math.cos(ang) * 14; y += Math.sin(ang) * 14; g.lineTo(x, y); e.lineTo(x, y); }
    g.strokeStyle = 'rgba(70,45,25,0.55)'; g.lineWidth = 1.2; g.stroke(); e.strokeStyle = '#fff'; e.lineWidth = 2.2; e.stroke();
  }
  const t = (c) => { const x = new THREE.CanvasTexture(c); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 4; x.wrapS = THREE.RepeatWrapping; return x; };
  return { map: t(a), glow: t(b) };
}

export class PracticeCaster {
  constructor(game) {
    this.game = game; this.k = 0; this.stamp = 9; this.t = 0; this.col = new THREE.Color(CASTER_LOOK.untyped);
    const maps = this.maps = glazeMaps();
    this.body = new THREE.MeshStandardMaterial({ name: 'practice-caster', map: maps.map, emissiveMap: maps.glow, emissive: CASTER_LOOK.untyped, emissiveIntensity: 0, roughness: 0.45 });
    this.clay = new THREE.MeshStandardMaterial({ name: 'practice-caster-arm', color: C.slip, roughness: 0.6, emissive: CASTER_LOOK.untyped, emissiveIntensity: 0 });
    this.hollow = new THREE.MeshBasicMaterial({ name: 'practice-caster-hollow', color: C.hollow });
    const F = TR.wing.telegraphFloor, G = new THREE.Group(); G.name = 'practice-caster'; G.position.set(F.caster[0], 0, F.caster[1]);
    const TF = game.throwingRoom?.telegraphFloor; G.rotation.y = TF?.caster?.yaw ?? 0;
    const rig = this.rig = new THREE.Group(); rig.position.y = TOP; G.add(rig);
    const urn = new THREE.Mesh(new THREE.LatheGeometry(URN.map(([x, y]) => new THREE.Vector2(x, y)), 24, Math.PI), this.body); urn.castShadow = true; rig.add(urn); addOutline(urn);
    // the face: hollows cut into the shoulder, tilted to its slope
    for (const [x, y, sx, sy, r] of [[-0.12, 1.22, 0.05, 0.035, 0.354], [0.12, 1.22, 0.05, 0.035, 0.354], [0, 1.0, 0.055, 0.075, 0.431]]) {
      const h = new THREE.Mesh(new THREE.CircleGeometry(1, 14), this.hollow); h.scale.set(sx, sy, 1);
      const z = Math.sqrt(Math.max(0, r * r - x * x)); h.position.set(x, y, z + 0.004); h.rotation.set(-0.28, Math.atan2(x, z), 0); rig.add(h);
    }
    // the arms: stubby clay, from the belly's sides
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.42, 0.95, 0); rig.add(pivot);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.32, 4, 8).translate(0, -0.23, 0), this.clay); arm.castShadow = true; pivot.add(arm); addOutline(arm);
      return { pivot, side, a: 0 };
    });
    game.scene.add(G); this.group = G;
    this.off = game.events?.on('telegraph.cast', () => { this.stamp = 0; });
  }

  update(raw = 1 / 60) {
    const L = CASTER_LOOK, dt = Math.min(raw, 0.05), TF = this.game.throwingRoom?.telegraphFloor; this.t += dt; this.stamp += dt;
    const K = TF?.cast, want = K ? THREE.MathUtils.clamp(1 - K.t / Math.max(0.1, TF.pick.eta), 0, 1) : 0;
    if (K) { const ty = CASTS[K.shape]?.type; this.col.setHex(ty ? TYPE_TINTS[ty][1] : L.untyped); }
    this.k = want > this.k ? want : Math.max(want, this.k - dt * 3); // (the light drains out quick once the cast is answered or landed)
    const k = this.k, glow = k * k * L.glow;
    this.body.emissive.copy(this.col); this.body.emissiveIntensity = glow * (0.9 + 0.1 * Math.sin(this.t * 40) * k);
    this.clay.emissive.copy(this.col); this.clay.emissiveIntensity = glow * 0.25;
    this.hollow.color.setHex(C.hollow).lerp(this.col, Math.min(1, k * 1.3));
    // the body: drawn up and trembling as the windup runs, a stamp when it ends
    const st = this.stamp < L.stamp ? Math.sin((this.stamp / L.stamp) * Math.PI) : 0;
    const tr = k > 0.6 ? (k - 0.6) * L.tremble / 0.4 : 0;
    this.rig.scale.set(1 + st * L.squash, 1 + k * 0.05 - st * L.squash, 1 + st * L.squash);
    this.rig.position.set(Math.sin(this.t * 53) * tr, TOP, Math.cos(this.t * 47) * tr);
    this.rig.rotation.z = K ? 0 : Math.sin(this.t * 1.1) * 0.02; // (at rest, a slow sway)
    for (const A of this.arms) {
      const rest = A.side > 0 ? L.rest[0] : L.rest[1], to = st > 0 ? 0.3 : THREE.MathUtils.lerp(rest, L.raised, Math.min(1, k * 1.6));
      A.a += (to - A.a) * Math.min(1, dt * (st > 0 ? 18 : 6));
      A.pivot.rotation.z = A.side * (A.a + Math.sin(this.t * 2 + A.side) * 0.04); // (a hanging arm swung out and up its side)
    }
    // embers out of the crazing at the windup's end, dust off the turntable at the stamp (the house's pools: game.fx)
    const fx = this.game.fx, G = this.group;
    if (fx && k > 0.7 && Math.random() < dt * 30 * k) {
      const a = Math.random() * Math.PI * 2, y = TOP + 0.4 + Math.random() * 0.9;
      fx.add.emit({ pos: new THREE.Vector3(G.position.x + Math.cos(a) * 0.4, y, G.position.z + Math.sin(a) * 0.4), vel: new THREE.Vector3(0, 0.6 + Math.random() * 0.5, 0), life: 0.6, size: 0.05, sizeEnd: 0.01, color: this.col.clone(), alpha: 0.9, drag: 1.5 });
    }
    if (fx && this.stamp < dt + 1e-6) fx.impact?.(new THREE.Vector3(G.position.x, TOP + 0.02, G.position.z + 0.5), new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 14 });
  }

  dispose() { this.off?.(); this.group.parent?.remove(this.group); this.group.traverse((o) => { if (!o.userData.isOutline) o.geometry?.dispose?.(); }); for (const m of [this.body, this.clay, this.hollow]) m.dispose(); this.maps.map.dispose(); this.maps.glow.dispose(); }
}
