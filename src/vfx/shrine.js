// ---------------------------------------------------------------------------------------
// A SHRINE (placeholder look; the owner, 2026-10-06; docs/plans/SHRINES.md: where you rest, where you are made whole, a fast-travel
// point, and the door into the Spirit Garden). The idea it is built on: the Courier is the Pneuka Jar in humanoid form, and the Spirit
// Garden is inside the jar, so a Shrine is a CRADLE FOR THE JAR. A stone plinth with a hollow shaped to take a jar's foot, under a clay
// arch of a kiln's mouth (where the Courier was made). Its names are Espada's to give.
//
//   UNFOUND      the arch's clay dull, the keystone's lamp cold: a ruin you might walk past
//   FOUND        the lamp in the keystone lit with Lachryma, a slow breath of light down into the cradle
//   RESTING      the cradle glows up through its glaze ring and the lamp burns bright (the Courier kneels at it: the kneel clip)
//   THE DOOR     the arch's opening fills with the Spirit Garden: a moss-green and gold light that swirls slowly, leaves and motes
//                drifting out through it; closed, the arch is just an arch
//
// Prior art: Dark Souls' bonfires (lit once found, rested at, travelled between), Hollow Knight's benches, Okami's origin mirrors (a
// door in a frame), the torii (a frame you pass through into the sacred), and the kiln mouth itself (the arch a kiln is fired through).
//
//   const S = new ShrineModel({ ground })   S.group (stands on its origin)   S.set({ found, resting, open })   S.update(rawDt)
//   S.doorWorld(out)  (the middle of the arch's opening: where the Courier steps through)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeStatic } from '../render/merge.js';
import { triplanar, surfaceTexture } from '../render/triplanar.js';

const W = 1.5, H = 2.3, T = 0.38; // (the arch: its opening's width and height, its thickness; metres)

