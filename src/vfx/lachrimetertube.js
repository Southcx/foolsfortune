// ---------------------------------------------------------------------------------------
// THE LACHRIMETER'S TUBE (OVERLAY.md 10.5c, approved on board v7 "without a note", built into the game on v8's word): the Lachrimeter as
// a mercury thermometer standing bottom-right, a made object in the overlay's own 3D layer (render/overlayscene.js), drawn at the
// 480-line present so it pixelates as the world does. Calissa's round-six mock (r6-thermo), ported whole:
//   the BULB        the pool's base, Lachryma held in labradorite dark, the schiller (violet, teal, gold, magenta) flashing in it
//   the COLUMN      the pool itself, lit Lachryma in a hand-blown bore; its meniscus (a bright line and a glow) is where the pool stands,
//                   the first thing the eye finds; etched frost ticks on the glass, a long one each 25%, a short one each 5%
//   the SCALE PLATE tenmoku-glazed clay (hare's fur, the glaze breaking rust at its edges) behind the column, gilt ticks cut through it
//   the COUNT       a VFD tube in a brass plate on the plinth: the pool and its full size, cyan-green, its unlit segments ghosting
//   the HELD STRETCH the bore a cap on the pool holds off (progress/poolcaps.js `capOf`), crazed glass with the clay's cracks in it above
//                   a cracked clay seal at the cap line, its ticks dimmed; its tag (a small System window, one bend in its leader) says
//                   what holds it and where it mends ("HELD 10% · 2 CRACKS · MEND: KILN")
//   the PALE STRETCH a psygun charge: the top of the column gone pale (the pool's `reserved`), a bright ring at its drawing front
//   the GOLD TICK   a cost: where the pool would stand after the next shot (while the psygun is out), its count beside it; red, past
//                   the bulb's neck, when it cannot be paid
//   the EXPANSION CHAMBER brimming (game.courierMind.brimming): the bore full through the neck and the little glass bulb turning
//   the LACHRYMATO BOTTLES behind and left (worn at the back: progress/brushload.js): below half the valve opens and the bottle drips
//                   down the feed tube into the bulb; a bottle drains as it feeds (two avenues for the pool: OVERLAY.md 9)
//   the BLINK'S PEARLS a brass rail beside the column, a glass pearl a Blink charge filling with Lachryma as it comes back; in combat
//                   only (vfx/lachrimeter/blinkpearls.js; the owner, 2026-10-18)
//   the CUBE PLATE  a Nixie window in a brass plate on the plinth's face, left of the pool's count: a bismuth cube and the balance,
//                   rolling digit by digit in fixed cells (vfx/lachrimeter/cubeplate.js; the owner, 2026-10-18)
// The plinth is clay glazed in the window colour (ui/theme.js: 15.3, the window colour is the glaze of the frame's matter), with
// patinated brass. It stands at the corner's foot while the pool is doing something (not full, held for a charge, or moved in the last
// four real seconds), while a Blink charge is coming back in a fight, a few real seconds after the cubes change, or after a pulse(), and
// sinks into the corner when none is so. It is the only Lachrimeter: the old flat DOM tube and then the LACHRYMA panel (its beads and
// the cubes' readout) were retired (the owner, 2026-10-18). Its width in CSS px is `pubW` (the psygun's cylinder stands left of it:
// vfx/psyguncylinder.js).
//
// On touch (ui/hudlayout.js, MOBILE.md 6.3) it stands in the HUD layout's box at a phone's scale (su, not the height): up the right edge under
// the Sight, or left of the cluster where a phone on its side has no room there; it steps back off the nearer edge.
//
// Prior art: the mercury-in-glass thermometer (Fahrenheit, 1714; the clinical and laboratory forms: the bulb as reservoir, the
// capillary bore, the convex meniscus, the expansion chamber, acid-etched ticks; the Victorian wall thermometer's board and brass);
// the VFD and Nixie tube (Shōwa calculators and hi-fi; Burroughs' Nixie, 1955); labradorite's schiller (vfx/oxidation.js FILM);
// crackle glaze (Ge ware, guan) read onto glass; Dead Space's RIG and Metroid Prime's visor for the interface as a lit object.
//
//   const L = new LachrimeterTube(game)   game.lachrimeterTube   (it registers itself with game.overlayScene; nothing else to call)
//   L.pulse()  the pool was touched or refused (a gain, a dry click): the tube comes up and stands its quiet seconds
//   L.skinParts  the housing an instrument skin repaints (vfx/instrumentskins.js: the brass, the scale plate's ground, their roughness and
//                metalness, the glass's tint, the instrument a garnish hangs on); L.skinTick(dt) a skin's own motion, called each frame shown
//   L.bulbAt(out) -> { x, y, z, r } the bulb in the overlay scene (null while hidden)   L.valveAt(out) -> { x, y, z } the Bottles' valve   L.root (the slot's object)   L.state (what it last showed: { level, full, held, charge, cost, brim, feeding, shown })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { capOf } from '../progress/poolcaps.js';
import { BOTTLES } from '../progress/brushload.js';
import { T } from '../core/config.js';
import { theme, THEMES, FONT } from '../ui/theme.js';
import { BlinkPearls, PEARL_KIND } from './lachrimeter/blinkpearls.js';
import { CubePlate, PLATE_W, PLATE_H } from './lachrimeter/cubeplate.js';

