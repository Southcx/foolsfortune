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
// The plinth is clay glazed in the window colour (ui/theme.js: 15.3, the window colour is the glaze of the frame's matter), with
// patinated brass. It stands while the DOM Lachrimeter would (feedback/hud.js's rule: not full, held for a charge, or moved in the last
// four real seconds) and sinks into the corner when it would not; while it stands the DOM tube steps aside (ui/lachrimeter.js).
//
// Prior art: the mercury-in-glass thermometer (Fahrenheit, 1714; the clinical and laboratory forms: the bulb as reservoir, the
// capillary bore, the convex meniscus, the expansion chamber, acid-etched ticks; the Victorian wall thermometer's board and brass);
// the VFD and Nixie tube (Shōwa calculators and hi-fi; Burroughs' Nixie, 1955); labradorite's schiller (vfx/oxidation.js FILM);
// crackle glaze (Ge ware, guan) read onto glass; Dead Space's RIG and Metroid Prime's visor for the interface as a lit object.
//
//   const L = new LachrimeterTube(game)   game.lachrimeterTube   (it registers itself with game.overlayScene; nothing else to call)
//   L.root (the slot's object)   L.state (what it last showed: { level, full, held, charge, cost, brim, feeding, shown })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { capOf } from '../progress/poolcaps.js';
import { BOTTLES } from '../progress/brushload.js';
import { T } from '../core/config.js';
import { theme, THEMES, FONT } from '../ui/theme.js';
import { stepAside } from '../ui/lachrimeter.js';

