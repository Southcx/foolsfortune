// ---------------------------------------------------------------------------------------
// THE DUEL'S PIECES (the duel's view: vfx/duelview.js): every piece on a puzzle duel's board as one instance of its family's mesh
// (CLAUDE.md: many copies of a prop are a batch), so a full board is a few draws. Each piece the view shows is a VISUAL (`v`): its kind,
// colour and side, the cell it is drawn at (fractional while it moves), and what a beat does to it (a squash, a lift, a flash, a flip, a
// spin, a scale; and what the view's glows lay on it: a hum, a grey, a pick, a preview, the foe's foresight). `cells` is the view's own
// copy of the board (where each visual will be once the beat in hand is done), so the beats (vfx/duelview/beats.js) can follow an event
// that names only a cell. The bodies are two figurines, not instances: the Courier's in white clay with a ring of the film turning round
// it, the foe's idol in its feeling with its data bug's magenta cast slid off it (vfx/databug.js's 'cast').
//
// THE GEMS (South, 2026-10-27: "the gems need to be readily identifiable ... visually reactive in a way that shows what happens to
// them"; PUZZLE-DUELS.md 20): colour leads, shape confirms, value separates. Each feeling's gem is its silhouette (piecemodels.js) in its
// feeling's hue set on its own lightness step (GEM, Oklab L: Mirth 0.84 (a true gold), Wonder 0.76 (a deep cyan: the pale steps read cream under the glow on a phone), Desire 0.70, Grief 0.62 (pushed to periwinkle,
// off Wonder's cyan), Gall 0.55, Fury 0.52, Dread 0.47; the dark three on a pale keyline of their own hue, PALE), self-lit (no light or tint of the board's reaches it: the domains' clash stays on the frame and the dome), a soft
// highlight at its top and a gloss spot, on a dark keyline that lifts it off the slab. The keyline is the state's voice:
//   idle        a slow breathe, out of phase gem to gem (Bejeweled's idle glint)
//   picked      lifted and swelled (marks.js rings the cell), the keyline white
//   preview     (worth.js: the cells the action under the finger would clear) the keyline a bright pulse, the silhouette swelling
//   clearing    (beats.js clears) white over its last 0.09 real s, then the pop in its colour
//   falling     stretched along the fall, squashed on landing, a puff of dust (beats.js fall)
//   painted     the old silhouette turning and shrinking away as the new one turns in (any gem whose colour changes in place)
//   tuned       its hum: a swell and a whitening on the bell's beat (glows.js), the keyline struck white
//   weak        (weaknessOf: the colour to chase) gold keyline and a twinkling glint on each of that colour on your half
//   foresight   (the foe's planned clears, glows.js) a bold keyline in the foe's feeling, its colour shown through the fog
// SLIME (an aberrant slip jelly's junk) a glossy blob of Gall, wobbling, its keyline its own darker green. JUNK is a cracked dark tile on a pulsing ember rim (bright as it lands, settling to a throb until it is cleared); an EMBER (Dread's
// junk) a coal of glazed clay, its count in glowing pips, crazing as it cools out (crazing.js) before it turns into its gem. DREAD'S
// FOG shows shape, never colour (dread.js fogShows): a piece on hidden ground is a plain stone of the fog, so the stacks read by height.
//
// Materials: the gems a self-lit basic program (the face shaded from its own normals: `duel-gem`, one new program); keylines, rims,
// glints and orbs the unlit glow program; junk, stone, the bomb, the fog's stones and the embers clay; the film ring the Mind's line.
// Prior art: three.js's InstancedMesh (one draw a family), Bejeweled (a shape a colour, the idle glint, the white pop), Candy Crush (a
// white highlight and a dark rim on every candy; the swelling hint), Puyo Puyo's squash on landing, Puzzle Quest's match preview,
// Panel de Pon's flicker as a panel converts (the pinch's flip), colour-blind design's rule (shape and value, never hue alone).
//
//   const P = new DuelPieces(parent)   P.build(kernelBoard, foeAspect)   P.at(x, y)   P.byId(id)   P.add(kind, props, x, y) -> v
//   P.move(v, x, y) (the model only)   P.remove(v)   P.hideBody(side, hidden)   P.bodyAt(side) -> v   P.update(dt)   P.list
//   P.dim (a Set of colours | null: the feelings side 0 has not awakened to, drawn unlit on your half: Dovina's state.dim)   v.hint (0..1: the idle hint's soft pulse) v.hintDir ([dx, dy]: its nudge)   P.weak (a colour | null) P.line P.fore (a Set of 'x,y': glows.js) P.dormant (0..1: the Courier's figurine asleep in the hand's form, formdive.js)   gemColour(aspect, out) -> THREE.Color (a gem's own colour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { crystalFretMaterial } from '../crystalfrets.js';
import { mindLineMaterial } from '../labradorite.js';
import { featTint } from '../oxidation.js';
import { DUEL_VIEW, FEELING_ORDER, cellLocal, feelColour, hash } from './layout.js';
import { drawCrazing } from './crazing.js';
import { aberrantFigurine } from '../aberrantlook.js';
import { gemGeometry, keylineGeometry, plateGeometry, glintGeometry, emberGeometry, pipGeometry, junkGeometry, slimeGeometry, stoneGeometry, fogStoneGeometry, bombGeometry, orbGeometry, courierFigurine, foeIdol, ledgeGeometry } from './piecemodels.js';

