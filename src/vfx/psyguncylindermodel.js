// ---------------------------------------------------------------------------------------
// THE PSYGUN'S CYLINDER, ITS MODEL AND ITS READOUTS (board v9, signed off by the owner 2026-10-18; OVERLAY.md 10.5g and 18): the made
// object the cylinder's beats (vfx/psyguncylinder.js) pose, built once a psygun from its kind (tools/psygun/kinds.js): a case-hardened
// steel cylinder whose SHAPE is its chamber count (one fat drum for the Bombardier, a triangle for the Carbine, a pentagon for the
// Pentagun, a hexagon for THE PSYGUN, a hexagon round a heart for the Pepperbox), a verdigris band in the window colour (ui/theme.js),
// brass studs; in each bore a brass case head, a ring of the labradorite light in its shell's colour (a tier IV's crazed) and a glazed
// cap with its glyph keylined dark; round each bore a ring of pips, its depth; the frame that does not turn (the top strap with its
// slit, the brass pawl, the hammer, the link's brass eye; the bottom strap the crane hangs in); the spent case and its glint. Beside it,
// two small canvases drawn in lines of the 480-line present: the PLATE (the chosen shell's glyph, its label reeling, its count rolling
// in fixed cells, x2 on a doubled heart) and the VESSEL INSET (the regions the Caster's toll would crack, glinting).
// Every look is a kind of the overlay's one shader (vfx/lachrimetertube.js `overlayKind`) or its one lit set-up (`overlayStd`), so the
// cylinder adds no shader program of its own.
//
// Prior art: the mock (scratchpad r9-cylinder: build(), filmMat, capMat, depthMat, drawPlate, drawVessel), ported to the overlay's
// scene; the LeMat revolver (1856: nine round a grapeshot barrel); the Colt and Smith & Wesson swing-out crane (1889, 1896); the
// single-action's hand and pawl; colour case-hardening on a Single Action Army's frame; Destiny's ammo pips for depth as fill.
//
//   buildCylinder(V, ids, env) -> B   V = layoutOf(gun): { n, shape, round, d, rc, heart: { rc } | null, solo }   ids: shell id a chamber
//     B.mount (the posed root: crane > tilt > spin), B.ch[i] { g, ring, cap, fl, depth, mouth, rc, p }, B.sel, B.pawl, B.hammer, B.eye,
//     B.heartG, B.puff, B.case, B.glint, B.band (the glaze), B.dispose()
//   CYL_T (the shared time uniform)   SHELL_GLYPH (who has a drawn glyph)   drawPlate(canvas, P, time)   drawInset(canvas, lit, cracks, time)
//   buildPentacle(B) -> B.pent (the Pentagun's five points, its star and circle)   posePentacle(pent, lit, star, circ, a)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayKind, overlayShader, overlayStd } from './lachrimetertube.js';
import { SHELL_COLOR } from '../pneuka/thingmodels.js';
import { SHELL_TYPES } from '../tools/psygun/shells.js';
import { FONT } from '../ui/theme.js';

const TAU = Math.PI * 2;
export const F = 0.28; // (the cylinder's face, z, in its own units: radius 1)
export const K = 2; // (canvas pixels a line of the present, for the plate and the inset)
const COUNT_FONT = `'Jersey 15', ${FONT.sys}`;
export const colourOf = (id) => SHELL_COLOR[id] ?? 0xcccccc; // (a shell without a colour wears the default grey, as its model does)
const v3 = (hex) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255); // (sRGB as given: the kind takes it to linear)

