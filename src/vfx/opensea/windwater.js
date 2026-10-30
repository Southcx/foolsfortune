// ---------------------------------------------------------------------------------------
// THE WIND ON THE WATER (docs/plans/OPEN-SEA.md section 14; the rules: progress/opensea/wind.js, Dovina's; the room reads them:
// world/opensea/opensea.js `.wind`, `.gusts`, `.rips`): the open sea's wind made visible on the crude, the one thing a sailor reads
// before the vane. Three layers in one program on one sheet laid over the sea round the camera:
//   THE WIND'S GRAIN  long faint streaks of sheen and fine dark ripples lying along the wind and drifting downwind (wind lanes, the
//                     streaks a real sea draws along the wind), denser and darker as the wind strengthens; nothing in a calm
//   A GUST            (a cat's paw) a dark ruffled patch where the wind blows harder: the surface roughened, so it holds less of the sky;
//                     its edge torn by noise, its heart a fine scale of ripples running downwind, rising and fading over its life and
//                     drifting at the gust's own speed (GUST.drift), advanced between the room's refreshes so it never steps
//   A RIP             (a current) a band 70 m wide along its square, its crude a shade lifted toward the film's violet, and lines of
//                     foam streaming its way at its speed, pinched at its two edges where it shears against the still sea
// The sheet is the sea's own grid (the same cells, snapped the same way) and rides the sea's own swells (the same Gerstner sum, the
// same uniforms copied each frame: vfx/crudesea.js), a hand's breadth over it, so it never cuts into a crest. Every fine term fades to its
// mean where a pixel holds more than one (fwidth): no crawl (CLAUDE.md). It fades out before the sheet's edge.
// It also gives the helm's ship its wind (shipkit/shiplook.js `wind(rel, k)`): the pennant streams downwind and the vanes belly to leeward.
// Installed by the squall line (vfx/opensea/squallline.js: made with it, updated and warmed with it), so the open sea's looks are one hook.
//
// Cost: one program (its own), one draw of 120 x 120 cells (about 29,000 triangles, the sea's own count over a third of its area),
// sixteen gusts and four rips as uniforms; nothing on the CPU but the uniforms.
//
// Prior art: real cat's paws (the dark patch a gust ruffles on a calm sea, read by every dinghy sailor to windward), wind lanes and
// streaks of foam along the wind (the Beaufort scale's pictures); The Legend of Zelda: The Wind Waker (the wind's white lines on the
// Great Sea); Sea of Thieves (the sea darkened and roughened under a squall's wind); a rip current's foam lines and its tint against the
// still water round it.
//
//   new WindWater(game)   .update(dt, camera) (each frame, from the squall line)   .prewarm() -> hide   .mesh
//   WINDWATER (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from '../../render/zonemap.js';
import { lightAt } from '../../progress/weather.js';
import { GUST, RIP, gustAt } from '../../progress/opensea/wind.js';
import { squareCentre } from '../../world/opensea/seaprops.js';

/** size: the sheet's side (m; a whole number of the sea's cells); lift: over the sea (m); fade: where it fades to nothing (m from the
 *  eye, start and end); gusts, rips: how many are drawn at once (the nearest); ripReach: how far a rip's middle may be (m); streak: the
 *  wind lanes' drift (m a real s at full strength). */
export const WINDWATER = { size: 600, lift: 0.07, fade: [200, 290], gusts: 16, rips: 4, ripReach: 700, streak: 7 };
const W = WINDWATER, NG = W.gusts, NR = W.rips;

const VERT = /* glsl */`
uniform float uST, uAmp, uCalm, uLift; uniform vec4 uW[4]; uniform float uC[4];
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float far = 1.0 - smoothstep(140.0, 380.0, length(wp.xz - cameraPosition.xz));
  float amp = uAmp * (1.0 - 0.85 * uCalm); vec3 d = vec3(0.0);
  for (int i = 0; i < 4; i++) { vec2 D = uW[i].xy; float k = uW[i].z, q = uW[i].w, A = q / k * amp, f = k * dot(D, wp.xz) - uC[i] * uST; d += vec3(D.x * A * cos(f) * q, A * sin(f), D.y * A * cos(f) * q); }
  wp.xyz += d * far; wp.y += uLift; vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */`
