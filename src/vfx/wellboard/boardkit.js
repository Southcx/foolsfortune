// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S KIT (docs/plans/WELL-BOARD.md 10; South, 2026-11-14: "use Mario Party and Dokapon Kingdom as your inspiration for
// the 3d space boardgame aesthetic, taken to a psychedelic esoteric extreme"): what the board's view (boardview.js) and its rings
// (boardring.js) are made of. A DRAFT LOOK, a free hand's; Calissa's to keep, change or replace.
//
//   TWO PROGRAMS   `wellboard-sky`: the void the board hangs in, one dome: an eye at the zenith (the house's convention: every sky's
//                  top is an iris and a pupil), a seven-fold kaleidoscope of drifting colour round it (seven feelings), stars at the
//                  horizon, and at the nadir the Well itself, a spiral turning down into a lit throat.
//                  `wellboard-toy`: everything solid, in a toy's shading (Mario Party's and Dokapon's: flat saturated colour, two
//                  tones, a pale rim so every piece reads against the dark), with the labradorite's film walked over it by `uFilm`,
//                  an icon or a painted deck by `uMap`, a pulse by `uGlow`. One program however many pieces: each piece its own
//                  uniforms on a clone.
//   THE ICONS      one small canvas a kind of space, drawn as shapes (no font glyphs but digits), white on clear, keylined dark.
//   THE DECK       a ring's top painted as a wheel: twelve houses, a heptagram, orbits, in gold on indigo.
//   THE DICE       the standard set's six as their solids (DICE.md 2), each in its suit's ink.
//
// Prior art: Mario Party's boards (chunky pads, one colour a job, the path a ribbon), Dokapon Kingdom (thick keylines, toy
// saturation), Rez and Tetris Effect (a void that breathes), Hilma af Klint and the alchemical emblem books (the wheel, the eye,
// the heptagram), the house's own labradorite film (vfx/labradorite.js) for the walk of hue.
//
//   skyMaterial()   toy({ color, map?, film?, glow?, flat? }) -> material   iconTexture(kind, shift?)   deckTexture(seed)
//   dieGeometry(sides)   PAD { kind: { color, top } }   DIE_COLOUR   textSprite() -> { sprite, set(text, colour) }   haloTex()
//   tick(t)  (walks the shared clock uniform)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const U_TIME = { value: 0 };
export const tick = (t) => { U_TIME.value = t; };

/** A pad's colours by its kind: the body, and the plate its icon sits on. Saturated, one hue a job (Mario Party's rule). */
export const PAD = {
  fight: { color: 0xff4a2a, top: 0xff6a3c }, genre: { color: 0x9a3dff, top: 0xb060ff }, cache: { color: 0xf0a800, top: 0xffbe1a },
  spring: { color: 0x10b89a, top: 0x1fd6b4 }, hazard: { color: 0xd0103a, top: 0x1c0812 }, shift: { color: 0x2468f0, top: 0x3a86ff },
  rest: { color: 0x4fb82a, top: 0x6fd23f }, door: { color: 0xe8d2a0, top: 0xfff1cf }, foe: { color: 0x1a0d1f, top: 0x7a0f24 },
  mouth: { color: 0xe8d2a0, top: 0xfff1cf }, '?': { color: 0x4a3f5a, top: 0x6a5f80 },
};
/** The dice's inks (DICE.md 2: d4 Wands, d6 Pentacles, d8 Swords, d10 Cups; the d12 the zodiac's violet, the d20 the Majors' gold). */
export const DIE_COLOUR = { 4: 0xe5484d, 6: 0xf5c542, 8: 0x3fb950, 10: 0x3b82f6, 12: 0xb26bff, 20: 0xffd36a };