// the instrument's own units (the mock's): the bulb at the origin, the scale from Y0 (empty) to Y1 (full), the plate behind
const Y0 = 0.55, Y1 = 3.55, yOf = (p) => Y0 + (Y1 - Y0) * p;
const PL = { x0: -0.32, x1: 0.74, y0: 0.3, y1: 4.0 };
const CP = { x: -1.6, len: 0.98 }; // (the cube plate's window on the plinth's face: its centre, its glass's length)
const BORE = 0.124; // (the bore's Lachryma)
// how it stands on the 480-line frame: 32 lines a unit (192 lines tall at most), the mock's eye (a three-quarter turn, a little above)
const SKIN = { w: 544, h: 1024, plate: [0, 0, 288, 1024], glaze: [288, 0, 256, 256], brass: [288, 256, 128, 128] }; // (the still body's atlas: tex px)
const LINES = 32, YAW = 0.42, PITCH = 0.08, GAP = 6; // (lines to the frame's bottom edge)
const CLEAR = 18, WIDE = 3.5; // (CSS px from the right edge: the corner, as the HUD's own margin; the tube's width in its units, the cube plate and the Bottles' rack included: the psygun's cylinder steps left by it)
const RIGHT = 1.1, FOOT = 1.3, HEIGHT = 5.9; // (units: the plinth's right corner as turned, the plinth's foot below the bulb, the whole height)
const K = 2; // (texture pixels a line, for the words drawn on canvases)
const COUNT_FONT = `'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const QUIET = 4; // (real seconds still and full before it steps back: hud.js's rule)

let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; };
const rgb = (s) => `rgb(${s})`;

/** A mottled glaze (the plinth's and the brass's patina): blobs over a base, a fine speckle. */
export function mottle(c, base, blobs, n, specks = ['#0b1f1a', '#9fd3c0']) {
  const w = c.width, x = c.getContext('2d'); seed = 7;
  x.globalAlpha = 1; x.fillStyle = base; x.fillRect(0, 0, w, w);
  for (let i = 0; i < n; i++) { const [col, a] = blobs[i % blobs.length]; x.globalAlpha = a * (0.4 + rnd() * 0.6); x.fillStyle = col; x.beginPath(); x.arc(rnd() * w, rnd() * w, 4 + rnd() * w * 0.12, 0, 7); x.fill(); }
  x.globalAlpha = 0.5; for (let i = 0; i < w * 2; i++) { x.fillStyle = rnd() < 0.5 ? specks[0] : specks[1]; x.fillRect(rnd() * w, rnd() * w, 1, 1); }
  x.globalAlpha = 1; return c;
}
/** The held stretch's glass: crazed (a fine net), the clay's cracks through it. */
function crazeCanvas() {
  const c = cv(256, 512), x = c.getContext('2d'); seed = 11;
  x.fillStyle = '#7c776e'; x.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 60; i++) { x.globalAlpha = 0.25; x.fillStyle = rnd() < 0.5 ? '#5c564e' : '#9a948a'; x.beginPath(); x.arc(rnd() * 256, rnd() * 512, 8 + rnd() * 30, 0, 7); x.fill(); }
  x.globalAlpha = 0.8; x.strokeStyle = '#d8d2c4'; x.lineWidth = 1;
  for (let i = 0; i < 140; i++) { let px = rnd() * 256, py = rnd() * 512; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * 40; py += (rnd() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); }
  x.strokeStyle = '#2a140c'; x.lineWidth = 3; x.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) { let px = rnd() * 256, py = rnd() * 512; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 9; k++) { px += (rnd() - 0.5) * 50; py += (rnd() - 0.3) * 40; x.lineTo(px, py); } x.stroke(); }
  x.globalAlpha = 1; return c;
}
/** The scale plate's stock look (an instrument skin brings its own: vfx/instrumentskins.js): its ground, its streaks, its edge, its gilt. */
export const PLATE_STOCK = { ground: '#160d09', streaks: ['#6e3a18', '#a4622a', '#2a1c30'], edge: '150,84,36', gilt: '#e9c574', minor: '#c8a462', cut: '#0a0503' };
/** The scale plate: tenmoku-glazed clay, hare's-fur streaks, the glaze breaking rust at the edges, gilt ticks cut through the glaze. */
function drawPlate(c, L = PLATE_STOCK) {
  const W = c.width, H = c.height, x = c.getContext('2d'); seed = 23;
  x.globalAlpha = 1; x.fillStyle = L.ground; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 520; i++) { const px = rnd() * W, py = rnd() * H, l = 20 + rnd() * 90; x.globalAlpha = 0.1 + rnd() * 0.22; x.strokeStyle = rnd() < 0.6 ? L.streaks[0] : rnd() < 0.5 ? L.streaks[1] : L.streaks[2]; x.lineWidth = 0.6 + rnd() * 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py + l); x.stroke(); }
  x.globalAlpha = 1;
  const eg = x.createLinearGradient(0, 0, W, 0); eg.addColorStop(0, `rgba(${L.edge},.55)`); eg.addColorStop(0.06, 'rgba(0,0,0,0)'); eg.addColorStop(0.94, 'rgba(0,0,0,0)'); eg.addColorStop(1, `rgba(${L.edge},.55)`); x.fillStyle = eg; x.fillRect(0, 0, W, H);
  const vg = x.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, `rgba(${L.edge},.45)`); vg.addColorStop(0.03, 'rgba(0,0,0,0)'); vg.addColorStop(0.97, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${L.edge},.45)`); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  const u = (X) => ((X - PL.x0) / (PL.x1 - PL.x0)) * W, v = (Y) => (1 - (Y - PL.y0) / (PL.y1 - PL.y0)) * H;
  x.font = `26px ${COUNT_FONT}`; x.textAlign = 'right'; x.textBaseline = 'middle';
  for (let i = 0; i <= 20; i++) {
    const maj = i % 5 === 0, y = v(yOf(i / 20)), a = u(0.27), b = u(maj ? 0.5 : 0.4);
    x.fillStyle = L.cut; x.fillRect(a, y - (maj ? 2.5 : 1.5) + 1, b - a, maj ? 5 : 3); // (the cut)
    x.fillStyle = maj ? L.gilt : L.minor; x.fillRect(a, y - (maj ? 2 : 1), b - a, maj ? 4 : 2); // (the gilt in it)
    if (maj) { x.fillStyle = L.cut; x.fillText(i * 5, u(0.71) + 1, y + 1); x.fillStyle = L.gilt; x.fillText(i * 5, u(0.71), y); }
  }
  x.fillStyle = L.minor; x.fillRect(u(0.27), v(yOf(1)), 2, v(yOf(0)) - v(yOf(1)));
}
/** The VFD count: phosphor digits behind a fine grid, the unlit segments ghosting (every digit an 8). */
function drawVfd(c, txt) {
  const W = c.width, H = c.height, x = c.getContext('2d');
  x.shadowBlur = 0; x.fillStyle = '#021310'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(109,255,216,.07)'; x.lineWidth = 1; x.beginPath();
  for (let i = 0; i < W; i += 4) { x.moveTo(i, 0); x.lineTo(i, H); } for (let j = 0; j < H; j += 4) { x.moveTo(0, j); x.lineTo(W, j); } x.stroke();
  let fs = 100; x.font = `${fs}px ${COUNT_FONT}`; const asc = x.measureText('0').actualBoundingBoxAscent || fs * 0.62;
  fs = Math.round((fs * H * 0.76) / asc); x.font = `${fs}px ${COUNT_FONT}`;
  const tw = x.measureText(txt).width; if (tw > W * 0.88) { fs = Math.floor((fs * W * 0.88) / tw); x.font = `${fs}px ${COUNT_FONT}`; }
  const dh = x.measureText('0').actualBoundingBoxAscent || fs * 0.62, by = H / 2 + dh / 2;
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = 'rgba(109,255,216,.07)'; x.fillText(txt.replace(/\d/g, '8'), W / 2, by);
  x.shadowColor = '#3dffc8'; x.shadowBlur = 13; x.fillStyle = '#8dffe0'; x.fillText(txt, W / 2, by);
  x.shadowBlur = 4; x.fillStyle = '#d8fff4'; x.fillText(txt, W / 2, by); x.shadowBlur = 0;
}

// ---------- THE OVERLAY'S ONE SHADER (shared with the Sight, vfx/sight.js). Every custom look the instruments wear is a kind of one
// program, picked by a uniform (uKind), so the overlay scene compiles one program for all of them, not one a look (ARCHITECTURE.md,
// Budgets: 227 programs were 192 before the instruments; they took 31, measured 2026-10-18). Every kind is drawn transparent and
// double-sided in one pass; a kind that wants a side culls the other in the shader (uCull: 1 keeps the front, 2 the back), and a
// glass that was drawn back then front (three's two passes) is two meshes, back then front. A module adds its kinds when it loads
// (`overlayKind`); the program's text is fixed when the first material is made. The lit parts share one MeshStandardMaterial set-up
// and one MeshPhysicalMaterial set-up (`overlayStd`: a map always, a white one where a part has none; the env map always, the same
// size), and the flat ones (MeshBasicMaterial's work) are the kind `flat` (`overlayFlat`). Prior art: the uber-shader (Unreal's and
// Unity's standard shaders, a branch a feature), three.js's own program cache (one program a distinct source and set of defines).
const KINDS = []; let UBER = null;
/** A kind of the overlay's one shader: its declarations and its main's body, vertex and fragment (vbody null: the plain one). */
export function overlayKind(name, { vdecl = '', vbody = null, fdecl = '', fbody }) { if (UBER) throw new Error(`overlayKind ${name}: added after the program was made`); KINDS.push({ name, vdecl, vbody, fdecl, fbody }); return KINDS.length - 1; }
const PLAIN_V = 'vUv=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;';
const VARY = 'varying vec3 vW,vN,vV,vP;varying vec2 vUv;varying float vA;';
function uber() {
  if (UBER) return UBER;
  const br = (f) => KINDS.map((K, i) => `${i ? 'else ' : ''}if(uKind<${i}.5){${f(K)}}`).join('\n');
  UBER = { V: `uniform float uKind;${VARY}\n${KINDS.map((k) => k.vdecl).join('\n')}\nvoid main(){\n${br((K) => K.vbody ?? PLAIN_V)}}`,
    F: `uniform float uKind,uCull;${VARY}\n${KINDS.map((k) => k.fdecl).join('\n')}\nvoid main(){if(uCull>.5&&((uCull<1.5)!=gl_FrontFacing))discard;\n${br((K) => K.fbody)}}` };
  return UBER;
}
/** A material of the one shader: `kind` its look, `cull` 0 both sides, 1 the front only, 2 the back only; `o` the blend, depth and order. */
export function overlayShader(kind, uniforms = {}, { cull = 0, ...o } = {}) {
  const { V, F } = uber();
  return new THREE.ShaderMaterial({ vertexShader: V, fragmentShader: F, toneMapped: false, ...o, transparent: true, side: THREE.DoubleSide, forceSinglePass: true, uniforms: { uKind: { value: kind }, uCull: { value: cull }, ...uniforms } });
}
const px1 = (r, g, b, a = 255) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, a]), 1, 1); t.needsUpdate = true; return t; };
/** The white texel every part without a picture wears (so every lit part has a map: one program). */
export const OVERLAY_WHITE = px1(255, 255, 255);
const FLAT = overlayKind('flat', { fdecl: 'uniform sampler2D uMap;uniform vec3 uColor;uniform float uOpacity;uniform vec4 uUvT;', fbody: 'vec4 c=texture2D(uMap,vUv*uUvT.zw+uUvT.xy);gl_FragColor=linearToOutputTexel(vec4(uColor*c.rgb,uOpacity*c.a));' });
/** MeshBasicMaterial's work as the one shader: `.color` and `.opacity` as on a basic material; the picture is `.uniforms.uMap.value`. */
export function overlayFlat({ color = 0xffffff, map = null, opacity = 1, cull = 0, ...o } = {}) {
  const m = overlayShader(FLAT, { uMap: { value: map || OVERLAY_WHITE }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uUvT: { value: new THREE.Vector4(0, 0, 1, 1) } }, { cull, ...o }); // (uUvT: a picture's offset and repeat)
  Object.defineProperty(m, 'color', { get: () => m.uniforms.uColor.value });
  Object.defineProperty(m, 'opacity', { get: () => m.uniforms.uOpacity.value, set: (v) => { m.uniforms.uOpacity.value = v; } });
  return m;
}
/** A lit part: one MeshPhysicalMaterial set-up for every one (`phys` or not: a part without a clearcoat wears a vanishing one, so it is
 *  the same program and renders as MeshStandardMaterial would), every map always (a white texel where a part has none: colour,
 *  roughness and metalness, glow, bump), transparent; `env` the instrument's environment (a 512-wide equirect's PMREM, so every one is the same size). */