uniform float uT, uLight, uFade0, uFade1, uRipW, uRipL, uRipV; uniform vec3 uWind; uniform vec4 uGust[${NG}]; uniform vec4 uRip[${NR}]; uniform vec3 uSheen;
varying vec3 vW;
float wwHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wwNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wwHash(i), wwHash(i + vec2(1, 0)), f.x), mix(wwHash(i + vec2(0, 1)), wwHash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = vW.xz, d = uWind.xy, n = vec2(-d.y, d.x); float k = uWind.z;
  float dist = length(p - cameraPosition.xz), fade = 1.0 - smoothstep(uFade0, uFade1, dist);
  float fw = length(fwidth(p)); // (metres a pixel: every fine term fades to its mean past it)
  float fine = 1.0 - smoothstep(0.6, 2.2, fw), mid = 1.0 - smoothstep(2.5, 9.0, fw);
  vec2 q = vec2(dot(p, d), dot(p, n)), qs = vec2(q.x - uT * ${W.streak.toFixed(1)} * (0.4 + 0.6 * k), q.y);
  // the wind's grain: long lanes of sheen along the wind, and a fine scale of dark ripples crossing them
  float lane = wwNoise(vec2(qs.x * 0.012, qs.y * 0.09)) * 0.65 + wwNoise(vec2(qs.x * 0.03, qs.y * 0.22)) * 0.35;
  float sheen = smoothstep(0.58, 0.86, lane) * mid * k;
  float ripple = mix(0.5, wwNoise(vec2(qs.x * 0.5, qs.y * 0.9)) * 0.6 + wwNoise(vec2(qs.x * 1.1 + 3.1, qs.y * 1.7)) * 0.4, fine);
  float dark = smoothstep(0.25, 1.0, k) * 0.16 * smoothstep(0.35, 0.75, ripple);
  // the gusts: cat's paws, dark and ruffled, their edges torn
  float paw = 0.0;
  for (int i = 0; i < ${NG}; i++) { vec4 g = uGust[i]; if (g.w <= 0.0) continue;
    float e = length(p - g.xy) / g.z + (wwNoise(p * 0.035 + g.xy * 0.01) - 0.5) * 0.45;
    paw = max(paw, g.w * (1.0 - smoothstep(0.55, 1.0, e))); }
  float ruff = mix(0.55, wwNoise(vec2(qs.x * 0.7, qs.y * 1.3) + 7.0) * 0.5 + wwNoise(vec2(qs.x * 1.6, qs.y * 2.4) + 2.0) * 0.5, fine);
  dark = max(dark, paw * (0.34 + 0.32 * ruff));
  sheen *= 1.0 - paw;
  // the rips: a band lifted toward the film's violet, foam lines streaming its way, its edges sheared
  float band = 0.0, foam = 0.0;
  for (int i = 0; i < ${NR}; i++) { vec4 r = uRip[i]; if (r.z < 0.0) continue; // (an empty slot's yaw is -1: a rip's is 0..2PI)
    vec2 a = vec2(sin(r.z), cos(r.z)), rel = p - r.xy; float across = rel.x * a.y - rel.y * a.x - r.w, along = dot(rel, a);
    float hw = uRipW * 0.5, inB = 1.0 - smoothstep(hw * 0.75, hw * 1.15, abs(across)), ends = 1.0 - smoothstep(uRipL * 0.5 - 60.0, uRipL * 0.5, abs(along));
    float b = inB * ends; if (b <= 0.0) continue; band = max(band, b);
    float sv = along - uT * uRipV, lines = wwNoise(vec2(sv * 0.035, across * 0.32)) * 0.7 + wwNoise(vec2(sv * 0.09, across * 0.7)) * 0.3;
    float f = smoothstep(0.68, 0.86, mix(0.45, lines, mid)) * b;
    float edge = (1.0 - smoothstep(0.0, 3.5 + fw, abs(abs(across) - hw * 0.92))) * ends * mix(0.5, wwNoise(vec2(sv * 0.08, across)), mid);
    foam = max(foam, max(f, edge * 0.5)); }
  // the layers over each other: the band's tint, the sheen, the dark, the foam on top
  vec3 lit = vec3(0.35 + 0.65 * uLight);
  vec3 col = vec3(0.22, 0.14, 0.32) * lit; float al = band * 0.2;
  col = mix(col, uSheen * lit, sheen * 0.16 / max(0.001, al + sheen * 0.16)); al = al + sheen * 0.16 * (1.0 - al);
  col = mix(col, vec3(0.0, 0.0, 0.015), dark / max(0.001, al + dark) ); al = al + dark * (1.0 - al);
  float fo = foam * 0.24; // (the one look, 2026-10-27: at 0.42 the foam read as white paint) col = mix(col, vec3(0.86, 0.84, 0.92) * lit, fo / max(0.001, al + fo)); al = al + fo * (1.0 - al);
  gl_FragColor = vec4(col, al * fade);
}`;

const _v = new THREE.Vector3();

export class WindWater {
  constructor(game) { this.game = game; this.made = false; this.t = 0; this.gusts = null; this.gustT = 0; this.ripsSeen = null; this.ripCentres = []; }

  make() {
    this.made = true;
    const u = this.u = { uST: { value: 0 }, uAmp: { value: 0.38 }, uCalm: { value: 0 }, uLift: { value: W.lift },
      uW: { value: Array.from({ length: 4 }, () => new THREE.Vector4(1, 0, 1, 0)) }, uC: { value: [0, 0, 0, 0] },
      uT: { value: 0 }, uLight: { value: 1 }, uFade0: { value: W.fade[0] }, uFade1: { value: W.fade[1] },
      uRipW: { value: RIP.width }, uRipL: { value: RIP.length }, uRipV: { value: RIP.speed },
      uWind: { value: new THREE.Vector3(1, 0, 0) }, uSheen: { value: new THREE.Color(0.62, 0.68, 0.8) },
      uGust: { value: Array.from({ length: NG }, () => new THREE.Vector4()) }, uRip: { value: Array.from({ length: NR }, () => new THREE.Vector4(0, 0, -1, 0)) } };
    const m = new THREE.ShaderMaterial({ name: 'wind-water', uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const geo = new THREE.PlaneGeometry(W.size, W.size, 120, 120); geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, m); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 1; this.mesh.userData.zoneFree = true; this.mesh.name = 'wind-water';
    this.game.scene.add(this.mesh);
  }

  /** Made and shown for the boot's compile (its own program); returns what hides it. */
  prewarm() { if (!this.made) this.make(); this.mesh.visible = true; return () => { this.mesh.visible = false; }; }

  update(dt, camera = this.game.camera) {
    const g = this.game, S = g.opensea, cam = camera?.position, wind = S?.wind;
    const here = S?.built && cam && wind && zoneOf(cam) === 'opensea';
    if (!here) { if (this.made) this.mesh.visible = false; return; }
    if (!this.made) this.make();
    this.t += dt; const u = this.u, sea = g.rail?.sea;
    if (sea?.u) { // (the sea's swells, as drawn: the same sum)
      u.uST.value = sea.u.uT.value; u.uAmp.value = sea.u.uAmp.value; u.uCalm.value = sea.u.uCalm.value;
      for (let i = 0; i < 4; i++) { u.uW.value[i].copy(sea.u.uW.value[i]); u.uC.value[i] = sea.u.uC.value[i]; }
    }
    const cell = sea?.cell || 5, y = (sea?.y ?? S.helm?.pos.y ?? 0) + (sea?.lift || 0);
    this.mesh.position.set(Math.round(cam.x / cell) * cell, y, Math.round(cam.z / cell) * cell);
    u.uT.value = this.t; u.uLight.value = lightAt();
    u.uWind.value.set(Math.sin(wind.to), Math.cos(wind.to), wind.k);
    this.gustsDrawn(dt, wind, cam);
    this.ripsDrawn(S, cam);
    this.mesh.visible = true;
    this.shipWind(S, wind);
  }

  /** The nearest gusts, advanced downwind since the room last asked for them (wind.js gustsNear: their places at that moment). */
  gustsDrawn(dt, wind, cam) {
    const list = this.game.opensea.gusts || [], G = this.u.uGust.value;
    if (list !== this.gusts) { this.gusts = list; this.gustT = 0; } else this.gustT += dt;
    const vx = Math.sin(wind.to) * GUST.drift * this.gustT, vz = Math.cos(wind.to) * GUST.drift * this.gustT;
    const near = list.slice().sort((a, b) => Math.hypot(a.x - cam.x, a.z - cam.z) - Math.hypot(b.x - cam.x, b.z - cam.z));
    for (let i = 0; i < NG; i++) { const q = near[i]; if (q) G[i].set(q.x + vx, q.z + vz, q.r, q.k); else G[i].set(0, 0, 1, 0); }
  }

  /** The rips within reach: each its band's middle (its square's centre), yaw and side offset. */
  ripsDrawn(S, cam) {
    const R = this.u.uRip.value, rips = S.rips;
    if (rips !== this.ripsSeen) { // (the sea's rips are made once a voyage: their centres found once)
      this.ripsSeen = rips; this.ripCentres = [];
      if (rips) for (const r of rips.values()) { const sq = S.grid?.squares?.find((s) => s.id === r.square); if (sq) { const c = squareCentre(sq.col, sq.row, _v); this.ripCentres.push({ x: c.x, z: c.z, yaw: r.yaw, off: r.off }); } }
    }
    const near = this.ripCentres.map((r) => ({ r, d: Math.hypot(r.x - cam.x, r.z - cam.z) })).filter((o) => o.d < W.ripReach).sort((a, b) => a.d - b.d);
    for (let i = 0; i < NR; i++) { const o = near[i]?.r; if (o) R[i].set(o.x, o.z, ((o.yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), o.off); else R[i].set(0, 0, -1, 0); }
  }

  /** The helm's ship given the wind in its own frame (its pennant downwind, its vanes to leeward), the gust where it is added. */
  shipWind(S, wind) {
    const H = S.helm, look = H?.look; if (!look?.wind) return;
    const k = Math.min(1, wind.k + GUST.k * gustAt(S.gusts || [], H.pos.x, H.pos.z));
    look.wind(wind.to - H.yaw, k);
  }
}
