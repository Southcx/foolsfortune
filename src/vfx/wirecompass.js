// ---------------------------------------------------------------------------------------
// THE WIRE COMPASS: which way they face and where the waypoint is, as a tape of ticks drawn in the Mind's lines across the top of
// the view, and a wire diamond standing over the waypoint in the world. No letters, no degrees, no metres (docs/ART.md precept 6): north is
// the tall tick, east, south and west the middling ones, each with its glyph under it (the sun's road: CARDINAL); the waypoint is a diamond on the tape at its bearing and
// another over the place itself, drawn through walls, a fixed size on the screen. The map is still the map (M); the room they are in
// is said by the log as they enter it (place.enter -> tracking.js).
//
// The tape is a ring of ticks round the eye at the world's bearings, raised to sit near the top of the view whatever the pitch: a
// visor's compass in perspective (it curves away at the ends and fades there), not a flat strip.
//
// Prior art: Metroid Prime's visor (the HUD belongs to a device and is drawn in perspective), the compass tape of Skyrim and of the
// flight sims (a strip of bearings with the target marked on it), and Rez's wireframe.
//
// While the Crucibelle is in the hands its pendulum hangs from the tape's centre (vfx/crucibellehud.js), and the tape's lower half opens
// a gap there for it (`hole`), so a quarter's glyph never stands inside the swing.
//
// READ ON ANY SKY (the owner, R11: "almost invisible against a clear, bright sky"; casebook rule 105: a mark the player must read carries
// a light part and a dark part). Every line of the compass and of the marks hung on it (the vane's, the pendulum's) is drawn with a
// KEYLINE under it, the same lines a pixel out to each side in the opposite tone, and the whole device takes its INK from what it is
// drawn against: on a dark sky the lines are pale light added to it with a dark keyline; on a bright one they turn to dark ink laid
// over it, the stone's near-black with its colour in it, with a pale keyline. What is behind is read from the sky's own state (the
// dome's paintings and grade in memory, vfx/sky.js `toneAt`, under the cloud layer, vfx/clouds.js `over`; under a roof the room's
// background), a few times a second where the tape crosses it, never from the GPU; it turns with a little hysteresis, so a passing
// cloud never flickers it. One blend does both (premultiplied: the colour added, the alpha how much of the ground it covers), so a
// line goes from light to ink by its numbers alone, in one shader program shared by every mark of the device. The setting
// `visual.compassContrast` still makes the lines fainter or stronger and grows the keyline with them.
// Prior art: the keyline of comics and of signage (black-and-white type that reads on any ground); the HUDs that invert on what they
// cross (Mirror's Edge's and Halo's reticles, the "difference" blend of the cockpit symbology that keeps a HUD legible against sky and
// sea); the print's halftone: ink where the ground is light.
//
//   const c = new WireCompass(game)     c.update(dt)     c.visible     c.hole(k, below, above)   (after update, each frame it is wanted)
//   c.ink (0 pale light .. 1 dark ink, eased)   c.skyL (how light what is behind it looks, 0..1)
//   compassMaterial({ key, fade, vert, flat, alpha, hole })   compassLines(geo)   keyUnder(lineMesh, opts)   COMPASS_U   keyStrength(con)
//     the device's one material and its keyline, for the marks hung on it (vfx/vanehud.js, vfx/crucibellehud.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';
import { pxToWorld } from './wiremarks.js';
import { T } from '../core/config.js';

const R = 10;            // the tape's radius round the eye, metres (it is drawn through everything: only its angle matters)
const RAISE = 0.40;      // how far up the view it sits, as a share of the half field of view

