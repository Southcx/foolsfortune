// ---------------------------------------------------------------------------------------
// THE ABERRANT ENCOUNTER'S WIPE: the battle transition into a puzzle duel with an aberrant Figment (the owner, 2026-10-19: "some juice
// when it comes to the 'battle transition' screen ... some kind of frame accumulation + distortion effect. Maybe a shatter"). Four
// beats, all on the game's clock (raw dt, clamped), so a replay steps through it the same:
//   THE CATCH    (0.28 real s) the frame is caught: each new frame laid over the held one, fainter each time, until it is still, so what
//                moves smears; the held frame is drawn in toward the aberrant (pulled and turned about its point on the screen), and
//                the view twists round it while its feeling's colour bleeds in from the edges. Then `onCovered`: the frame is held,
//                and the world may change behind it.
//   THE BUG      (0.20 s) the data showing through: the aberrant's data-bug wrongness laid on the held frame (a magenta cast, bands of
//                rows slid, the colours split out from its point), smooth, never stepping; and one pulse of the glitch's own tear
//                (vfx/glitch.js `pulse`, its stutter bounded by its own comfort rules). `visual.glitch` off: no pulse, and the cast
//                and slide at a third.
//   THE CRACKLE  (0.27 s) the held frame crazes like a glaze, from the aberrant's point outward: guan ware's crackle, the iron wire
//                (the big cells, which are the shards to come) and the golden thread (the fine net) behind it, each plate lifting by a
//                hair. A kiln's crackle, not window glass: Anagami is clay.
//   THE SHATTER  (0.60 s, on open()) the frame breaks along the iron wire into glazed shards textured with it, which part at the
//                Line first (a seam of the feeling's light), then fly to their sides (the Courier's to your side, the foe's to its
//                own), turning, tipping to catch the light on their glaze, and falling away; through the gaps the duel's view is
//                already there (game.duelView when it is up; else the dark #07030d with the film's sheen).
// Nothing flickers: every amount eases; the only stepping is the glitch pulse's, which keeps the glitch's own limits.
// The HUD steps out while it runs, as for a cinematic (the log, the Sight, the Lachrimeter, the overlay's HUD slots: a want of the HUD's,
// feedback/hideui.js 'aberrantWipe'), and comes back as the player had it when the last shard has fallen.
//
// How it is drawn: a screen volume (render/glow.js `post.volumes`), in the 480 lines and the light-linear frame, before the glitch
// pass and the bloom, so the tear and the glow take it too. ONE program (`aberrant-wipe`), four modes by a uniform: the accumulation
// (into a ping-pong pair), the present (the twist, the bug, the crackle), the shards (a fan a shard, one buffer moved on the CPU), and
// the ground behind them. It registers on the glow when made, so the boot's `post.compile()` warms it (as the caster volumes are).
// With the glow and the grade both off there is no frame to hold: a plain dark cover stands in.
//
// THE PULL'S EDGE (the owner, 2026-10-20: "progressive onloading chromatic aberration ... just enough time to get away"; PUZZLE-DUELS.md
// 16.3). Before any wipe: nearness to an aberrant fills `game.duelFoes.pull` (0..1, Petra's), and the frame's edges split into red,
// green and blue as it rises: nothing at 0, a vignette-shaped split creeping in from the edges, strongest at the corners, the middle
// always clean (at 1 the inner 45 % of the view is untouched), so you can see the way out. It drains back as the pull falls; at 1 the
// wipe takes over (called by Petra's session, as before). The same program as the wipe (its fifth mode, `uEdge`), drawn only while
// the pull is up, never in a duel. `visual.glitch` off: the split at half, and no darkening. `/pull <0..1>` (DEBUG) holds a value.
//
// Prior art (a museum label): Final Fantasy VII, VIII and IX's pre-battle swirl (Square, 1997-2000: the frame buffer copied, turned and
// laid back over itself, a PS1 frame-buffer effect) for the catch; Final Fantasy X's random-encounter shatter (Square, 2001: the screen
// breaks and the pieces fly off) and Kingdom Hearts' (2002) for the break; Tales of Symphonia's shatter (Namco, 2003); EarthBound's
// psychedelic swirl and its colour telling who has the edge (Ape and HAL, 1994) for the feeling's colour bleeding in; Persona 5's cut-in
// slashes (Atlus, 2016) for the seam of light along the Line; Pokemon's wipes (Game Freak, 1996-) for the rule that it is short and
// every encounter's the same; .hack//Infection's data bugs and Protect Break (CyberConnect2, 2002) for the bug and the crazing before
// the break; guan and ge ware's jinsi tiexian, "gold thread and iron wire" (the Song kilns) for the crackle's two nets; Voronoi
// fracture (the shatter tools of every engine, and RPG Maker's shatter plugins' impact point) for the shards' shape.
//
//   game.aberrantWipe = new AberrantWipe(game)
//   .close(onCovered, { foe })   catch, bug, crackle; `onCovered` once the frame is held (0.28 s in); false, and nothing, while one runs
//   .open()                      the shatter, as soon as the crackle is done (at once if it already is)
//   .pullOverride = 0..1 | null   /pull's held value (the pull's edge)
//   .update(rawDt, camera)       each frame (main.js)   .active   .covered   .on / .render(post, src) / .compile(r, post)  (the glow's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { COLOR } from '../progress/weather.js';
import { LAB_GLSL } from './labradorite.js';

