// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD: its made parts (part of vfx/sondelassguard.js), real meshes in the overlay's own scene, built once in dots (a
// line of the 480-line present) round the guard's heart, x right and y up, the forms along +x of their own axis:
//   the TSUBA       a brass rim (a lathe, its lip rounded so the key light runs round it) round a face of clay glazed in the window
//                   colour (ui/theme.js), a gold crack mended across it (kintsugi); 30 dots across
//   the CUTLASS     the owner's note on board v9 (2026-10-18): "make the blade a little wider and curved like a sabre or cutlass, rather
//                   than too katana-coded". A broad sabre, 90 dots from the guard's heart: its back curving away, the edge on the
//                   convex side, turned INBOARD (the owner, 2026-10-18: the UI's right side is the right hand, so it slashes outside in; the
//                   lines below are drawn with the back on +, and EDGE_IN mirrors them onto the screen's inner side), widening from 7 dots at the guard to 12 near the tip, a swelling belly sweeping up into a clipped point;
//                   a brass knuckle bow out of the guard on the edge's side (the cutlass's own hilt). No habaki, no straight hamon.
//   the ROD         four sections of black-red urushi lacquer that telescope, a brass ferrule at each joint and a guide ring
//   the HOOK        two forged iron sections, and the grapnel: a ring, the shank, its spike and two flukes that open and close
//   the DRUM        the hook form's rope drum: the rim swells into a brass capstan behind the guard, wound with rope, turning as it reels
// Every lit part is one kind of the overlay's one shader (`guard.metal`: a key light from the upper left, a painted room in its
// reflection, a texture where a part has one, and a clip along its own axis so a form slides back into the guard and out of it).
//
// Prior art: the cutlass and the naval sabre (the 1860 pattern's broad curved blade, its clipped point; the shell guard and knuckle bow:
// the guard is the shell here); the tsuba's round plate and its sukashi windows; the tenkara rod's nested lacquered sections; a ship's
// grapnel and capstan; for the look, the mock (r9-sondelass) and the thermometer Lachrimeter (vfx/lachrimetertube.js: its brass and its
// glaze in the window colour).
//
//   const F = buildForms(theme)   F.root (a THREE.Group)   F.tsuba  F.face  F.axis  F.blade  F.bow  F.rod[4]  F.ferrule[4]  F.hook[2]
//   F.grapnel { group, flukes }  F.drum  F.collars { rod, hook }   F.glaze(themeColours) (the face's glaze again)   SABRE (the blade's
//   lines, for the marks along it: edge(s), back(s), hamon(s), U(s) in dots along the axis)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayKind, overlayShader, OVERLAY_WHITE } from '../lachrimetertube.js';

const METAL = overlayKind('guard.metal', {
  fdecl: 'uniform vec3 uSgCol,uSgGlow;uniform float uSgMet,uSgClip,uSgAlpha;uniform sampler2D uSgMap;',
  fbody: `if(vP.x<uSgClip)discard;vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=vec3(0.,0.,1.);
vec3 L=normalize(vec3(-.45,.6,.65));float d=max(dot(N,L),0.);vec3 R=reflect(-V,N);
float e=smoothstep(-.2,.75,R.y);vec3 env=mix(vec3(.07,.05,.08),vec3(1.,.93,.82),e)+vec3(1.,.62,.32)*pow(max(R.x,0.),5.)*.45;
float s=pow(max(dot(N,normalize(L+V)),0.),36.);vec3 b=uSgCol*texture2D(uSgMap,vUv).rgb;
vec3 col=b*(.22+.9*d)*(1.-uSgMet)+b*env*uSgMet*1.15+vec3(s)*(.25+.75*uSgMet)+uSgGlow;
gl_FragColor=linearToOutputTexel(vec4(col,uSgAlpha));`,
});
/** A lit part's material: colour (hex, sRGB), how metal (0..1), a map (sRGB canvas) or none. `.uniforms.uSgClip` its axis clip, `uSgGlow` a flash. */
export function metal(hex, met, map = null) {
  return overlayShader(METAL, { uSgCol: { value: new THREE.Color(hex) }, uSgGlow: { value: new THREE.Color(0, 0, 0) }, uSgMet: { value: met }, uSgClip: { value: -1e9 }, uSgAlpha: { value: 1 }, uSgMap: { value: map || OVERLAY_WHITE } }, { cull: 0 });
}