const V = /* glsl */`
attribute float aSize; attribute vec2 aOff; attribute vec4 aCol;
uniform vec2 uPx;
varying vec3 vW; varying float vSize; varying vec4 vCol;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vSize = aSize; vCol = aCol;
  gl_Position = projectionMatrix * viewMatrix * w;
  gl_Position.xy += aOff * uPx * gl_Position.w; // (a keyline's copy: a pixel out on the screen, whatever the distance)
}`;
// (uHole: strength, the cosines of its half-angles below the line and above it, the tape's height. uFlat: a colour of its own instead of
// the stone's, and how much. uVert: the colour and weight are the vertices' own, the pendulum's pen. uFade: the tape's bearing fade and gap)
const F = /* glsl */`
uniform vec3 uFwd; uniform float uAlpha, uInk, uKey, uVert, uFade; uniform vec4 uHole, uFlat;
varying vec3 vW; varying float vSize; varying vec4 vCol;
${LAB_GLSL}
void main() {
  vec3 d = vW - cameraPosition;
  float c = dot(normalize(d.xz), normalize(uFwd.xz));
  float fade = smoothstep(0.55, 0.85, c);          // (the tape shows about a hundred degrees, fading at its ends)
  float below = step(vW.y, uHole.w - 0.03), above = step(uHole.w + 0.03, vW.y);
  fade *= 1.0 - uHole.x * (below * smoothstep(uHole.y - 0.0015, uHole.y + 0.0015, c) + above * smoothstep(uHole.z - 0.00005, uHole.z + 0.00005, c)); // (the pendulum's gap, and its bell's)
  fade = mix(1.0, fade, uFade);
  float own = max(uVert, uFlat.a);
  vec3 hue = uVert > 0.5 ? vCol.rgb : mix(labSoft(labPhase(vW, normalize(-d))), uFlat.rgb, uFlat.a);
  float w = uAlpha * fade * mix(0.45 + 0.55 * vSize, 1.0, own) * (uVert > 0.5 ? vCol.a : 1.0);
  float wc = min(w * (1.0 + 0.5 * uInk * (1.0 - uKey)), 1.0);          // (ink a little heavier: a dark line one pixel wide reads thin)
  vec3 pale = hue * mix(0.8 + 0.4 * vSize, 1.0, own);                // (added light, on a dark ground)
  vec3 ink = LAB_INK + hue * 0.16;                                     // (laid over a bright one: the stone's near-black, its colour in it)
  vec3 halo = mix(vec3(0.92, 0.9, 1.0), hue, 0.2);                    // (a keyline's pale, under ink)
  vec3 col = uKey > 0.5 ? mix(LAB_INK, halo, uInk) : mix(pale, ink, uInk);
  float cover = uKey > 0.5 ? 1.0 : uInk;                               // (how much of the ground it covers: none as light, all as ink or keyline)
  gl_FragColor = vec4(col * mix(w, wc, cover), wc * cover);
}`;

/** The device's shared uniforms: the eye's heading, a pixel's size in clip space (the keylines), and the ink (0 the marks are pale light
 *  added to a dark ground .. 1 they are dark ink laid over a bright one: WireCompass sets it from what is behind the tape). */
export const COMPASS_U = { uFwd: { value: new THREE.Vector3(0, 0, -1) }, uPx: { value: new THREE.Vector2(2 / 854, 2 / 480) }, uInk: { value: 0 } };
/** The device's one material (one shader program for every mark on it): `key` a keyline, `fade` the tape's bearing fade and gap, `vert`
 *  the vertices' own colour and weight (aCol: rgb, weight), `flat` a colour of its own (`uniforms.uFlat`); `alpha` and `hole` may be
 *  uniforms shared with another mark. Premultiplied: the colour added, the alpha how much of the ground it covers. */
export function compassMaterial({ key = false, fade = false, vert = false, flat = false, alpha = null, hole = null } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMPASS_U, uMindT: mindTime, uAlpha: alpha || { value: 0 }, uHole: hole || { value: new THREE.Vector4(0, 1, 1, 0) },
      uKey: { value: key ? 1 : 0 }, uFade: { value: fade ? 1 : 0 }, uVert: { value: vert ? 1 : 0 }, uFlat: { value: new THREE.Vector4(1, 1, 1, flat ? 1 : 0) } },
    vertexShader: V, fragmentShader: F, transparent: true, depthTest: false, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}
