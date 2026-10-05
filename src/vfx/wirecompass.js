// ---------------------------------------------------------------------------------------
// THE WIRE COMPASS: which way they face and where the waypoint is, as a tape of ticks drawn in the Mind's lines across the top of
// the view, and a wire diamond standing over the waypoint in the world. No letters, no degrees, no metres (docs/LOOK.md 6): north is
// the tall tick with a diamond on it, east, south and west the middling ones; the waypoint is a diamond on the tape at its bearing and
// another over the place itself, drawn through walls, a fixed size on the screen. The map is still the map (M); the room they are in
// is said by the log as they enter it (place.enter -> tracking.js).
//
// The tape is a ring of ticks round the eye at the world's bearings, raised to sit near the top of the view whatever the pitch: a
// visor's compass in perspective (it curves away at the ends and fades there), not a flat strip.
//
// Prior art: Metroid Prime's visor (the HUD belongs to a device and is drawn in perspective), the compass tape of Skyrim and of the
// flight sims (a strip of bearings with the target marked on it), and Rez's wireframe.
//
//   const c = new WireCompass(game)     c.update(dt)     c.visible
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';
import { pxToWorld } from './wiremarks.js';

const R = 10;            // the tape's radius round the eye, metres (it is drawn through everything: only its angle matters)
const RAISE = 0.40;      // how far up the view it sits, as a share of the half field of view