export function overlayStd(env, o = {}, phys = false) {
  const base = { toneMapped: false, transparent: true, envMap: env, map: OVERLAY_WHITE, roughnessMap: OVERLAY_WHITE, metalnessMap: OVERLAY_WHITE, emissiveMap: OVERLAY_WHITE, bumpMap: OVERLAY_WHITE, bumpScale: 0, clearcoat: phys ? 0.3 : 1e-4 };
  const m = new THREE.MeshPhysicalMaterial({ ...base, ...o, side: THREE.FrontSide }); if (!(m.clearcoat > 0)) m.clearcoat = 1e-4; return m;
}
/** An equirect canvas as an instrument's environment (PMREM'd; 512 px wide, so every instrument's env map is the same size). */
export function overlayEnv(renderer, c) {
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer), e = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose(); return e;
}

// ---------- the tube's kinds (the mock's shaders, in the instrument's own units: uInst takes a world point back into them; the
// overlay's eye is orthographic) ----------
const NOISE = `
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
vec3 pal(float t){vec3 a=vec3(.30,.06,.70),b=vec3(.04,.55,.75),c=vec3(.95,.72,.18),d=vec3(.85,.10,.50);t=fract(t)*4.;
if(t<1.)return mix(a,b,t);if(t<2.)return mix(b,c,t-1.);if(t<3.)return mix(c,d,t-2.);return mix(d,a,t-3.);}
uniform float uT,uPale,uSwirl,uGain;`;
const INST_V = 'vec4 w=modelMatrix*vec4(position,1.);vW=(uInst*w).xyz;vN=normalize(normalMatrix*normal);vV=vec3(0.,0.,1.);gl_Position=projectionMatrix*viewMatrix*w;';
const LABO = overlayKind('tube.labo', { vdecl: 'uniform mat4 uInst;', vbody: INST_V, fdecl: NOISE, fbody: `vec3 N=normalize(vN),V=normalize(vV);float f=clamp(abs(dot(N,V)),0.,1.);
vec3 p=vW*4.5;if(uSwirl>0.){vec2 q=vW.xz;float r=length(q)+.001;float a=atan(q.y,q.x)+uSwirl*8.*(.2-r)+vW.y*9.+uT;p=vec3(cos(a)*r,vW.y,sin(a)*r)*14.;}
float n=fbm(p+vec3(0.,uT,0.)),n2=fbm(p*2.3+7.+uT);
float band=sin((n*3.+f*2.2+vW.y*.7)*6.2831);
float flash=smoothstep(.3,1.,band)*smoothstep(.32,.72,n2);
vec3 fl=pal(n*1.3+f*.6+vW.y*.18);
vec3 col=vec3(.03,.02,.06)+fl*flash*(.8+.9*f*f)*uGain+vec3(.20,.10,.40)*pow(1.-f,3.)*.9;
col=mix(col,vec3(.82,.92,1.)*(.8+.35*flash)+fl*.12,uPale);
gl_FragColor=vec4(col,1.);` });
const LUM = overlayKind('tube.lum', { vbody: INST_V, fbody: `vec3 N=normalize(vN),V=normalize(vV);float f=clamp(abs(dot(N,V)),0.,1.);
vec3 p=vW*vec3(10.,2.4,10.);float n=fbm(p+vec3(0.,uT,0.)),n2=fbm(p*2.1+5.+uT);
float band=sin((n*3.+vW.y*1.4)*6.2831);float flash=smoothstep(.15,1.,band)*smoothstep(.32,.68,n2);
vec3 core=mix(vec3(.20,.10,.62),vec3(.42,.30,1.),f*f);
vec3 fl=mix(vec3(.25,1.,.88),vec3(1.,.84,.32),smoothstep(.42,.58,fract(n*2.2+vW.y*.45)));
vec3 col=core*(.85+.5*f)*uGain+fl*flash*1.5*uGain+vec3(.55,.5,1.)*pow(1.-f,2.)*.4;
col=mix(col,vec3(.85,.94,1.)*(.85+.3*flash),uPale);
gl_FragColor=vec4(col,1.);` });
const GLASS = overlayKind('tube.glass', { vdecl: 'attribute vec2 aGlass;', vbody: INST_V + 'vUv=aGlass;', fdecl: 'uniform vec4 uTgTint;', fbody: `vec3 N=normalize(vN),V=normalize(vV);float d=dot(N,V);if(d<0.)N=-N;float f=1.-abs(d);
float a=vUv.x+pow(f,2.4)*vUv.y;vec3 c=mix(vec3(.78,.90,1.),pal(f*.8+vW.y*.2),.35);c=mix(c,uTgTint.rgb,uTgTint.a);
vec3 L=normalize(vec3(-.45,.6,.65));vec3 H=normalize(L+V);float s=pow(max(dot(N,H),0.),90.)*1.6;
vec3 L2=normalize(vec3(.7,.2,.5));float s2=pow(max(dot(N,normalize(L2+V)),0.),40.)*.35;
gl_FragColor=vec4(c*a+vec3(1.)*(s+s2),clamp(a+s+s2,0.,1.));` });
// the etched ticks, one mesh: a tick above the cap dims (aP its fraction, aMaj a long one)
const TICK = overlayKind('tube.tick', { vdecl: 'attribute float aP,aMaj;uniform float uCap;', vbody: 'vA=aP>uCap+1e-4?.22:(aMaj>.5?.85:.55);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);',
  fbody: 'gl_FragColor=vec4(.886,.933,.957,vA);' });
const PEARL = overlayKind('tube.pearl', PEARL_KIND); // (the Blink's pearls' Lachryma: vfx/lachrimeter/blinkpearls.js)