/** A line geometry made ready for the device's material: a size per vertex (`size` where it has none) and no keyline offset. */
export function compassLines(geo, size = 1) {
  const n = geo.attributes.position.count;
  if (!geo.attributes.aSize) geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n).fill(size), 1));
  if (!geo.attributes.aOff) geo.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}
const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** A line geometry's keyline: its lines four times, each copy a pixel out to one side on the screen (one draw). */
export function keyLines(geo) {
  const P = geo.attributes.position.array, S = geo.attributes.aSize?.array, n = geo.attributes.position.count;
  const pos = new Float32Array(n * 12), size = new Float32Array(n * 4), off = new Float32Array(n * 8);
  OUT.forEach(([x, y], k) => { pos.set(P.subarray(0, n * 3), k * n * 3); for (let i = 0; i < n; i++) { size[k * n + i] = S ? S[i] : 1; off[(k * n + i) * 2] = x; off[(k * n + i) * 2 + 1] = y; } });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aOff', new THREE.BufferAttribute(off, 2));
  return g;
}
/** A keyline under a mesh of lines: its child (it goes where the lines go and shows when they do), drawn just before them. */
export function keyUnder(mesh, opts = {}) {
  const k = new THREE.LineSegments(keyLines(mesh.geometry), compassMaterial({ key: true, ...opts }));
  k.renderOrder = mesh.renderOrder - 1; k.frustumCulled = false; k.userData.zoneFree = true;
  mesh.add(k);
  return k;
}
/** How strong the keyline is at the setting `visual.compassContrast` (0.25 .. 3): none at the faintest, 0.6 at 1, 0.8 from 1.25. */
export const keyStrength = (con) => THREE.MathUtils.clamp(con - 0.25, 0, 1) * 0.8;

// where the tape reads what is behind it: bearings off straight ahead (radians), above the tape's line, and weights (the middle most,
// and one up where the vane's sigil sits); and when it turns to ink and back (the lightness of what is behind, as the screen shows it)
const SAMPLES = [[0, 0, 2], [0.3, 0, 1.5], [-0.3, 0, 1.5], [0.6, 0, 1], [-0.6, 0, 1], [0.85, 0, 0.5], [-0.85, 0, 0.5], [0, 0.1, 1.5]];
const INK = { on: 0.6, off: 0.5 };
const lum = (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
/** A linear light as the screen shows it: the game's tone curve (ACES, Narkowicz's fit) and the sRGB curve, 0..1. */
const shown = (y, expo = 1) => { const x = Math.max(0, y * expo), a = Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)); return a <= 0.0031308 ? a * 12.92 : 1.055 * Math.pow(a, 1 / 2.4) - 0.055; };
const _d = new THREE.Vector3(), _c = new THREE.Color(), _px = new THREE.Vector2();

