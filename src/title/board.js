// ---------------------------------------------------------------------------------------
// THE BOARD: the checkerboard sea of the title (THE FOOL'S PRECIPICE: title/scene.js), bent down into a slow whirlpool and up again at its
// rim, with giant game pieces standing on it that PLAY: on the beat of the music, one of them makes its move (a pawn steps a square, a
// rook slides two, the king turns, a die tumbles), so the game is already being played when they sit down to watch it.
//
// The squares are LOG-POLAR: a square's width is a fixed fraction of its distance from the centre, so the board is the same pattern
// all the way down the drain (an Escher spiral: "Smaller and Smaller", and the owner's own checker vortex, docs/ref/). The whole board
// turns slowly and flows slowly inward; the pieces ride it, so they circle the drain, and one that reaches the middle sinks and comes
// back at the rim. The checker is drawn with ANALYTIC antialiasing (a smoothstep over the screen-space width of a square's edge, and
// the pattern fades to its mean colour where the squares are smaller than a few pixels) so that at 480 lines it cannot shimmer
// (CLAUDE.md's comfort rule): what moves is the board itself, slowly.
//
// Prior art: Escher's spirals and "Smaller and Smaller", Alice's chessboard country (Through the Looking-Glass), the tarot Fool on his
// cliff, Kirby's and Mario Party's board worlds, and the "box-filtered checkerboard" of Inigo Quilez (an antialiased procedural checker).
//
// THE PIECES are the owner's (source_assets/chess_pieces.blend -> src/assets/clips/chess.bin, scripts/export_chess.py, 2026-10-07): six
// porcelain pieces on five-bone rigs, alive. Each idles, glances about, bows and taunts between turns; on its turn it MOVES (its own
// move clip, a square's travel taken out of it: the board carries it from square to square, log-polar), the knight in an L and the queen
// spinning; the king and the queen celebrate a move; a piece drawn down the drain FALLS, and comes back at the rim with its SPAWN.
// Its GLB bytes are fetched beside the bundle as a .bin like the clip packs (some hosts will not serve a .glb), only while the title
// plays, and let go when it closes; until then the pieces are lathed porcelain.
//
//   const b = new Board(scene)   b.update(dt, beat)   (beat: { bar, beat, phase } from the music's grid, or the board's own clock)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneRig } from 'three/examples/jsm/utils/SkeletonUtils.js';
import chessUrl from '../assets/clips/chess.bin?url';

// the owner's pieces: the name of each rig in chess.bin, its height in its own units, and the step a turn takes it (squares: round, in)
const RIGS = { pawn: ['pawn_Rig', 3.0], rook: ['Rook_Rig', 3.7], knight: ['Knight_Rig', 3.96], bishop: ['bishop_Rig', 4.3], queen: ['queen_Rig', 4.29], king: ['King_Rig', 5.0] };
const CLIP = { pawn: 'pawn', rook: 'Rook', knight: 'Knight', bishop: 'bishop', queen: 'queen', king: 'King' };

const N = 24;                // squares round the board
const R0 = 4, R1 = 260;      // the drain's lip and the rim, in metres
const K = (Math.PI * 2) / N; // a square's height in log-radius is its width in angle: squares stay square all the way down
const SPIN = 0.018, FLOW = 0.012; // (radians a second the board turns; log-radius a second it flows inward)

/** The board's height at radius r: down into the drain, up at the rim. */
export const boardY = (r) => -26 * Math.exp(-r / 22) + 0.001 * r * r - 2;
const logr0 = Math.log(R0), logr1 = Math.log(R1);

