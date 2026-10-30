// ---------------------------------------------------------------------------------------
// THE PUZZLE STONES' LOOK (plain name; Dovina's rules, progress/mimicry.js; Petra's and Dovina's runtime, world/mimicry/mimicry.js;
// docs/plans/MIMICRY.md 7, "the stone's dress"): each of the mimicry puzzles' stones in the Dunes drawn as a standing stone of the
// System's, over the placeholder's clay cylinder and gold band (hidden by vfx/mimicry/look.js while this stands).
//   - THE STONE: a menhir of black lydite (the Touchstone's stone, vfx/touchstonelook.js: its body and its polished arrises' colours),
//     tapering to a rough arched top two metres up (under the runtime's interact chevron at 2.2 m, so it floats clear over it), set in
//     a low socle of terracotta dipped in a black iron glaze that breaks to rust at its rim. Its face turns to its patch (the way the
//     god hand looks at it), and the same face is written on its back for whoever walks up to it.
//   - ITS MARK: the power the puzzle it sets now teaches, the god hand's art icon (ui/icons/artart.js) in its domain's palette and
//     ringed in its domain's glaze colour (ui/domainlook.js), at the top of the face; the stone at the Gnomon flats wears Shape, the
//     shore's Scoop, the ridges' Transmute, the ruins' Swap, until a later rung asks for another.
//   - THE RUNG'S NUMBER: the ladder's number of the puzzle it sets now (MIMIC_LADDER, 1 to 14) in neuralese numerals, gold, under the
//     mark (the numerals worn, vfx/wornnumerals.js). The game day's puzzle wears none.
//   - THE STARS: three star sockets under the number, cut into the stone; the best a puzzle has been solved with filled in gold (the
//     ledger's `god.mimic.stars.<id>`), and on a solve the stars it took struck in one by one (look.js plays the beat).
//   - THE OGHAM EDGE: a stemline down the face's right edge with one group of notches a rung of the stone's own (the first rung one
//     notch, the second two ...), as ogham is cut along a stone's arris: gold for a rung solved, the film's pale violet for the one it
//     sets now, a dark incision for one still to come. The stone's whole ladder is read off it at a glance.
// No words: every mark is a world mark (CLAUDE.md "Feedback"); the log says what happened.
// DRAWS: every stone's body is one vertex-coloured mesh in the kit's standard program (vfx/racewaypark.js Tris, the Touchstone's
// parameters), and every face one decal mesh of one atlas in the numerals' decal program (vfx/wornnumerals.js's parameters): 2 draws
// and an outline hull, for the placeholder's 2. The atlas is a plain canvas texture, redrawn only when a stone's state changes.
//
// Prior art: the Breton menhirs and the ogham stones of Ireland and Wales (the script cut as notches along the stone's arris, read from
// the bottom up; Ballycrovane, Co. Cork, the tallest), the goldsmith's touchstone (Theophrastus' Lydian stone: this repo's Touchstone),
// Islands of Insight's enclave pillars (a stone in the world that holds a puzzle and shows what it teaches), the golf scorecard's
// par and the puzzle game's three stars (Angry Birds, Cut the Rope) for the sockets.
//
//   const s = new PuzzleStones(game, stones)   (stones: game.mimicry.stones, [{ site, pos, patch }])   s.update(raw)   s.dispose()
//   s.stateOf(i) -> { puzzle, power, domain, rung, stars, rungs }   s.strike(i, { puzzle, stars }) (the solve's beat: its stars held)
//   s.starAt(i, k) -> world position of star socket k (0..2) on the face toward the patch   s.release(i) (the beat over)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris } from '../racewaypark.js';
import { numeralFit } from '../wornnumerals.js';
import { uiIcon } from '../../ui/icons/icons.js';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { GOD_POWERS } from '../../progress/godpowers.js';
import { MIMIC_LADDER, MIMIC_PUZZLES, mimicOpen } from '../../progress/mimicry.js';
import { addOutline, OUTLINES } from '../../render/outline.js';
import { T } from '../../core/config.js';

/** The numbers (metres, local to a stone: x along its face, y up from its foot, z out of its face toward its patch). The socle; the
 *  stone's foot and shoulders, its top's arch, its thickness and bevel; the face's decal box; the atlas cell; the colours. */