// The four quarters as the sun's road, not letters (the owner, R45: "glyphs of some form denoting the cardinal directions"): NORTH the
// pole star (four points, the one that does not move); EAST the sun rising (half a disc on the horizon, its rays); SOUTH the sun at noon
// (the astronomer's sun, a ring with its point); WEST the moon of evening (a crescent). Line segments in a unit square, u along the
// tape, v up. Prior art: the compass rose's own marks (the fleur-de-lis at north and the cross at east on the portolan charts), the
// sun and moon glyphs of the almanac, and Okami's and Zelda's sun-and-moon dials.
const arc = (cx, cy, r, a0, a1, n = 12) => Array.from({ length: n }, (_, i) => {
  const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
  return [cx + Math.cos(t0) * r, cy + Math.sin(t0) * r, cx + Math.cos(t1) * r, cy + Math.sin(t1) * r];
});
const CARDINAL = [
  // north: the pole star, four long points and four short
  [[0, 1, 0.18, 0.18], [0.18, 0.18, 1, 0], [1, 0, 0.18, -0.18], [0.18, -0.18, 0, -1], [0, -1, -0.18, -0.18], [-0.18, -0.18, -1, 0], [-1, 0, -0.18, 0.18], [-0.18, 0.18, 0, 1],
    [0.42, 0.42, 0.12, 0.12], [-0.42, 0.42, -0.12, 0.12], [0.42, -0.42, 0.12, -0.12], [-0.42, -0.42, -0.12, -0.12]],
  // east: the sun rising on the horizon
  [[-1, -0.45, 1, -0.45], ...arc(0, -0.45, 0.55, 0, Math.PI, 8),
    ...[0.2, 0.5, 0.8].map((k) => { const a = k * Math.PI; return [Math.cos(a) * 0.75, -0.45 + Math.sin(a) * 0.75, Math.cos(a) * 1.0, -0.45 + Math.sin(a) * 1.0]; })],
  // south: the sun at noon, a ring and its point
  [...arc(0, 0, 0.8, 0, Math.PI * 2, 16), [-0.1, 0, 0.1, 0], [0, -0.1, 0, 0.1]],
  // west: the crescent of evening
  [...arc(0, 0, 0.85, Math.PI * 0.35, Math.PI * 1.65, 12), ...arc(0.38, 0, 0.62, Math.PI * 0.62, Math.PI * 1.38, 10)],
];

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
      if (cardinal) { // the quarter's glyph, under its tick (above is the Dreamvane's sigil's: vfx/vanehud.js)
        const s = 0.36, y = -h - 0.5, tx = Math.cos(b), tz = Math.sin(b); // (along the tape)
        const P = (u, v) => new THREE.Vector3(x * R + tx * u * s, y + v * s, z * R + tz * u * s);
        for (const [u0, v0, u1, v1] of CARDINAL[deg / 90]) add(P(u0, v0), P(u1, v1), north ? 1 : 0.8);
      }
    }
    // and the line the ticks stand on, faint
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2, b = ((i + 1) / 96) * Math.PI * 2;
      add(new THREE.Vector3(Math.sin(a) * R, 0, -Math.cos(a) * R), new THREE.Vector3(Math.sin(b) * R, 0, -Math.cos(b) * R), 0.05);
    }
    const geo = compassLines(new THREE.BufferGeometry().setFromPoints(pts));
    geo.attributes.aSize.array.set(size);
    const mat = compassMaterial({ fade: true });
    this.u = mat.uniforms;
    this.tape = new THREE.LineSegments(geo, mat);
    this.tape.renderOrder = 35; this.tape.frustumCulled = false;
    this.keyA = { value: 0 }; this.wpKeyA = { value: 0 };
    keyUnder(this.tape, { fade: true, alpha: this.keyA, hole: this.u.uHole }); // (its keyline, opening the same gap)
    // the waypoint's diamond on the tape, and the one over the place (the waypoint is never in the gap)
    const dia = compassLines(new THREE.BufferGeometry().setFromPoints([[0, 1], [1, 0], [1, 0], [0, -1], [0, -1], [-1, 0], [-1, 0], [0, 1], [0, 0.45], [0.45, 0], [0.45, 0], [0, -0.45], [0, -0.45], [-0.45, 0], [-0.45, 0], [0, 0.45]].map(([x, y]) => new THREE.Vector3(x, y, 0))));
    this.wpTape = new THREE.LineSegments(dia, compassMaterial({ fade: true, alpha: this.u.uAlpha }));
    this.wpTape.renderOrder = 35; this.wpTape.frustumCulled = false;
    keyUnder(this.wpTape, { fade: true, alpha: this.keyA });
    this.wpMat = compassMaterial({ fade: true });
    this.wpWorld = new THREE.LineSegments(dia, this.wpMat);
    this.wpWorld.renderOrder = 35; this.wpWorld.frustumCulled = false;
    keyUnder(this.wpWorld, { fade: true, alpha: this.wpKeyA });
    for (const o of [this.tape, this.wpTape, this.wpWorld]) o.userData.zoneFree = true; // (the HUD is never hidden by a render zone)
    game.scene.add(this.tape, this.wpTape, this.wpWorld);
    this.visible = true; this.alpha = 0; this.wpA = 0;
    this.placeT = 0; this.place = null;
    this.skyT = 0; this.skyL = 0; this.inked = false; this.ink = 0;
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
    if (C && this.placeT <= 0 && !g.realm?.active) { // (the Spirit Garden is no floor of the workshop: never charted, never announced)
      this.placeT = 0.25;
      const l = C.layerOf(P.pos.y), room = C.roomAt(P.pos.x, P.pos.y, P.pos.z, 40);
      const name = room?.name || l?.name || null;
      if (name && name !== this.place) { this.place = name; if (!g.circuits?.active) g.events?.emit('place.enter', { room: name, layer: l?.name }); }
    }
    if (!on) return;
    const con = THREE.MathUtils.clamp(T.visual.compassContrast ?? 1, 0.25, 3); // (the setting: the tape's contrast, vfx/crucibellehud.js reads it too)
    this.u.uAlpha.value = this.alpha * con;
    this.keyA.value = this.alpha * keyStrength(con);
    g.renderer?.getDrawingBufferSize(_px); if (_px.x > 0) COMPASS_U.uPx.value.set(2 / _px.x, 2 / _px.y); // (a pixel of the frame as drawn: the keylines)
    // the tape round the eye, raised to the top of the view
    cam.getWorldDirection(this.u.uFwd.value);
    const pitch = Math.asin(THREE.MathUtils.clamp(this.u.uFwd.value.y, -1, 1));
    const up = THREE.MathUtils.clamp(pitch + ((cam.fov * Math.PI) / 360) * RAISE * 2, -1.3, 1.3);
    this.tape.position.copy(cam.position).setY(cam.position.y + Math.tan(up) * R);
    // the ink, from what the tape is drawn against (ten times a second): over a light sky dark, over a dark one pale; snapped as it appears
    if ((this.skyT -= dt) <= 0) { this.skyT = 0.1; this.skyL = this.behind(up); }
    this.inked = this.inked ? this.skyL > INK.off : this.skyL > INK.on;
    this.ink = this.alpha < 0.05 ? +this.inked : this.ink + (+this.inked - this.ink) * (1 - Math.exp(-dt * 6));
    COMPASS_U.uInk.value = this.ink;
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
    this.wpMat.uniforms.uAlpha.value = this.wpA * this.alpha * con;
    this.wpKeyA.value = this.wpA * this.alpha * keyStrength(con);
  }

  /** How light what is behind the tape looks (0..1, as the screen shows it) at elevation `el` (radians): the dome where the tape crosses
   *  it, as drawn now (vfx/sky.js toneAt) under the cloud layer (vfx/clouds.js over), at eight points across it; under a roof, the
   *  room's own background, as the open sky gives way to it (dunes.mix). From the sky's state in memory, never a read of the GPU. */
  behind(el) {
    const g = this.game, sky = g.sky, D = g.dunes, open = D?.mix ?? 0, f = this.u.uFwd.value, h = Math.hypot(f.x, f.z) || 1, fx = f.x / h, fz = f.z / h;
    let Y = 0, W = 0;
    if (open > 0.01 && sky?.toneAt) for (const [b, de, w] of SAMPLES) {
      const e = THREE.MathUtils.clamp(el + de, -1.3, 1.5), cb = Math.cos(b), sb = Math.sin(b), ce = Math.cos(e);
      _d.set((fx * cb - fz * sb) * ce, Math.sin(e), (fz * cb + fx * sb) * ce);
      sky.toneAt(_d, _c, D.sunDir); D.clouds?.over?.(_d, _c);
      Y += lum(_c) * w; W += w;
    }
    const bg = g.scene.background?.isColor ? lum(g.scene.background) : 0.02;
    return shown(THREE.MathUtils.lerp(bg, W ? Y / W : bg, open), g.renderer?.toneMappingExposure ?? 1);
  }
  /** A gap in the tape straight ahead: `k` 0..1, `half` its half-angle below the line and `top` above it (radians). Asked after update,
   *  every frame it is wanted. */
  hole(k, half, top = 0) { this.u.uHole.value.set(k, Math.cos(half), Math.cos(top), this.tape.position.y); }
}