/** An arc of a ring round the bore at height y (a tick, a cost), facing the eye. */
function arcTube(r, y, arc, th, phi0 = 0) {
  const C = new THREE.Curve(); C.getPoint = (t, out = new THREE.Vector3()) => { const a = phi0 - arc / 2 + arc * t; return out.set(r * Math.sin(a), y, r * Math.cos(a)); };
  return new THREE.TubeGeometry(C, 12, th, 3, false); // (a tick is a line or two at the 480-line present)
}
function roundBox(w, h, d, b) {
  const s = new THREE.Shape(), x = w / 2 - b, y = h / 2 - b; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 4 }); g.translate(0, 0, -(d - 2 * b) / 2); return g;
}
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
/** A part placed (position, rotation, scale) and readied for merging. */
function at(geo, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  geo.applyMatrix4(M4.compose(V1.set(...p), Q.setFromEuler(E.set(...r)), S1.set(...s)));
  const g = geo.index ? geo.toNonIndexed() : geo; g.clearGroups(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  return g;
}

export class LachrimeterTube {
  /** True while this instrument stands in place of the old HUD piece (feedback/ gives way to it); false if switched off. */
  /** A cost shown on the tube before it is spent (OVERLAY.md 18): the shell under the hammer, the sounding while held. One amount per
   *  source, kept until it is set again; 0 clears it. The pale stretch shows the sum, beside a psygun charge's. */
  reserve(source, amount) { if (amount > 0) this.holds.set(source, amount); else this.holds.delete(source); }
  get standing() { return !this.off; }
  /** The bulb's centre in the overlay scene's coordinates (its world: x right, y up, CSS px) and its glass's radius, into `out` as
   *  { x, y, z, r }; null while the tube is not shown (the spiritual link's near end, vfx/spirituallink.js). This frame's once the
   *  tube's own slot has updated. */
  bulbAt(out = {}) {
    if (!this.root || this.shown <= 0 || this.root.userData.overlayHidden) return null;
    const e = this.inst.matrixWorld.elements; out.x = e[12]; out.y = e[13]; out.z = e[14]; out.r = 0.42 * this.inst.scale.x; return out;
  }
  /** The Bottles' valve wheel in the overlay scene's coordinates, into `out` as { x, y, z }; null while the tube is not shown (the
   *  spiritual link's foot slides there while a tool spends or fills the Bottles). */
  valveAt(out = {}) {
    if (!this.root || !this.valveM || this.shown <= 0 || this.root.userData.overlayHidden) return null;
    this.valveM.updateWorldMatrix(true, false); const e = this.valveM.matrixWorld.elements; out.x = e[12]; out.y = e[13]; out.z = e[14]; return out;
  }
  constructor(game) {
    this.holds = new Map(); // (source -> Lachryma shown reserved: reserve())
    this.game = game;
    this.S = game.overlayScene;
    this.state = { level: 0, full: 0, held: 0, charge: 0, cost: 0, brim: 0, feeding: false, shown: 0 };
    this.lvl = -1; this.ch = 0; this.brim = 0; this.shown = 0; this.quiet = 0; this.lastAvail = -1; this.flare = 0; this.valve = 0; this.t = 0; this.feedT = 0; this.lastCubes = -1;
    this.blink = { n: 0, max: 0, fill: 0 }; // (the Blink's charges, read each frame: blinkOf)
    this.keys = { count: '', tag: '', cost: '', theme: '', cap: -1 };
    this.uInst = { value: new THREE.Matrix4() }; this.turnBack = new THREE.Quaternion();
    if (!this.S) return;
    this.build();
    this.slot = this.S.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    document.fonts?.addEventListener?.('loadingdone', () => { this.keys.count = this.keys.tag = this.keys.cost = ''; this.cubePlate.dirty = true; this.cubePlate.fs = 0; drawPlate(this.plateC, this.plateLook); this.skin(); });
  }

  /** The pool was touched or refused (a bauble drunk, a dry click: the seven callers that once pulsed the LACHRYMA panel): the tube
   *  comes up and stands its quiet seconds (the meniscus flares on a gain by itself: the pool's 'gain'). */
  pulse() { this.quiet = 0; }

  /** The Blink's charges as the old beads read them (main.js's blinkState): how many, of how many, how far the next has come back; null
   *  without the Blink. Into one object, no allocation. */
  blinkOf() {
    const b = this.game.techs?.get?.('blink'); if (!b?.enabled || !b.cfg) return null;
    const o = this.blink, max = b.cfg.charges; o.n = b.charges; o.max = max; o.fill = b.charges < max ? Math.max(0, Math.min(1, b.recharge / b.cfg.recharge)) : 0; return o;
  }

  // ---------- the instrument, built once ----------
  build() {
    const r = this.S.r, U = this.uInst;
    // the environment: the mock's lit room (a gradient, a window, a lamp), drawn as an equirect at twice the mock's sphere's canvas and
    // mirrored (the sphere's u runs the other way round from an equirect's), so it is the Sight's size and the lit parts share a program
    { const c = cv(512, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); x.translate(512, 0); x.scale(-2, 2);
      g.addColorStop(0, '#fff1dc'); g.addColorStop(0.45, '#6a5a58'); g.addColorStop(0.55, '#2a2030'); g.addColorStop(1, '#08060c'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); x.fillStyle = '#fff'; x.fillRect(40, 20, 40, 30); x.fillStyle = '#ffb070'; x.fillRect(170, 40, 30, 20);
      this.env = overlayEnv(r, c); }
    const ENV = this.env;

    // the brass, the plinth's glaze and the scale plate on one atlas (and their roughness and metalness on a small one beside it), so the
    // instrument's still body is one mesh: one draw. The plate's region 288 x 1024, the glaze's 256 square, the brass's 128.
    this.glazeC = cv(256, 256); this.brassC = mottle(cv(128, 128), '#a37c34', [['#c9a253', 0.5], ['#3f8a74', 0.45], ['#5b4218', 0.4]], 50);
    this.plateC = cv(288, 1024); drawPlate(this.plateC); this.skinC = cv(SKIN.w, SKIN.h); this.skinT = tex(this.skinC);
    { const o = cv(SKIN.w / 8, SKIN.h / 8), x = o.getContext('2d'); // (roughness in green, metalness in blue, a region each: MeshStandardMaterial's channels)
      for (const [k, r, m] of [['plate', 0.22, 0], ['glaze', 0.32, 0.05], ['brass', 0.38, 0.85]]) { const [x0, y0, w, h] = SKIN[k]; x.fillStyle = `rgb(255,${Math.round(r * 255)},${Math.round(m * 255)})`; x.fillRect(x0 / 8, y0 / 8, w / 8, h / 8); }
      this.ormC = o; this.ormT = new THREE.CanvasTexture(o); this.ormT.magFilter = this.ormT.minFilter = THREE.NearestFilter; this.ormT.generateMipmaps = false; }
    const crazeT = tex(crazeCanvas());
    const glowC = cv(64, 64); { const x = glowC.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(220,250,255,1)'); g.addColorStop(0.25, 'rgba(120,200,255,.55)'); g.addColorStop(1, 'rgba(90,60,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }

    const body = overlayStd(ENV, { map: this.skinT, roughnessMap: this.ormT, metalnessMap: this.ormT, roughness: 1, metalness: 1, envMapIntensity: 0.9 });
    /** A part's uvs into its region of the atlas (`fit`: its uvs first brought to 0..1, for a part that tiled its texture). */
    const onto = (g, k, fit = false) => { const uv = g.attributes.uv, [x0, y0, w, h] = SKIN[k]; let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
      if (fit) { u0 = v0 = Infinity; u1 = v1 = -Infinity; for (let i = 0; i < uv.count; i++) { u0 = Math.min(u0, uv.getX(i)); u1 = Math.max(u1, uv.getX(i)); v0 = Math.min(v0, uv.getY(i)); v1 = Math.max(v1, uv.getY(i)); } }
      for (let i = 0; i < uv.count; i++) { const u = (uv.getX(i) - u0) / (u1 - u0 || 1), v = (uv.getY(i) - v0) / (v1 - v0 || 1); uv.setXY(i, (x0 + Math.min(1, Math.max(0, u)) * w) / SKIN.w, 1 - (y0 + h) / SKIN.h + Math.min(1, Math.max(0, v)) * h / SKIN.h); }
      return g; };
    const still = []; // (the instrument's still body: the brass, the plinth, the scale plate)
    const sh = (kind, u, o = {}) => overlayShader(kind, { uInst: U, ...u }, { cull: 1, ...o }); // (the bulb's and the column's Lachryma: drawn as they were, front faces, written to depth)
    const labo = (o = {}) => sh(LABO, { uT: { value: o.t || 0 }, uPale: { value: 0 }, uSwirl: { value: o.swirl || 0 }, uGain: { value: o.gain || 1 } });
    const lum = (o = {}) => sh(LUM, { uT: { value: o.t || 0 }, uPale: { value: o.pale || 0 }, uGain: { value: o.gain || 1 } });
    /** A glass's base and rim, carried by its vertices (so every glass that always stands is one mesh). */
    const glassOf = (geo, base = 0.05, rim = 0.55) => { const n = geo.attributes.position.count, a = new Float32Array(n * 2); for (let i = 0; i < n; i++) { a[i * 2] = base; a[i * 2 + 1] = rim; } geo.setAttribute('aGlass', new THREE.BufferAttribute(a, 2)); return geo; };
    const basic = (color, o = {}) => overlayFlat({ color, cull: 1, ...o }); // (front faces, as a basic material draws them)
    this.mats = { labo: [], lum: [] };
    const L = (m) => { this.mats.lum.push(m); return m; }, B = (m) => { this.mats.labo.push(m); return m; };

    const root = (this.root = new THREE.Group()); root.name = 'lachrimeterTube';
    const pitch = new THREE.Group(); pitch.rotation.x = PITCH; root.add(pitch);
    const inst = (this.inst = new THREE.Group()); inst.rotation.y = -YAW; pitch.add(inst); this.pitch = pitch;
    const add = (geo, mat, o = 0) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = o; m.frustumCulled = false; inst.add(m); return m; };
    /** A glass, drawn as three.js draws a double-sided transparent one: its back faces, then its front (two meshes, one program). */
    const tint = { value: new THREE.Vector4(0, 0, 0, 0) }; // (an instrument skin's tint of the glass: rgb, how much; 0 the stock)
    const glassB = sh(GLASS, { uTgTint: tint }, { cull: 2, depthWrite: false }), glassF = sh(GLASS, { uTgTint: tint }, { cull: 1, depthWrite: false });
    const glass = (geo, o = 2) => { const b = add(geo, glassB, o), f = new THREE.Mesh(geo, glassF); f.renderOrder = o + 0.01; f.frustumCulled = false; b.add(f); return b; };
    const glasses = []; // (the glass that always stands: the count's, the bulb's, the column's and the chamber's, the feed's; one mesh)

    // the brass, one mesh: the cup, the count's plate and end caps, the plate's frame and rivets, the column's collars and its foot,
    // the finial, the Bottles' rack and manifold
    const P = [];
    P.push(at(new THREE.LatheGeometry([[0, -0.36], [0.3, -0.36], [0.34, -0.3], [0.37, -0.12], [0.35, -0.11], [0.31, -0.28], [0, -0.3]].map((p) => new THREE.Vector2(p[0], p[1])), 32)));
    P.push(at(new THREE.BoxGeometry(1.92, 0.72, 0.04), [0, -0.88, 0.47]), at(new THREE.BoxGeometry(CP.len + 0.12, 0.66, 0.04), [CP.x, -0.88, 0.47])); // (the count's plate; the cube plate's)
    for (const x of [-0.9, 0.9, CP.x - CP.len / 2 - 0.04, CP.x + CP.len / 2 + 0.04]) P.push(at(new THREE.CylinderGeometry(x < -0.95 ? 0.19 : 0.22, x < -0.95 ? 0.19 : 0.22, 0.08, 20), [x, -0.88, 0.6], [0, 0, Math.PI / 2])); // (the end caps of the two windows)
    { const pw = PL.x1 - PL.x0, ph = PL.y1 - PL.y0, cx = (PL.x0 + PL.x1) / 2, cy = (PL.y0 + PL.y1) / 2, z = -0.29;
      P.push(at(new THREE.BoxGeometry(pw + 0.06, 0.05, 0.05), [cx, PL.y0, z]), at(new THREE.BoxGeometry(pw + 0.06, 0.05, 0.05), [cx, PL.y1, z]));
      P.push(at(new THREE.BoxGeometry(0.05, ph, 0.05), [PL.x0, cy, z]), at(new THREE.BoxGeometry(0.05, ph, 0.05), [PL.x1, cy, z]));
      for (const [x, y] of [[PL.x0 + 0.08, PL.y0 + 0.1], [PL.x1 - 0.08, PL.y0 + 0.1], [PL.x0 + 0.08, PL.y1 - 0.1], [PL.x1 - 0.08, PL.y1 - 0.1]]) P.push(at(new THREE.SphereGeometry(0.03, 8, 6), [x, y, z]));
      still.push(onto(at(new THREE.BoxGeometry(pw, ph, 0.06), [cx, cy, z - 0.04]), 'plate')); } // (the plate on its own board's face)
    for (const y of [1.25, 3.1]) P.push(at(new THREE.TorusGeometry(0.215, 0.02, 6, 28), [0, y, 0], [Math.PI / 2, 0, 0]));
    P.push(at(new THREE.CylinderGeometry(0.24, 0.2, 0.14, 28), [0, 0.44, 0]));
    P.push(at(new THREE.CylinderGeometry(0.05, 0.09, 0.12, 16), [0, 4.42, 0]), at(new THREE.SphereGeometry(0.05, 12, 8), [0, 4.51, 0]));
    const BX = [-0.8, -1.16], BY = 1.18, BH = 0.62, BZ = -0.22;
    for (const x of BX) { for (const y of [BY - 0.02, BY + BH + 0.02]) P.push(at(new THREE.BoxGeometry(0.33, 0.05, 0.33), [x, y, BZ])); P.push(at(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 10), [x, BY + BH + 0.07, BZ])); }
    P.push(at(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), [-0.98, 1.1, -0.22], [0, 0, Math.PI / 2]));
    still.push(onto(mergeGeometries(P), 'brass'));
    // the valve wheel (turned open while the Bottles feed), on its own
    { const w = [at(new THREE.TorusGeometry(0.07, 0.014, 6, 20)), at(new THREE.BoxGeometry(0.14, 0.014, 0.014))];
      this.valveM = add(onto(mergeGeometries(w), 'brass'), body); this.valveM.position.set(-0.98, 0.88, -0.12); }
    // the plinth: clay glazed in the window colour, and its step
    still.push(onto(at(roundBox(3.24, 0.8, 0.9, 0.07), [-0.62, -0.88, 0]), 'glaze', true), onto(at(roundBox(1.2, 0.14, 0.7, 0.04), [0, -0.42, 0]), 'glaze', true)); // (widened left for the cube plate)
    add(mergeGeometries(still), body); still.forEach((g) => g.dispose()); this.skin();
    // the count: the VFD's face and its glass
    this.vfdC = cv(512, 160); this.vfdT = tex(this.vfdC);
    add(new THREE.PlaneGeometry(1.66, 0.52), basic(0xffffff, { map: this.vfdT })).position.set(0, -0.88, 0.6);
    glasses.push(glassOf(at(new THREE.CylinderGeometry(0.31, 0.31, 1.72, 28, 1, true), [0, -0.88, 0.6], [0, 0, Math.PI / 2], [1, 1, 0.62]), 0.03, 0.45));
    // the cube plate: its Nixie window (the cube and the balance: vfx/lachrimeter/cubeplate.js) and its glass
    this.cubePlate = new CubePlate(); this.cubeT = tex(this.cubePlate.canvas);
    add(new THREE.PlaneGeometry(PLATE_W, PLATE_H), basic(0xffffff, { map: this.cubeT })).position.set(CP.x, -0.88, 0.6);
    glasses.push(glassOf(at(new THREE.CylinderGeometry(0.27, 0.27, CP.len, 24, 1, true), [CP.x, -0.88, 0.6], [0, 0, Math.PI / 2], [1, 1, 0.62]), 0.03, 0.45));
    // the bulb: the pool's base, and its glass
    this.bulb = add(new THREE.SphereGeometry(0.37, 36, 24), B(labo({ gain: 1.15, t: 1.3 })));
    glasses.push(glassOf(at(new THREE.SphereGeometry(0.42, 36, 24))));
    // the column's glass, and the expansion chamber's (one mesh)
    glasses.push(glassOf(mergeGeometries([at(new THREE.CylinderGeometry(0.2, 0.2, 3.6, 32, 1, true), [0, 2.1, 0]), at(new THREE.SphereGeometry(0.26, 32, 20), [0, 4.12, 0])]), 0.045, 0.6));
    // the column's Lachryma (a unit cylinder, stretched), its glow sheath, the pale stretch and its front, the meniscus, its line and glow
    this.col = add(new THREE.CylinderGeometry(BORE, BORE, 1, 20), L(lum({ t: 4.3 })));
    this.sheath = add(new THREE.CylinderGeometry(0.19, 0.19, 1, 20, 1, true), basic(0x5c58ff, { transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }), 3);
    this.pale = add(new THREE.CylinderGeometry(BORE, BORE, 1, 20), L(lum({ t: 1, pale: 0.72 })));
    this.front = add(new THREE.TorusGeometry(BORE + 0.012, 0.014, 6, 24), basic(0xe8f6ff)); this.front.rotation.x = Math.PI / 2;
    this.men = add(new THREE.SphereGeometry(BORE, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), L(lum({ t: 2, gain: 1.5 }))); this.men.scale.y = 0.45;
    this.menLine = add(new THREE.TorusGeometry(BORE + 0.004, 0.016, 6, 32), basic(0xf4fff8), 7); this.menLine.rotation.x = Math.PI / 2;
    // (the meniscus's glow: a quad turned to the eye each frame, as a sprite would be, in the one shader)
    this.glow = add(new THREE.PlaneGeometry(1, 1), basic(0xbfe8ff, { map: tex(glowC), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }), 8); this.glow.scale.set(0.9, 0.5, 1);
    // the etched ticks: a long one each 25%, a short one each 5%; dimmed above the cap
    { const G = []; for (let i = 0; i <= 20; i++) { const maj = i % 5 === 0, g = at(arcTube(0.203, yOf(i / 20), maj ? Math.PI * 0.95 : Math.PI * 0.45, maj ? 0.007 : 0.0045)), n = g.attributes.position.count;
        g.setAttribute('aP', new THREE.Float32BufferAttribute(new Float32Array(n).fill(i / 20), 1)); g.setAttribute('aMaj', new THREE.Float32BufferAttribute(new Float32Array(n).fill(maj ? 1 : 0), 1)); G.push(g); }
      this.tickU = { value: 1 };
      add(mergeGeometries(G), overlayShader(TICK, { uCap: this.tickU }, { cull: 1, depthWrite: false }), 4); }
    // the held stretch: the crazed sleeve (a unit cylinder from its foot) and the cracked clay seal at the cap line
    { const g = new THREE.CylinderGeometry(0.208, 0.208, 1, 32, 1, true); g.translate(0, 0.5, 0);
      this.sleeve = add(g, overlayStd(ENV, { map: crazeT, opacity: 0.88, roughness: 0.85, metalness: 0, envMapIntensity: 0.3 }), 5);
      this.seal = add(new THREE.TorusGeometry(0.212, 0.024, 6, 32), overlayStd(ENV, { color: 0x8a4a30, roughness: 0.9, map: crazeT, envMapIntensity: 0 })); this.seal.rotation.x = Math.PI / 2; }
    // a cost: the gold tick and its bar down from the meniscus
    this.costTick = add(arcTube(0.22, 0, Math.PI * 1.1, 0.011), basic(0xf2c35a), 6);
    { const g = new THREE.BoxGeometry(0.012, 1, 0.012); g.translate(0, -0.5, 0); this.costBar = add(g, basic(0xf2c35a, { transparent: true, opacity: 0.7 })); this.costBar.position.set(0.245, 0, 0.06); }
    // brimming: the chamber's swirl and the neck full
    this.chamber = add(new THREE.SphereGeometry(0.17, 28, 18), B(labo({ t: 4, swirl: 1, gain: 1.8 })));
    this.neck = add(new THREE.CylinderGeometry(BORE, BORE, 0.4, 14), L(lum({ t: 5, gain: 1.3 }))); this.neck.position.y = 3.85;
    // the Lachrymato Bottles: their liquid (a unit box from its foot) and their glass, on the rack
    this.bottles = BX.map((x, i) => {
      const g = new THREE.BoxGeometry(0.25, 1, 0.25); g.translate(0, 0.5, 0);
      const liq = add(g, B(labo({ t: 6 + i, gain: 1.3 }))); liq.position.set(x, BY + 0.02, BZ);
      const gl = glass(glassOf(new THREE.BoxGeometry(0.3, BH, 0.3), 0.06, 0.5)); gl.position.set(x, BY + BH / 2, BZ);
      return { liq, gl };
    });
    // the feed: its glass tube down to the bulb, the Lachryma in it, drops running down, a ring where it enters
    const curve = (this.curve = new THREE.CatmullRomCurve3([[-0.98, 1.08, -0.22], [-0.98, 0.78, -0.16], [-0.82, 0.36, -0.04], [-0.56, 0.12, 0.02], [-0.38, 0.04, 0.03]].map((p) => new THREE.Vector3(...p))));
    glasses.push(glassOf(at(new THREE.TubeGeometry(curve, 32, 0.036, 8, false)), 0.06, 0.6));
    glass(mergeGeometries(glasses)); glasses.forEach((q) => q.dispose());
    this.feed = add(new THREE.TubeGeometry(curve, 32, 0.02, 6, false), B(labo({ t: 8, gain: 1.5 })));
    { const d = new THREE.SphereGeometry(0.03, 8, 6).toNonIndexed(); this.dropN = d.attributes.position.count; this.dropAt = d.attributes.position.array.slice(); // (three drops, one mesh: placed each frame)
      this.drops = add(mergeGeometries([d, d.clone(), d.clone()]), basic(0xcff0ff), 3); this.drops.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage); d.dispose(); }
    this.entry = add(new THREE.TorusGeometry(0.06, 0.01, 6, 20), basic(0xbfe8ff)); this.entry.position.set(-0.37, 0.04, 0.05); this.entry.rotation.y = -1.2;
    // the Blink's pearls on their rail beside the column (vfx/lachrimeter/blinkpearls.js)
    this.pearls = new BlinkPearls({ inst, uInst: U, body, onto, at, glassOf, glassB, glassF,
      kind: (u) => overlayShader(PEARL, u, { cull: 0 }), flat: () => basic(0xffffff, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }) });

    // the words beside it, in root space (CSS px, never turned): the held stretch's tag, a cost's count
    const plane = (map, o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic(0xffffff, { map, depthTest: false, depthWrite: false })); m.renderOrder = 20 + o; m.frustumCulled = false; m.visible = false; root.add(m); return m; };
    this.tagC = cv(8, 8); this.tag = plane(this.tagT = tex(this.tagC), 0);
    this.costC = cv(40 * K, 18 * K); this.costLab = plane(this.costT = tex(this.costC), 1);
    this.A = { held: new THREE.Vector3(), cost: new THREE.Vector3() };
    this.plateLook = PLATE_STOCK;
    this.skinParts = { glassTint: tint.value, inst, env: ENV, brassC: this.brassC, body, BX, BY, BH, BZ, PL, CP, drawPlate: (L) => { this.plateLook = L; drawPlate(this.plateC, L); this.skin(); },
      orm: (k, r, m) => { const [x0, y0, w, h] = SKIN[k], x = this.ormC.getContext('2d'); x.fillStyle = `rgb(255,${Math.round(r * 255)},${Math.round(m * 255)})`; x.fillRect(x0 / 8, y0 / 8, w / 8, h / 8); this.ormT.needsUpdate = true; } };
  }

  // ---------- each frame it may be drawn ----------
  update(dt, slot) {
    const g = this.game, pool = g.lachryma, root = this.root;
    const allowed = !!pool && !g.title?.active && !g.god?.controlling && !document.body.classList.contains('bztable-seated');
    if (!allowed) { this.shown = 0; root.userData.overlayHidden = true; return; }
    this.t += dt;
    // shown while the pool is doing something: not full, held for a charge, or moved in the last few real seconds
    let held = 0; for (const v of this.holds.values()) held += v; // (what the tool in hand would cost, shown before it is spent: reserve())
    const avail = pool.available, reserved = pool.reserved, max = pool.max, shownHeld = Math.min(held, avail); // (a hold is still in the pool: it pales the column's top, it does not lengthen it)
    if (Math.abs(avail - this.lastAvail) > 0.01 || reserved > 0 || held > 0) { this.lastAvail = avail; this.quiet = 0; }
    this.quiet += dt;
    const cubes = g.cubes?.balance ?? 0; if (cubes !== this.lastCubes) { if (this.lastCubes >= 0) this.quiet = 0; this.lastCubes = cubes; } // (the cubes changed: it stands a few real seconds, as a gain does)
    const blink = this.blinkOf(), combat = g.combat ? !!g.combat.engaged : true, blinkBack = !!blink && combat && blink.n < blink.max; // (a charge coming back in a fight)
    const want = avail < max - 0.5 || this.quiet < QUIET || reserved > 0 || held > 0 || blinkBack || g.spiritualLink?.state?.owner ? 1 : 0; // (a tool UI on the link holds it up: the tool draws from the pool it is tied to)
    this.shown += (want - this.shown) * Math.min(1, dt * (want ? 7 : 3));
    if (!want && this.shown < 0.01) this.shown = 0;
    root.userData.overlayHidden = this.shown <= 0;
    this.state.shown = this.shown;
    if (this.shown <= 0) return;

    // where it stands (CSS px), and how big: 32 lines a unit at the 480-line present
    // (on touch the HUD layout's box instead, keyed to the safe area's shorter side: up the right edge under the Sight, or left of the
    //  cluster where a phone on its side has no room there; ui/hudlayout.js)
    const P = g.hudLayout?.touch ? g.hudLayout.place('lachrimeterTube') : null;
    const H = slot.view.h || innerHeight, lineP = P ? P.scale : H / 480, s = LINES * lineP, e = this.shown * this.shown * (3 - 2 * this.shown);
    this.pubW = Math.round(WIDE * s + 12); // (its width, for what stands left of it: the psygun's cylinder)
    if (P) { // (the bulb inside its box: the plinth's left end WIDE - RIGHT units left of it, its top HEIGHT - FOOT units above; it steps back off the nearer edge)
      const low = P.y + P.h > slot.view.h * 0.75;
      slot.x = P.x + (WIDE - RIGHT) * s - slot.view.w + (low ? 0 : (1 - e) * (P.w + CLEAR));
      slot.y = P.y + (HEIGHT - FOOT) * s - slot.view.h + (low ? (1 - e) * (HEIGHT * s + GAP * lineP) : 0);
    } else {
      slot.x = -(CLEAR + RIGHT * s);
      slot.y = -(GAP * lineP + FOOT * s) + (1 - e) * (HEIGHT * s + GAP * lineP); // (it stands at the corner's foot, and sinks into the corner as it steps back)
    }
    this.inst.scale.setScalar(s);

    // the numbers: the tube is the pool's uncapped size, the column the pool, the pale stretch what a charge holds
    const C = capOf(pool), full = Math.max(1, C.held > 0 ? C.full : max), cap = Math.min(1, max / full);
    const level = Math.min((avail + reserved) / full, cap), charge = Math.min(level, (reserved + shownHeld) / full);
    this.lvl = this.lvl < 0 ? level : this.lvl + (level - this.lvl) * Math.min(1, dt * 12);
    this.ch += (charge - this.ch) * Math.min(1, dt * 12);
    const brimming = !!g.courierMind?.brimming;
    this.brim += ((brimming ? 0.9 : 0) - this.brim) * Math.min(1, dt * (brimming ? 6 : 2));
    if (this.heard !== pool) { this.heard = pool; pool.on?.('gain', () => { this.flare = 1; }); } // (Lachryma came in: the meniscus flares)
    this.flare = Math.max(0, this.flare - dt * 3);
    Object.assign(this.state, { level, full, held: C.held, charge, brim: this.brim });

    // the column, its pale stretch and the meniscus
    const lvl = this.lvl, brimK = Math.min(1, this.brim * 4), top = yOf(lvl) + (3.92 - yOf(lvl)) * brimK, ch = this.ch > 0.002 ? this.ch : 0;
    const pb = ch > 0 ? Math.min(top, yOf(Math.max(0, lvl - ch))) : top;
    const set = (m, y0, y1) => { const h = Math.max(0.001, y1 - y0); m.scale.y = h; m.position.y = (y0 + y1) / 2; };
    set(this.col, 0.3, pb); set(this.sheath, 0.3, top);
    this.pale.visible = this.front.visible = ch > 0; if (ch > 0) { set(this.pale, pb, top); this.front.position.y = pb; }
    const menOn = brimK < 0.98;
    this.men.visible = this.menLine.visible = this.glow.visible = menOn;
    this.men.position.y = this.menLine.position.y = top; this.glow.position.y = top + 0.02;
    this.men.material.uniforms.uPale.value = ch > 0 ? 0.72 : 0;
    this.glow.scale.set(0.9 * (1 + this.flare * 0.6), 0.5 * (1 + this.flare * 0.6), 1); this.glow.quaternion.copy(this.turnBack); // (to the eye, as a sprite)
    // the held stretch, above the cap
    if (cap < 0.999) { const y = yOf(cap), h = Y1 - y + 0.12; this.sleeve.visible = this.seal.visible = true; this.sleeve.position.y = y; this.sleeve.scale.y = h; this.seal.position.y = y; this.A.held.set(-0.21, y + h / 2, 0); } else this.sleeve.visible = this.seal.visible = false;
    if (Math.abs(cap - this.keys.cap) > 1e-4) { this.keys.cap = cap; this.tickU.value = cap; }
    // brimming: the chamber and the neck
    this.chamber.visible = this.neck.visible = this.brim > 0.01;
    if (this.chamber.visible) { const k = Math.cbrt(this.brim); this.chamber.scale.setScalar(k); this.chamber.position.y = 4.1 - (0.17 - 0.17 * k); }
    // a cost: the next shot's, while the psygun is out
    const gun = g.weapon, gunOut = !!gun && (gun.drawT > 0.05 || !!gun.wantShell);
    const costN = gunOut ? pool.cost?.(T.lachryma.shotCost, 'shot') ?? T.lachryma.shotCost : 0, cost = costN / full;
    this.state.cost = costN;
    this.costTick.visible = this.costBar.visible = cost > 0;
    let costY = 0, short = false;
    if (cost > 0) {
      const yy = lvl - ch - cost; short = avail < costN - 1e-6; costY = short ? Math.max(0.2, yOf(yy)) : yOf(yy);
      const r = short ? 0.28 / 0.22 : 1; this.costTick.scale.set(r, 1, r); this.costTick.position.y = costY;
      const col = short ? 0xd0453a : 0xf2c35a; this.costTick.material.color.setHex(col); this.costBar.material.color.setHex(col);
      this.costBar.position.y = pb; this.costBar.scale.y = Math.max(0.001, pb - costY);
      this.A.cost.set(0.28 * r, costY, 0);
    }
    // the Bottles: what they hold, and the feed below half
    const box = g.pneuka, fitted = box?.fitted?.('bottle') || [], uses = box?.uses?.bottle || [];
    let feeding = false;
    this.bottles.forEach((b, i) => {
      const id = fitted[i], B = id && BOTTLES[id], f = B ? Math.max(0, Math.min(1, (uses[i] || 0) / B.capacity)) : 0;
      b.gl.visible = !!B; b.liq.visible = f > 0.005; if (b.liq.visible) b.liq.scale.y = 0.62 * f * 0.92;
      if (B && f > 0 && avail / max < 0.5) feeding = true;
    });
    this.state.feeding = feeding;
    this.valve += ((feeding ? 1 : 0) - this.valve) * Math.min(1, dt * 4); this.valveM.rotation.y = (1 - this.valve) * Math.PI / 2;
    this.feed.visible = this.drops.visible = this.entry.visible = feeding;
    if (feeding) { this.feedT += dt * 0.6; const P = this.drops.geometry.attributes.position, A = P.array, B = this.dropAt, n = this.dropN;
      for (let i = 0; i < 3; i++) { this.curve.getPoint((this.feedT + i / 3) % 1 * 0.9 + 0.08, V1); for (let v = 0; v < n; v++) { const o = (i * n + v) * 3; A[o] = B[v * 3] + V1.x; A[o + 1] = B[v * 3 + 1] + V1.y; A[o + 2] = B[v * 3 + 2] + V1.z; } }
      P.needsUpdate = true; }
    // the Lachryma alive: the schiller turning slowly
    for (const m of this.mats.labo) m.uniforms.uT.value += dt * 0.12;
    for (const m of this.mats.lum) m.uniforms.uT.value += dt * 0.25;

    // the window colour: the plinth's glaze
    if (theme.id !== this.keys.theme) { this.keys.theme = theme.id; this.glazeTheme(); this.keys.tag = ''; }
    // the count, redrawn only when it changes
    const count = `${Math.floor(avail)} / ${Math.round(full)}`;
    if (count !== this.keys.count) { this.keys.count = count; drawVfd(this.vfdC, count); this.vfdT.needsUpdate = true; }
    if (this.cubePlate.update(dt, cubes)) this.cubeT.needsUpdate = true; // (the cubes' count, rolling: redrawn only while it moves)

    // placed for this frame (the overlay places the root after this; done here too, so the shaders' instrument space is this frame's)
    root.position.set(slot.view.w + slot.x, -(slot.view.h + slot.y), slot.z);
    root.updateMatrixWorld(true); this.inst.updateMatrix(); this.pitch.updateMatrix();
    this.uInst.value.copy(this.inst.matrixWorld).invert();
    this.inst.getWorldQuaternion(this.turnBack).invert();
    this.pearls.update(dt, blink, combat, this.turnBack); this.state.pearls = this.pearls.state; this.skinTick?.(dt);
    this.words(C, full, cap, cost > 0 ? costN : 0, short, lineP);
  }

  /** The atlas drawn again from its three canvases (at build, a change of window colour, the fonts in). */
  skin() { if (!this.skinC) return; const x = this.skinC.getContext('2d'); for (const [k, c] of [['plate', this.plateC], ['glaze', this.glazeC], ['brass', this.brassC]]) { const [x0, y0, w, h] = SKIN[k]; x.drawImage(c, x0, y0, w, h); } this.skinT.needsUpdate = true; }

  /** The plinth's glaze in the window colour (ui/theme.js): its top as the base, its frame's light and dark mottled through. */
  glazeTheme() {
    const t = THEMES[theme.id] || THEMES.verdigris;
    mottle(this.glazeC, rgb(t.top), [[t.mid, 0.5], [rgb(t.bot), 0.6], [t.hi, 0.3], ['#3c2a1c', 0.25]], 90);
    this.skin();
  }

  /** The words beside it: the held stretch's tag (what holds it, and where it mends) and the cost's count, each a canvas redrawn on change. */
  words(C, full, cap, costN, short, lineP) {
    const toRoot = (v) => V1.copy(v).applyMatrix4(this.inst.matrix).applyMatrix4(this.pitch.matrix);
    // the tag
    let text = '';
    if (cap < 0.999) {
      const pct = Math.round((1 - cap) * 100), by = C.by.filter((b) => b.held > 0);
      const cracks = by.find((b) => b.source === 'cracks'), n = cracks ? Math.round(cracks.held / full / 0.05) : 0;
      const what = by.map((b) => (b.source === 'cracks' ? `${n} CRACK${n === 1 ? '' : 'S'}` : String(b.source || 'CAP').toUpperCase())).join(' · ');
      text = `HELD ${pct}% · ${what}${cracks ? ' · MEND: KILN' : ''}`; // (PLACEHOLDER: "KILN" is Anagami's finishing station; another island's waits on REGISTERS.md)
    }
    this.tag.visible = !!text;
    if (text) {
      if (text !== this.keys.tag) { this.keys.tag = text; this.drawTag(text); }
      const p = toRoot(this.A.held), w = this.tagC.width / K, h = this.tagC.height / K;
      this.tag.scale.set(w * lineP, h * lineP, 1);
      this.tag.position.set(p.x - (w / 2 - 1) * lineP, p.y + (h / 2 - 1) * lineP, 300);
    }
    // the cost's count
    this.costLab.visible = costN > 0;
    if (costN > 0) {
      const key = `${Math.ceil(costN)}${short ? '!' : ''}`;
      if (key !== this.keys.cost) { this.keys.cost = key; this.drawCost(String(Math.ceil(costN)), short ? '#e0604f' : '#f2c35a'); }
      const p = toRoot(this.A.cost), w = this.costC.width / K, h = this.costC.height / K;
      this.costLab.scale.set(w * lineP, h * lineP, 1);
      this.costLab.position.set(p.x + (w / 2 + 3) * lineP, p.y - 1 * lineP, 300);
    }
  }

  /** A small System window (the window colour's fill, the schiller's frame) and its leader, one bend, to the held stretch: drawn in
   *  lines, K texture pixels a line; the anchor at the canvas's lower right. */
  drawTag(text) {
    const t = THEMES[theme.id] || THEMES.verdigris, px = 14 * K, c = this.tagC;
    let x = c.getContext('2d'); x.font = `${px}px ${FONT.sys}`;
    const tw = Math.ceil(x.measureText(text).width), pad = Math.round(px * 0.5), w = tw + pad * 2, h = px + pad * 2 - 2 * K, cut = Math.round(px * 0.45);
    const LD = 70 * K, DY = 25 * K; // (the leader: across, then down to the anchor)
    c.width = w + LD + 2 * K; c.height = h / 2 + DY + 2 * K + 2;
    x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.font = `${px}px ${FONT.sys}`;
    const lw = K, ax = c.width - 1.5 * K, ay = c.height - 1.5 * K, ty = 1, tx = 1, ey = ty + h / 2;
    const film = (a, b) => { const g = x.createLinearGradient(a[0], a[1], b[0], b[1]); ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80'].forEach((col, i) => g.addColorStop(i / 3, col)); return g; };
    x.lineWidth = lw; x.strokeStyle = film([tx + w, ey], [ax, ay]);
    x.beginPath(); x.moveTo(tx + w, ey); x.lineTo(ax - px * 0.9, ey); x.lineTo(ax - px * 0.35, ay); x.lineTo(ax, ay); x.stroke();
    x.strokeStyle = '#f2b82e'; const sq = Math.round(px * 0.3); x.strokeRect(ax - sq / 2 - K, ay - sq / 2 - K / 2, sq, sq);
    const path = () => { x.beginPath(); x.moveTo(tx + cut, ty); x.lineTo(tx + w, ty); x.lineTo(tx + w, ty + h - cut); x.lineTo(tx + w - cut, ty + h); x.lineTo(tx, ty + h); x.lineTo(tx, ty + cut); x.closePath(); };
    path(); const g = x.createLinearGradient(0, ty, 0, ty + h);
    g.addColorStop(0, `rgba(${t.top},.96)`); g.addColorStop(0.18, `rgba(${t.top},.95)`); g.addColorStop(0.82, `rgba(${t.bot},.95)`); g.addColorStop(1, `rgba(${t.top},.96)`); x.fillStyle = g; x.fill();
    x.strokeStyle = film([tx, ty], [tx + w, ty + h]); path(); x.stroke();
    x.globalAlpha = 0.55; x.strokeStyle = t.mid; x.strokeRect(tx + 2 * lw + 0.5, ty + 2 * lw + 0.5, w - 4 * lw - 1, h - 4 * lw - 1); x.globalAlpha = 1;
    x.fillStyle = t.hi; x.textBaseline = 'middle'; x.fillText(text, tx + pad, ty + h / 2 + K);
    this.tagT.dispose(); this.tagT = this.tag.material.uniforms.uMap.value = tex(c); // (the canvas changed size: a fresh texture)
  }

  /** A cost's count beside its tick, in the System's count face, gold (red when it cannot be paid). */
  drawCost(text, col) {
    const c = this.costC, x = c.getContext('2d'), px = 14 * K;
    x.clearRect(0, 0, c.width, c.height); x.font = `${px}px ${COUNT_FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.lineWidth = Math.max(2, px / 7); x.strokeStyle = '#17111f'; x.strokeText(text, 2, c.height / 2); x.fillStyle = col; x.fillText(text, 2, c.height / 2);
    this.costT.needsUpdate = true;
  }
}