export const STONE_LOOK = {
  socle: { w: 1.5, d: 0.95, h: 0.2, cap: 0.08, rim: 0.035 },
  stone: { foot: 0.5, shoulder: 0.36, shoulderY: 1.62, top: 2.0, peak: -0.07, t: 0.46, bevel: 0.035, y0: 0.26 },
  face: { x: 0.34, y0: 0.36, y1: 1.64, lift: 0.004 },
  cell: { w: 240, h: 452 },
  col: { body: 0x16151a, arris: 0x4e4b54, foot: 0x221f26, clay: 0x6a3a28, glaze: 0x1c120c, rust: 0x6b3416 },
  ink: { key: '#120c0a', gold: '#f0c25a', goldLit: '#ffe39a', film: '#b9b4e8', cut: '#2e2a33', cutLip: '#57525f', socket: '#2a262f' },
  refresh: 1,
};
const L = STONE_LOOK, V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerpHex = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex();
const STAR_U = [0.2, 0.43, 0.66], STAR_V = 0.68, CX = 0.43;

/** The stone's outline seen from the front: its foot, its shoulders tapering in, a rough arch over the top (an even count of points). */
function profile() {
  const S = L.stone, pts = [V(-S.foot, S.y0, 0), V(S.foot, S.y0, 0), V(S.shoulder + 0.02, S.shoulderY - 0.5, 0), V(S.shoulder, S.shoulderY, 0)];
  for (let i = 1; i < 12; i++) {
    const u = i / 12, x = S.shoulder - u * 2 * S.shoulder, a = Math.sin(Math.PI * u);
    pts.push(V(x, S.shoulderY + (S.top - S.shoulderY) * Math.pow(a, 0.7) * (1 + 0.6 * S.peak * (x / S.shoulder)) + (hash(i) - 0.5) * 0.05, 0));
  }
  pts.push(V(-S.shoulder, S.shoulderY, 0), V(-S.shoulder - 0.02, S.shoulderY - 0.5, 0));
  return pts;
}

/** One stone's body into `Tr` at a stone's frame `M` (a Matrix4): the socle, then the menhir (extruded, its faces black, its
 *  arrises polished paler, its foot darker). */
function stoneBody(Tr, M, seed) {
  const S = L.stone, C = L.col, So = L.socle, n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const put = (geo, colOf) => {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      const col = colOf(n, (a.y + b.y + c.y) / 3);
      Tr.tri(a.clone().applyMatrix4(M), b.clone().applyMatrix4(M), c.clone().applyMatrix4(M), col);
    }
    g.dispose(); if (g !== geo) geo.dispose();
  };
  // the socle: a clay slab, its top dipped in the iron glaze, its rim broken to rust
  const slab = new THREE.BoxGeometry(So.w, So.h, So.d).translate(0, So.h / 2, 0);
  put(slab, (nn, y) => (nn.y > 0.5 ? C.glaze : y > So.h - So.rim ? C.rust : C.clay));
  const cap = new THREE.BoxGeometry(So.w - 0.12, So.cap, So.d - 0.12).translate(0, So.h + So.cap / 2, 0);
  put(cap, (nn) => (nn.y > 0.5 ? C.glaze : C.rust));
  // the menhir: its outline extruded, bevelled; black on its faces, its arrises polished, its foot darker
  const shape = new THREE.Shape(profile().map((p) => new THREE.Vector2(p.x, p.y)));
  const ex = new THREE.ExtrudeGeometry(shape, { depth: S.t - 2 * S.bevel, bevelEnabled: true, bevelThickness: S.bevel, bevelSize: S.bevel, bevelSegments: 1, steps: 1 }).translate(0, 0, -(S.t - 2 * S.bevel) / 2);
  // (a stone's own grain: its faces a shade apart, so the four do not read as one cast)
  const grain = 0.9 + 0.2 * hash(seed * 3.1);
  put(ex, (nn, y) => {
    const base = Math.abs(nn.z) > 0.92 ? lerpHex(C.body, 0x000000, 1 - grain * 0.9) : C.arris;
    return y < S.y0 + 0.25 ? lerpHex(base, C.foot, 0.6) : base;
  });
}