// ---------- the cylinder's kind of the overlay's one shader. uCyPart: 0 the light's ring (a tier IV's crazed), 1 a cap (its glyph),
// 2 the depth pips, 3 a glow (additive), 4 a flat dark (a bore, its mouth). Colours in sRGB, taken to linear at the end. ----------
export const CYL_T = { value: 0 };
const CYL = overlayKind('cylinder', {
  fdecl: `uniform float uCyT,uCyPart,uCyGlow,uCySeed,uCyMix,uCyCrack,uCyGrey,uCyCount,uCyMax,uCyR0,uCyR1,uCyA;uniform vec3 uCyCol;uniform sampler2D uCyTex;
vec3 cyFilm(float s){s=fract(s)*4.;float f=fract(s);f=f*f*(3.-2.*f);vec3 c0=vec3(.298,.059,.702),c1=vec3(.039,.549,.749),c2=vec3(.949,.722,.18),c3=vec3(.851,.102,.502);
if(s<1.)return mix(c0,c1,f);if(s<2.)return mix(c1,c2,f);if(s<3.)return mix(c2,c3,f);return mix(c3,c0,f);}
vec2 cyH2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float cyCraze(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));float d=length(g+cyH2(i+g)-f);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return d2-d1;}`,
  fbody: `vec3 c=vec3(0.);float al=1.;
if(uCyPart<.5){float a=atan(vP.y,vP.x);vec3 f=cyFilm(a*.159+uCyT*.08+uCySeed+length(vP.xy)*.6);c=mix(f,uCyCol,uCyMix)*(.12+.88*uCyGlow)+vec3(1.)*max(0.,uCyGlow-1.2)*.35;
  if(uCyCrack>0.){float e=cyCraze(vP.xy*46.+uCySeed*13.);float ln=1.-smoothstep(.05,.13,e);float hl=smoothstep(.13,.17,e)*(1.-smoothstep(.17,.26,e));
    c=mix(c,vec3(.03,.02,.04),ln*.9*uCyCrack);c+=cyFilm(a*.3+uCyT*.11+.5)*hl*.55*uCyCrack;}
  c=mix(c,vec3(.32,.3,.36)*(.4+.3*uCyGlow),uCyGrey);}
else if(uCyPart<1.5){vec2 d=vUv-.5;float r=length(d)*2.;vec4 g=texture2D(uCyTex,vUv);
  vec3 glaze=uCyCol*(.2+.2*min(uCyGlow,1.5))*(.75+.4*smoothstep(.3,1.,r));vec3 lit=g.rgb*mix(vec3(1.),uCyCol,.2)*(.45+.75*min(uCyGlow,1.8));
  c=mix(glaze,lit,g.a);c+=cyFilm(uCyT*.07+r+uCySeed)*smoothstep(.85,1.,r)*.25*uCyGlow;}
else if(uCyPart<2.5){float w=(length(vP.xy)-uCyR0)/(uCyR1-uCyR0);float a=fract(atan(vP.x,vP.y)/6.2831853+1.);
  float per=uCyMax<=10.?1.:4.;float segs=ceil(uCyMax/per);float s=floor(a*segs),f=fract(a*segs);float lit=clamp(uCyCount/per-s,0.,1.);c=vec3(.05,.035,.06);
  if(f>.1&&f<.9&&w>.2&&w<.8){vec3 on=vec3(1.,.95,.84)*(.6+.55*min(uCyGlow,1.6));vec3 off=vec3(.19,.15,.23);c=mix(off,on,lit)+cyFilm(a+uCyT*.05)*.1*lit;}}
else if(uCyPart<3.5){float r=length(vUv-.5)*2.;c=uCyCol*exp(-r*r*5.)*uCyA+vec3(1.)*exp(-r*r*40.)*uCyA*.6;}
else{c=uCyCol;al=uCyA;}
gl_FragColor=linearToOutputTexel(vec4(pow(max(c,0.),vec3(2.2)),al));`,
});
function cylMat(part, u = {}, o = {}) {
  const U = { uCyT: CYL_T, uCyPart: { value: part }, uCyGlow: { value: 1 }, uCySeed: { value: 0 }, uCyMix: { value: 0 }, uCyCrack: { value: 0 }, uCyGrey: { value: 0 },
    uCyCount: { value: 0 }, uCyMax: { value: 1 }, uCyR0: { value: 0 }, uCyR1: { value: 1 }, uCyA: { value: 1 }, uCyCol: { value: v3(0xffffff) }, uCyTex: { value: null } };
  for (const k in u) U[k].value = u[k];
  return overlayShader(CYL, U, o);
}
const glowMat = (hex) => cylMat(3, { uCyCol: v3(hex), uCyA: 0 }, { blending: THREE.AdditiveBlending, depthWrite: false });

