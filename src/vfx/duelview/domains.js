// ---------------------------------------------------------------------------------------
// THE DOMAINS' CLASH (the duel's view: vfx/duelview.js): a puzzle duel's backdrop as two minds meeting (the owner, 2026-10-19: "a
// clash of two minds, like two Domain Expansions in Jujutsu Kaisen meeting"). When the duel opens, each side's half of the clash unfolds
// round the arena from where its owner stands (about 1.2 real s), and the two meet at the Line's plane:
//   THE COURIER'S   Lachryma's deep (#2e1a52) with the labradorite film running through it in slow curtains (the Courier's power:
//                   vfx/labradorite.js labSoft and labPhase; the film of vfx/oxidation.js), and a few motes of it turning
//   THE FOE'S       its feeling's colour fired dark, wearing its weather's heavy look as a pattern (vfx/weather.js LOOK[aspect].heavy, its
//                   haze; the paint's motifs, vfx/paintmotifs.js PAINT_MOTIF): Wonder's frost lattice, Mirth's drops, Desire's ripples,
//                   Fury's cracks of light under the hail, Gall's curds, Grief's long rain, Dread's marbling
//   THE SEAM        where they meet, on the Line's plane: crackling light (ridged noise) that slides with the Line, and pushes (a ripple
//                   into the half that gave ground, the seam widened and brightened) on every `line`
// It collapses on close. The board's slab (vfx/duelview/board.js) is drawn by the same program in its other mode, split on the same
// plane, so the Line's seam on the slab and the clash's seam are one cut.
//
// ONE PROGRAM (the budget: one new at most): the sphere and the slab share the vertex and fragment source, the side and the blending, so
// three.js keys them as one; `uMode` tells them apart. Warmed at boot (`prewarm` here, called by DuelView.prewarm from main.js), as the
// caster shaders are (vfx/caster/warmups1tos5.js). No screen pass: the clash is a mesh round the arena.
//
// Prior art: Jujutsu Kaisen's domain clash (Gojo's Unlimited Void against Sukuna's Malevolent Shrine: two barrier-less domains pushing
// at a seam, the stronger mind's ground gaining), Persona's Velvet Room (a room that is a mind, wrapped round the player), the Dark Souls
// invasion's tint (the world coloured by whose world it is), Bayonetta's Witch Time (the world shifted round a fight, then given back).
// The noise is Dave Hoskins' "Hash without Sine" (Shadertoy 4djSRW, MIT), as vfx/paintmotifs.js; the voronoi edge is Inigo Quilez's.
//
// THE GROUND (South, 2026-10-27: a puzzle duel is its own instance, so nothing of the world stands under the bodies): a disc at the board's
// foot in the same program (mode 2), each half's ground laid flat under its owner, a pool of its own light under each body, its rim faded.
//   const D = new DomainClash()   D.dome (the sphere's mesh)   D.ground (the disc's)   D.groundTo(radius)   D.slabMaterial(gravityTexture, w, h) -> the slab's material
//   (the slab's fog: a texture of the cells, r hidden, g the lantern's light: Dread's, vfx/duelview/board.js setFog)
//   D.setFoe(aspect)   D.setPlane(pointWorld, normalWorld, centreWorld)   D.setLine(column)   D.flash(side)   D.won(k)
//   D.unfold(originCourier, originFoe)   D.push(receiverSide)   D.collapse(slower = 1)   D.update(dt) -> still showing?   D.open (0..1 each side)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';
import { LOOK } from '../weather.js';
import { DUEL_VIEW, FEELING_ORDER, feelColour, clamp01, sm } from './layout.js';

