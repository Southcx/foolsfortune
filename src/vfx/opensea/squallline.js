// ---------------------------------------------------------------------------------------
// A FRONT'S SQUALL LINE (docs/plans/OPEN-SEA.md sections 3 and 5; the rules: progress/opensea/seatrip.js `frontAt`, Dovina's): the open
// sea's front drawn where the rules put it, a band two columns wide off the lanes walking from the Chaos edge to the Law edge a column a
// game hour. Seen from outside it is a dark wall of rain and cloud standing on the water along the front's line: the cloud's mass on
// top (its base billowing along the wall), rain shafts under it, denser and thinner in turn, streaked and falling, and a shelf cloud
// leaning out ahead of the leading edge; the lane between its two halves stays clear, a corridor under two walls. Its leading edge walks
// with the game hour (the line is moving, as a squall line is); its trailing edge follows the rules' square, eased. Inside it (the rules'
// own test: your square in the front), the house's rain falls round you (vfx/weather.js `makeRain`, the long rain's sheets: the same
// program as the weather's) and the storm's veil comes over the screen's edges (vfx/stormwarp.js `set({ veil })`: the haze and the
// split, never the bend, which would slide the islets off the sea).
// Beyond the camera's far plane (420 m at sea) the wall is drawn pulled in along each ray to just inside it, the same place on the
// screen and behind everything near, so a front is seen on the horizon as weather is; it greys into the fog's colour with distance.
// Nothing flickers: every frequency is low, and the streaks fade to their mean where a pixel holds more than one (`fwidth`).
//
// Cost: one program (its own), one draw for the wall (about 1,600 triangles), and the rain's (the weather's program) only inside.
//
// Prior art: real squall lines (a shelf cloud over a curtain of rain, the rain arriving in shafts); Wind Waker's storms seen far off at
// sea; Sea of Thieves' storms (a wall you sail into, the rain round the ship within); the house's own camera-wrapped rain (weather.js)
// and the sky marks drawn at the back of the depth (weather.js `ringMesh`).
//
//   game.squallLine = new SquallLine(game)   .update(dt, camera) (each frame)   .prewarm() -> hide   .inside (0..1, eased)   .edges { lead, trail } (x, m)
//   SQUALL (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from '../../render/zonemap.js';
import { ECON } from '../../progress/econ/table.js';
import { frontAt } from '../../progress/opensea/seatrip.js';
import { lightAt } from '../../progress/weather.js';
import { now } from '../../core/calendar.js';
import { SEA } from '../../world/opensea/seaprops.js';
import { makeRain, rainTo, fallsOf } from '../weather.js';
import { Overhead } from '../overhead.js';

const G = ECON.openSea.grid;
/** height: the cloud's top over the sea (m); shelf: how far the shelf cloud leans out ahead of the leading edge (m); veil: the storm's
 *  veil inside; rain: the long rain's amount inside (fallsOf's k); ease: how fast the trailing edge follows (1/real s); fade: real s
 *  to fade in after the line wraps from the Law edge back to the Chaos one; hour: real ms a game hour (as the room reads it). */
export const SQUALL = { height: 170, shelf: 110, veil: 0.32, rain: 0.9, ease: 0.5, fade: 4, hour: 150000 };
const colX = (c) => SEA.x + (c - (G.cols - 1) / 2) * SEA.square;
const RAIN_C = new THREE.Color(0xaab4c4), _c = new THREE.Color();