// ---------- the glyphs: a light shape keylined dark (the UI icons' hand), drawn for the founding shells; the rest wear their table's
// glyph as a character (shells.js SHELL_TYPES) until Calissa's icons ----------
const DRAWN = {
  slicer: (x, s, L, F) => { L([[-0.38, -0.14], [0.3, -0.14]]); L([[-0.38, 0.14], [0.3, 0.14]]); x.beginPath(); x.moveTo(0.28 * s, -0.3 * s); x.lineTo(0.5 * s, 0); x.lineTo(0.28 * s, 0.3 * s); x.closePath(); F(); },
  push: (x, s, L) => { L([[-0.36, -0.3], [-0.06, 0], [-0.36, 0.3]]); L([[0.04, -0.3], [0.34, 0], [0.04, 0.3]]); },
  well: (x, s, L, F) => { x.beginPath(); x.arc(0, 0, 0.32 * s, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 0.11 * s, 0, TAU); F(); },
  mark: (x, s, L) => { for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; L([[0, 0], [Math.cos(a) * 0.38, Math.sin(a) * 0.38]]); } },
  bomb: (x, s, L, F) => { x.beginPath(); x.arc(-0.06 * s, 0.08 * s, 0.3 * s, 0, TAU); F(); L([[0.12, -0.14], [0.34, -0.36]]); x.beginPath(); x.arc(0.36 * s, -0.38 * s, 0.07 * s, 0, TAU); F(); },
  ricochet: (x, s, L, F) => { L([[-0.42, 0.24], [-0.18, -0.22], [0.06, 0.24], [0.24, -0.12]]); x.beginPath(); x.moveTo(0.44 * s, -0.44 * s); x.lineTo(0.12 * s, -0.3 * s); x.lineTo(0.34 * s, -0.06 * s); x.closePath(); F(); },
  homing: (x, s, L, F) => { L([[0, -0.38], [0.32, 0], [0, 0.38], [-0.32, 0], [0, -0.38]]); x.beginPath(); x.arc(0, 0, 0.1 * s, 0, TAU); F(); },
  paint: (x, s) => { for (const y of [-0.24, 0, 0.24]) { x.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, px = (-0.4 + 0.8 * u) * s, py = (y + Math.sin(u * TAU) * 0.07) * s; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); } },
  plain: (x, s, L, F) => { x.beginPath(); x.arc(0, 0, 0.2 * s, 0, TAU); F(); },
};
export const SHELL_GLYPH = DRAWN;
function glyph(x, id, s, mode) {
  x.save(); const key = mode === 'key'; x.strokeStyle = x.fillStyle = key ? '#120c18' : '#fff4e2'; x.lineCap = 'round'; x.lineJoin = 'round';
  const w = s * 0.15, kw = s * 0.085; x.lineWidth = key ? w + kw * 2 : w;
  const L = (pts) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s))); x.stroke(); };
  const Fl = () => { x.fill(); if (key) { const lw = x.lineWidth; x.lineWidth = kw * 2; x.stroke(); x.lineWidth = lw; } };
  if (DRAWN[id]) DRAWN[id](x, s, L, Fl);
  else { const ch = SHELL_TYPES.find((t) => t.id === id)?.glyph || '•'; x.font = `${Math.round(s * 0.78)}px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (key) { x.lineWidth = kw * 2.4; x.strokeText(ch, 0, s * 0.03); } else x.fillText(ch, 0, s * 0.03); }
  x.restore();
}
export function glyph2d(x, id, cx, cy, s) { x.save(); x.translate(cx, cy); glyph(x, id, s, 'key'); glyph(x, id, s, 'fill'); x.restore(); }
const GTEX = new Map();
function glyphTex(id) {
  if (GTEX.has(id)) return GTEX.get(id);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.translate(64, 64); glyph(x, id, 100, 'key'); glyph(x, id, 100, 'fill');
  const t = new THREE.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; GTEX.set(id, t); return t;
}

// ---------- the steel: case-hardening's mottle (blues, straws, browns) over a gunmetal ground ----------
let CASE = null;
function caseTex() {
  if (CASE) return CASE;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); let s = 11; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  x.fillStyle = '#3a4250'; x.fillRect(0, 0, N, N);
  const cols = ['#1c3d78', '#3b2a6e', '#b08a3e', '#6e4a2a', '#2a5a7a', '#8a6a9a', '#203048']; x.filter = 'blur(5px)';
  for (let i = 0; i < 90; i++) { x.globalAlpha = 0.55; x.fillStyle = cols[Math.floor(R() * cols.length)]; const r = 7 + R() * 30; x.beginPath(); x.ellipse(R() * N, R() * N, r, r * (0.4 + R() * 0.8), R() * 3, 0, TAU); x.fill(); }
  x.filter = 'none'; x.globalAlpha = 1; for (let i = 0; i < 1500; i++) { x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.08)'; x.fillRect(R() * N, R() * N, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.5, 0.5); t.offset.set(0.5, 0.5);
  return (CASE = t);
}

/** The cylinder's layout from its psygun (kinds.js): the shape and the chambers' ring (the mock's VARS). */
export function layoutOf(gun) {
  const heart = gun.heart != null, n = gun.shape === 'one' ? 0 : heart ? gun.chambers - 1 : gun.chambers;
  if (n === 0) return { n: 0, shape: 0, d: 0, rc: 0.42, heart: { rc: 0.42 }, solo: true };
  const sides = { triangle: 3, pentagon: 5, hexagon: 6, 'hexagon+heart': 6 }[gun.shape] || n;
  const L = { 3: { round: 0.2, d: 0.42, rc: 0.19 }, 5: { round: 0.14, d: 0.56, rc: 0.2 }, 6: { round: 0.12, d: 0.6, rc: 0.19 } }[sides] || { round: 0.12, d: 0.6, rc: 0.17 };
  return { n, shape: sides, ...L, heart: heart ? { rc: 0.2 } : null, solo: false };
}
function shapeFor(V, sc) {
  const s = new THREE.Shape();
  if (!V.shape) { s.absarc(0, 0, sc, 0, TAU, false); return s; }
  const n = V.shape, t = V.round, P = [];
  for (let k = 0; k < n; k++) { const a = Math.PI / 2 + (k * TAU) / n; P.push(new THREE.Vector2(Math.cos(a) * sc, Math.sin(a) * sc)); }
  for (let k = 0; k < n; k++) { const v = P[k], p = P[(k - 1 + n) % n], q = P[(k + 1) % n], a = v.clone().lerp(p, t), b = v.clone().lerp(q, t); if (k === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y); s.quadraticCurveTo(v.x, v.y, b.x, b.y); }
  s.closePath(); return s;
}
const apexOf = (V) => { if (!V.shape) return 1; const n = V.shape, t = V.round, a1 = Math.PI / 2 + TAU / n; return 0.5 * (1 + t * (Math.sin(a1) - 1)) + 0.5; };
export const chamberAt = (V, k) => { const a = Math.PI / 2 - (k * TAU) / V.n; return [Math.cos(a) * V.d, Math.sin(a) * V.d]; };

/** The cylinder for a psygun: `ids` the shell in each chamber (the ring's, then the heart's), `tiers` each one's tier, `env` the overlay's environment. */
export function buildCylinder(V, ids, tiers, env, bandHex) {
  const B = { V, ch: [], geos: [], mats: [] };
  const G = (g) => (B.geos.push(g), g), M = (m) => (B.mats.push(m), m);
  const body = M(overlayStd(env, { map: caseTex(), metalness: 0.86, roughness: 0.3, envMapIntensity: 1.3 }));
  const brass = M(overlayStd(env, { color: 0xd0a64e, metalness: 0.95, roughness: 0.26, envMapIntensity: 1.4 }));
  const blued = M(overlayStd(env, { color: 0x1a2232, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2 }));
  const sleeve = M(overlayStd(env, { color: 0x9aa4b0, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.3 }));
  B.band = M(overlayStd(env, { color: bandHex, roughness: 0.12, metalness: 0, envMapIntensity: 1.1 }, true));
  B.caseMat = M(overlayStd(env, { color: 0xd8ae58, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.5 }));
  const bore = M(cylMat(4, { uCyCol: v3(0x07060a) }));
  const mesh = (geo, mat, parent) => { const m = new THREE.Mesh(G(geo), mat); m.frustumCulled = false; parent.add(m); return m; };
  B.mount = new THREE.Group(); B.rx = 0.16; B.ry = -0.42;
  const ap = apexOf(V), sy = ap + 0.17, by = -(ap + 0.15);
  // the crane: the cylinder swings out on it (its pivot below and left, in the frame's bottom strap), and tilts as it goes
  B.PX = -0.4; B.PY = by; B.crane = new THREE.Group(); B.crane.position.set(B.PX, B.PY, 0); B.mount.add(B.crane);
  B.tilt = new THREE.Group(); B.tilt.position.set(-B.PX, -B.PY, 0); B.crane.add(B.tilt);
  B.spin = new THREE.Group(); B.tilt.add(B.spin);
  const armL = Math.hypot(B.PX, B.PY), arm = mesh(new THREE.BoxGeometry(armL, 0.11, 0.08), blued, B.crane); arm.position.set(-B.PX / 2, -B.PY / 2, F - 0.6); arm.rotation.z = Math.atan2(-B.PY, -B.PX);
  const knuckle = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.36, 16), brass, B.crane); knuckle.rotation.x = Math.PI / 2; knuckle.position.set(0, 0, F - 0.3);
  const pos = []; for (let k = 0; k < V.n; k++) pos.push({ p: chamberAt(V, k), rc: V.rc }); if (V.heart) pos.push({ p: [0, 0], rc: V.heart.rc, heart: true });
  const sh = shapeFor(V, 1); for (const c of pos) { const h = new THREE.Path(); h.absarc(c.p[0], c.p[1], c.rc, 0, TAU, true); sh.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 2, curveSegments: 28 });
  geo.computeBoundingBox(); geo.translate(0, 0, F - geo.boundingBox.max.z); mesh(geo, body, B.spin);
  const band = shapeFor(V, 0.985); band.holes.push(shapeFor(V, 0.92)); const bg = new THREE.ExtrudeGeometry(band, { depth: 0.016, bevelEnabled: false, curveSegments: 28 }); bg.translate(0, 0, F - 0.008); mesh(bg, B.band, B.spin);
  const studs = V.shape || 8; const studG = G(new THREE.SphereGeometry(0.03, 10, 6));
  for (let k = 0; k < studs; k++) { const a = Math.PI / 2 + (k * TAU) / studs + (V.shape ? 0 : TAU / 16), rr = V.shape ? ap * 0.955 : 0.955; const m = new THREE.Mesh(studG, brass); m.position.set(Math.cos(a) * rr, Math.sin(a) * rr, F + 0.008); m.frustumCulled = false; B.spin.add(m); }
  pos.forEach((c, i) => {
    const g = new THREE.Group(); let holder = B.spin; if (c.heart) { holder = new THREE.Group(); B.spin.add(holder); B.heartG = holder; }
    const rw = c.rc - 0.045, id = ids[i], col = colourOf(id), tier = tiers[i] || 1;
    mesh(new THREE.CircleGeometry(c.rc, 28), bore, B.spin).position.set(c.p[0], c.p[1], F - 0.5);
    const lining = mesh(new THREE.CylinderGeometry(rw - 0.003, rw - 0.003, 0.47, 28, 1, true), bore, B.spin); lining.rotation.x = Math.PI / 2; lining.position.set(c.p[0], c.p[1], F - 0.265);
    const mouth = mesh(new THREE.RingGeometry(rw - 0.006, c.rc + 0.005, 32), bore, B.spin); mouth.position.set(c.p[0], c.p[1], F + 0.002);
    const r0 = c.rc * 1.05, r1 = c.rc * 1.42; const depth = mesh(new THREE.RingGeometry(r0, r1, 56), M(cylMat(2, { uCyR0: r0, uCyR1: r1 })), B.spin); depth.position.set(c.p[0], c.p[1], F + 0.004);
    g.position.set(c.p[0], c.p[1], F - 0.035); holder.add(g);
    const head = mesh(new THREE.CylinderGeometry(c.rc * 0.97, c.rc * 0.97, 0.06, 32), brass, g); head.rotation.x = Math.PI / 2;
    const ring = mesh(new THREE.RingGeometry(c.rc * 0.76, c.rc * 0.9, 48), M(cylMat(0, { uCySeed: i * 0.21, uCyCol: v3(col), uCyMix: 0.3, uCyCrack: tier >= 4 ? 1 : 0 })), g); ring.position.z = 0.031; // (a tier IV's ring wears the crackle)
    const cap = mesh(new THREE.CircleGeometry(c.rc * 0.74, 32), M(cylMat(1, { uCyTex: glyphTex(id), uCyCol: v3(col), uCySeed: i * 0.17 })), g); cap.position.z = 0.032;
    if (c.heart && !V.solo) { const sl = mesh(new THREE.CylinderGeometry(c.rc * 0.995, c.rc * 0.995, 0.62, 32, 1, true), sleeve, g); sl.rotation.x = Math.PI / 2; sl.position.z = -0.31; }
    const fl = mesh(new THREE.PlaneGeometry(1, 1), M(glowMat(col)), g); fl.position.z = 0.08; fl.renderOrder = 2;
    B.ch.push({ g, ring, cap, fl, depth, mouth, rc: c.rc, p: c.p, heart: !!c.heart });
  });
  // the frame (it does not turn or swing): the top strap and its slit, the pawl, the hammer, the link's eye; the bottom strap the crane hangs in
  const strapG = G(new THREE.BoxGeometry(0.66, 0.13, 0.34));
  const strap = new THREE.Mesh(strapG, blued); strap.position.set(0, sy, F - 0.2); B.mount.add(strap);
  const strap2 = new THREE.Mesh(strapG, blued); strap2.position.set(-0.1, by, F - 0.2); B.mount.add(strap2);
  B.slit = mesh(new THREE.PlaneGeometry(0.44, 0.026), M(cylMat(0, { uCySeed: 0.3 })), B.mount); B.slit.position.set(0, sy, F - 0.2 + 0.1705);
  B.pawl = new THREE.Group(); B.pawl.position.set(-0.02, ap + 0.12, F + 0.025); B.mount.add(B.pawl);
  const tooth = mesh(new THREE.ConeGeometry(0.05, 0.15, 4), brass, B.pawl); tooth.rotation.z = Math.PI; tooth.position.y = -0.075;
  B.hammer = new THREE.Group(); B.hammer.position.set(-0.2, sy + 0.06, F - 0.12); B.mount.add(B.hammer); // (cocked it leans back; fired it falls across the strap)
  mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), blued, B.hammer).position.y = 0.15;
  mesh(new THREE.BoxGeometry(0.16, 0.07, 0.13), sleeve, B.hammer).position.y = 0.3;
  B.eye = mesh(new THREE.TorusGeometry(0.052, 0.017, 6, 18), brass, B.mount); B.eye.position.set(0.36, sy, F - 0.2);
  B.sel = mesh(new THREE.TorusGeometry(1, 0.055, 8, 56), M(cylMat(0, { uCySeed: 0.6 })), B.mount);
  B.puff = mesh(new THREE.PlaneGeometry(1, 1), M(glowMat(0x6a6274)), B.mount); // (a dull puff: dim, additive) B.puff.renderOrder = 3;
  B.case = mesh(new THREE.CylinderGeometry(V.rc * 0.8, V.rc * 0.8, 0.26, 16), B.caseMat, B.mount); B.case.visible = false; // (the spent case, flicked out on an auto-turn)
  B.glint = mesh(new THREE.PlaneGeometry(1, 1), M(glowMat(0xffe7a8)), B.mount); B.glint.renderOrder = 3;
  B.dispose = () => { for (const g of B.geos) g.dispose(); for (const m of B.mats) m.dispose(); };
  return B;
}

// ---------- the pentacle's points (the Pentagun's: OVERLAY.md 19, board v10 figure 04): a gem at each corner of the pentagon outside its
// chamber, glazed in its damage type's colour (types.js's order from the top, clockwise: Impact bone gold, Ego lapis, Influence rose,
// Illusion the labradorite's blue, Delirium violet), lit as its chamber fires; the star drawn through them in one stroke (0, 2, 4, 1, 3)
// and its circle, on the fifth. On the spin, so they turn with their chambers. ----------
export const PENT_COLS = [0xe9c46a, 0x7f9cff, 0xf2a0b8, 0x9ad8f0, 0xc458d0];
/** The Pentagun's points on a built cylinder `B` (5 chambers): B.pent { gems[k] { base, glow }, strokes[j], circle }. */
export function buildPentacle(B) {
  const V = B.V, G = (g) => (B.geos.push(g), g), M = (m) => (B.mats.push(m), m), r = 0.86, P = [];
  for (let k = 0; k < 5; k++) { const a = Math.PI / 2 - (k * TAU) / 5; P.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const pent = { gems: [], strokes: [], circle: null, P };
  const gemG = G(new THREE.CircleGeometry(0.062, 16)), glowG = G(new THREE.PlaneGeometry(1, 1));
  P.forEach(([x, y], k) => {
    const base = new THREE.Mesh(gemG, M(cylMat(4, { uCyCol: v3(PENT_COLS[k]), uCyA: 1 }))); base.position.set(x, y, F + 0.012); base.frustumCulled = false; B.spin.add(base);
    const glow = new THREE.Mesh(glowG, M(glowMat(PENT_COLS[k]))); glow.position.set(x, y, F + 0.05); glow.scale.setScalar(0.42); glow.renderOrder = 2; glow.frustumCulled = false; B.spin.add(glow);
    pent.gems.push({ base, glow });
  });
  const ord = [0, 2, 4, 1, 3, 0], segG = G(new THREE.PlaneGeometry(1, 0.022));
  for (let j = 0; j < 5; j++) {
    const a = P[ord[j]], b = P[ord[j + 1]], m = new THREE.Mesh(segG, M(cylMat(4, { uCyCol: v3(0xf4ecff), uCyA: 0 }, { blending: THREE.AdditiveBlending, depthWrite: false })));
    m.userData.a = a; m.userData.b = b; m.position.set(0, 0, F + 0.04); m.frustumCulled = false; m.renderOrder = 2; B.spin.add(m); pent.strokes.push(m);
  }
  pent.circle = new THREE.Mesh(G(new THREE.RingGeometry(r - 0.012, r + 0.012, 64)), M(cylMat(4, { uCyCol: v3(0xf4ecff), uCyA: 0 }, { blending: THREE.AdditiveBlending, depthWrite: false })));
  pent.circle.position.set(0, 0, F + 0.04); pent.circle.frustumCulled = false; pent.circle.renderOrder = 2; B.spin.add(pent.circle);
  B.pent = pent; void V;
  return pent;
}
/** The points posed: `lit[k]` 0..1 a gem's light (and its flash over 1), `star` 0..1 the stroke drawn, `circ` 0..1 the circle closed, `a` the whole's fade. */
export function posePentacle(pent, lit, star, circ, a) {
  pent.gems.forEach((G, k) => {
    const l = lit[k] || 0; G.base.material.uniforms.uCyA.value = 1; G.base.material.uniforms.uCyCol.value.copy(v3(PENT_COLS[k])).multiplyScalar(0.35 + 0.65 * Math.min(1, l));
    G.glow.material.uniforms.uCyA.value = Math.min(1.6, l * 0.9); G.glow.scale.setScalar(0.32 + 0.22 * Math.min(2, l));
  });
  pent.strokes.forEach((m, j) => {
    const u = Math.max(0, Math.min(1, star * 5 - j)), [ax, ay] = m.userData.a, [bx, by] = m.userData.b, ex = ax + (bx - ax) * u, ey = ay + (by - ay) * u, len = Math.hypot(ex - ax, ey - ay);
    m.visible = u > 0 && a > 0.01; if (!m.visible) return;
    m.position.set((ax + ex) / 2, (ay + ey) / 2, F + 0.04); m.rotation.z = Math.atan2(by - ay, bx - ax); m.scale.set(Math.max(1e-3, len), 1, 1); m.material.uniforms.uCyA.value = a;
  });
  pent.circle.visible = circ > 0 && a > 0.01; pent.circle.material.uniforms.uCyA.value = a * Math.min(1, circ * 1.5);
}

// ---------- the plate: tenmoku with the System's keyline; the shell's glyph (keylined) on its colour, its label reeling, its count
// rolling in fixed cells, x2 on a doubled heart. Drawn in lines of the present, K canvas pixels a line (110 x 40 lines). ----------
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const eob = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
const filmRGB = (s, a) => { s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, m = f * f * (3 - 2 * f), A = FILM[i], Bc = FILM[(i + 1) % 4]; return `rgba(${A.map((v, k) => Math.round(v + (Bc[k] - v) * m)).join(',')},${a})`; };
const ink = (x, t, px, py, lw) => { x.lineWidth = lw; x.strokeStyle = '#17111f'; x.lineJoin = 'round'; x.strokeText(t, px, py); };
function roll(x, X, cy, size, from, to, u, col, cells, glow) {
  x.save(); x.font = `${size}px ${COUNT_FONT}`; x.textBaseline = 'middle'; x.textAlign = 'center';
  const a = String(from), b = String(to), L = Math.max(cells, a.length, b.length), A = a.padStart(L, ' '), Bs = b.padStart(L, ' ');
  let dw = 0; for (const d of '0123456789') dw = Math.max(dw, x.measureText(d).width); dw = Math.ceil(dw + size * 0.18);
  const dir = to < from ? 1 : -1;
  for (let i = 0; i < L; i++) {
    const uu = cl((u * 0.4 - (L - 1 - i) * 0.05) / 0.35), e = uu >= 1 ? 1 : eob(uu), x0 = X + i * dw, xc = x0 + dw / 2;
    x.save(); x.beginPath(); x.rect(x0, cy - size * 0.62, dw, size * 1.24); x.clip();
    const draw = (ch, y, al) => { if (ch === ' ') return; x.globalAlpha = cl(al); ink(x, ch, xc, y, Math.max(2, size / 6)); if (glow) { x.shadowColor = 'rgba(80,240,190,.8)'; x.shadowBlur = size / 3; } x.fillStyle = col; x.fillText(ch, xc, y); x.shadowBlur = 0; };
    if (A[i] === Bs[i] || uu <= 0) draw(uu > 0 ? Bs[i] : A[i], cy, 1); else { draw(A[i], cy + dir * e * size, 1 - cl(e)); draw(Bs[i], cy + dir * (e - 1) * size, e + 0.2); }
    x.restore();
  }
  x.restore(); return X + L * dw;
}
function reel(x, X, y, size, from, to, u, col) {
  x.save(); x.font = `${size}px ${COUNT_FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left';
  if (from === to || u >= 1) { ink(x, to, X, y, Math.max(2, size / 6)); x.fillStyle = col; x.fillText(to, X, y); x.restore(); return; }
  const e = eob(cl(u)); x.beginPath(); x.rect(X - 3, y - size * 0.62, x.canvas.width - X, size * 1.24); x.clip();
  for (const [t, yy, al] of [[from, y - e * size, 1 - cl(e)], [to, y + (1 - e) * size, cl(e + 0.2)]]) { x.globalAlpha = cl(al); ink(x, t, X, yy, Math.max(2, size / 6)); x.fillStyle = col; x.fillText(t, X, yy); }
  x.restore();
}
/** The plate, its label { from, to, u } of { id, name }, its count { from, to, u } or null, `dbl` the heart's x2. */
export function drawPlate(c, P, time) {
  const s = K, w = 110 * s, h = 40 * s, cut = 5 * s, x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
  x.save(); x.beginPath(); x.moveTo(cut, 0); x.lineTo(w, 0); x.lineTo(w, h - cut); x.lineTo(w - cut, h); x.lineTo(0, h); x.lineTo(0, cut); x.closePath();
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4a2a16'); g.addColorStop(0.55, '#24140c'); g.addColorStop(1, '#120a07'); x.fillStyle = g; x.fill();
  const lg = x.createLinearGradient(0, 0, w, h); for (let i = 0; i < 5; i++) lg.addColorStop(i / 4, filmRGB((i / 4) * 0.8 + time * 0.07, 0.95)); x.strokeStyle = lg; x.lineWidth = s; x.stroke();
  x.globalAlpha = 0.6; x.lineWidth = s * 0.5; x.strokeRect(2.5 * s, 2.5 * s, w - 5 * s, h - 5 * s); x.globalAlpha = 1;
  let sd = 5; const R = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); x.fillStyle = 'rgba(200,190,210,.18)'; for (let i = 0; i < 14; i++) x.fillRect(4 * s + R() * (w - 8 * s), 4 * s + R() * (h - 8 * s), s, s);
  const L = P.label, cur = L.u > 0.5 ? L.to : L.from, gx = 18 * s, gy = 20 * s;
  x.fillStyle = cur.id === 'plain' ? '#2a2236' : `#${new THREE.Color(colourOf(cur.id)).multiplyScalar(0.55).getHexString()}`; x.beginPath(); x.arc(gx, gy, 13 * s, 0, TAU); x.fill();
  x.strokeStyle = '#120c18'; x.lineWidth = 1.4 * s; x.stroke(); glyph2d(x, cur.id, gx, gy, 22 * s);
  reel(x, 36 * s, 11 * s, Math.round(14 * s), L.from.name, L.to.name, L.u, '#e9dcc8');
  if (P.count) {
    const cc = P.count, dead = cc.to === 0 && cc.u >= 1, ex = roll(x, 35 * s, 28 * s, Math.round(20 * s), cc.from, cc.to, cc.u, dead ? '#7a6a8a' : '#8ff5d2', 2, !dead);
    if (P.dbl) { x.font = `${Math.round(12 * s)}px ${COUNT_FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left'; const tw = x.measureText('×2').width; x.fillStyle = '#c9a04a'; x.fillRect(ex + 3 * s, 22 * s, tw + 6 * s, 12 * s); x.fillStyle = '#2a1a0a'; x.fillText('×2', ex + 6 * s, 28.5 * s); }
  }
  x.restore();
}

// ---------- the vessel inset: the Courier's silhouette in clay (36 x 52 lines), its six regions in damage.js's REGIONS order; the
// region the toll would crack glints (every region when the toll would shatter) ----------
const REG = [
  { fill: (x) => { x.beginPath(); x.arc(18, 9, 5, 0, TAU); }, star: [18, 9] }, // mask
  { fill: (x) => { x.beginPath(); x.moveTo(13.5, 15); x.lineTo(22.5, 15); x.lineTo(22, 30); x.lineTo(14, 30); x.closePath(); }, star: [18, 22] }, // torso
  { line: (x) => { x.beginPath(); x.moveTo(12.5, 16); x.lineTo(8.5, 24); x.lineTo(7.5, 31); }, lw: 3, star: [8.5, 24] }, // armL
  { line: (x) => { x.beginPath(); x.moveTo(23.5, 16); x.lineTo(27.5, 24); x.lineTo(28.5, 31); }, lw: 3, star: [27.5, 24] }, // armR
  { line: (x) => { x.beginPath(); x.moveTo(15.5, 30); x.lineTo(14.5, 40); x.lineTo(13.5, 48); }, lw: 3.4, star: [14.5, 40] }, // legL
  { line: (x) => { x.beginPath(); x.moveTo(20.5, 30); x.lineTo(21.5, 40); x.lineTo(22.5, 48); }, lw: 3.4, star: [21.5, 40] }, // legR
];
const CRACKS = [[[15, 7], [18, 10], [17, 12]], [[16, 17], [19, 21], [17, 25], [20, 28]], [[9, 22], [8, 26]], [[27, 22], [28, 26]], [[15, 33], [14.5, 38]], [[21, 33], [21.5, 38]]];
/** `lit` the regions glinting (indices), `cracks` each region's crack (0 whole), `g` the glint's strength. */
export function drawInset(c, lit, cracks, g, T) {
  const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.save(); x.scale(K, K); const w = 36, h = 52;
  x.fillStyle = 'rgba(13,10,18,.82)'; x.fillRect(0, 0, w, h);
  const lg = x.createLinearGradient(0, 0, w, h); for (let i = 0; i < 5; i++) lg.addColorStop(i / 4, filmRGB((i / 4) * 0.8 + T * 0.07, 0.9)); x.strokeStyle = lg; x.lineWidth = 1; x.strokeRect(0.5, 0.5, w - 1, h - 1);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const paint = (r, col, extra = 0) => { if (r.fill) { r.fill(x); x.fillStyle = col; x.fill(); if (extra) { x.lineWidth = extra; x.strokeStyle = col; x.stroke(); } } else { r.line(x); x.lineWidth = r.lw + extra; x.strokeStyle = col; x.stroke(); } };
  for (const r of REG) { (r.fill || r.line)(x); x.strokeStyle = '#17111f'; x.lineWidth = (r.lw || 0) + 2; x.stroke(); }
  for (const r of REG) paint(r, '#b98a62');
  cracks.forEach((k, i) => { if (!(k > 0)) return; x.strokeStyle = '#2a1610'; x.lineWidth = 0.9; x.beginPath(); CRACKS[i].forEach((p, j) => (j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke(); });
  if (g > 0.01) {
    const pulse = 0.6 + 0.4 * Math.sin(T * 7);
    for (const i of lit) {
      const r = REG[i]; x.globalAlpha = g * 0.55 * pulse; x.shadowColor = 'rgba(255,236,170,1)'; x.shadowBlur = 6; paint(r, '#fff1c4', 0.8); x.shadowBlur = 0;
      x.globalAlpha = g * pulse; const [sx, sy] = r.star, rr = 4 + 1.5 * Math.sin(T * 7 + i); x.fillStyle = '#fffbe8';
      x.beginPath(); x.moveTo(sx, sy - rr); x.lineTo(sx + 0.8, sy - 0.8); x.lineTo(sx + rr, sy); x.lineTo(sx + 0.8, sy + 0.8); x.lineTo(sx, sy + rr); x.lineTo(sx - 0.8, sy + 0.8); x.lineTo(sx - rr, sy); x.lineTo(sx - 0.8, sy - 0.8); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
  }
  x.restore();
}