const V = /* glsl */`
varying vec3 vW; varying vec3 vView; varying vec2 vUv;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vView = normalize(cameraPosition - w.xyz); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const F = /* glsl */`
uniform float uMode, uT, uRadius, uPush, uPushSide, uWon, uMotif, uLine, uFade;
uniform vec3 uPlaneP, uPlaneN, uCentre, uOriginC, uOriginF, uFoe, uFoeDeep, uHaze;
uniform vec2 uOpen, uFlash, uGrid;
uniform sampler2D uGrav, uFog;
varying vec3 vW; varying vec3 vView; varying vec2 vUv;
${LAB_GLSL}
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; } return s; }
vec2 vor(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h21(i + g), h21(i + g + 19.7));
    vec2 r = g + o - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  d1 = sqrt(d1); d2 = sqrt(d2); return vec2(d1, d2 - d1); }
// a streak field falling down q (rain, hail): columns of streaks, each its own speed and phase
float streaks(vec2 q, float t, float cols, float len, float speed, float share) {
  float col = floor(q.x * cols), s = h21(vec2(col, 3.1)), y = fract(q.y * 0.18 + t * speed * (0.7 + 0.6 * s) + s);
  float x = abs(fract(q.x * cols) - 0.5);
  return step(1.0 - share, h21(vec2(col, 7.7))) * smoothstep(0.0, 0.03, y) * smoothstep(len, 0.0, y) * (1.0 - smoothstep(0.08, 0.2, x));
}
// a feeling's heavy look as a pattern over its half: x its light (its colour lifted), y its dark, z white (hail, glints)
vec3 foeLook(vec2 q, float t, float m) {
  if (m < 0.5) { // Wonder: hexagonal frost (three line families at 60 degrees), a glint in some cells
    float l = 0.0; for (int k = 0; k < 3; k++) { float a = float(k) * 1.0472; vec2 d = vec2(cos(a), sin(a)); l = max(l, 1.0 - smoothstep(0.0, 0.05, abs(fract(dot(q, d) * 0.9) - 0.5))); }
    float gl = step(0.97, h21(floor(q * 2.0))) * (0.5 + 0.5 * sin(t * 0.9 + h21(floor(q * 2.0)) * 30.0));
    return vec3(l * 0.7, 0.2, gl * 0.6);
  }
  if (m < 1.5) { // Mirth: drops, rising slowly (the sunshower's dapples)
    vec2 g = q * 1.1 + vec2(0.0, -t * 0.12); vec2 c = fract(g) - 0.5; float on = step(0.45, h21(floor(g)));
    return vec3(on * (1.0 - smoothstep(0.12, 0.2, length(c))), 0.1, 0.0);
  }
  if (m < 2.5) { // Desire: the wanting wind's crests, drifting along
    float cr = sin(q.x * 1.6 + fbm(q * 0.45) * 4.5 - t * 1.1);
    return vec3(smoothstep(0.82, 1.0, cr), smoothstep(-0.2, -0.95, cr) * 0.6, 0.0);
  }
  if (m < 3.5) { // Fury: plates split by cracks of light, charred to their middles; the hail falling white through it
    vec2 v = vor(q * 0.9); float cr = 1.0 - smoothstep(0.0, 0.07, v.y);
    return vec3(cr * (0.65 + 0.35 * vn(q * 3.0 + t * 0.7)), smoothstep(0.05, 0.6, v.x) * 0.7, streaks(q, t, 5.0, 0.07, 1.6, 0.35));
  }
  if (m < 4.5) { // Gall: curds, each with a pale skin, the rest wet and dark
    vec2 v = vor(q * 1.4 + vec2(0.0, t * 0.04)); float blob = 1.0 - smoothstep(0.26, 0.34, v.x), skin = blob * smoothstep(0.18, 0.3, v.x);
    return vec3(skin * 0.7, blob * 0.8, 0.0);
  }
  if (m < 5.5) { // Grief: the long rain in sheets, fine and broken
    return vec3(streaks(q, t, 9.0, 0.5, 0.9, 0.55) * 0.8, 0.45, 0.0);
  }
  // Dread: ink marbling (suminagashi): pale contours on the dark
  float f = fbm(q * 0.5 + vec2(t * 0.025, 0.0)); float c = abs(fract(f * 9.0) - 0.5);
  return vec3((1.0 - smoothstep(0.0, 0.07, c)) * 0.55, 0.55, 0.0);
}
vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
void main() {
  float sd = dot(vW - uPlaneP, uPlaneN); // (the Line's plane: below nought the Courier's ground, above it the foe's)
  float t = uT;
  if (uMode > 0.5) { // ---- the slab: the board's face (its ruleset's w x h cells, uGrid), split at the Line
    vec2 c = vec2(vUv.x * uGrid.x, (1.0 - vUv.y) * uGrid.y);
    float fwx = max(fwidth(c.x), 1e-4), k = smoothstep(-fwx, fwx, c.x - uLine), yy = c.y / uGrid.y;
    float ph = labPhase(vW * 0.6, vView);
    // the slab is neutral and calm under the gems (South, 2026-10-27: the tint washed them to one colour): a charcoal near #141418, a
    // breath of each side's own at most (the film's sheen on yours, the foe's feeling on its), the tint itself on the frame and the dome
    vec3 cour = mix(srgb(vec3(0.085, 0.085, 0.1)), srgb(vec3(0.066, 0.066, 0.078)), yy);
    cour += labSoft(ph + c.x * 0.02) * 0.012;
    vec3 foe = mix(srgb(vec3(0.085, 0.08, 0.085)), uFoe, 0.06) * (1.0 - 0.15 * yy);
    vec3 col = mix(cour, foe, k);
    col = mix(col, vec3(1.0), (1.0 - k) * uFlash.x + k * uFlash.y);
    vec2 f = fract(c) - 0.5; float fw = max(fwidth(c.y), fwx);
    float grid = 1.0 - smoothstep(0.0, fw * 1.2, 0.5 - max(abs(f.x), abs(f.y)));
    col *= 1.0 + 0.06 * mod(floor(c.x) + floor(c.y), 2.0); // (a quiet checker: the cells read without lines of their own)
    col = mix(col, srgb(vec3(0.91, 0.86, 0.78)), grid * 0.03);
    vec2 cc = floor(c), g = texture2D(uGrav, (cc + 0.5) / uGrid).xy * (255.0 / 127.0) - 1.0; // (the cell's gravity: shown only at the half's back wall)
    if (dot(g, g) > 0.25) { g = normalize(g); vec2 nx = cc + floor(g + 0.5); float wall = 1.0;
      if (nx.x >= 0.0 && nx.y >= 0.0 && nx.x < uGrid.x && nx.y < uGrid.y) { vec2 gn = texture2D(uGrav, (nx + 0.5) / uGrid).xy * (255.0 / 127.0) - 1.0; wall = 1.0 - step(-0.5, dot(gn, g)); } // (the edge, or a neighbour falling the other way: the Line between halves that fall toward each other)
      float b = dot(f, g), a = dot(f, vec2(-g.y, g.x));
      float ch = (1.0 - smoothstep(0.02, 0.02 + fw, abs(b - 0.3 + abs(a) * 0.7))) * step(abs(a), 0.2); // (a faint arrow against the wall the half falls to, never in every cell)
      col = mix(col, srgb(vec3(0.91, 0.86, 0.78)), ch * 0.16 * wall); }
    // Dread's fog (dread.js visibleTo): the hidden ground under ink marbling (suminagashi, the pall's colours), the lantern's pool warm
    vec4 fg = texture2D(uFog, vec2(vUv.x, 1.0 - vUv.y)); float fog = fg.r, lamp = fg.g;
    if (fog + lamp > 0.001) {
      float mf = fbm(c * 0.32 + vec2(t * 0.03, -t * 0.02)), ml = 1.0 - smoothstep(0.0, 0.08, abs(fract(mf * 8.0) - 0.5));
      vec3 fc = mix(srgb(vec3(0.078, 0.11, 0.094)), srgb(vec3(0.141, 0.19, 0.165)), fbm(c * 0.18 - vec2(0.0, t * 0.05))) + srgb(vec3(0.42, 0.52, 0.45)) * ml * 0.22;
      col = mix(col, fc, fog);
      col += srgb(vec3(1.0, 0.62, 0.26)) * (lamp * 0.32 * (1.0 - fog) + fog * (1.0 - fog) * 0.5);
    }
    float d = abs(c.x - uLine), core = 1.0 - smoothstep(0.04, 0.04 + fwx * 1.5, d);
    float ridge = 1.0 - abs(fbm(vec2(c.y * 0.9 - t * 1.4, t * 0.3)) * 2.0 - 1.0);
    col += labSoft(ph + c.y * 0.05) * (core * 1.6 + exp(-d * 5.0) * (0.25 + 0.5 * pow(ridge, 4.0)) * (1.0 + uPush));
    col = mix(col, srgb(vec3(0.95, 0.76, 0.35)) * 1.4, core * uWon);
    gl_FragColor = vec4(col, 1.0);
    return;
  }
  // ---- the clash: an inside-out sphere round the arena (mode 0), or its ground under the bodies (mode 2: a disc at the board's foot)
  vec3 dir = normalize(vW - uCentre);
  vec2 q = vec2(atan(dir.z, dir.x) * 6.0, dir.y * 6.0) * (uRadius / 18.0);
  float fl = step(1.5, uMode);
  if (fl > 0.5) { q = (vW.xz - uCentre.xz) * 0.55; dir = normalize(vec3(dir.x, 0.22, dir.z)); } // (the ground's pattern laid flat, lit as the sphere's band at its foot)
  float k = smoothstep(-0.05, 0.05, sd);
  float ph = labPhase(vW * 0.35, vView);
  // the Courier's: Lachryma's deep, the film in slow curtains, a few motes turning
  float rb = sin(q.x * 0.9 + fbm(q * 0.4 + vec2(0.0, t * 0.05)) * 5.0 + t * 0.15), band = smoothstep(0.5, 1.0, rb);
  vec3 cour = mix(srgb(vec3(0.18, 0.10, 0.32)) * (0.45 + 0.4 * dir.y), labSoft(ph + q.y * 0.05) * 0.9, band * 0.55 + 0.06);
  float mh = h21(floor(q * 3.0)), mote = step(0.982, mh) * (1.0 - smoothstep(0.05, 0.16, length(fract(q * 3.0) - 0.5))) * (0.6 + 0.4 * sin(t * 1.2 + mh * 40.0));
  cour += labSoft(mh) * mote * 1.4;
  // the foe's: its feeling fired dark, its heavy look's haze low down, its pattern over it
  vec3 L = foeLook(q, t, uMotif);
  vec3 foe = mix(uHaze, uFoeDeep, smoothstep(-0.1, 0.5, dir.y));
  foe = foe * (1.0 - L.y * 0.55) + uFoe * L.x * 1.5 + vec3(0.95, 0.97, 1.0) * L.z;
  vec3 col = mix(cour, foe, k);
  // the seam: crackling light on the Line's plane, pushed on a line
  vec3 along = normalize(cross(uPlaneN, vec3(0.0, 1.0, 0.0)));
  float al = dot(vW - uPlaneP, along), wS = 0.3 + 0.9 * uPush;
  float ridge = 1.0 - abs(fbm(vec2(al * 0.35, vW.y * 0.35 - t * 1.3)) * 2.0 - 1.0), near = exp(-abs(sd) / wS);
  vec3 seamC = mix(srgb(vec3(1.0, 0.9, 0.72)), labSoft(ph), 0.45);
  col += seamC * near * (0.9 + 2.4 * pow(ridge, 6.0) + uPush);
  float rip = uPush * step(0.0, sd * uPushSide) * max(0.0, sin(abs(sd) * 1.4 - t * 9.0)) * exp(-abs(sd) * 0.18);
  col += mix(labSoft(ph), uFoe * 1.6, step(0.0, -sd * uPushSide)) * rip * 0.7; // (the ripple runs into the half that gave ground, in the pusher's colour)
  // each half unfolds from its owner and folds back to it
  float rC = length(vW - uOriginC), rF = length(vW - uOriginF), covC = uOpen.x * uRadius * 2.3, covF = uOpen.y * uRadius * 2.3;
  float inC = 1.0 - smoothstep(covC - 2.0, covC, rC), inF = 1.0 - smoothstep(covF - 2.0, covF, rF);
  float rim = mix(exp(-abs(rC - covC) * 1.2) * step(0.001, uOpen.x) * (1.0 - step(0.999, uOpen.x)), exp(-abs(rF - covF) * 1.2) * step(0.001, uOpen.y) * (1.0 - step(0.999, uOpen.y)), k);
  col += mix(labSoft(ph) * 1.4, uFoe * 2.0, k) * rim;
  float a = mix(inC, inF, k) * mix(0.62, 0.95, smoothstep(0.0, 0.35, dir.y)) * uFade;
  if (fl > 0.5) { // the ground: a pool of each side's own light under its body, the disc fading out at its rim
    float pC = exp(-pow(length(vW.xz - uOriginC.xz) / 1.5, 2.0)), pF = exp(-pow(length(vW.xz - uOriginF.xz) / 1.5, 2.0));
    col += labSoft(ph) * pC * 0.9 * uOpen.x + uFoe * pF * 1.3 * uOpen.y;
    a = clamp(a * 0.85 + (pC * uOpen.x + pF * uOpen.y) * 0.35, 0.0, 1.0) * (1.0 - smoothstep(0.55, 1.0, length(vUv - 0.5) * 2.0)) * uFade;
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

/** The clash's sphere, the slab or the ground, by mode: one program (the same source, side and blending; the uniforms shared by reference). */
function clashMaterial(mode, shared) {
  return new THREE.ShaderMaterial({
    name: mode ? 'duel-slab' : 'duel-clash', uniforms: { ...shared, uMode: { value: mode } }, vertexShader: V, fragmentShader: F,
    transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
}

export class DomainClash {
  constructor() {
    const grav = new THREE.DataTexture(new Uint8Array(4 * 4).fill(127), 2, 2); grav.needsUpdate = true;
    const clear = new THREE.DataTexture(new Uint8Array(4 * 4), 2, 2); clear.needsUpdate = true; // (no fog)
    this.U = {
      uT: { value: 0 }, uMindT: mindTime, uRadius: { value: DUEL_VIEW.radius }, uPush: { value: 0 }, uPushSide: { value: 1 }, uWon: { value: 0 },
      uMotif: { value: 3 }, uLine: { value: 10 }, uFade: { value: 1 },
      uPlaneP: { value: new THREE.Vector3() }, uPlaneN: { value: new THREE.Vector3(1, 0, 0) }, uCentre: { value: new THREE.Vector3() },
      uOriginC: { value: new THREE.Vector3() }, uOriginF: { value: new THREE.Vector3() },
      uFoe: { value: new THREE.Color() }, uFoeDeep: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() },
      uOpen: { value: new THREE.Vector2() }, uFlash: { value: new THREE.Vector2() }, uGrid: { value: new THREE.Vector2(20, 20) }, uGrav: { value: grav }, uFog: { value: clear },
    };
    const dome = (this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), clashMaterial(0, this.U)));
    dome.name = 'duel-clash'; dome.frustumCulled = false; dome.renderOrder = -10; dome.scale.setScalar(DUEL_VIEW.radius); dome.visible = false;
    const disc = new THREE.CircleGeometry(1, 64); disc.rotateX(-Math.PI / 2);
    const ground = (this.ground = new THREE.Mesh(disc, clashMaterial(2, this.U))); // (South, 2026-10-27, via Petra: the duel is its own instance, so the bodies stand on the clash's own ground)
    ground.name = 'duel-ground'; ground.frustumCulled = false; ground.renderOrder = -9; ground.visible = false;
    this.open = [0, 0]; this.want = 0; this.pushK = 0; this.flashK = [0, 0]; this.t = 0;
    this.setFoe('fury');
  }

  /** The slab's material: the same program in its other mode, the board's gravity map its grain. */
  slabMaterial(grav, w, h, fog = null) {
    this.U.uGrav.value = grav; if (fog) this.U.uFog.value = fog; this.U.uGrid.value.set(w, h);
    return (this.slab ||= clashMaterial(1, this.U));
  }

  /** The foe's half: its feeling's colour, fired dark, its heavy look's haze, its pattern. */
  setFoe(aspect) {
    const L = LOOK[aspect] || LOOK.fury, U = this.U;
    feelColour(aspect, U.uFoe.value);
    U.uFoeDeep.value.copy(U.uFoe.value).multiplyScalar(0.16);
    U.uHaze.value.copy(L.heavy?.sky?.haze || L.heavy?.fog || L.fog || U.uFoe.value).lerp(U.uFoeDeep.value, 0.35).multiplyScalar(0.55);
    U.uMotif.value = Math.max(0, FEELING_ORDER.indexOf(aspect in LOOK ? aspect : 'fury'));
  }

  /** The Line's plane in the world (a point on it and its normal toward the foe), and the arena's centre (the board's foot). */
  setPlane(p, n, centre) { this.U.uPlaneP.value.copy(p); this.U.uPlaneN.value.copy(n); if (centre) this.U.uCentre.value.copy(centre); } // (the sphere stands at its parent's origin: the board's foot)
  setLine(col) { this.U.uLine.value = col; }
  /** A half's flash (a break): white, fading over a third of a real second. */
  flash(side) { this.flashK[side] = 1; }
  won(k) { this.U.uWon.value = k; }

  /** The duel opens: each half unfolds from its owner. */
  unfold(originC, originF) { this.slower = 1; this.U.uOriginC.value.copy(originC); this.U.uOriginF.value.copy(originF); this.want = 1; this.dome.visible = this.ground.visible = true; this.U.uFade.value = 1; }
  /** The ground's reach (m): past both bodies, its rim faded. */
  groundTo(r) { this.ground.scale.setScalar(r); }
  /** A `line`: the seam pushes into the half that gave ground (the receiver's). */
  push(receiver) { this.pushK = 1; this.U.uPushSide.value = receiver === 0 ? -1 : 1; }
  /** The domains fold away (`slower`: times their closing, a fled duel's soft fold). */
  collapse(slower = 1) { this.slower = this.want === 0 ? Math.max(this.slower || 1, slower) : Math.max(1, slower); this.want = 0; } // (a second call never hurries one already slow)

  /** Each frame (real seconds): the halves opening or closing, the push decaying. Returns whether anything still shows. */
  update(dt) {
    mindTick(); this.t += dt; const U = this.U; U.uT.value = this.t % 3600;
    const rate = dt / (this.want ? DUEL_VIEW.unfold : DUEL_VIEW.collapse * (this.slower || 1));
    for (let i = 0; i < 2; i++) this.open[i] = clamp01(this.open[i] + (this.want ? rate * (i ? 0.92 : 1) : -rate)); // (the foe's a beat behind)
    U.uOpen.value.set(sm(this.open[0]), sm(this.open[1]));
    this.pushK = Math.max(0, this.pushK - dt / DUEL_VIEW.push); U.uPush.value = this.pushK * this.pushK;
    for (let i = 0; i < 2; i++) this.flashK[i] = Math.max(0, this.flashK[i] - dt / 0.35);
    U.uFlash.value.set(this.flashK[0] * 0.8, this.flashK[1] * 0.8);
    const shown = this.want > 0 || this.open[0] > 0 || this.open[1] > 0;
    this.dome.visible = this.ground.visible = shown;
    return shown;
  }
}