const VERT = /* glsl */`
attribute vec4 aP; attribute float aSide; // (a: 0 the leading edge .. 1 the trailing, below 0 the shelf ahead; b: 0 the lane's side .. 1 the outer; h: 0 the water .. 1 the top; face)
uniform float uLead, uTrail, uIn, uOutN, uOutS, uZ0, uY0, uH, uShelf, uFar;
varying vec3 vW; varying vec4 vP;
void main() {
  float a = aP.x;
  float x = a >= 0.0 ? mix(uLead, uTrail, a) : uLead + a * uShelf;
  float z = uZ0 + aSide * mix(uIn, aSide > 0.0 ? uOutN : uOutS, aP.y);
  vec3 w = vec3(x, uY0 + aP.z * uH, z); vW = w; vP = aP;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  if (-mv.z > uFar) mv.xyz *= uFar / -mv.z; // (past the far plane: pulled in along its ray, the same place on the screen)
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform float uT, uA, uLight; uniform vec3 uFogC; varying vec3 vW; varying vec4 vP;
float hh(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hh(i), hh(i + vec2(1.0, 0.0)), u.x), mix(hh(i + vec2(0.0, 1.0)), hh(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  float face = vP.w, h = vP.z, d = distance(vW, cameraPosition);
  vec3 slate = vec3(0.033, 0.04, 0.054), under = vec3(0.008, 0.01, 0.013), rainC = vec3(0.13, 0.16, 0.2); // (linear: the frame is graded to sRGB after; a slate of 0.2 drawn as is read as a pale mountain)
  vec3 c; float a;
  if (face < 1.5) { // a wall: cloud over rain
    float u = face < 0.5 ? vW.z : vW.x; // (along the wall)
    float cb = 0.5 + 0.12 * vn(vec2(u * 0.012 + uT * 0.005, 3.1)) + 0.04 * vn(vec2(u * 0.05, 9.0)); // (the cloud's base, billowing)
    float cloud = smoothstep(cb - 0.04, cb + 0.07, h);
    float shaft = 0.4 + 0.6 * smoothstep(0.2, 0.8, vn(vec2(u * 0.007 - uT * 0.012, 7.7)));
    float sx = u * 0.22, st = vn(vec2(sx, vW.y * 0.02 + uT * 0.8)); // (streaks: fine across, long down, falling)
    st = mix(st, 0.5, clamp(fwidth(sx) * 1.5, 0.0, 1.0)); // (where a pixel spans a streak, its mean: no crawl)
    float rain = shaft * (0.55 + 0.45 * st) * (1.0 - 0.25 * smoothstep(0.0, cb, h));
    float lump = vn(vec2(u * 0.025, h * 5.0 - uT * 0.015));
    float crown = 0.86 + 0.1 * vn(vec2(u * 0.009 - uT * 0.004, 5.3)) + 0.05 * vn(vec2(u * 0.04, 2.0)); // (the cloud's top, heaped: never a ruled edge)
    a = mix(0.58 * rain, 0.94, cloud) * (1.0 - smoothstep(crown - 0.06, crown, h));
    c = mix(rainC * (0.85 + 0.25 * st), mix(under, slate, 0.35 + 0.65 * lump * smoothstep(cb, 1.0, h)), cloud);
    float e = face < 0.5 ? vP.y : clamp(vP.x, 0.0, 1.0); a *= smoothstep(1.0, 0.93, e); // (the far ends of each wall softened)
  } else if (face < 2.5) { // the shelf cloud: dark, rolled, thinning to its lip
    float s = -vP.x, lump = vn(vec2(vW.z * 0.02 + uT * 0.01, s * 3.0));
    a = 0.92 * (1.0 - smoothstep(0.6, 1.0, s + 0.25 * (lump - 0.5)));
    c = mix(under, slate, 0.25 + 0.5 * lump);
  } else { // the cloud's underside, seen from inside
    float lump = vn(vW.xz * 0.012 + uT * 0.004) * 0.6 + vn(vW.xz * 0.04) * 0.4;
    vec2 q = vP.xy; float rim = smoothstep(0.0, 0.12, q.x) * smoothstep(1.0, 0.88, q.x) * smoothstep(1.0, 0.9, q.y); // (only its middle: from outside the wall's heaped top is the edge)
    a = 0.9 * rim; c = mix(under, slate * 0.8, lump);
  }
  c *= uLight;
  c = mix(c, uFogC, 0.55 * smoothstep(380.0, 2600.0, d)); // (greyed into the haze with distance)
  a *= smoothstep(18.0, 75.0, d) * uA; // (sailing into it, the wall thins round you: the rain inside takes over)
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
}`;

/** The wall as one geometry in parameters (the shader lays it out): for each half (north, south) its leading and trailing walls, its
 *  lane-side and outer walls, its shelf and its underside. */
function wallGeometry() {
  const P = [], S = [], I = [];
  const quad = (side, face, nu, nv, at) => { // (a grid of (nu+1) x (nv+1) vertices; at(u, v) -> [a, b, h])
    const o = P.length / 4;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [a, b, h] = at(i / nu, j / nv); P.push(a, b, h, face); S.push(side); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = o + j * (nu + 1) + i; I.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1); }
  };
  for (const side of [1, -1]) {
    quad(side, 0, 24, 8, (u, v) => [0, u, v]); // (the leading wall)
    quad(side, 0, 24, 8, (u, v) => [1, u, v]); // (the trailing wall)
    quad(side, 1, 16, 8, (u, v) => [u, 0, v]); // (the lane's side)
    quad(side, 1, 16, 8, (u, v) => [u, 1, v]); // (the outer side)
    quad(side, 2, 24, 4, (u, v) => [-v, u, 1 - 0.42 * v]); // (the shelf, leaning down ahead)
    quad(side, 3, 16, 24, (u, v) => [u, v, 0.88]); // (the underside, under the heaped top)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('aP', new THREE.Float32BufferAttribute(P, 4)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1));
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(S.length * 3), 3)); // (unused: the shader lays it out)
  g.setIndex(I);
  return g;
}