const VERT = /* glsl */ `
  uniform float uSpin, uFlow;
  varying vec2 vSq; varying float vFog; varying float vR;
  void main() {
    float lr = mix(${logr0.toFixed(5)}, ${logr1.toFixed(5)}, uv.x);
    float a = uv.y * 6.2831853;
    float r = exp(lr);
    vec3 p = vec3(cos(a + uSpin) * r, -26.0 * exp(-r / 22.0) + 0.001 * r * r - 2.0, sin(a + uSpin) * r);
    vSq = vec2(a / ${K.toFixed(6)}, (lr + uFlow) / ${K.toFixed(6)});
    vR = r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFog = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */ `
  uniform vec3 uA, uB, uFogC; uniform float uFogN, uFogF;
  varying vec2 vSq; varying float vFog; varying float vR;
  // a box-filtered checker (Inigo Quilez): the pattern integrated over the pixel's footprint, so it greys out instead of aliasing
  float checker(vec2 p) {
    vec2 w = max(abs(dFdx(p)) + abs(dFdy(p)), 1e-4);
    vec2 i = 2.0 * (abs(fract((p - 0.5 * w) * 0.5) - 0.5) - abs(fract((p + 0.5 * w) * 0.5) - 0.5)) / w;
    return 0.5 - 0.5 * i.x * i.y;
  }
  void main() {
    float c = checker(vSq);
    vec3 col = mix(uA, uB, c);
    // the drain darkens toward its throat, the rim lifts toward the sky
    col *= mix(0.25, 1.0, smoothstep(${R0.toFixed(1)}, 30.0, vR));
    float f = smoothstep(uFogN, uFogF, vFog);
    gl_FragColor = vec4(mix(col, uFogC, f), 1.0);
  }`;

/** A piece's profile for the lathe (radius, height), in units of its height. */
const PROFILES = {
  pawn: [[0, 0], [0.42, 0], [0.42, 0.06], [0.32, 0.1], [0.3, 0.16], [0.18, 0.28], [0.13, 0.52], [0.22, 0.56], [0.22, 0.6], [0.12, 0.62], [0.2, 0.72], [0.21, 0.82], [0.15, 0.94], [0, 1]],
  rook: [[0, 0], [0.44, 0], [0.44, 0.07], [0.34, 0.12], [0.3, 0.2], [0.24, 0.3], [0.22, 0.74], [0.32, 0.8], [0.32, 1], [0, 1]],
  king: [[0, 0], [0.44, 0], [0.44, 0.06], [0.34, 0.1], [0.3, 0.18], [0.2, 0.3], [0.15, 0.62], [0.26, 0.66], [0.26, 0.7], [0.16, 0.72], [0.24, 0.84], [0.22, 0.9], [0.1, 0.94], [0, 0.95]],
  bishop: [[0, 0], [0.42, 0], [0.42, 0.06], [0.32, 0.1], [0.28, 0.18], [0.16, 0.3], [0.12, 0.56], [0.22, 0.6], [0.22, 0.64], [0.12, 0.66], [0.2, 0.76], [0.18, 0.88], [0.08, 0.96], [0.04, 1], [0, 1]],
};

function lathe(kind) {
  const g = new THREE.LatheGeometry(PROFILES[kind].map(([r, y]) => new THREE.Vector2(r, y)), 18);
  if (kind === 'rook') { // crenellations: four notches cut by boxes is costly; four small blocks on the rim reads the same
    const parts = [g];
    for (let i = 0; i < 4; i++) { const b = new THREE.BoxGeometry(0.14, 0.12, 0.14); const a = (i / 4) * Math.PI * 2 + Math.PI / 4; b.translate(Math.cos(a) * 0.26, 1.05, Math.sin(a) * 0.26); parts.push(b); }
    return merge(parts);
  }
  if (kind === 'king') { // a star on top (the owner's star-crowned king)
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.07 : 0.17, a = (i / 10) * Math.PI * 2 + Math.PI / 2; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    const st = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }); st.translate(0, 1.1, -0.025);
    return merge([g, st]);
  }
  return g;
}
function merge(parts) {
  const out = new THREE.BufferGeometry(), pos = [], nor = [];
  for (const p of parts) { const q = p.index ? p.toNonIndexed() : p; q.computeVertexNormals(); pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); }
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
/** A die's face texture: pips on ivory. */
function dieTexture() {
  const c = document.createElement('canvas'); c.width = 384; c.height = 64;
  const g = c.getContext('2d');
  const pips = { 1: [[0.5, 0.5]], 2: [[0.27, 0.27], [0.73, 0.73]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]] };
  for (let f = 0; f < 6; f++) {
    g.fillStyle = '#efe4cf'; g.fillRect(f * 64, 0, 64, 64);
    g.fillStyle = '#2a1838'; for (const [x, y] of pips[f + 1]) { g.beginPath(); g.arc(f * 64 + x * 64, y * 64, 6, 0, Math.PI * 2); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Board {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); scene.add(this.group);
    // the board itself: a grid in (log-radius, angle), shaped in the vertex shader
    const geo = new THREE.PlaneGeometry(1, 1, 96, 144);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide,
      uniforms: { uSpin: { value: 0 }, uFlow: { value: 0 }, uA: { value: new THREE.Color(0x24142e) }, uB: { value: new THREE.Color(0xd9c7b0) }, uFogC: { value: new THREE.Color(0x3a2550) }, uFogN: { value: 60 }, uFogF: { value: 300 } },
    });
    // (the plane's uvs are (0..1, 0..1): u along log-radius, v round the board; the shader does the rest)
    const surf = new THREE.Mesh(geo, this.mat); surf.frustumCulled = false; this.group.add(surf);
    this.spin = 0; this.flow = 0;
    // the pieces: porcelain, black and cream
    const dark = new THREE.MeshStandardMaterial({ color: 0x1c1224, roughness: 0.3, metalness: 0.1 });
    const pale = new THREE.MeshStandardMaterial({ color: 0xe8dcc6, roughness: 0.35, metalness: 0.05 });
    this.geos = Object.fromEntries(Object.keys(PROFILES).map((k) => [k, lathe(k)]));
    this.pieces = [];
    const cast = [['king', 1, 22, 13], ['rook', 0, 7, 10], ['pawn', 0, 2, 8], ['queen', 0, 16, 12.5], ['pawn', 1, 15, 8], ['bishop', 0, 18, 11], ['pawn', 0, 10, 7], ['knight', 1, 1, 10], ['rook', 1, 4, 10], ['pawn', 1, 20, 7], ['bishop', 1, 12, 10], ['knight', 0, 8, 10], ['pawn', 0, 23, 7]];
    this.mats = [dark, pale];
    cast.forEach(([kind, side, i, h], n) => {
      const m = new THREE.Mesh(this.geos[kind === 'knight' ? 'bishop' : kind === 'queen' ? 'king' : kind], side ? pale : dark);
      m.scale.setScalar(h);
      this.group.add(m);
      this.pieces.push({ m, kind, side, i: i + 0.5, j: 9 + (n * 5) % 11 + 0.5, h, hop: null, yaw: Math.random() * 6.28, wait: 2 + (n % 5) * 1.7 }); // (j in log-radius squares: 9 is ~10 m out, 20 ~190 m)
    });
    this.piecesWanted = true; // (the owner's pieces are parsed the first time the board plays: the title shown, not a test drive)
    // dice in the air, turning
    const dieMat = new THREE.MeshStandardMaterial({ map: dieTexture(), roughness: 0.4 });
    this.dice = [];
    for (const [x, y, z, s] of [[-38, 26, -70, 7], [52, 40, -120, 10], [-90, 55, -160, 12]]) {
      const g = new THREE.BoxGeometry(1, 1, 1);
      // (the six faces of the strip, one to a side)
      const uv = g.attributes.uv;
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const k = f * 4 + v; uv.setX(k, (f + uv.getX(k)) / 6); }
      const d = new THREE.Mesh(g, dieMat); d.position.set(x, y, z); d.scale.setScalar(s); d.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      this.group.add(d); this.dice.push({ m: d, spin: new THREE.Euler(0.05 + Math.random() * 0.05, 0.08, 0.03), tumble: null, base: y });
    }
    this.lastBar = -1; this.lastBeat = -1; this.turn = 0;
  }

  /** The owner's pieces in place of the lathed ones, once chess.bin is in (each its own rig, its own mixer). */
  async loadPieces() {
    if (this.loading) return;
    this.loading = true;
    let gl;
    try { gl = await new GLTFLoader().parseAsync(await fetch(chessUrl).then((r) => r.arrayBuffer()), ''); } catch (e) { console.warn('chess pieces', e); return; }
    // (a move's square of travel taken out: the board carries the piece; its rise and its squash stay)
    for (const a of gl.animations) if (/_move$/.test(a.name)) for (const t of a.tracks) if (/^root(_\d+)?\.position$/.test(t.name)) for (let k = 0; k < t.values.length; k += 3) { t.values[k] = 0; t.values[k + 2] = 0; }
    const rigs = {}; gl.scene.traverse((o) => { if (o.name.endsWith('_Rig')) rigs[o.name] = o; });
    for (const p of this.pieces) {
      const [rn, height] = RIGS[p.kind], src = rigs[rn]; if (!src) continue;
      const rig = cloneRig(src); rig.position.set(0, 0, 0);
      rig.traverse((o) => { if (o.isSkinnedMesh) { o.material = this.mats[p.side]; o.frustumCulled = false; } });
      const holder = new THREE.Group(); holder.add(rig); holder.scale.setScalar(p.h / height);
      this.group.remove(p.m); this.group.add(holder);
      const pre = `${CLIP[p.kind]}_`, mixer = new THREE.AnimationMixer(rig), clips = {};
      for (const a of gl.animations) if (a.name.startsWith(pre)) clips[a.name.slice(pre.length)] = a;
      p.m = holder; p.unit = p.h / height; p.mixer = mixer; p.clips = clips; p.rigged = true;
      this.play(p, 'idle', { loop: true, fade: 0 });
    }
  }

  /** The title is gone: the owner's pieces let go (the lathed ones stand in until it is shown again). */
  release() {
    for (const p of this.pieces) {
      if (!p.rigged) continue;
      p.mixer.stopAllAction(); this.group.remove(p.m);
      p.m = new THREE.Mesh(this.geos[p.kind === 'knight' ? 'bishop' : p.kind === 'queen' ? 'king' : p.kind], this.mats[p.side]); this.group.add(p.m);
      p.rigged = false; p.mixer = p.clips = p.action = null;
    }
    this.loading = false;
  }

  /** A piece plays one of its clips (crossfaded); a one-shot goes back to its idle when it ends. */
  play(p, name, { loop = false, fade = 0.2, dur = null } = {}) {
    const c = p.clips?.[name]; if (!c) return;
    const a = p.mixer.clipAction(c);
    a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1); a.clampWhenFinished = !loop;
    a.setEffectiveTimeScale(dur ? c.duration / dur : 1); a.setEffectiveWeight(1);
    if (p.action && p.action !== a) a.crossFadeFrom(p.action, fade, false); else a.play();
    a.play(); p.action = a; p.clip = name; p.left = loop ? Infinity : (dur ?? c.duration);
  }

  /** The way a step goes on the board, from piece p's square: [x, z] for atan2 (the piece's +Z is its front). */
  heading(p, step) { const a = this.at(p.i, p.j, new THREE.Vector3()), b = this.at(p.i + step[0], p.j + step[1], new THREE.Vector3()); return [b.x - a.x, b.z - a.z]; }

  /** Where a square's centre is (and the board's up there, roughly). */
  at(i, j, out = new THREE.Vector3()) {
    const a = (i * K) + this.spin, lr = j * K - this.flow, r = Math.exp(lr);
    return out.set(Math.cos(a) * r, boardY(r), Math.sin(a) * r);
  }

  update(dt, beat) {
    if (this.piecesWanted && !this.loading) this.loadPieces();
    this.spin += SPIN * dt; this.flow += FLOW * dt;
    this.mat.uniforms.uSpin.value = this.spin; this.mat.uniforms.uFlow.value = this.flow;
    // the beat: a move each bar, by turns; a die tumbles on each bar's downbeat
    if (beat.bar !== this.lastBar) {
      this.lastBar = beat.bar;
      const p = this.pieces[this.turn++ % this.pieces.length];
      const md = (a, n) => ((a % n) + n) % n;
      const side = Math.random() < 0.5 ? 1 : -1;
      const step = p.kind === 'rook' ? [0, -2] : p.kind === 'bishop' ? [side, -1] : p.kind === 'king' ? [side, 0] : p.kind === 'knight' ? [side, -2] : p.kind === 'queen' ? [side * 2, -2] : [0, -1];
      p.hop = { t: 0, dur: beat.spb * (p.rigged ? 2 : 1.4), from: [p.i, p.j], to: [p.i + step[0], p.j + step[1]] };
      if (p.rigged) { this.play(p, 'move', { dur: p.hop.dur }); p.face = Math.atan2(...this.heading(p, step)); }
      const d = this.dice[md(beat.bar, this.dice.length)];
      d.tumble = { t: 0, dur: beat.spb * 0.9, from: d.m.quaternion.clone(), to: d.m.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)) };
    }
    const v = new THREE.Vector3();
    for (const p of this.pieces) {
      let i = p.i, j = p.j, lift = 0;
      if (p.hop) {
        p.hop.t += dt;
        const u = Math.min(1, p.hop.t / p.hop.dur), e = u * u * (3 - 2 * u);
        i = p.hop.from[0] + (p.hop.to[0] - p.hop.from[0]) * e; j = p.hop.from[1] + (p.hop.to[1] - p.hop.from[1]) * e;
        lift = p.rigged ? 0 : Math.sin(Math.PI * u) * p.h * 0.35; // (an owner's piece hops in its own clip)
        if (u >= 1) { p.i = p.hop.to[0]; p.j = p.hop.to[1]; p.hop = null; if (p.rigged && (p.kind === 'king' || p.kind === 'queen')) this.play(p, 'celebrate'); }
      }
      if (p.rigged) {
        p.mixer.update(dt); p.left -= dt; p.wait -= dt;
        if (p.left <= 0 && p.clip !== 'idle' && p.clip !== 'fall') this.play(p, 'idle', { loop: true, fade: 0.3 });
        if (p.wait <= 0 && p.clip === 'idle' && !p.hop) { p.wait = 4 + Math.random() * 6; this.play(p, ['lookAround', 'bow', 'taunt', 'lookAround'][Math.floor(Math.random() * 4)], { fade: 0.3 }); }
        if (Math.exp(j * K - this.flow) < R0 + 10 && p.clip !== 'fall') { p.hop = null; this.play(p, 'fall', { fade: 0.15 }); }
      }
      // (drawn down the drain: back at the rim, rising out of the board)
      if (Math.exp(j * K - this.flow) < R0 + 2) { p.j += Math.log(R1 * 0.55 / R0) / K; p.hop = null; if (p.rigged) this.play(p, 'spawn', { fade: 0 }); }
      this.at(i, j, v);
      const r = Math.hypot(v.x, v.z), sink = THREE.MathUtils.smoothstep(r, R0, R0 + 14);
      p.m.position.set(v.x, v.y + lift - (1 - sink) * p.h, v.z);
      p.m.scale.setScalar((p.rigged ? p.unit : p.h) * (0.35 + 0.65 * sink));
      if (p.rigged) { if (p.face != null) p.yaw += Math.atan2(Math.sin(p.face - p.yaw), Math.cos(p.face - p.yaw)) * Math.min(1, dt * 4); p.m.rotation.y = p.yaw; } // (it turns to where it goes)
      else p.m.rotation.y = p.yaw + (p.kind === 'king' && p.hop ? Math.PI * 2 * (p.hop.t / p.hop.dur) : 0);
    }
    for (const d of this.dice) {
      if (d.tumble) {
        d.tumble.t += dt;
        const u = Math.min(1, d.tumble.t / d.tumble.dur);
        d.m.quaternion.slerpQuaternions(d.tumble.from, d.tumble.to, 1 - Math.pow(1 - u, 3));
        if (u >= 1) d.tumble = null;
      } else { d.m.rotation.x += d.spin.x * dt; d.m.rotation.y += d.spin.y * dt; }
      d.m.position.y = d.base + Math.sin(performance.now() / 1900 + d.base) * 1.2;
    }
  }
}