// ---------------------------------------------------------------- the sky
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    name: 'wellboard-sky', side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTime: U_TIME, uDepth: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      precision highp float; varying vec3 vDir; uniform float uTime, uDepth;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
      vec3 film(float h) { return 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67))); }
      void main() {
        vec3 d = normalize(vDir); float t = uTime;
        float az = atan(d.z, d.x), up = d.y;
        // the seven-fold kaleidoscope: the azimuth folded into one of seven wedges
        float w = 6.2832 / 7.0, a = abs(mod(az + t * 0.02, w) - w * 0.5);
        float r = acos(clamp(abs(up), 0.0, 1.0));
        vec2 p = vec2(a * 3.0, r * 2.2);
        float n = fbm(p * 2.0 + vec2(0.0, -t * 0.06) + fbm(p * 3.0 + t * 0.03) * 1.6);
        vec3 col = mix(vec3(0.010, 0.003, 0.030), vec3(0.045, 0.008, 0.10), n);
        float bands = smoothstep(0.52, 0.9, n);
        col += film(n * 1.3 + r * 0.35 + t * 0.03 + uDepth * 0.11) * bands * 0.30;
        // stars toward the horizon
        vec2 sp = vec2(az * 40.0, up * 60.0); float st = step(0.985, hash(floor(sp))) * smoothstep(0.75, 0.0, abs(up));
        col += st * (0.6 + 0.4 * sin(t * 3.0 + hash(floor(sp)) * 40.0));
        if (up > 0.0) { // the eye at the zenith: a pupil, an iris of rays, a lid of gold
          float e = r; float rays = 0.5 + 0.5 * sin(az * 28.0 + sin(e * 30.0 - t) * 0.6);
          vec3 iris = film(e * 2.2 - t * 0.05 + 0.55) * (0.55 + 0.45 * rays);
          float inIris = smoothstep(0.50, 0.46, e), pupil = smoothstep(0.13 + 0.02 * sin(t * 0.7), 0.11, e);
          col = mix(col, iris, inIris * 0.9);
          col = mix(col, vec3(0.01, 0.0, 0.03), pupil);
          col += vec3(1.0, 0.82, 0.42) * (smoothstep(0.035, 0.0, abs(e - 0.50)) + 0.6 * smoothstep(0.02, 0.0, abs(e - 0.135)));
          col += vec3(1.0) * smoothstep(0.03, 0.0, length(vec2(e - 0.07, mod(az, 6.2832) - 0.8) * vec2(1.0, 0.06))) * 0.8;
        } else { // the Well at the nadir: a spiral down into a lit throat
          float sp2 = sin(az * 3.0 + log(r + 0.02) * 9.0 - t * 0.9);
          float arm = pow(0.5 + 0.5 * sp2, 5.0) * smoothstep(1.35, 0.15, r);
          float rungs = pow(0.5 + 0.5 * sin(log(r + 0.02) * 26.0 + t * 1.6), 10.0) * smoothstep(1.1, 0.2, r);
          col += film(r * 1.5 + az * 0.16 + t * 0.08 + 0.2) * (arm * 0.85 + rungs * 0.5);
          col += vec3(1.0, 0.88, 0.7) * smoothstep(0.2, 0.0, r) * 1.3;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ---------------------------------------------------------------- the toy shading
const TOY_VERT = `
  varying vec3 vN, vV, vW; varying vec2 vUv;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`;
const TOY_FRAG = `
  precision highp float; varying vec3 vN, vV, vW; varying vec2 vUv;
  uniform vec3 uColor, uTop; uniform sampler2D uMap; uniform float uTime, uFilm, uGlow, uHasMap, uDim, uFlat, uAlpha;
  vec3 film(float h) { return 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67))); }
  void main() {
    vec3 n = normalize(vN); if (uFlat > 0.5) n = normalize(cross(dFdx(vW), dFdy(vW)));
    vec3 L = normalize(vec3(0.35, 0.9, 0.3));
    float d = dot(n, L), tone = mix(0.52, 1.0, smoothstep(-0.05, 0.05, d)) + 0.12 * smoothstep(0.55, 0.6, d);
    vec3 base = uColor;
    float up = smoothstep(0.7, 0.9, n.y);
    if (uHasMap > 0.5) { vec4 m = texture2D(uMap, vUv); base = mix(mix(base, uTop, up), m.rgb, m.a * mix(1.0, up, step(1.5, uHasMap))); }
    vec3 col = base * tone;
    float fres = pow(1.0 - max(dot(n, vV), 0.0), 2.5);
    vec3 f = film(vW.y * 0.12 + vW.x * 0.05 + fres * 0.6 + uTime * 0.12);
    col = mix(col, col * 0.4 + f * 0.9, uFilm * (0.35 + 0.65 * fres));
    col += vec3(1.0, 0.96, 0.9) * fres * 0.2;                       // the pale rim: every piece reads against the dark
    col += (base * 0.7 + f * 0.3) * uGlow * (0.6 + 0.4 * sin(uTime * 5.0));
    col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * 0.45 + vec3(0.03, 0.02, 0.06), uDim);
    gl_FragColor = vec4(col, uAlpha);
  }`;
/** A piece's material: one program, its own uniforms. `map`: 1 an image over the whole piece (the deck), 2 an icon on its upward
 *  faces only (a pad's plate). */
export function toy({ color = 0xffffff, top = 0xffffff, map = null, mapOn = 1, film = 0, glow = 0, flat = false, alpha = 1, side = THREE.FrontSide } = {}) {
  const m = new THREE.ShaderMaterial({
    name: 'wellboard-toy', vertexShader: TOY_VERT, fragmentShader: TOY_FRAG, side, transparent: alpha < 1, depthWrite: alpha >= 1,
    uniforms: { uTime: U_TIME, uColor: { value: new THREE.Color(color) }, uTop: { value: new THREE.Color(top) }, uMap: { value: map }, uHasMap: { value: map ? mapOn : 0 },
      uFilm: { value: film }, uGlow: { value: glow }, uDim: { value: 0 }, uFlat: { value: flat ? 1 : 0 }, uAlpha: { value: alpha } },
  });
  return m;
}

// ---------------------------------------------------------------- the icons
const ICONS = new Map();
function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
/** A kind's icon, drawn as shapes on a 128 px canvas: white with a dark keyline (Dokapon's thick outline), clear round it. */
export function iconTexture(kind, shift = 0) {
  const key = kind === 'shift' ? `shift${shift}` : kind;
  if (ICONS.has(key)) return ICONS.get(key);
  const c = canvas(128), g = c.getContext('2d'), ink = kind === 'hazard' ? '#ffe14a' : kind === 'foe' ? '#ffffff' : '#ffffff', key2 = '#1a0d1f';
  g.translate(64, 64); g.scale(1.22, 1.22); g.lineJoin = 'round'; g.lineCap = 'round';
  const draw = (path, fill = ink) => { g.lineWidth = 14; g.strokeStyle = key2; path(); g.stroke(); g.fillStyle = fill; path(); g.fill(); };
  const line = (pts, w = 12) => { for (const [col, lw] of [[key2, w + 10], [ink, w]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
  if (kind === 'fight') { line([[-30, 30], [28, -28]]); line([[30, 30], [-28, -28]]); line([[-34, 8], [-8, 34]], 8); line([[34, 8], [8, 34]], 8); }
  else if (kind === 'genre') draw(() => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 17 : 40; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); });
  else if (kind === 'cache') { draw(() => { g.beginPath(); g.moveTo(0, -38); g.lineTo(30, -6); g.lineTo(0, 40); g.lineTo(-30, -6); g.closePath(); }); line([[-30, -6], [30, -6]], 4); }
  else if (kind === 'spring') draw(() => { g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(34, 0, 30, 38, 0, 38); g.bezierCurveTo(-30, 38, -34, 0, 0, -42); g.closePath(); });
  else if (kind === 'hazard') { draw(() => { g.beginPath(); g.rect(-8, -40, 16, 48); }); draw(() => { g.beginPath(); g.arc(0, 30, 10, 0, 7); }); }
  else if (kind === 'rest') draw(() => { g.beginPath(); g.arc(0, 0, 38, 0.6, Math.PI * 2 - 0.6); g.arc(16, 0, 26, Math.PI * 2 - 1.05, 1.05, true); g.closePath(); });
  else if (kind === 'door' || kind === 'mouth') draw(() => { g.beginPath(); g.arc(0, -12, 20, 0, 7); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(18, 40); g.lineTo(-18, 40); g.closePath(); }, kind === 'door' ? '#3a1f0c' : '#7a5a2c');
  else if (kind === 'foe') { draw(() => { g.beginPath(); g.moveTo(-46, 0); g.quadraticCurveTo(0, -42, 46, 0); g.quadraticCurveTo(0, 42, -46, 0); g.closePath(); }); draw(() => { g.beginPath(); g.arc(0, 0, 15, 0, 7); }, '#1a0d1f'); }
  else if (kind === 'shift') {
    const s = Math.sign(shift) || 1; line([[-34 * s, -22], [-8 * s, 0], [-34 * s, 22]]); line([[-4 * s, -22], [22 * s, 0], [-4 * s, 22]]);
    g.font = '900 34px system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = key2; g.strokeText(String(Math.abs(shift)), 34 * s, 44); g.fillStyle = '#ffe14a'; g.fillText(String(Math.abs(shift)), 34 * s, 44);
  } else if (kind === 'check') line([[-30, 2], [-8, 26], [32, -24]], 14);
  else { g.font = '900 72px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = key2; g.strokeText('?', 0, 4); g.fillStyle = ink; g.fillText('?', 0, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  ICONS.set(key, t); return t;
}

/** A ring's deck: the wheel painted on its top, 1024 px, planar (a RingGeometry's UVs are its x and y). Twelve houses, the orbits,
 *  a heptagram over the shaft's lip, small suns and moons; `hue` turns the ground a floor (deeper is redder). */
export function deckTexture(depth = 0) {
  const c = canvas(1024), g = c.getContext('2d'), R = 512, hue = (262 - depth * 34 + 360) % 360;
  g.translate(R, R);
  const grd = g.createRadialGradient(0, 0, R * 0.5, 0, 0, R); grd.addColorStop(0, `hsl(${hue}, 62%, 20%)`); grd.addColorStop(0.6, `hsl(${(hue + 30) % 360}, 58%, 13%)`); grd.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 24%)`);
  g.fillStyle = grd; g.fillRect(-R, -R, 2 * R, 2 * R);
  const gold = 'rgba(255, 211, 106, 0.95)', pale = 'rgba(255, 240, 210, 0.55)';
  // the houses: twelve sectors, alternately washed
  for (let i = 0; i < 12; i++) { const a0 = ((i - 0.5) * Math.PI) / 6 - Math.PI / 2; if (i % 2) { g.fillStyle = `hsla(${(hue + 180) % 360}, 80%, 60%, 0.10)`; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a0 + Math.PI / 6); g.closePath(); g.fill(); } }
  g.strokeStyle = pale; g.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = ((i - 0.5) * Math.PI) / 6 - Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
  // the orbits, and the path the pads stand on
  for (const [r, w, col] of [[0.62, 5, gold], [0.66, 1.5, pale], [0.8, 14, 'rgba(255, 211, 106, 0.28)'], [0.8, 2, gold], [0.955, 1.5, pale], [0.985, 6, gold]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(0, 0, R * r, 0, 7); g.stroke(); }
  g.setLineDash([3, 13]); g.strokeStyle = gold; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, R * 0.9, 0, 7); g.stroke(); g.setLineDash([]);
  // the heptagram, on the lip of the shaft
  g.strokeStyle = gold; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 7; i++) { const a = (i * 3 * 2 * Math.PI) / 7 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74); } g.stroke();
  // suns and moons between the houses
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) * Math.PI) / 6 - Math.PI / 2, x = Math.cos(a) * R * 0.925, y = Math.sin(a) * R * 0.925;
    g.fillStyle = gold; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    if (i % 2) { g.fillStyle = `hsl(${hue}, 60%, 16%)`; g.beginPath(); g.arc(x + 5, y - 2, 8, 0, 7); g.fill(); }
    else for (let k = 0; k < 8; k++) { const b = (k * Math.PI) / 4; g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(x + Math.cos(b) * 12, y + Math.sin(b) * 12); g.lineTo(x + Math.cos(b) * 18, y + Math.sin(b) * 18); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------------------------------------------------------------- the dice
/** The standard set's solids (DICE.md 2). The d10 is the pentagonal trapezohedron, near enough as two five-sided cones turned a
 *  tenth against each other. */
export function dieGeometry(sides) {
  if (sides === 4) return new THREE.TetrahedronGeometry(1.15);
  if (sides === 6) return new THREE.BoxGeometry(1.3, 1.3, 1.3);
  if (sides === 8) return new THREE.OctahedronGeometry(1.1);
  if (sides === 12) return new THREE.DodecahedronGeometry(1.0);
  if (sides === 20) return new THREE.IcosahedronGeometry(1.05);
  const pos = [], ring = (y, off) => [...Array(5)].map((_, i) => { const a = ((i + off) * 2 * Math.PI) / 5; return [Math.cos(a) * 0.95, y, Math.sin(a) * 0.95]; });
  const A = ring(0.16, 0), B = ring(-0.16, 0.5), top = [0, 1.05, 0], bot = [0, -1.05, 0], tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; tri(top, A[j], A[i]); tri(A[i], A[j], B[i]); tri(A[j], B[j], B[i]); tri(bot, B[i], B[j]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- words and light
/** A number said big over a thing (Mario Party's dice block number): one canvas, drawn again when it changes. */
export function textSprite() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })); sprite.scale.set(4, 2, 1); sprite.renderOrder = 20; sprite.visible = false;
  let was = null;
  return { sprite, set(text, colour = '#fff') {
    const k = `${text}|${colour}`; if (k === was) return; was = k;
    g.clearRect(0, 0, 256, 128); g.font = `900 ${String(text).length > 3 ? 64 : 100}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = 22; g.strokeStyle = '#1a0d1f'; g.strokeText(text, 128, 68); g.lineWidth = 8; g.strokeStyle = '#fff'; g.strokeText(text, 128, 68); g.fillStyle = colour; g.fillText(text, 128, 68);
    tex.needsUpdate = true;
  } };
}
let HALO = null;
/** A soft round light for motes and rings. */
export function haloTex() {
  if (HALO) return HALO;
  const c = canvas(64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); HALO = new THREE.CanvasTexture(c); return HALO;
}