const BRASS = 0xc39a4a, STEEL = 0xc4ccd2, URUSHI = 0x6e2618, IRON = 0x6a717c;
export const BLADE = { u0: 21, L: 90 }; // (the blade from 21 dots out of the guard's heart, 90 long)
export const EDGE_IN = -1; // (the blade's lines are mirrored across its axis so the edge faces inboard: every v along the blade is times this)
const C = 15; // (the blade's curve: its back 15 dots off the axis at the tip)
const sm = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
/** The sabre's lines along s (0 at the guard, 1 at the point), in dots off its axis (+ the back's side). */
export const SABRE = {
  U: (s) => BLADE.u0 + s * BLADE.L,
  mid: (s) => C * s * s,
  width: (s) => 7 + 5.2 * sm(0, 0.8, s),
  edge(s) { if (s <= 0.84) return this.mid(s) - this.width(s) * 0.56; const e0 = this.mid(0.84) - this.width(0.84) * 0.56, t = (s - 0.84) / 0.16; return e0 + (this.tip - e0) * Math.pow(t, 1.7); },
  back(s) { if (s <= 0.78) return this.mid(s) + this.width(s) * 0.44; const b0 = this.mid(0.78) + this.width(0.78) * 0.44, t = (s - 0.78) / 0.22; return b0 + (this.tip - b0) * t - 1.4 * Math.sin(Math.PI * t); }, // (the clip: a shallow concave run to the point)
  hamon(s) { return s > 0.9 ? this.edge(s) + (this.mid(s) - this.edge(s)) * 0.45 : this.edge(s) + this.width(s) * 0.27 + 0.35 * Math.sin(s * 19); }, // (the temper line rides the edge's curve, a gentle wave)
  get tip() { return C - 0.5; },
};

const v2 = (x, y) => new THREE.Vector2(x, y);
function sabreGeometry() {
  const S = new THREE.Shape(), N = 36;
  for (let i = 0; i <= N; i++) { const s = i / N, p = v2(SABRE.U(s), EDGE_IN * SABRE.edge(s)); i ? S.lineTo(p.x, p.y) : S.moveTo(p.x, p.y); }
  for (let i = N; i >= 0; i--) { const s = i / N; S.lineTo(SABRE.U(s), EDGE_IN * SABRE.back(s)); }
  S.closePath();
  const g = new THREE.ExtrudeGeometry(S, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.9, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -0.3); return g;
}
/** A cylinder along +x from 0 to 1 (scaled to a section's length each frame). */
function rodSeg(r) { const g = new THREE.CylinderGeometry(r, r, 1, 14, 1, false); g.rotateZ(-Math.PI / 2); g.translate(0.5, 0, 0); return g; }
function tube(points, r, seg = 16) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z))), seg, r, 6, false); }

/** The face's glaze: the window colour mottled, the gold crack mended across it (redrawn when the window colour changes). */
function glazeCanvas(c, t) {
  const x = c.getContext('2d'), w = c.width; let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const g = x.createRadialGradient(w * 0.38, w * 0.34, 2, w / 2, w / 2, w / 2);
  g.addColorStop(0, `rgb(${t.bot})`); g.addColorStop(0.7, `rgb(${t.top})`); g.addColorStop(1, t.mid); x.fillStyle = g; x.fillRect(0, 0, w, w);
  for (let i = 0; i < 260; i++) { x.globalAlpha = 0.35; x.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,.6)' : t.hi; x.fillRect(rnd() * w, rnd() * w, 1.5, 1.5); }
  x.globalAlpha = 1; x.strokeStyle = '#f2c35a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, w * 0.6); x.lineTo(w * 0.13, w * 0.58); x.lineTo(w * 0.2, w * 0.65); x.lineTo(w * 0.28, w * 0.63); x.stroke();
}