const CATCH = 0.28, BUG = 0.2, CRACK = 0.27, SHATTER = 0.6, CLOSED = CATCH + BUG + CRACK;
const N = 40, RIM = 16; // (shards; most corners a shard may have)
const BUG_COLOUR = 0xd23cff; // (a data bug's magenta, when the aberrant has no feeling)
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const bump = (x, a, b) => ease((x - a) / (b - a)); // (0 before a, 1 after b, eased)

const VERT = 'attribute vec3 aE; varying vec2 vUv; varying vec3 vE; void main() { vUv = uv; vE = aE; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
uniform sampler2D tSrc, tHist, tHeld; uniform float uEdge, uMode, uAsp, uLive, uPull, uSpin, uTwist, uPinch, uBleed, uBug, uCrack, uDark, uLineX, uLineK;
uniform vec2 uFoe, uRes; uniform vec3 uFeel; uniform vec2 uSeeds[${N}];
varying vec2 vUv; varying vec3 vE;
${LAB_GLSL}
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
vec2 h2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c) * v; }
vec2 toUv(vec2 p) { return p / vec2(uAsp, 1.0) + 0.5; }
// the golden thread: a fine cellular net, F2 - F1 of a jittered grid (in cells)
float thread(vec2 p) {
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = g + h2(i + g) * 0.85 - f; float d = length(o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return d2 - d1;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0), d = p - uFoe; float px = 1.0 / uRes.y;
  if (uMode < 0.5) { // THE CATCH: the frame laid over the held one, which is pulled in and turned about the aberrant
    vec3 prev = texture2D(tHist, clamp(toUv(uFoe + rot(d, uSpin) * (1.0 + uPull)), 0.0, 1.0)).rgb;
    gl_FragColor = vec4(mix(prev, texture2D(tSrc, vUv).rgb, uLive), 1.0); return;
  }
  if (uMode < 1.5) { // THE PRESENT: the held frame twisted toward the aberrant, the bug, the bleed, the crackle
    float r = length(d), fall = exp(-r * r * 2.6);
    vec2 q = uFoe + rot(d, uTwist * fall) * (1.0 + uPinch * fall);
    float band = floor(vUv.y * 34.0), hb = h1(band + 3.7);
    q.x += step(0.62, hb) * (hb - 0.81) * 0.16 * uBug; // (bands of rows slid, held still: no stutter of its own)
    vec2 qu = clamp(toUv(q), 0.0, 1.0), off = normalize(d + 1e-4) / vec2(uAsp, 1.0) * uBug * 0.012;
    vec3 col = vec3(texture2D(tHeld, qu + off).r, texture2D(tHeld, qu).g, texture2D(tHeld, qu - off).b);
    float L = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(1.0, 0.1, 0.8) * (L * 1.25 + 0.02), uBug * 0.32); // (the data bug's magenta cast)
    float e = smoothstep(0.32, 0.95, length((vUv - 0.5) * vec2(uAsp, 1.0)));
    col = mix(col, uFeel * (0.08 + L * 0.9), uBleed * e * 0.75); // (its feeling bleeding in from the edges)
    if (uCrack > 0.0) {
      // the iron wire: the shards' own cells (the same seeds the shatter breaks along), so the break follows the crackle
      int bi = 0; float bd = 1e9; vec2 bs = uSeeds[0];
      for (int i = 0; i < ${N}; i++) { vec2 s = uSeeds[i]; float k = dot(p - s, p - s); if (k < bd) { bd = k; bi = i; bs = s; } }
      float edge = 1e9;
      for (int i = 0; i < ${N}; i++) { if (i == bi) continue; vec2 s = uSeeds[i], n = normalize(s - bs); edge = min(edge, dot((bs + s) * 0.5 - p, n)); }
      float rf = length(p - uFoe) + 0.06 * (h1(floor(atan(d.y, d.x) * 9.0) + 1.3) - 0.5), front = uCrack * 1.25;
      float lit = smoothstep(front, front - 0.06, rf), lit2 = smoothstep(front - 0.22, front - 0.36, rf);
      float iron = 1.0 - smoothstep(0.8 * px, 2.0 * px, edge), bevel = smoothstep(4.5 * px, 2.0 * px, edge) * (1.0 - iron);
      float gold = 1.0 - smoothstep(0.02, 0.07, thread(p * 26.0 + 4.1));
      col *= 1.0 + (h1(float(bi) * 1.7) - 0.5) * 0.16 * lit; // (each plate lifting by a hair)
      col = mix(col, vec3(0.62, 0.40, 0.13) * (0.5 + L), gold * lit2 * 0.55);
      col += vec3(0.85, 0.80, 0.68) * bevel * lit * 0.14; // (the glaze's light caught on one lip)
      col = mix(col, vec3(0.018, 0.012, 0.008), iron * lit * 0.92);
      col += uFeel * exp(-pow((rf - front) / 0.025, 2.0)) * 0.5 * step(uCrack, 0.999); // (the front, in its feeling's colour)
    }
    gl_FragColor = vec4(max(col, 0.0), 1.0); return;
  }
  if (uMode < 2.5) { // A SHARD: the held frame on it, its glaze's lip and its tip to the light
    vec3 col = texture2D(tHeld, vUv).rgb * vE.y;
    col = mix(col, vec3(0.9, 0.86, 0.74), smoothstep(0.82, 0.97, vE.x) * 0.3);
    col = mix(col, vec3(0.018, 0.012, 0.008), smoothstep(0.96, 1.0, vE.x) * 0.85);
    col += labSoft(vE.z) * max(0.0, 1.0 - vE.y) * 0.35; // (the film's flash as it tips)
    gl_FragColor = vec4(max(col, 0.0), 1.0); return;
  }
  if (uMode > 3.5) { // THE PULL'S EDGE: the live frame, its channels split outward from the middle, only toward the edges
    vec2 c = vUv - 0.5; float r = length(c) * 1.4142; // (0 the middle, 1 a corner)
    float w = smoothstep(mix(1.0, 0.4, uEdge), 1.05, r) * uEdge; vec2 off = c * w * 0.12 * uBug; // (0.12: at 480 lines 0.05 barely read at 0.9, measured)
    vec3 col = vec3(texture2D(tSrc, vUv + off).r, texture2D(tSrc, vUv).g, texture2D(tSrc, vUv - off).b);
    gl_FragColor = vec4(col * (1.0 - w * 0.32 * uDark), 1.0); return; // (and the corners a shade darker: the room closing in)
  }
  // THE GROUND BEHIND: the duel's view, or the dark with the film's sheen; the Line a seam of the feeling's light
  vec3 col = uDark > 0.5 ? vec3(0.0021, 0.0009, 0.004) + labSoft(vUv.x * 0.5 + vUv.y * 0.3 + uLineK * 0.2) * 0.025 * (0.5 + 0.5 * sin(vUv.y * 7.0 + vUv.x * 3.0))
                         : texture2D(tSrc, vUv).rgb;
  col += uFeel * exp(-pow((p.x - uLineX) / 0.0025, 2.0)) * uLineK * 1.1;
  gl_FragColor = vec4(col, 1.0);
}`;

/** A small seeded draw, so the shards are the same for the same seed (a replay). */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** The cell of seed i: the view's rectangle cut by the half-plane nearer i than each other seed (Sutherland-Hodgman). */
function cellOf(i, seeds, asp) {
  let poly = [[-asp / 2, -0.5], [asp / 2, -0.5], [asp / 2, 0.5], [-asp / 2, 0.5]];
  const [sx, sy] = seeds[i];
  for (let j = 0; j < seeds.length && poly.length; j++) {
    if (j === i) continue;
    const nx = seeds[j][0] - sx, ny = seeds[j][1] - sy, mx = (seeds[j][0] + sx) / 2, my = (seeds[j][1] + sy) / 2;
    const side = (p) => (p[0] - mx) * nx + (p[1] - my) * ny, out = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k], b = poly[(k + 1) % poly.length], da = side(a), db = side(b);
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    poly = out;
  }
  return poly.slice(0, RIM);
}

export class AberrantWipe {
  constructor(game) {
    this.game = game; this.run = null; this.mat = null; this.hist = null; this.w = 0; this.h = 0; this.flip = 0; this.t = 0;
    this.seeds = Array.from({ length: N }, () => new THREE.Vector2());
    this.edgeK = 0; this.pullOverride = null; // (the pull's edge, 0..1 as drawn; /pull's held value, null for the real one)
    if (game.post) (game.post.volumes ||= []).push(this); // (a screen volume: the glow draws it, and its compile() warms it at boot)
  }

  make() {
    if (this.mat) return;
    const u = { tSrc: { value: null }, tHist: { value: null }, tHeld: { value: null }, uMindT: { value: 0 }, uFoe: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(1, 1) },
      uFeel: { value: new THREE.Color() }, uSeeds: { value: this.seeds } };
    for (const k of ['uEdge', 'uMode', 'uAsp', 'uLive', 'uPull', 'uSpin', 'uTwist', 'uPinch', 'uBleed', 'uBug', 'uCrack', 'uDark', 'uLineX', 'uLineK']) u[k] = { value: 0 };
    this.mat = new THREE.ShaderMaterial({ name: 'aberrant-wipe', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    // the shards: one buffer, a fan a shard (its middle, then up to RIM corners), moved on the CPU each frame
    const V = N * (RIM + 1), geo = new THREE.BufferGeometry(), idx = [];
    for (let s = 0; s < N; s++) for (let k = 0; k < RIM; k++) idx.push(s * (RIM + 1), s * (RIM + 1) + 1 + k, s * (RIM + 1) + 1 + ((k + 1) % RIM));
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(V * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(V * 2), 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aE', new THREE.BufferAttribute(new Float32Array(V * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.shardMesh = new THREE.Mesh(geo, this.mat); this.shardMesh.frustumCulled = false;
    this.shardScene = new THREE.Scene(); this.shardScene.add(this.shardMesh);
  }

  get active() { return !!this.run; }
  get covered() { return !!this.run?.held; }
  get on() { return (!!this.run && !this.run.plain) || (this.edgeK > 0.002 && !!this.game.post?.on); }

  /** Catch, bug, crackle; `onCovered` once the frame is held. `foe` the aberrant (its pos, height, and grade or aspect for its feeling). */
  close(onCovered, { foe = null } = {}) {
    if (this.run) return false; // (one at a time: a second close would drop the first's callback)
    const g = this.game, cam = g.camera, asp = cam?.aspect || 16 / 9, plain = !g.post?.on;
    const screen = (v) => { if (!v || !cam) return null; const s = v.clone().project(cam); return s.z < 1 ? new THREE.Vector2(s.x * 0.5 * asp, s.y * 0.5) : null; };
    const fp = foe?.pos ? screen(foe.pos.clone().setY(foe.pos.y + (foe.height || 1) * 0.5)) : null;
    const F = fp ? fp.clamp(new THREE.Vector2(-asp * 0.42, -0.42), new THREE.Vector2(asp * 0.42, 0.42)) : new THREE.Vector2(0, 0.05);
    const P = g.player?.pos ? screen(g.player.pos.clone().setY(g.player.pos.y + 1)) : null;
    const C = P || new THREE.Vector2(0, -0.2);
    // the Line: upright on the screen, between the Courier and the foe; your side is the Courier's (the left when they stand in line)
    const lineX = (C.x + F.x) / 2, you = Math.abs(C.x - F.x) > 0.04 ? Math.sign(C.x - F.x) : -1;
    const feel = COLOR[foe?.grade] ?? COLOR[foe?.aspect] ?? BUG_COLOUR;
    // the seeds: dense at the foe's point, sparser out to the edges (the impact's fracture)
    const R = rng((g.seed ?? 7) * 7919 + 101), seeds = [];
    for (let i = 0; i < N; i++) {
      let x, y;
      if (i < 9) { const a = (i / 9) * 6.283 + R() * 0.5, r = 0.05 + R() * 0.1; x = F.x + Math.cos(a) * r; y = F.y + Math.sin(a) * r; }
      else if (i < 22) { const a = R() * 6.283, r = 0.16 + R() * 0.32; x = F.x + Math.cos(a) * r; y = F.y + Math.sin(a) * r; }
      else { x = (R() - 0.5) * asp * 0.98; y = (R() - 0.5) * 0.98; }
      x = Math.max(-asp / 2 + 0.01, Math.min(asp / 2 - 0.01, x)); y = Math.max(-0.49, Math.min(0.49, y));
      seeds.push([x, y]); this.seeds[i].set(x, y);
    }
    this.run = { t: 0, cb: onCovered || null, held: false, opened: false, plain, asp, F, lineX, you, feel: new THREE.Color(feel), seeds, shards: null, ts: -1, fresh: true, snap: false, pulsed: false };
    const V = g.post?.volumes; if (V) { const i = V.indexOf(this); if (i >= 0 && i !== V.length - 1) { V.splice(i, 1); V.push(this); } } // (last of the volumes: it holds what they drew)
    if (plain) this.cover(0);
    g.ui?.want?.('aberrantWipe', true); // (the HUD steps out of the picture: hideui.js; back at the end, in update)
    return true;
  }

  /** The shatter: when the crackle is done (at once if it is). */
  open() { if (this.run) this.run.opened = true; }

  /** The shards cut from the seeds, each with its flight: to its side of the Line, out from the foe, turning, tipping, falling. */
  cut(R) {
    const R2 = rng((this.game.seed ?? 7) * 104729 + 17);
    R.shards = R.seeds.map((s, i) => {
      const poly = cellOf(i, R.seeds, R.asp); let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length || 1; cy /= poly.length || 1;
      const ox = cx - R.F.x, oy = cy - R.F.y, od = Math.hypot(ox, oy) || 1;
      const dir = cx < R.lineX ? -1 : 1; // (each shard to its own side of the Line: the Courier's toward the Courier's side, the foe's toward its own)
      return { poly, cx, cy, dir, delay: 0.1 * Math.min(1, od / 0.8),
        vx: dir * (0.7 + 0.8 * R2()) + (ox / od) * 0.35, vy: (oy / od) * 0.35 + 0.5 * R2(), spin: (R2() - 0.5) * 7, tip: 2 + 4 * R2(), ph: R2() };
    });
  }

  /** The pull's edge as drawn: the pull (or /pull's value), none while a wipe runs or a duel is on, eased a little so it never pops. */
  edgeOf(raw) {
    const g = this.game, p = this.pullOverride ?? g.duelFoes?.pull ?? 0, to = this.run || g.duel?.active || g.duel?.pending ? 0 : Math.min(1, Math.max(0, Number(p) || 0));
    this.edgeK = THREE.MathUtils.damp(this.edgeK, to, 14, Math.min(raw || 0, 0.1));
    if (to === 0 && this.edgeK < 0.002) this.edgeK = 0;
  }

  update(raw, camera) {
    this.edgeOf(raw);
    const R = this.run; if (!R) return;
    raw = Math.min(raw || 0, 0.1); // (a stalled frame does not jump a beat)
    this.t += raw; R.t += raw; this.dtK = raw * 60; // (the catch's per-frame amounts, as at 60 frames a real second)
    if (!R.held && R.t >= CATCH) { R.held = true; const cb = R.cb; R.cb = null; cb?.(); } // (the frame is held: the place may change behind it)
    if (!R.pulsed && R.t >= CATCH) { // the bug: one pulse of the glitch's own tear at the aberrant's point (none with visual.glitch off: the glitch drops it)
      R.pulsed = true; const u = R.F.x / R.asp + 0.5, v = R.F.y + 0.5;
      this.game.glitch?.pulse?.({ split: 0.7, tear: 0.6, crush: 0.5, mosh: 0.25, dur: BUG + 0.2, at: { u, v } });
    }
    if (R.ts < 0 && R.opened && R.t >= CLOSED) { R.ts = 0; R.snap = true; this.cut(R); }
    else if (R.ts >= 0) R.ts += raw;
    if (R.plain) this.cover(R.ts >= 0 ? 1 - R.ts / SHATTER : Math.min(1, R.t / CATCH));
    if (R.ts >= SHATTER) { this.run = null; if (R.plain) this.cover(-1); this.game.ui?.want?.('aberrantWipe', false); }
  }

  /** The stand-in with the glow off: a dark cover (0..1; -1 gone). */
  cover(k) {
    if (!this.el) { this.el = document.createElement('div'); this.el.style.cssText = 'position:fixed;inset:0;background:#07030d;opacity:0;pointer-events:none;z-index:11'; document.body.appendChild(this.el); }
    this.el.style.opacity = String(Math.max(0, k)); this.el.style.display = k < 0 ? 'none' : 'block';
  }

  targets(w, h) {
    if (!this.hist) { const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }); this.hist = [rt(), rt(), rt()]; } // ([0], [1] the catch's pair; [2] what the present draws)
    if (this.w !== w || this.h !== h) { for (const t of this.hist) t.setSize(w, h); this.w = w; this.h = h; if (this.run) this.run.fresh = true; }
  }

  pass(post, mode, out) { this.mat.uniforms.uMode.value = mode; this.mat.uniformsNeedUpdate = true; post.pass(this.mat, out); }

  /** The glow's volume hook: the frame in, the caught, crazed or broken frame out. */
  render(post, src) {
    const R = this.run; this.make();
    this.targets(src.width, src.height);
    if (!R) { // the pull's edge alone
      const u = this.mat.uniforms, soft = T.visual.glitch === false;
      u.tSrc.value = src.texture; u.uEdge.value = this.edgeK; u.uBug.value = soft ? 0.5 : 1; u.uDark.value = soft ? 0 : 1;
      this.pass(post, 4, this.hist[2]); return this.hist[2];
    }
    const u = this.mat.uniforms, t = R.t, x = Math.min(1, t / CATCH), r60 = 1 / 60;
    u.uAsp.value = R.asp; u.uFoe.value.copy(R.F); u.uRes.value.set(src.width, src.height); u.uFeel.value.copy(R.feel); u.uMindT.value = this.t; u.uLineX.value = R.lineX;
    // the catch, while it lasts: into the pair, the newest kept as the held frame
    if (t < CATCH + r60 || R.fresh) {
      const base = 0.55 * Math.pow(1 - x, 1.5), k = this.dtK ?? 1;
      u.tSrc.value = src.texture; u.tHist.value = this.hist[1 - this.flip].texture;
      u.uLive.value = R.fresh ? 1 : 1 - Math.pow(1 - base, k); u.uPull.value = 0.008 * k * (1 - x * 0.5); u.uSpin.value = 0.012 * k * (1 - x * 0.5);
      this.pass(post, 0, this.hist[this.flip]); this.held = this.hist[this.flip]; this.flip = 1 - this.flip; R.fresh = false;
    }
    const tw = 0.9 * ease(x) + 0.15 * bump(t, CATCH, CLOSED);
    u.uTwist.value = tw * (R.you < 0 ? 1 : -1); u.uPinch.value = 0.32 * ease(x); u.uBleed.value = 0.25 + 0.75 * ease(x);
    const bugK = T.visual.glitch === false ? 0.33 : 1, b = t < CATCH ? 0 : t < CATCH + BUG * 0.4 ? bump(t, CATCH, CATCH + BUG * 0.4) : 1 - 0.85 * bump(t, CATCH + BUG * 0.4, CATCH + BUG);
    u.uBug.value = b * bugK; u.uCrack.value = t < CATCH + BUG ? 0 : Math.min(1, (t - CATCH - BUG) / CRACK);
    u.tHeld.value = u.tHist.value = this.held.texture; u.uLineK.value = 0; // (no sampler left on a target drawn into below: a feedback loop drops the draw)
    if (R.ts < 0) { this.pass(post, 1, this.hist[2]); return this.hist[2]; }
    // the shatter: the presented frame kept once (into the pair's spare: the catch is over), the ground drawn, the shards over it
    const snap = this.hist[this.flip]; // (the held frame is [1 - flip])
    if (R.snap) { this.pass(post, 1, snap); R.snap = false; }
    const duel = this.game.duelView, live = !!(duel && (duel.active ?? duel.on));
    u.uDark.value = live ? 0 : 1; u.tSrc.value = src.texture;
    u.uLineK.value = bump(R.ts, 0, 0.06) * (1 - bump(R.ts, 0.18, 0.45));
    this.pass(post, 3, this.hist[2]);
    this.move(R); u.tHeld.value = snap.texture; u.uMode.value = 2; this.mat.uniformsNeedUpdate = true;
    const r = post.r, auto = r.autoClear; r.autoClear = false; r.setRenderTarget(this.hist[2]); r.render(this.shardScene, post.cam); r.autoClear = auto;
    return this.hist[2];
  }

  /** Each shard where its flight has it now, written into the one buffer. */
  move(R) {
    const geo = this.shardMesh.geometry, P = geo.attributes.position.array, UV = geo.attributes.uv.array, E = geo.attributes.aE.array, a = R.asp, ts = R.ts;
    const part = 0.012 * bump(ts, 0, 0.08);
    R.shards.forEach((s, i) => {
      const o = i * (RIM + 1), tau = Math.max(0, ts - s.delay), ang = s.spin * tau, tip = s.tip * tau, ct = Math.cos(tip), shrink = 1 - 0.3 * Math.min(1, tau / 0.5);
      const cx = s.cx + s.dir * part + s.vx * tau, cy = s.cy + s.vy * tau - 1.6 * tau * tau, ca = Math.cos(ang), sa = Math.sin(ang);
      const lit = 0.82 + 0.38 * Math.cos(tip * 0.7 + s.ph * 6), ph = s.ph + tip * 0.08;
      const put = (k, lx, ly, e) => {
        const tx = lx * ct * shrink, ty = ly * shrink, wx = cx + tx * ca - ty * sa, wy = cy + tx * sa + ty * ca;
        P[(o + k) * 3] = (wx * 2) / a; P[(o + k) * 3 + 1] = wy * 2; P[(o + k) * 3 + 2] = 0;
        UV[(o + k) * 2] = (s.cx + lx) / a + 0.5; UV[(o + k) * 2 + 1] = s.cy + ly + 0.5;
        E[(o + k) * 3] = e; E[(o + k) * 3 + 1] = lit; E[(o + k) * 3 + 2] = ph;
      };
      put(0, 0, 0, 0);
      const n = s.poly.length;
      for (let k = 0; k < RIM; k++) { const p = s.poly[Math.min(k, n - 1)] || [s.cx, s.cy]; put(1 + k, p[0] - s.cx, p[1] - s.cy, 1); } // (a shard of fewer corners repeats its last: those triangles are empty)
    });
    geo.attributes.position.needsUpdate = geo.attributes.uv.needsUpdate = geo.attributes.aE.needsUpdate = true;
  }

  /** The boot's warm-up (the glow's compile()): its one program, against the glow's half-float target as it is drawn. */
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); }
}