// ---------------------------------------------------------------- the faces: one atlas, a cell a stone
/** A five-pointed star path at (x, y), outer radius r. */
function starPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}
/** One stone's face drawn into its cell at (x0, 0): the mark, the rung's number, the stars, the ogham edge. `st` is stateOf(). */
function drawFace(g, x0, st) {
  const W = L.cell.w, H = L.cell.h, I = L.ink, cx = x0 + W * CX;
  g.clearRect(x0, 0, W, H);
  g.lineJoin = g.lineCap = 'round';
  // the mark: the power's icon in its domain's palette, inside a ring of its glaze
  const D = DOMAIN_LOOK[st.domain], ring = D?.colours?.body ?? '#c9a882', my = H * 0.19, R = W * 0.3;
  g.beginPath(); g.arc(cx, my, R, 0, Math.PI * 2); g.fillStyle = '#0d0b10'; g.fill();
  for (const [w, c] of [[22, I.key], [12, ring]]) { g.beginPath(); g.arc(cx, my, R, 0, Math.PI * 2); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
  const icon = uiIcon(`godart.${st.power}`, D?.pal ?? 'gold'), k = Math.max(1, Math.floor((R * 1.35) / Math.max(icon.width, icon.height)));
  g.imageSmoothingEnabled = false;
  g.drawImage(icon, Math.round(cx - (icon.width * k) / 2), Math.round(my - (icon.height * k) / 2), icon.width * k, icon.height * k);
  g.imageSmoothingEnabled = true;
  // the rung's number, gold on a dark key
  if (st.rung) {
    const o = { x: cx, y: H * 0.47, w: W * 0.5, h: H * 0.12, max: 99 };
    numeralFit(g, st.rung, { ...o, ink: I.key, lw: 15 }); numeralFit(g, st.rung, { ...o, ink: I.gold, lw: 7 });
  }
  // the stars: three sockets cut in the stone, the ones won filled with gold
  STAR_U.forEach((u, i) => {
    const sx = x0 + W * u, sy = H * STAR_V, r = W * 0.095, got = i < st.stars;
    starPath(g, sx, sy, r + 3); g.fillStyle = I.key; g.fill();
    starPath(g, sx, sy, r); g.fillStyle = got ? (st.lit ? I.goldLit : I.gold) : I.socket; g.fill();
    if (!got) { starPath(g, sx, sy + 1.5, r * 0.8); g.strokeStyle = I.cutLip; g.lineWidth = 2; g.stroke(); }
  });
  // the ogham edge: the stemline down the right edge, a group of notches a rung, read from the bottom up
  const sx = x0 + W * 0.9, top = H * 0.04, bot = H * 0.97;
  g.strokeStyle = I.key; g.lineWidth = 9; g.beginPath(); g.moveTo(sx, top); g.lineTo(sx, bot); g.stroke();
  g.strokeStyle = I.cutLip; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, top); g.lineTo(sx, bot); g.stroke();
  const n = st.rungs.length, span = (bot - top) / Math.max(1, n), notch = W * 0.11;
  st.rungs.forEach((r, i) => {
    const gy = bot - span * (i + 0.5), col = r.solved ? I.gold : r.now ? I.film : I.cut, strokes = i + 1, gap = Math.min(13, (span * 0.7) / strokes);
    for (let s = 0; s < strokes; s++) {
      const y = gy + (s - (strokes - 1) / 2) * gap;
      g.strokeStyle = I.key; g.lineWidth = 9; g.beginPath(); g.moveTo(sx + 2, y); g.lineTo(sx - notch, y); g.stroke();
      g.strokeStyle = col; g.lineWidth = 4.5; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx - notch + 3, y); g.stroke();
    }
  });
}