// the instrument's own units (the mock's): the bulb at the origin, the scale from Y0 (empty) to Y1 (full), the plate behind
const Y0 = 0.55, Y1 = 3.55, yOf = (p) => Y0 + (Y1 - Y0) * p;
const PL = { x0: -0.32, x1: 0.74, y0: 0.3, y1: 4.0 };
const BORE = 0.124; // (the bore's Lachryma)
// how it stands on the 480-line frame: 32 lines a unit (192 lines tall at most), the mock's eye (a three-quarter turn, a little above)
const LINES = 32, YAW = 0.42, PITCH = 0.08, GAP = 6; // (lines to the frame's bottom edge)
const CLEAR = 312; // (CSS px from the right edge: clear of the DOM panel (#lachryma, 284 wide at 18) and the psygun's shells under it)
const RIGHT = 1.1, FOOT = 1.3, HEIGHT = 5.9; // (units: the plinth's right corner as turned, the plinth's foot below the bulb, the whole height)
const K = 2; // (texture pixels a line, for the words drawn on canvases)
const COUNT_FONT = `'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const QUIET = 4; // (real seconds still and full before it steps back: hud.js's rule)

let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; };
const rgb = (s) => `rgb(${s})`;

/** A mottled glaze (the plinth's and the brass's patina): blobs over a base, a fine speckle. */
function mottle(c, base, blobs, n) {
  const w = c.width, x = c.getContext('2d'); seed = 7;
  x.globalAlpha = 1; x.fillStyle = base; x.fillRect(0, 0, w, w);
  for (let i = 0; i < n; i++) { const [col, a] = blobs[i % blobs.length]; x.globalAlpha = a * (0.4 + rnd() * 0.6); x.fillStyle = col; x.beginPath(); x.arc(rnd() * w, rnd() * w, 4 + rnd() * w * 0.12, 0, 7); x.fill(); }
  x.globalAlpha = 0.5; for (let i = 0; i < w * 2; i++) { x.fillStyle = rnd() < 0.5 ? '#0b1f1a' : '#9fd3c0'; x.fillRect(rnd() * w, rnd() * w, 1, 1); }
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
/** The scale plate: tenmoku-glazed clay, hare's-fur streaks, the glaze breaking rust at the edges, gilt ticks cut through the glaze. */
function drawPlate(c) {
  const W = c.width, H = c.height, x = c.getContext('2d'); seed = 23;
  x.globalAlpha = 1; x.fillStyle = '#160d09'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 520; i++) { const px = rnd() * W, py = rnd() * H, l = 20 + rnd() * 90; x.globalAlpha = 0.1 + rnd() * 0.22; x.strokeStyle = rnd() < 0.6 ? '#6e3a18' : rnd() < 0.5 ? '#a4622a' : '#2a1c30'; x.lineWidth = 0.6 + rnd() * 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py + l); x.stroke(); }
  x.globalAlpha = 1;
  const eg = x.createLinearGradient(0, 0, W, 0); eg.addColorStop(0, 'rgba(150,84,36,.55)'); eg.addColorStop(0.06, 'rgba(0,0,0,0)'); eg.addColorStop(0.94, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(150,84,36,.55)'); x.fillStyle = eg; x.fillRect(0, 0, W, H);
  const vg = x.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(150,84,36,.45)'); vg.addColorStop(0.03, 'rgba(0,0,0,0)'); vg.addColorStop(0.97, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(150,84,36,.45)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  const u = (X) => ((X - PL.x0) / (PL.x1 - PL.x0)) * W, v = (Y) => (1 - (Y - PL.y0) / (PL.y1 - PL.y0)) * H;
  x.font = `26px ${COUNT_FONT}`; x.textAlign = 'right'; x.textBaseline = 'middle';
  for (let i = 0; i <= 20; i++) {
    const maj = i % 5 === 0, y = v(yOf(i / 20)), a = u(0.27), b = u(maj ? 0.5 : 0.4);
    x.fillStyle = '#0a0503'; x.fillRect(a, y - (maj ? 2.5 : 1.5) + 1, b - a, maj ? 5 : 3); // (the cut)
    x.fillStyle = maj ? '#e9c574' : '#c8a462'; x.fillRect(a, y - (maj ? 2 : 1), b - a, maj ? 4 : 2); // (the gilt in it)
    if (maj) { x.fillStyle = '#0a0503'; x.fillText(i * 5, u(0.71) + 1, y + 1); x.fillStyle = '#e9c574'; x.fillText(i * 5, u(0.71), y); }
  }
  x.fillStyle = '#c8a462'; x.fillRect(u(0.27), v(yOf(1)), 2, v(yOf(0)) - v(yOf(1)));
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

// ---------- the shaders (the mock's, in the instrument's own units: uInst takes a world point back into them; the overlay's eye is orthographic) ----------
const NOISE = `
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
vec3 pal(float t){vec3 a=vec3(.30,.06,.70),b=vec3(.04,.55,.75),c=vec3(.95,.72,.18),d=vec3(.85,.10,.50);t=fract(t)*4.;
if(t<1.)return mix(a,b,t);if(t<2.)return mix(b,c,t-1.);if(t<3.)return mix(c,d,t-2.);return mix(d,a,t-3.);}`;
const VS = `uniform mat4 uInst;varying vec3 vW,vN,vV;
void main(){vec4 w=modelMatrix*vec4(position,1.);vW=(uInst*w).xyz;vN=normalize(normalMatrix*normal);vV=vec3(0.,0.,1.);gl_Position=projectionMatrix*viewMatrix*w;}`;
const LABO = NOISE + `
uniform float uT,uPale,uSwirl,uGain;varying vec3 vW,vN,vV;
void main(){vec3 N=normalize(vN),V=normalize(vV);float f=clamp(abs(dot(N,V)),0.,1.);
vec3 p=vW*4.5;if(uSwirl>0.){vec2 q=vW.xz;float r=length(q)+.001;float a=atan(q.y,q.x)+uSwirl*8.*(.2-r)+vW.y*9.+uT;p=vec3(cos(a)*r,vW.y,sin(a)*r)*14.;}
float n=fbm(p+vec3(0.,uT,0.)),n2=fbm(p*2.3+7.+uT);
float band=sin((n*3.+f*2.2+vW.y*.7)*6.2831);
float flash=smoothstep(.3,1.,band)*smoothstep(.32,.72,n2);
vec3 film=pal(n*1.3+f*.6+vW.y*.18);
vec3 col=vec3(.03,.02,.06)+film*flash*(.8+.9*f*f)*uGain+vec3(.20,.10,.40)*pow(1.-f,3.)*.9;
col=mix(col,vec3(.82,.92,1.)*(.8+.35*flash)+film*.12,uPale);
gl_FragColor=vec4(col,1.);}`;
const LUM = NOISE + `
uniform float uT,uPale,uGain;varying vec3 vW,vN,vV;
void main(){vec3 N=normalize(vN),V=normalize(vV);float f=clamp(abs(dot(N,V)),0.,1.);
vec3 p=vW*vec3(10.,2.4,10.);float n=fbm(p+vec3(0.,uT,0.)),n2=fbm(p*2.1+5.+uT);
float band=sin((n*3.+vW.y*1.4)*6.2831);float flash=smoothstep(.15,1.,band)*smoothstep(.32,.68,n2);
vec3 core=mix(vec3(.20,.10,.62),vec3(.42,.30,1.),f*f);
vec3 film=mix(vec3(.25,1.,.88),vec3(1.,.84,.32),smoothstep(.42,.58,fract(n*2.2+vW.y*.45)));
vec3 col=core*(.85+.5*f)*uGain+film*flash*1.5*uGain+vec3(.55,.5,1.)*pow(1.-f,2.)*.4;
col=mix(col,vec3(.85,.94,1.)*(.85+.3*flash),uPale);
gl_FragColor=vec4(col,1.);}`;
const GLASS = NOISE + `
uniform float uBase,uRim;varying vec3 vW,vN,vV;
void main(){vec3 N=normalize(vN),V=normalize(vV);float d=dot(N,V);if(d<0.)N=-N;float f=1.-abs(d);
float a=uBase+pow(f,2.4)*uRim;vec3 c=mix(vec3(.78,.90,1.),pal(f*.8+vW.y*.2),.35);
vec3 L=normalize(vec3(-.45,.6,.65));vec3 H=normalize(L+V);float s=pow(max(dot(N,H),0.),90.)*1.6;
vec3 L2=normalize(vec3(.7,.2,.5));float s2=pow(max(dot(N,normalize(L2+V)),0.),40.)*.35;
gl_FragColor=vec4(c*a+vec3(1.)*(s+s2),clamp(a+s+s2,0.,1.));}`;
// the etched ticks, one mesh: a tick above the cap dims (aP its fraction, aMaj a long one)
const TICK_VS = `attribute float aP,aMaj;varying float vA;uniform float uCap;
void main(){vA=aP>uCap+1e-4?.22:(aMaj>.5?.85:.55);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const TICK_FS = `varying float vA;void main(){gl_FragColor=vec4(.886,.933,.957,vA);}`;

/** An arc of a ring round the bore at height y (a tick, a cost), facing the eye. */
function arcTube(r, y, arc, th, phi0 = 0) {
  const C = new THREE.Curve(); C.getPoint = (t, out = new THREE.Vector3()) => { const a = phi0 - arc / 2 + arc * t; return out.set(r * Math.sin(a), y, r * Math.cos(a)); };
  return new THREE.TubeGeometry(C, 24, th, 5, false);
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
  get standing() { return !this.off; }
  constructor(game) {
    this.game = game;
    this.S = game.overlayScene;
    this.state = { level: 0, full: 0, held: 0, charge: 0, cost: 0, brim: 0, feeding: false, shown: 0 };
    this.lvl = -1; this.ch = 0; this.brim = 0; this.shown = 0; this.quiet = 0; this.lastAvail = -1; this.pulse = 0; this.valve = 0; this.t = 0; this.feedT = 0;
    this.keys = { count: '', tag: '', cost: '', theme: '', cap: -1 };
    this.uInst = { value: new THREE.Matrix4() };
    if (!this.S) return;
    this.build();
    this.slot = this.S.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    document.fonts?.addEventListener?.('loadingdone', () => { this.keys.count = this.keys.tag = this.keys.cost = ''; drawPlate(this.plateC); this.plateT.needsUpdate = true; });
  }

  // ---------- the instrument, built once ----------
  build() {
    const r = this.S.r, U = this.uInst;
    const pm = new THREE.PMREMGenerator(r), envS = new THREE.Scene();
    { const c = cv(256, 128), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#fff1dc'); g.addColorStop(0.45, '#6a5a58'); g.addColorStop(0.55, '#2a2030'); g.addColorStop(1, '#08060c'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); x.fillStyle = '#fff'; x.fillRect(40, 20, 40, 30); x.fillStyle = '#ffb070'; x.fillRect(170, 40, 30, 20);
      envS.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: tex(c), side: THREE.BackSide }))); }
    this.env = pm.fromScene(envS, 0.02).texture; pm.dispose(); envS.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
    const ENV = this.env;

    this.glazeC = cv(256, 256); this.glazeT = tex(this.glazeC); this.glazeT.wrapS = this.glazeT.wrapT = THREE.RepeatWrapping;
    const brassT = tex(mottle(cv(128, 128), '#a37c34', [['#c9a253', 0.5], ['#3f8a74', 0.45], ['#5b4218', 0.4]], 50)); brassT.wrapS = brassT.wrapT = THREE.RepeatWrapping;
    this.plateC = cv(288, 1024); drawPlate(this.plateC); this.plateT = tex(this.plateC);
    const crazeT = tex(crazeCanvas());
    const glowC = cv(64, 64); { const x = glowC.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(220,250,255,1)'); g.addColorStop(0.25, 'rgba(120,200,255,.55)'); g.addColorStop(1, 'rgba(90,60,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }

    const brass = new THREE.MeshStandardMaterial({ map: brassT, metalness: 0.85, roughness: 0.38, envMap: ENV, envMapIntensity: 1.1, toneMapped: false });
    const glaze = new THREE.MeshStandardMaterial({ map: this.glazeT, metalness: 0.05, roughness: 0.32, envMap: ENV, envMapIntensity: 0.7, toneMapped: false });
    const sh = (frag, u, o = {}) => new THREE.ShaderMaterial({ uniforms: { uInst: U, ...u }, vertexShader: VS, fragmentShader: frag, toneMapped: false, ...o });
    const labo = (o = {}) => sh(LABO, { uT: { value: o.t || 0 }, uPale: { value: 0 }, uSwirl: { value: o.swirl || 0 }, uGain: { value: o.gain || 1 } });
    const lum = (o = {}) => sh(LUM, { uT: { value: o.t || 0 }, uPale: { value: o.pale || 0 }, uGain: { value: o.gain || 1 } });
    const glass = (base = 0.05, rim = 0.55) => sh(GLASS, { uBase: { value: base }, uRim: { value: rim } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
    this.mats = { labo: [], lum: [] };
    const L = (m) => { this.mats.lum.push(m); return m; }, B = (m) => { this.mats.labo.push(m); return m; };

    const root = (this.root = new THREE.Group()); root.name = 'lachrimeterTube';
    const pitch = new THREE.Group(); pitch.rotation.x = PITCH; root.add(pitch);
    const inst = (this.inst = new THREE.Group()); inst.rotation.y = -YAW; pitch.add(inst); this.pitch = pitch;
    const add = (geo, mat, o = 0) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = o; m.frustumCulled = false; inst.add(m); return m; };

    // the brass, one mesh: the cup, the count's plate and end caps, the plate's frame and rivets, the column's collars and its foot,
    // the finial, the Bottles' rack and manifold
    const P = [];
    P.push(at(new THREE.LatheGeometry([[0, -0.36], [0.3, -0.36], [0.34, -0.3], [0.37, -0.12], [0.35, -0.11], [0.31, -0.28], [0, -0.3]].map((p) => new THREE.Vector2(p[0], p[1])), 32)));
    P.push(at(new THREE.BoxGeometry(1.92, 0.72, 0.04), [0, -0.88, 0.47]));
    for (const x of [-0.9, 0.9]) P.push(at(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 20), [x, -0.88, 0.6], [0, 0, Math.PI / 2]));
    { const pw = PL.x1 - PL.x0, ph = PL.y1 - PL.y0, cx = (PL.x0 + PL.x1) / 2, cy = (PL.y0 + PL.y1) / 2, z = -0.29;
      P.push(at(new THREE.BoxGeometry(pw + 0.06, 0.05, 0.05), [cx, PL.y0, z]), at(new THREE.BoxGeometry(pw + 0.06, 0.05, 0.05), [cx, PL.y1, z]));
      P.push(at(new THREE.BoxGeometry(0.05, ph, 0.05), [PL.x0, cy, z]), at(new THREE.BoxGeometry(0.05, ph, 0.05), [PL.x1, cy, z]));
      for (const [x, y] of [[PL.x0 + 0.08, PL.y0 + 0.1], [PL.x1 - 0.08, PL.y0 + 0.1], [PL.x0 + 0.08, PL.y1 - 0.1], [PL.x1 - 0.08, PL.y1 - 0.1]]) P.push(at(new THREE.SphereGeometry(0.03, 8, 6), [x, y, z]));
      add(new THREE.BoxGeometry(pw, ph, 0.06), new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.5, metalness: 0, envMap: ENV, envMapIntensity: 0.5, toneMapped: false })).position.set(cx, cy, z - 0.045);
      add(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: this.plateT, roughness: 0.22, metalness: 0, envMap: ENV, envMapIntensity: 0.9, toneMapped: false })).position.set(cx, cy, z - 0.01); }
    for (const y of [1.25, 3.1]) P.push(at(new THREE.TorusGeometry(0.215, 0.02, 6, 28), [0, y, 0], [Math.PI / 2, 0, 0]));
    P.push(at(new THREE.CylinderGeometry(0.24, 0.2, 0.14, 28), [0, 0.44, 0]));
    P.push(at(new THREE.CylinderGeometry(0.05, 0.09, 0.12, 16), [0, 4.42, 0]), at(new THREE.SphereGeometry(0.05, 12, 8), [0, 4.51, 0]));
    const BX = [-0.8, -1.16], BY = 1.18, BH = 0.62, BZ = -0.22;
    for (const x of BX) { for (const y of [BY - 0.02, BY + BH + 0.02]) P.push(at(new THREE.BoxGeometry(0.33, 0.05, 0.33), [x, y, BZ])); P.push(at(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 10), [x, BY + BH + 0.07, BZ])); }
    P.push(at(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), [-0.98, 1.1, -0.22], [0, 0, Math.PI / 2]));
    add(mergeGeometries(P), brass);
    // the valve wheel (turned open while the Bottles feed), on its own
    { const w = [at(new THREE.TorusGeometry(0.07, 0.014, 6, 20)), at(new THREE.BoxGeometry(0.14, 0.014, 0.014))];
      this.valveM = add(mergeGeometries(w), brass); this.valveM.position.set(-0.98, 0.88, -0.12); }
    // the plinth: clay glazed in the window colour, and its step
    add(mergeGeometries([at(roundBox(2.0, 0.8, 0.9, 0.07), [0, -0.88, 0]), at(roundBox(1.2, 0.14, 0.7, 0.04), [0, -0.42, 0])]), glaze);
    // the count: the VFD's face and its glass
    this.vfdC = cv(512, 160); this.vfdT = tex(this.vfdC);
    add(new THREE.PlaneGeometry(1.66, 0.52), new THREE.MeshBasicMaterial({ map: this.vfdT, toneMapped: false })).position.set(0, -0.88, 0.6);
    { const m = add(new THREE.CylinderGeometry(0.31, 0.31, 1.72, 28, 1, true), glass(0.03, 0.45), 3); m.rotation.z = Math.PI / 2; m.position.set(0, -0.88, 0.6); m.scale.set(1, 1, 0.62); }
    // the bulb: the pool's base, and its glass
    this.bulb = add(new THREE.SphereGeometry(0.37, 36, 24), B(labo({ gain: 1.15, t: 1.3 })));
    add(new THREE.SphereGeometry(0.42, 36, 24), glass(), 2);
    // the column's glass, and the expansion chamber's (one mesh)
    add(mergeGeometries([at(new THREE.CylinderGeometry(0.2, 0.2, 3.6, 32, 1, true), [0, 2.1, 0]), at(new THREE.SphereGeometry(0.26, 32, 20), [0, 4.12, 0])]), glass(0.045, 0.6), 2);
    // the column's Lachryma (a unit cylinder, stretched), its glow sheath, the pale stretch and its front, the meniscus, its line and glow
    this.col = add(new THREE.CylinderGeometry(BORE, BORE, 1, 20), L(lum({ t: 4.3 })));
    this.sheath = add(new THREE.CylinderGeometry(0.19, 0.19, 1, 20, 1, true), basic(0x5c58ff, { transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }), 3);
    this.pale = add(new THREE.CylinderGeometry(BORE, BORE, 1, 20), L(lum({ t: 1, pale: 0.72 })));
    this.front = add(new THREE.TorusGeometry(BORE + 0.012, 0.014, 6, 24), basic(0xe8f6ff)); this.front.rotation.x = Math.PI / 2;
    this.men = add(new THREE.SphereGeometry(BORE, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), L(lum({ t: 2, gain: 1.5 }))); this.men.scale.y = 0.45;
    this.menLine = add(new THREE.TorusGeometry(BORE + 0.004, 0.016, 6, 32), basic(0xf4fff8), 7); this.menLine.rotation.x = Math.PI / 2;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(glowC), color: 0xbfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false }));
    this.glow.scale.set(0.9, 0.5, 1); this.glow.renderOrder = 8; this.glow.frustumCulled = false; inst.add(this.glow);
    // the etched ticks: a long one each 25%, a short one each 5%; dimmed above the cap
    { const G = []; for (let i = 0; i <= 20; i++) { const maj = i % 5 === 0, g = at(arcTube(0.203, yOf(i / 20), maj ? Math.PI * 0.95 : Math.PI * 0.45, maj ? 0.007 : 0.0045)), n = g.attributes.position.count;
        g.setAttribute('aP', new THREE.Float32BufferAttribute(new Float32Array(n).fill(i / 20), 1)); g.setAttribute('aMaj', new THREE.Float32BufferAttribute(new Float32Array(n).fill(maj ? 1 : 0), 1)); G.push(g); }
      this.tickU = { value: 1 };
      add(mergeGeometries(G), new THREE.ShaderMaterial({ uniforms: { uCap: this.tickU }, vertexShader: TICK_VS, fragmentShader: TICK_FS, transparent: true, depthWrite: false, toneMapped: false }), 4); }
    // the held stretch: the crazed sleeve (a unit cylinder from its foot) and the cracked clay seal at the cap line
    { const g = new THREE.CylinderGeometry(0.208, 0.208, 1, 32, 1, true); g.translate(0, 0.5, 0);
      this.sleeve = add(g, new THREE.MeshStandardMaterial({ map: crazeT, transparent: true, opacity: 0.88, roughness: 0.85, metalness: 0, envMap: ENV, envMapIntensity: 0.3, toneMapped: false }), 5);
      this.seal = add(new THREE.TorusGeometry(0.212, 0.024, 6, 32), new THREE.MeshStandardMaterial({ color: 0x8a4a30, roughness: 0.9, map: crazeT, toneMapped: false })); this.seal.rotation.x = Math.PI / 2; }
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
      const gl = add(new THREE.BoxGeometry(0.3, BH, 0.3), glass(0.06, 0.5), 2); gl.position.set(x, BY + BH / 2, BZ);
      return { liq, gl };
    });
    // the feed: its glass tube down to the bulb, the Lachryma in it, drops running down, a ring where it enters
    const curve = (this.curve = new THREE.CatmullRomCurve3([[-0.98, 1.08, -0.22], [-0.98, 0.78, -0.16], [-0.82, 0.36, -0.04], [-0.56, 0.12, 0.02], [-0.38, 0.04, 0.03]].map((p) => new THREE.Vector3(...p))));
    add(new THREE.TubeGeometry(curve, 32, 0.036, 8, false), glass(0.06, 0.6), 2);
    this.feed = add(new THREE.TubeGeometry(curve, 32, 0.02, 6, false), B(labo({ t: 8, gain: 1.5 })));
    this.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), basic(0xcff0ff), 3); this.drops.frustumCulled = false; inst.add(this.drops);
    this.entry = add(new THREE.TorusGeometry(0.06, 0.01, 6, 20), basic(0xbfe8ff)); this.entry.position.set(-0.37, 0.04, 0.05); this.entry.rotation.y = -1.2;

    // the words beside it, in root space (CSS px, never turned): the held stretch's tag, a cost's count
    const plane = (o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); m.renderOrder = 20 + o; m.frustumCulled = false; m.visible = false; root.add(m); return m; };
    this.tagC = cv(8, 8); this.tag = plane(0); this.tag.material.map = this.tagT = tex(this.tagC);
    this.costC = cv(40 * K, 18 * K); this.costLab = plane(1); this.costLab.material.map = this.costT = tex(this.costC);
    this.A = { held: new THREE.Vector3(), cost: new THREE.Vector3() };
  }

  // ---------- each frame it may be drawn ----------
  update(dt, slot) {
    const g = this.game, pool = g.lachryma, root = this.root;
    const allowed = !!pool && !g.title?.active && !g.god?.controlling && !document.body.classList.contains('bztable-seated');
    stepAside(allowed);
    if (!allowed) { this.shown = 0; root.userData.overlayHidden = true; return; }
    this.t += dt;
    // shown as the DOM Lachrimeter is (hud.js): not full, held for a charge, or moved in the last few real seconds
    const avail = pool.available, reserved = pool.reserved, max = pool.max;
    if (Math.abs(avail - this.lastAvail) > 0.01 || reserved > 0) { this.lastAvail = avail; this.quiet = 0; }
    this.quiet += dt;
    const want = avail < max - 0.5 || this.quiet < QUIET || reserved > 0 ? 1 : 0;
    this.shown += (want - this.shown) * Math.min(1, dt * (want ? 7 : 3));
    if (!want && this.shown < 0.01) this.shown = 0;
    root.userData.overlayHidden = this.shown <= 0;
    this.state.shown = this.shown;
    if (this.shown <= 0) return;

    // where it stands (CSS px), and how big: 32 lines a unit at the 480-line present
    const H = slot.view.h || innerHeight, lineP = H / 480, s = LINES * lineP, e = this.shown * this.shown * (3 - 2 * this.shown);
    slot.x = -(CLEAR + RIGHT * s);
    slot.y = -(GAP * lineP + FOOT * s) + (1 - e) * (HEIGHT * s + GAP * lineP); // (it sinks into the corner as it steps back)
    this.inst.scale.setScalar(s);

    // the numbers: the tube is the pool's uncapped size, the column the pool, the pale stretch what a charge holds
    const C = capOf(pool), full = Math.max(1, C.held > 0 ? C.full : max), cap = Math.min(1, max / full);
    const level = Math.min((avail + reserved) / full, cap), charge = Math.min(level, reserved / full);
    this.lvl = this.lvl < 0 ? level : this.lvl + (level - this.lvl) * Math.min(1, dt * 12);
    this.ch += (charge - this.ch) * Math.min(1, dt * 12);
    const brimming = !!g.courierMind?.brimming;
    this.brim += ((brimming ? 0.9 : 0) - this.brim) * Math.min(1, dt * (brimming ? 6 : 2));
    if (this.heard !== pool) { this.heard = pool; pool.on?.('gain', () => { this.pulse = 1; }); } // (Lachryma came in: the meniscus flares)
    this.pulse = Math.max(0, this.pulse - dt * 3);
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
    this.glow.scale.set(0.9 * (1 + this.pulse * 0.6), 0.5 * (1 + this.pulse * 0.6), 1);
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
    if (feeding) { this.feedT += dt * 0.6; for (let i = 0; i < 3; i++) { this.curve.getPoint((this.feedT + i / 3) % 1 * 0.9 + 0.08, V1); M4.makeTranslation(V1.x, V1.y, V1.z); this.drops.setMatrixAt(i, M4); } this.drops.instanceMatrix.needsUpdate = true; }
    // the Lachryma alive: the schiller turning slowly
    for (const m of this.mats.labo) m.uniforms.uT.value += dt * 0.12;
    for (const m of this.mats.lum) m.uniforms.uT.value += dt * 0.25;

    // the window colour: the plinth's glaze
    if (theme.id !== this.keys.theme) { this.keys.theme = theme.id; this.glazeTheme(); this.keys.tag = ''; }
    // the count, redrawn only when it changes
    const count = `${Math.floor(avail)} / ${Math.round(full)}`;
    if (count !== this.keys.count) { this.keys.count = count; drawVfd(this.vfdC, count); this.vfdT.needsUpdate = true; }

    // placed for this frame (the overlay places the root after this; done here too, so the shaders' instrument space is this frame's)
    root.position.set(slot.view.w + slot.x, -(slot.view.h + slot.y), slot.z);
    root.updateMatrixWorld(true); this.inst.updateMatrix(); this.pitch.updateMatrix();
    this.uInst.value.copy(this.inst.matrixWorld).invert();
    this.words(C, full, cap, cost > 0 ? costN : 0, short, lineP);
  }

  /** The plinth's glaze in the window colour (ui/theme.js): its top as the base, its frame's light and dark mottled through. */
  glazeTheme() {
    const t = THEMES[theme.id] || THEMES.verdigris;
    mottle(this.glazeC, rgb(t.top), [[t.mid, 0.5], [rgb(t.bot), 0.6], [t.hi, 0.3], ['#3c2a1c', 0.25]], 90);
    this.glazeT.needsUpdate = true;
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
    this.tagT.dispose(); this.tagT = this.tag.material.map = tex(c); this.tag.material.needsUpdate = true; // (the canvas changed size: a fresh texture)
  }

  /** A cost's count beside its tick, in the System's count face, gold (red when it cannot be paid). */
  drawCost(text, col) {
    const c = this.costC, x = c.getContext('2d'), px = 14 * K;
    x.clearRect(0, 0, c.width, c.height); x.font = `${px}px ${COUNT_FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.lineWidth = Math.max(2, px / 7); x.strokeStyle = '#17111f'; x.strokeText(text, 2, c.height / 2); x.fillStyle = col; x.fillText(text, 2, c.height / 2);
    this.costT.needsUpdate = true;
  }
}