export class SquallLine {
  constructor(game) { this.game = game; this.made = false; this.inside = 0; this.alpha = 0; this.t = 0; this.edges = { lead: null, trail: null }; this.veiling = false; }

  make() {
    this.made = true;
    const u = this.u = { uLead: { value: 0 }, uTrail: { value: 0 }, uIn: { value: SEA.square / 2 }, uOutN: { value: (G.rows - 1 - G.lane + 0.5) * SEA.square }, uOutS: { value: (G.lane + 0.5) * SEA.square },
      uZ0: { value: SEA.z }, uY0: { value: SEA.y }, uH: { value: SQUALL.height }, uShelf: { value: SQUALL.shelf }, uFar: { value: 400 },
      uT: { value: 0 }, uA: { value: 0 }, uLight: { value: 1 }, uFogC: { value: new THREE.Color(0x8a96a4) } };
    const m = new THREE.ShaderMaterial({ name: 'squall-line', uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    m.userData.shared = true;
    this.mesh = new THREE.Mesh(wallGeometry(), m); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 4; this.mesh.userData.zoneFree = true;
    this.over = new Overhead(this.game); // (the ship's deck over the rain: nothing falls through it)
    this.rain = makeRain(3000, this.over.u); this.rain.obj.userData.zoneFree = true;
    this.game.scene.add(this.mesh, this.rain.obj);
  }

  /** Made and shown for the boot's compile (its own program; the rain's is the weather's); returns what hides it. */
  prewarm() {
    if (!this.made) this.make();
    this.mesh.visible = this.rain.obj.visible = true;
    return () => { this.mesh.visible = this.rain.obj.visible = false; };
  }

  update(dt, camera = this.game.camera) {
    const S = this.game.opensea, cam = camera?.position;
    const here = S?.built && cam && zoneOf(cam) === 'opensea';
    if (!here) { if (this.made) this.mesh.visible = this.rain.obj.visible = false; this.inside = 0; this.edges.lead = null; this.veil(0); return; }
    if (!this.made) this.make();
    this.t += dt;
    // where the rules put the band: head (its leading column) and how far into the game hour; the leading edge walks with the hour
    const span = G.cols + 2, pos = ((now() / SQUALL.hour + (S.seed % span)) % span + span) % span, head = (G.cols - 1) - Math.floor(pos), frac = pos - Math.floor(pos);
    const lead = colX(Math.max(-0.5, head - frac - 0.5)), trail = colX(Math.min(G.cols - 0.5, head + 1.5)), on = trail - lead > 1;
    const E = this.edges;
    if (E.lead === null || Math.abs(lead - E.lead) > SEA.square * 2) { E.lead = lead; E.trail = trail; this.alpha = 0; } // (wrapped round: faded in afresh)
    E.lead = lead; E.trail += (trail - E.trail) * (1 - Math.exp(-dt * SQUALL.ease));
    this.alpha = Math.min(on ? 1 : 0, this.alpha + dt / SQUALL.fade);
    const u = this.u; u.uLead.value = E.lead; u.uTrail.value = Math.max(E.lead + 1, E.trail); u.uT.value = this.t; u.uA.value = this.alpha;
    u.uFar.value = camera.far * 0.97; u.uLight.value = 0.3 + 0.7 * lightAt();
    if (this.game.scene.fog?.color) u.uFogC.value.copy(this.game.scene.fog.color);
    this.mesh.visible = this.alpha > 0.01;
    // inside the front (the rules' own test, as the room's R asks it): the long rain round the eye, the storm's veil
    const sq = S.squareAt?.(cam), want = sq && frontAt(S.grid, S.seed, now() / SQUALL.hour).has(sq.id) ? 1 : 0;
    this.inside += (want - this.inside) * (1 - Math.exp(-dt * 0.8));
    const f = fallsOf('grief', SQUALL.rain).rain;
    if (f && this.inside > 0.01) {
      f.alpha *= this.inside; f.n *= this.inside;
      rainTo(this.rain, f, _c.copy(RAIN_C).multiplyScalar(0.4 + 0.6 * lightAt()));
      this.rain.u.uT.value = this.t; this.rain.u.uCam.value.copy(cam); this.rain.obj.visible = true;
      this.over.update(cam, 48);
    } else this.rain.obj.visible = false;
    this.veil(this.inside * SQUALL.veil);
  }

  /** The storm's veil (vfx/stormwarp.js): set while it is ours, handed back at nothing. */
  veil(k) {
    const W = this.game.stormWarp; if (!W?.set) return;
    if (k > 0.002) { W.set({ veil: k }); this.veiling = true; } else if (this.veiling) { W.set({ veil: 0 }); this.veiling = false; }
  }
}