export function buildForms(themeColours) {
  const root = new THREE.Group(); root.name = 'sondelassGuardForms';
  const add = (parent, geo, mat, order = 5) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); return m; };
  const brass = metal(BRASS, 0.9);
  // the tsuba: its brass rim (a lathe round z, the lip rounded) and its glazed face, turned with the windows
  const tsuba = new THREE.Group(); root.add(tsuba);
  { const prof = [v2(12.6, 1.2), v2(13.2, 1.9), v2(14.2, 2.0), v2(15.0, 1.3), v2(15.2, 0), v2(15.0, -1.3), v2(13.0, -1.4), v2(12.6, -1.0)];
    const g = new THREE.LatheGeometry(prof, 40); g.rotateX(Math.PI / 2); add(tsuba, g, brass, 6); }
  const glazeC = document.createElement('canvas'); glazeC.width = glazeC.height = 96; glazeCanvas(glazeC, themeColours);
  const glazeT = new THREE.CanvasTexture(glazeC); glazeT.colorSpace = THREE.SRGBColorSpace;
  const face = add(tsuba, new THREE.CircleGeometry(13.3, 40), metal(0xffffff, 0.12, glazeT), 6); face.position.z = 1.15;
  // the forms, on their own axis (turned to the form's angle), behind the guard's plane
  const axis = new THREE.Group(); axis.position.z = -2.4; root.add(axis);
  const steel = metal(STEEL, 0.85);
  const blade = add(axis, sabreGeometry(), steel);
  const bow = add(axis, tube([[1, -14.6, 1.6], [-5, -18.4, 1.2], [-13, -17.2, 0.8], [-19, -11, 0.6], [-21, -5, 0.6]].map(([x, y, z]) => [x, EDGE_IN * y, z]), 1.05, 20), brass, 6); bow.position.z = 2.4;
  const urushi = metal(URUSHI, 0.25), W = [4.2, 3.4, 2.6, 1.9];
  const rod = W.map((w) => add(axis, rodSeg(w / 2), urushi));
  const ferrule = W.map((w) => add(axis, rodSeg(w / 2 + 0.4), brass));
  const iron = metal(IRON, 0.7);
  const hook = [5.2, 4.2].map((w) => add(axis, rodSeg(w / 2), iron));
  const hookBand = [5.2, 4.2].map((w) => add(axis, rodSeg(w / 2 + 0.45), brass));
  // the grapnel: its ring, shank and spike, and the two flukes (drawn open; scaled shut)
  const grapnel = new THREE.Group(); axis.add(grapnel);
  { const ring = new THREE.TorusGeometry(1.3, 0.45, 6, 14); ring.translate(1.3, 0, 0); add(grapnel, ring, brass, 6);
    const shank = rodSeg(0.65); shank.scale(6.9, 1, 1); shank.translate(2.6, 0, 0); add(grapnel, shank, iron, 6); }
  const flukes = new THREE.Group(); flukes.position.x = 0; grapnel.add(flukes);
  for (const s of [1, -1]) add(flukes, tube([[9.5, 0], [10.9, s * 2.4], [10.2, s * 4.0], [7.6, s * 4.6]], 0.45, 12), iron, 6);
  add(flukes, tube([[9.5, 0], [12.2, 0]], 0.42, 2), iron, 6);
  // the collars where a form leaves the guard: the rod's ferrule cup and the hook's iron collar (the cutlass's is its knuckle bow)
  const collar = (col) => { const g = new THREE.CylinderGeometry(5.2, 3.6, 7, 16, 1, false); g.rotateZ(-Math.PI / 2); g.translate(16.5, 0, 0); return add(axis, g, col); };
  const collars = { rod: collar(brass), hook: collar(iron) };
  // the drum: a brass capstan swelling behind the rim, wound with rope (the rope's lines turn with it)
  const ropeC = document.createElement('canvas'); ropeC.width = 256; ropeC.height = 16;
  { const x = ropeC.getContext('2d'); x.fillStyle = '#8a6a3c'; x.fillRect(0, 0, 256, 16); for (let i = 0; i < 44; i++) { x.strokeStyle = i % 2 ? 'rgba(40,24,8,.75)' : 'rgba(240,210,150,.45)'; x.lineWidth = 2; x.beginPath(); x.moveTo(i * 5.8, 0); x.lineTo(i * 5.8 + 6, 16); x.stroke(); } }
  const ropeT = new THREE.CanvasTexture(ropeC); ropeT.colorSpace = THREE.SRGBColorSpace; ropeT.wrapS = THREE.RepeatWrapping;
  const drum = add(root, new THREE.RingGeometry(13.6, 18.8, 44, 1), metal(0xffffff, 0.3, ropeT), 4); drum.position.z = -0.8;
  { const g = drum.geometry, p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (a / (Math.PI * 2) + 0.5) * 1, (r - 13.6) / 5.2); } }
  return {
    root, tsuba, face, axis, blade, bow, rod, ferrule, hook, hookBand, grapnel: { group: grapnel, flukes }, collars, drum,
    skin: { blade: [steel], brass: [brass], wood: [urushi], steel: [iron] }, // (the Sondelass's skin's roles here, colour and metal: vfx/toolskinwear.js kind 'sg')
    glaze(t) { glazeCanvas(glazeC, t); glazeT.needsUpdate = true; },
  };
}