export class PuzzleStones {
  constructor(game, stones) {
    this.game = game; this.stones = stones || []; this.held = new Map(); this.sig = []; this.t = L.refresh;
    // each stone's frame: at its foot, its face (+z) turned to its patch
    this.frames = this.stones.map((st) => {
      const yaw = Math.atan2(st.patch.x - st.pos.x, st.patch.z - st.pos.z);
      return { M: new THREE.Matrix4().compose(st.pos.clone(), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1)), id: st.site.id };
    });
    this.build();
  }

  build() {
    const g = this.game, Tr = new Tris();
    this.frames.forEach((f, i) => stoneBody(Tr, f.M, i + 1));
    const grp = (this.group = new THREE.Group()); grp.name = 'mimicry-stones-look'; grp.userData.zone = 'dunes';
    this.mat = new THREE.MeshStandardMaterial({ name: 'mimicry-stones-look', color: 0xffffff, vertexColors: true, roughness: 0.32, metalness: 0, flatShading: true });
    this.body = new THREE.Mesh(Tr.geometry(), this.mat); this.body.name = 'mimicry-stones-look'; this.body.castShadow = true; this.body.receiveShadow = true;
    grp.add(this.body); g.present?.shadeOne?.(this.body, true, T.visual.smooth !== false);
    this.outline = addOutline(this.body);
    // the faces: a cell of the atlas a stone, front (toward its patch) and back (mirrored, so it reads the right way round)
    const W = L.cell.w * Math.max(1, this.stones.length), H = L.cell.h;
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
    this.map = new THREE.CanvasTexture(this.canvas); this.map.colorSpace = THREE.SRGBColorSpace; this.map.anisotropy = 4;
    this.decalMat = new THREE.MeshBasicMaterial({ name: 'mimicry-stones-face', map: this.map, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.face = new THREE.Mesh(this.faceGeometry(), this.decalMat); this.face.name = 'mimicry-stones-face';
    grp.add(this.face);
    g.scene?.add(grp);
    this.refresh(true);
  }

  /** Two quads a stone (its front and its back), each its cell of the atlas. */
  faceGeometry() {
    const F = L.face, z = L.stone.t / 2 + F.lift, n = this.stones.length || 1, pos = [], uv = [], idx = [];
    this.frames.forEach((f, i) => {
      const u0 = i / n, u1 = (i + 1) / n;
      for (const side of [1, -1]) {
        const base = pos.length / 3;
        for (const [sx, sy, U, Vv] of [[-1, 0, u0, 0], [1, 0, u1, 0], [1, 1, u1, 1], [-1, 1, u0, 1]]) {
          const p = V(sx * F.x * side, F.y0 + sy * (F.y1 - F.y0), z * side).applyMatrix4(f.M);
          pos.push(p.x, p.y, p.z); uv.push(U, Vv);
        }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    geo.computeBoundingSphere();
    return geo;
  }

  /** What a stone shows now: the puzzle it sets (Dovina's own pick, mimicry.js), its power and domain, its rung's number, the stars, its rungs. */
  stateOf(i) {
    const g = this.game, st = this.stones[i], L0 = g.ledger, held = this.held.get(i);
    const P = held?.puzzle ? (MIMIC_PUZZLES[held.puzzle] || null) : g.mimicry?.pick?.(st) ?? null;
    const id = held?.puzzle ?? P?.id ?? st.site.rungs[0];
    const power = (P?.powers?.[0]) ?? MIMIC_PUZZLES[st.site.rungs[0]]?.powers?.[0] ?? 'shape', domain = GOD_POWERS[power]?.domain ?? 'alteration';
    const solved = (r) => (L0?.get?.(`god.mimic.solved.${r}`) || 0) > 0;
    const rungs = st.site.rungs.map((r) => ({ id: r, solved: solved(r), now: r === id && mimicOpen(r, L0, g) }));
    const best = held ? held.stars : Math.min(3, L0?.best?.(`god.mimic.stars.${id}`) || 0);
    const rung = id === 'day' ? 0 : MIMIC_LADDER.indexOf(id) + 1;
    return { puzzle: id, power, domain, rung, stars: best, rungs, lit: !!held };
  }

  /** Redraw the cells whose state changed (every `refresh` real seconds, or at once when forced). */
  refresh(force = false) {
    const ctx = this.canvas.getContext('2d'); let dirty = false;
    this.stones.forEach((st, i) => {
      const s = this.stateOf(i), key = JSON.stringify(s);
      if (!force && this.sig[i] === key) return;
      this.sig[i] = key; drawFace(ctx, i * L.cell.w, s); dirty = true;
    });
    if (dirty) this.map.needsUpdate = true;
  }

  /** The solve's beat on a stone: its stars held, struck in one at a time by the caller (`stars` how many are lit so far). */
  strike(i, { puzzle, stars }) { this.held.set(i, { puzzle, stars }); this.refresh(true); }
  /** The beat over: the stone shows the puzzle it sets next. */
  release(i) { if (this.held.delete(i)) this.refresh(true); }
  /** Where star socket k sits on stone i's face toward its patch, in the world. */
  starAt(i, k) {
    const F = L.face, f = this.frames[i]; if (!f) return null;
    const x = (STAR_U[k] - 0.5) * 2 * F.x, y = F.y0 + (1 - STAR_V) * (F.y1 - F.y0);
    return V(x, y, L.stone.t / 2 + 0.08).applyMatrix4(f.M);
  }
  /** The stone's index for a puzzle's site id. */
  indexOf(siteId) { return this.stones.findIndex((s) => s.site.id === siteId); }

  update(raw) {
    if ((this.t -= raw) > 0) return;
    this.t = L.refresh; this.refresh();
  }

  dispose() {
    if (this.outline) OUTLINES.delete(this.outline);
    this.game.scene?.remove(this.group);
    this.body?.geometry.dispose(); this.face?.geometry.dispose(); this.mat?.dispose(); this.decalMat?.dispose(); this.map?.dispose();
  }
}