const V = /* glsl */`
attribute float aSize;
varying vec3 vW; varying float vSize;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vSize = aSize;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const F = /* glsl */`
uniform vec3 uFwd; uniform float uAlpha;
varying vec3 vW; varying float vSize;
${LAB_GLSL}
void main() {
  vec3 d = vW - cameraPosition;
  float c = dot(normalize(d.xz), normalize(uFwd.xz));
  float fade = smoothstep(0.55, 0.85, c);          // (the tape shows about a hundred degrees, fading at its ends)
  gl_FragColor = vec4(labSoft(labPhase(vW, normalize(-d))) * (0.8 + 0.4 * vSize), uAlpha * fade * (0.45 + 0.55 * vSize));
}`;

export class WireCompass {
  constructor(game) {
    this.game = game;
    const pts = [], size = [];
    const add = (a, b, s) => { pts.push(a, b); size.push(s, s); };
    for (let deg = 0; deg < 360; deg += 15) {
      // bearing 0 is north, -Z; clockwise (cartography.js): direction (sin b, 0, -cos b)
      const b = (deg * Math.PI) / 180, x = Math.sin(b), z = -Math.cos(b);
      const cardinal = deg % 90 === 0, north = deg === 0;
      const h = north ? 0.6 : cardinal ? 0.42 : deg % 45 === 0 ? 0.26 : 0.16;
      add(new THREE.Vector3(x * R, -h, z * R), new THREE.Vector3(x * R, h, z * R), north ? 1 : cardinal ? 0.7 : 0.3);
      if (north) { // a diamond on north's tick
        const s = 0.2, y = h + 0.28, tx = Math.cos(b), tz = Math.sin(b); // (along the tape)
        const P = (u, v) => new THREE.Vector3(x * R + tx * u, y + v, z * R + tz * u);
        add(P(0, s), P(s, 0), 1); add(P(s, 0), P(0, -s), 1); add(P(0, -s), P(-s, 0), 1); add(P(-s, 0), P(0, s), 1);
      }
    }
    // and the line the ticks stand on, faint
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2, b = ((i + 1) / 96) * Math.PI * 2;
      add(new THREE.Vector3(Math.sin(a) * R, 0, -Math.cos(a) * R), new THREE.Vector3(Math.sin(b) * R, 0, -Math.cos(b) * R), 0.05);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    this.u = { uFwd: { value: new THREE.Vector3(0, 0, -1) }, uAlpha: { value: 0 }, uMindT: mindTime };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: V, fragmentShader: F, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.tape = new THREE.LineSegments(geo, mat);
    this.tape.renderOrder = 35; this.tape.frustumCulled = false;
    // the waypoint's diamond on the tape, and the one over the place
    const dia = new THREE.BufferGeometry().setFromPoints([[0, 1], [1, 0], [1, 0], [0, -1], [0, -1], [-1, 0], [-1, 0], [0, 1], [0, 0.45], [0.45, 0], [0.45, 0], [0, -0.45], [0, -0.45], [-0.45, 0], [-0.45, 0], [0, 0.45]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
    dia.setAttribute('aSize', new THREE.Float32BufferAttribute(new Array(16).fill(1), 1));
    this.wpTape = new THREE.LineSegments(dia, mat);
    this.wpTape.renderOrder = 35; this.wpTape.frustumCulled = false;
    this.wpMat = mat.clone(); this.wpMat.uniforms = { uFwd: this.u.uFwd, uAlpha: { value: 0 }, uMindT: mindTime };
    this.wpWorld = new THREE.LineSegments(dia, this.wpMat);
    this.wpWorld.renderOrder = 35; this.wpWorld.frustumCulled = false;
    game.scene.add(this.tape, this.wpTape, this.wpWorld);
    this.visible = true; this.alpha = 0; this.wpA = 0;
    this.placeT = 0; this.place = null;
  }

  update(dt) {
    const g = this.game, cam = g.camera, P = g.player, C = g.cartography;
    mindTick();
    const show = this.visible && !g.god?.controlling && !document.body.classList.contains('cine');
    this.alpha += ((show ? 0.85 : 0) - this.alpha) * (1 - Math.exp(-dt * 5));
    const on = this.alpha > 0.01;
    this.tape.visible = this.wpTape.visible = this.wpWorld.visible = on;
    // the room they are in, said once as they enter it (four times a second is often enough to ask)
    this.placeT -= dt;
    if (C && this.placeT <= 0) {
      this.placeT = 0.25;
      const l = C.layerOf(P.pos.y), room = C.roomAt(P.pos.x, P.pos.y, P.pos.z, 40);
      const name = room?.name || l?.name || null;
      if (name && name !== this.place) { this.place = name; if (!g.circuits?.active) g.events?.emit('place.enter', { room: name, layer: l?.name }); }
    }
    if (!on) return;
    this.u.uAlpha.value = this.alpha;
    // the tape round the eye, raised to the top of the view
    cam.getWorldDirection(this.u.uFwd.value);
    const pitch = Math.asin(THREE.MathUtils.clamp(this.u.uFwd.value.y, -1, 1));
    const up = pitch + ((cam.fov * Math.PI) / 360) * RAISE * 2;
    this.tape.position.copy(cam.position).setY(cam.position.y + Math.tan(THREE.MathUtils.clamp(up, -1.3, 1.3)) * R);
    // the waypoint, if it is on their layer
    const wp = C?.waypoint, same = wp && C.layerOf(P.pos.y)?.id === wp.layer;
    this.wpA += ((same ? 1 : 0) - this.wpA) * (1 - Math.exp(-dt * 5));
    this.wpTape.visible = this.wpWorld.visible = this.wpA > 0.01;
    if (!this.wpTape.visible) return;
    const p = same ? (this._wp ||= new THREE.Vector3()).set(wp.x, P.pos.y + 2.2, wp.z) : this._wp;
    const dx = p.x - cam.position.x, dz = p.z - cam.position.z, dl = Math.hypot(dx, dz) || 1;
    this.wpTape.position.set(cam.position.x + (dx / dl) * R, this.tape.position.y + 0.62, cam.position.z + (dz / dl) * R);
    this.wpTape.quaternion.copy(cam.quaternion);
    this.wpTape.scale.setScalar(0.2);
    this.wpWorld.position.copy(p);
    this.wpWorld.quaternion.copy(cam.quaternion);
    this.wpWorld.scale.setScalar(pxToWorld(cam, p, 11));
    this.wpMat.uniforms.uAlpha.value = this.wpA * this.alpha;
  }
}