const DOOR_V = /* glsl */`varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DOOR_F = /* glsl */`uniform float uOpen, uT; varying vec2 vU;
float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
void main() {
  vec2 p = vU - vec2(0.5, 0.42); float r = length(p * vec2(1.0, 0.75)), a = atan(p.y, p.x);
  float sw = n(vec2(a * 2.0 + uT * 0.15 - r * 4.0, r * 6.0 - uT * 0.3)) * 0.6 + n(vU * 9.0 + uT * 0.1) * 0.4;  // (the garden's light, swirling)
  vec3 moss = vec3(0.16, 0.42, 0.28), gold = vec3(1.0, 0.82, 0.42), teal = vec3(0.1, 0.32, 0.36);
  vec3 c = mix(teal, moss, sw); c = mix(c, gold, smoothstep(0.55, 0.0, r) * 0.7);                             // (gold at its heart)
  float leaf = step(0.985, h(floor(vU * vec2(24.0, 32.0) + vec2(0.0, -uT * 1.5))));                         // (leaves drifting out)
  c += vec3(0.9, 1.0, 0.6) * leaf * 0.6;
  float edge = smoothstep(0.0, 0.06, min(min(vU.x, 1.0 - vU.x), vU.y));                                     // (soft at the arch's sides)
  gl_FragColor = vec4(c * (0.3 + 0.25 * uOpen), uOpen * edge * (0.8 + 0.2 * sw)); // (the scene is linear: kept low, it reads as the garden's own green)
}`;

export class ShrineModel {
  constructor({ ground = 'stone_flags' } = {}) {
    const g = (this.group = new THREE.Group()); g.name = 'shrine';
    const stone = new THREE.MeshStandardMaterial({ name: 'shrine-stone', color: 0x8a7f74, roughness: 0.9 });
    const clay = (this.clay = new THREE.MeshStandardMaterial({ name: 'shrine-clay', color: 0x9a5236, roughness: 0.75 }));
    const tp = (m, side) => triplanar(m, { side: surfaceTexture(side), scale: 0.6, strength: 0.6, foot: { tex: surfaceTexture(ground), height: 0.22 } }); // (its foot's skirt into the ground it stands on)
    tp(stone, 'stone_flags'); tp(clay, 'clay_floor');
    const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
    // the plinth, two steps
    box(W + 1.1, 0.16, 1.5, 0, 0.08, 0, stone); box(W + 0.5, 0.18, 1.1, 0, 0.25, 0, stone);
    // the arch: two jambs and a round head of the kiln's clay, its keystone proud
    box(T, H, T * 1.4, -(W / 2 + T / 2), 0.34 + H / 2, -0.25, clay); box(T, H, T * 1.4, W / 2 + T / 2, 0.34 + H / 2, -0.25, clay);
    const head = new THREE.Mesh(new THREE.TorusGeometry(W / 2 + T / 2, T / 2, 6, 14, Math.PI), clay); head.scale.z = 1.4; head.position.set(0, 0.34 + H, -0.25); g.add(head);
    box(0.3, 0.36, T * 1.6, 0, 0.34 + H + W / 2 + T / 2, -0.25, clay); // (the keystone)
    for (const sx of [-1, 1]) { box(T + 0.14, 0.14, T * 1.7, sx * (W / 2 + T / 2), 0.34 + H - 0.07, -0.25, stone); box(T + 0.16, 0.2, T * 1.8, sx * (W / 2 + T / 2), 0.44, -0.25, stone); } // (the imposts the arch springs from, and the jambs' feet)
    // the cradle: a hollow for a jar's foot, a ring of glaze round it
    this.ringMat = new THREE.MeshStandardMaterial({ name: 'shrine-glaze', color: 0x2f5a62, roughness: 0.25, emissive: 0x6ad2c0, emissiveIntensity: 0 });
    const hollow = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.04, 20), new THREE.MeshStandardMaterial({ name: 'shrine-hollow', color: 0x2a2018, roughness: 1 }));
    hollow.position.set(0, 0.33, 0.2); g.add(hollow);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 6, 24), this.ringMat); ring.name = 'shrine-ring'; ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.345, 0.2); g.add(ring);
    // the lamp in the keystone: Lachryma behind a small round window
    this.lampMat = new THREE.MeshBasicMaterial({ name: 'shrine-lamp', color: 0x221a2a });
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), this.lampMat); lamp.name = 'shrine-lamp'; lamp.position.set(0, 0.34 + H + W / 2 + T / 2, -0.25 + T * 0.8 + 0.003); g.add(lamp);
    mergeStatic(g);
    // the door: the arch's opening, the Spirit Garden showing through it
    this.du = { uOpen: { value: 0 }, uT: { value: 0 } };
    const dg = new THREE.PlaneGeometry(W, H + W / 2, 1, 1);
    this.door = new THREE.Mesh(dg, new THREE.ShaderMaterial({ name: 'shrine-door', uniforms: this.du, vertexShader: DOOR_V, fragmentShader: DOOR_F, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    this.door.position.set(0, 0.34 + (H + W / 2) / 2, -0.25); this.door.visible = false; this.door.name = 'shrine-door'; g.add(this.door);
    this.state = { found: false, resting: false, open: false }; this.k = { lamp: 0, rest: 0, open: 0 }; this.t = 0;
  }

  set(s) { Object.assign(this.state, s); }

  update(raw = 1 / 60) {
    this.t += raw; this.du.uT.value = this.t;
    const ease = (k, to, r) => k + (to - k) * (1 - Math.exp(-raw * r));
    this.k.lamp = ease(this.k.lamp, this.state.found ? 1 : 0, 1.5); this.k.rest = ease(this.k.rest, this.state.resting ? 1 : 0, 2); this.k.open = ease(this.k.open, this.state.open ? 1 : 0, 2.5);
    const breath = 0.75 + 0.25 * Math.sin(this.t * 1.3); // (a slow breath: a rest, not a beacon)
    this.lampMat.color.setRGB(0.13, 0.1, 0.16).lerp(_c.setRGB(0.55, 0.85, 1.0), this.k.lamp * breath * (0.7 + 0.3 * this.k.rest));
    this.ringMat.emissiveIntensity = (0.15 * this.k.lamp + 0.9 * this.k.rest) * breath;
    this.du.uOpen.value = this.k.open; this.door.visible = this.k.open > 0.01;
  }

  doorWorld(out = new THREE.Vector3()) { return this.door.getWorldPosition(out); }
}
const _c = new THREE.Color();