/** A dim gem (a feeling you have not awakened to, worth half: progress/duel/duel.js DIM) drawn unlit: its body darkened to this share of
 *  its colour, its feeling carried by its keyline in full colour, thicker by `rim` (cells), so it reads when every gem is dim (a new save). */
/** A slime's wobble (its squash's share, the real clock's). */
export const SLIME = { wobble: 0.06 };
export const DIM_GEM = { body: 0.1, rim: 0.09, glow: 1.3 }; // (body: linear, so 0.1 reads near 0.35 on the screen)
/** A gem's colour: its feeling's hue (progress/weather.js COLOR) on its own lightness step (Oklab L, chroma kept where sRGB allows). */
export const GEM = { mirth: 0xf6c12a, wonder: 0x34c2ec, desire: 0xf57141, grief: 0x6e76ee, gall: 0x8454c1, fury: 0xc5071a, dread: 0x3b6646 };
const PALE = { gall: 0xdfcdff, fury: 0xfdbfb8, dread: 0xb6e5c0 }; // (the dark three wear a pale keyline in their own hue: every gem 4.5:1 or more against the slab, counted at its rim)
export const gemColour = (aspect, out = new THREE.Color()) => (GEM[aspect] !== undefined ? out.setHex(GEM[aspect]) : feelColour(aspect, out));
const CLAY = { junk: 0x4a3f3a, stone: 0x4c4856, bomb: 0x2c2224 }, FOG = 0x5d605f;
const EMBER = [0x3a2a24, 0x6a3020, 0xb0401c, 0xff5a1e], PIP = 0xffb24a; // (an ember's glaze by its count, cooling to its last: 0 cold .. 3 fresh)
const INK = 0x07060a, RIM = 0xff5a1e, GOLD = 0xffcf4a, PREVIEW = 0xfff4c8, HINT = 0xffe9a8;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _k = new THREE.Color(), _w = new THREE.Color(1, 1, 1), _g = new THREE.Color(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _f = new THREE.Color();

/** The gems' face: self-lit, shaded from its own normals (the top bevel lit, the foot's shaded, a gradient down the face, a gloss spot). */
function gemMaterial() {
  const mat = new THREE.MeshBasicMaterial({ name: 'duel-gem', color: 0xffffff, toneMapped: false, fog: false }); // (no fog: at the board's few metres it shows nothing, and the gem keeps its colour whole)
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP; varying vec3 vGN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGP = position; vGN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP; varying vec3 vGN;').replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 n = normalize(vGN); float face = smoothstep(0.75, 0.95, n.z);
  float grad = 0.84 + 0.3 * clamp(vGP.y * 1.25 + 0.5, 0.0, 1.0);
  float bev = 0.86 + 0.42 * n.y - 0.08 * abs(n.x);
  vec3 c = diffuseColor.rgb * mix(bev, grad, face);
  float gl = face * (1.0 - smoothstep(0.02, 0.15, length((vGP.xy - vec2(-0.11, 0.17)) * vec2(1.0, 1.8))));
  diffuseColor.rgb = mix(c, vec3(1.0), gl * 0.5 + (1.0 - face) * max(0.0, n.y) * 0.18); }`);
  };
  mat.customProgramCacheKey = () => 'duel-gem';
  return mat;
}

/** The materials (the AP beads keep the crystals' Lachrymite). Module-wide: made once, never disposed. */
let MATS = null;
export function duelMaterials() {
  if (MATS) return MATS;
  MATS = {
    gem: crystalFretMaterial({ color: 0xffffff, emissive: 0x2a1a48, emissiveIntensity: 0.45, roughness: 0.22, metalness: 0.15, flatShading: true }, 0xffffff), // (the AP beads, board.js)
    face: gemMaterial(),
    clay: new THREE.MeshStandardMaterial({ name: 'duel-clay', color: 0xffffff, roughness: 0.86, metalness: 0, flatShading: true }),
    slime: new THREE.MeshStandardMaterial({ name: 'duel-slime', color: 0xffffff, roughness: 0.18, metalness: 0, flatShading: true }), // (the clay's program, wet: a slip jelly's slime)
    clayVc: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true }), // (racewayprops' clay: the frame, the figurines, junk's cracks)
    glow: new THREE.MeshBasicMaterial({ name: 'duel-glow', toneMapped: false }),
  };
  return MATS;
}

export class DuelPieces {
  constructor(parent) {
    const M = duelMaterials(), N = DUEL_VIEW.maxPieces;
    this.group = new THREE.Group(); this.group.name = 'duel-pieces'; parent.add(this.group);
    this.fam = {};
    const fam = (key, geo, mat, n = N) => {
      const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0; mesh.name = `duel-${key}`;
      this.group.add(mesh); this.fam[key] = mesh; return mesh;
    };
    for (const a of FEELING_ORDER) { fam(a, gemGeometry(a), M.face); fam('k:' + a, keylineGeometry(a), M.glow); }
    fam('junk', junkGeometry(), M.clayVc); fam('k:junk', plateGeometry('junk'), M.glow); fam('slime', slimeGeometry(), M.slime); fam('k:slime', slimeGeometry(true), M.glow); fam('stone', stoneGeometry(), M.clay, 64); fam('bomb', bombGeometry(), M.clay, 64);
    fam('fog', fogStoneGeometry(), M.clay); fam('glint', glintGeometry(), M.glow, 96);
    fam('orb', orbGeometry(), M.glow, 64); fam('ember', emberGeometry(), M.clay); fam('k:ember', plateGeometry('ember'), M.glow); fam('pip', pipGeometry(), M.glow, 3 * N);
    fam('craze', new THREE.PlaneGeometry(1, 1), M.glow, N); // (a cooling coal's crazing: crazing.js)
    // the bodies: two figurines
    const cs = DUEL_VIEW.cs;
    this.courierMesh = new THREE.Mesh(courierFigurine(), M.clayVc); this.courier = new THREE.Group(); this.courier.add(this.courierMesh);
    this.clayVc = M.clayVc; this.sleepMat = M.clayVc.clone(); this.sleepMat.name = 'duel-figurine-asleep'; this.sleepMat.color.setHex(0x6f7480); this.dormant = 0; // (the hand's form: the figurine asleep in a stone glaze, formdive.js)
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.48, 28), mindLineMaterial({ opacity: 0.9, depthTest: true }));
    this.courier.add(this.ring);
    this.foeMat = aberrantFigurine(new THREE.MeshStandardMaterial({ name: 'duel-idol', color: 0xc80018, roughness: 0.5, metalness: 0.1, flatShading: true })); // (the aberrant's look on the idol: vfx/aberrantlook.js)
    this.castMat = new THREE.MeshBasicMaterial({ name: 'duel-cast', color: 0xd0207a, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false });
    const idol = foeIdol();
    this.foe = new THREE.Group(); this.foe.add(new THREE.Mesh(idol, this.foeMat), new THREE.Mesh(ledgeGeometry(), M.clayVc));
    const cast = new THREE.Mesh(idol, this.castMat); cast.position.set(0.07, 0.02, -0.03); this.foe.add(cast);
    const eye = new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff3e0, toneMapped: false }); // (fog as the world's basic program: at the board's few metres it shows nothing, and a program is saved)
    for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(eye, eyeMat); e.position.set(x, 0.04, 0.1); this.foe.add(e); }
    for (const b of [this.courier, this.foe]) { b.scale.setScalar(cs); b.visible = false; this.group.add(b); }
    this.list = []; this.cells = []; this.ids = new Map(); this.board = { w: 20, h: 20 }; this.t = 0; this.bodyHidden = [false, false];
    this.born = new Map(); this.weak = null; this.dim = null; this.line = 10; this.fore = null; this.foeHex = new THREE.Color(0xc80018);
  }

  /** The view's board from the kernel's (at open, and to settle up after a play). */
  build(board, foeAspect = 'fury') {
    this.board = { w: board.w, h: board.h };
    this.list.length = 0; this.ids.clear(); this.cells = new Array(board.w * board.h).fill(null);
    if (this.born.size > 4000) this.born.clear();
    feelColour(foeAspect, this.foeMat.color); feelColour(foeAspect, this.foeHex).lerp(_w, 0.35).multiplyScalar(1.4); // (the foresight's keyline: the foe's feeling, lifted to read on the fog)
    board.each((p, x, y) => this.add(p.kind, { id: p.id, colour: p.colour, side: p.side, count: p.count, slime: p.slime }, x, y));
  }

  idx(x, y) { return y * this.board.w + x; }
  in(x, y) { return x >= 0 && y >= 0 && x < this.board.w && y < this.board.h; }
  at(x, y) { return this.in(x, y) ? this.cells[this.idx(x, y)] : null; }
  byId(id) { return id != null ? this.ids.get(id) || null : null; }
  bodyAt(side) { return this.list.find((v) => v.kind === 'body' && v.side === side) || null; }

  /** A new visual at a cell (and in the model there). */
  add(kind, { id = null, colour = null, side = null, count = null, slime = false } = {}, x = 0, y = 0) {
    const v = { id, kind, colour, side, count, slime: !!slime, cool: 0, x, y, cx: x, cy: y, s: 1, sx: 1, sy: 1, lift: 0, flash: 0, hum: 0, grey: 0, pick: 0, prev: 0, flip: 0, spin: 0, dx: 0, dy: 0, hidden: false, seed: hash(id ?? x * 31 + y, 4.7), shown: null, was: null, morph: 1, born: this.t };
    if (id != null) { if (this.born.has(id)) v.born = this.born.get(id); else this.born.set(id, this.t); } // (a piece's age kept across a settle's rebuild: junk's rim glows from its landing, not from the last play)
    this.list.push(v); if (id != null) this.ids.set(id, v);
    if (this.in(x, y)) { this.cells[this.idx(x, y)] = v; v.cx = x; v.cy = y; }
    return v;
  }
  /** The model's move (where it will be): the drawn place (`x`, `y`) is the beat's to animate. */
  move(v, x, y) {
    if (!v) return;
    if (this.in(v.cx, v.cy) && this.cells[this.idx(v.cx, v.cy)] === v) this.cells[this.idx(v.cx, v.cy)] = null;
    v.cx = x; v.cy = y; if (this.in(x, y)) this.cells[this.idx(x, y)] = v;
  }
  remove(v) {
    if (!v) return;
    if (this.in(v.cx, v.cy) && this.cells[this.idx(v.cx, v.cy)] === v) this.cells[this.idx(v.cx, v.cy)] = null;
    const i = this.list.indexOf(v); if (i >= 0) this.list.splice(i, 1);
    if (v.id != null && this.ids.get(v.id) === v) this.ids.delete(v.id);
  }
  adopt(v, id) { if (v && id != null && v.id !== id) { if (v.id != null) this.ids.delete(v.id); v.id = id; this.ids.set(id, v); } }
  hideBody(side, hidden) { this.bodyHidden[side] = hidden; }

  /** One instance of a family (false when it is full). */
  put(n, key, pos, quat, scale, colour) {
    const mesh = this.fam[key]; if (!mesh || n[key] >= mesh.instanceMatrix.count) return false;
    const i = n[key]++; mesh.setMatrixAt(i, _m.compose(pos, quat, scale)); mesh.setColorAt(i, colour); return true;
  }

  /** A gem's face and keyline: its family, its scale (cell units times the cell), its turn, and the state's keyline (colour, extra reach). */
  gem(n, key, v, sc, rot, kx) {
    _e.set(0, v.flip, v.spin + rot); _q.setFromEuler(_e);
    this.put(n, key, _p, _q, _s.set(sc * v.sx, sc * v.sy, sc), _c);
    this.put(n, 'k:' + key, _p, _q, _s.set(sc * v.sx * (1 + kx), sc * v.sy * (1 + kx), sc), _k);
  }

  /** Each frame: every visual to its family's instance (real seconds). */
  update(dt) {
    this.t += dt;
    const cs = DUEL_VIEW.cs, n = {}, B = this.board, t = this.t, fore = this.fore;
    for (const k in this.fam) n[k] = 0;
    this.courier.visible = this.foe.visible = false;
    for (const v of this.list) {
      if (v.hidden) continue;
      cellLocal(v.x + v.dx, v.y + v.dy, B, _p); _p.z += (v.lift + v.pick * 0.55) * cs;
      if (v.hintDir) { const w = Math.max(0, Math.sin(t * 6)) ** 2 * 0.16 * cs; _p.x += v.hintDir[0] * w; _p.y -= v.hintDir[1] * w; } // (the idle hint's nudge: the piece leaning the way the move would take it, Candy Crush's)
      const hum = v.hum ? v.hum * Math.exp(-((t + v.seed * 0.12) % 0.6) / 0.16) : 0, grow = (1 + 0.09 * hum) * (1 + 0.12 * v.pick); // (a hum: a bell's strike each 0.6 real s, decaying, a wave across by its seed; a pick lifts and swells it: glows.js, marks.js)
      if (v.kind === 'body') {
        const b = v.side === 0 ? this.courier : this.foe; if (this.bodyHidden[v.side]) continue;
        b.visible = true; b.position.copy(_p); b.scale.set(cs * v.s * v.sx * grow, cs * v.s * v.sy * grow, cs * v.s * grow);
        if (v.side === 0) { const d = this.dormant || 0; this.ring.rotation.z = t * 0.6; this.ring.visible = d < 0.5; this.courierMesh.material = d >= 0.5 ? this.sleepMat : this.clayVc; if (d >= 0.5) b.scale.y *= 0.92; }
        else b.rotation.z = Math.sin(t * 1.3 + v.seed * 6) * 0.08;
        continue;
      }
      const gx = Math.round(v.x + v.dx), gy = Math.round(v.y + v.dy), seen = fore?.has(gx + ',' + gy);
      if (this.fogAt && this.fogAt(gx, gy) > 0.5 && !seen) { // (hidden ground: a plain stone of the fog, its place shown, never its colour: dread.js fogShows)
        _q.identity(); _c.setHex(FOG).multiplyScalar(0.9 + 0.2 * v.seed); this.put(n, 'fog', _p, _q, _s.setScalar(cs * v.s), _c); continue; }
      if (v.cool) { v.cool = Math.max(0, v.cool - dt / 0.5); }
      if (v.kind === 'gem') {
        const key = this.fam[v.colour] ? v.colour : 'fury';
        if (v.shown && v.shown !== key) { v.was = v.shown; v.morph = 0; } v.shown = key; // (its colour changed in place: a paint, a tune's turn; the silhouette morphs)
        if (v.morph < 1) v.morph = Math.min(1, v.morph + dt / 0.3);
        const pv = 0.5 + 0.5 * Math.sin(t * 8 - v.seed * 3), breathe = 1 + 0.025 * Math.sin(t * 1.7 + v.seed * 6.283), weak = this.weak === key && v.cx < this.line;
        const sc = cs * v.s * grow * breathe * (1 + v.prev * (0.07 + 0.07 * pv));
        gemColour(key, _c).multiplyScalar(1 + 0.04 * Math.sin(t * 1.7 + v.seed * 6.283));
        _k.setHex(PALE[key] ?? INK); let kx = 0;
        if (this.dim?.has(key) && v.cx < this.line) { _k.copy(_c).multiplyScalar(DIM_GEM.glow); _c.multiplyScalar(DIM_GEM.body); kx = DIM_GEM.rim; } // (a feeling not yet awakened, worth half (Dovina's DIM): an unlit gem, its body dark, its colour in a thicker keyline)
        if (weak) { const tw = 0.7 + 0.3 * Math.sin(t * 5 + v.seed * 9); _k.lerp(_f.setHex(GOLD), 0.95 * tw); kx = 0.05; }
        if (seen) { _k.copy(this.foeHex).multiplyScalar(0.8 + 0.3 * Math.sin(t * 3 + v.seed * 4)); kx = Math.max(kx, 0.08); }
        if (v.prev) { _k.lerp(_f.setHex(PREVIEW), v.prev * (0.7 + 0.3 * pv)).multiplyScalar(1 + 0.6 * pv * v.prev); kx = Math.max(kx, 0.1 * v.prev); }
        if (v.pick) { _k.lerp(_w, v.pick); kx = Math.max(kx, 0.06 * v.pick); }
        if (v.hint) { const hp = 0.5 + 0.5 * Math.sin(t * 4 - v.seed); _k.lerp(_f.setHex(HINT), v.hint * (0.45 + 0.5 * hp)); kx = Math.max(kx, 0.07 * hp * v.hint); _c.lerp(_w, 0.12 * hp * v.hint); } // (the idle hint: a soft pulse, never words)
        if (v.cool) _c.lerp(_w, v.cool * 0.6);
        if (v.flash) { const f = Math.min(1, v.flash); _c.lerp(_w, f); _k.lerp(_w, f); }
        if (hum) { _c.lerp(_w, hum * 0.35); _k.lerp(_w, hum * 0.7); }
        if (v.grey) { const l = 0.3 * _c.r + 0.55 * _c.g + 0.15 * _c.b; _c.lerp(_g.setRGB(l, l, l), v.grey * 0.8).multiplyScalar(1 - v.grey * 0.45); } // (a colour none of which a Paint could reach: greyed, glows.js)
        if (v.morph < 1 && v.was && this.fam[v.was]) { const m = v.morph * v.morph * (3 - 2 * v.morph); // (the old shape turning out as the new one turns in)
          _f.copy(_c); gemColour(v.was, _c).lerp(_w, 0.3 * m); this.gem(n, v.was, v, sc * (1 - m), m * 1.6, kx); _c.copy(_f); this.gem(n, key, v, sc * Math.max(0.02, m), -(1 - m) * 1.6, kx); }
        else this.gem(n, key, v, sc, 0, kx);
        if (weak && n.glint < this.fam.glint.instanceMatrix.count) { const tw = Math.max(0, Math.sin(t * 2.3 + v.seed * 17)); // (the weak colour's spark: a glint winking at its shoulder)
          _t.copy(_p).add(_o.set(0.27 * sc, 0.27 * sc, 0.03)); _e.set(0, 0, t * 1.5 + v.seed * 6); _q.setFromEuler(_e);
          this.put(n, 'glint', _t, _q, _s.setScalar(cs * (0.35 + 0.9 * tw * tw)), _f.setHex(GOLD).multiplyScalar(1.4 + tw)); }
        continue;
      }
      let key = v.slime && v.kind === 'junk' ? 'slime' : v.kind;
      if (v.kind === 'orb') { _p.y += Math.sin(t * 2.4 + v.seed * 6.28) * 0.1 * cs; _p.z += 0.03; }
      if (!this.fam[key]) continue;
      _e.set(0, v.flip, v.spin + (v.kind === 'orb' ? Math.sin(t * 1.7 + v.seed * 9) * 0.15 : 0)); _q.setFromEuler(_e);
      const big = (v.kind === 'orb' ? 1.2 : 1) * grow; _s.set(cs * v.s * v.sx * big, cs * v.s * v.sy * big, cs * v.s * big);
      if (v.kind === 'orb') featTint(t * 0.3 + v.seed, _c, { bright: 1.9 }); // (the film's flash, walking)
      else if (v.kind === 'ember') { const k = Math.max(0, Math.min(3, v.count ?? 3)); _c.setHex(EMBER[k]).multiplyScalar(1 + 0.15 * Math.sin(t * 3 + v.seed * 9) * (k / 3)); }
      else if (key === 'slime') { feelColour('gall', _c).multiplyScalar(0.85 + 0.15 * Math.sin(t * 2.1 + v.seed * 6)); const w = Math.sin(t * 3.2 + v.seed * 9) * SLIME.wobble; _s.x *= 1 + w; _s.y *= 1 - w; } // (a slip jelly's slime: Gall's, wet, never still)
      else _c.setHex(CLAY[v.kind] ?? CLAY.junk);
      if (v.cool) _c.lerp(_w, v.cool * 0.6);
      if (v.flash) _c.lerp(_w, Math.min(1, v.flash));
      if (hum) _c.lerp(_w, hum * 0.35);
      if (!this.put(n, key, _p, _q, _s, _c)) continue;
      if (key === 'slime') { const age = t - v.born; feelColour('gall', _k).multiplyScalar(0.35 + 0.9 * Math.exp(-age / 0.8)); if (v.flash) _k.lerp(_w, Math.min(1, v.flash)); this.put(n, 'k:slime', _p, _q, _s, _k); }
      else if (v.kind === 'junk' || v.kind === 'ember') { // (the ember's rim: bright as it lands, settling to a throb; an ember's by its count)
        const age = t - v.born, k = v.kind === 'ember' ? 0.25 + 0.55 * (Math.max(0, Math.min(3, v.count ?? 3)) / 3) : 0.3 + 0.7 * Math.exp(-age / 2.5);
        _k.setHex(INK).lerp(_f.setHex(RIM), Math.min(1, k * (0.6 + 0.4 * Math.sin(t * 4 + v.seed * 6.28)))).multiplyScalar(1 + 0.8 * Math.exp(-age / 0.6));
        if (v.flash) _k.lerp(_w, Math.min(1, v.flash));
        this.put(n, 'k:' + v.kind, _p, _q, _s.set(cs * v.s * v.sx * big * 1.04, cs * v.s * v.sy * big * 1.04, cs * v.s * big), _k); }
      if (v.kind === 'ember' && v.craze > 0) n.craze = drawCrazing(this.fam.craze, n.craze, v, _p, _q, cs * v.s, t); // (before the pips: they take _q)
      if (v.kind === 'ember') { const pips = this.fam.pip, k = Math.max(0, Math.min(3, v.count ?? 3)); // (its count: pips across its face, glowing)
        for (let j = 0; j < k && n.pip < pips.instanceMatrix.count; j++) { const o = (j - (k - 1) / 2) * 0.24 * cs * v.s;
          _e.set(0, 0, v.spin); _q.setFromEuler(_e); const pp = _t.copy(_p).add(_o.set(o, -0.02 * cs, 0.24 * cs * v.s));
          pips.setMatrixAt(n.pip, _m.compose(pp, _q, _s.setScalar(cs * v.s))); pips.setColorAt(n.pip++, _c.setHex(PIP).multiplyScalar(1.1 + 0.4 * Math.sin(t * 4 + j + v.seed * 7))); } }
    }
    for (const k in this.fam) { const m = this.fam[k]; m.count = n[k]; m.visible = n[k] > 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
}
