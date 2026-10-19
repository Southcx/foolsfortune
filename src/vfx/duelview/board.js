// ---------------------------------------------------------------------------------------
// THE TSUITATE (the duel's view: vfx/duelview.js): a puzzle duel's board as a made thing standing in the world (the owner's pick A,
// 2026-10-19): a single-panel screen whose face is a slab of Lachrymite 20 cells by 20, in a frame of Anagami's clay (OVERLAY.md 15.4's
// Clay dress: fired terracotta, an ash run along its top, a kintsugi seam, bronze bosses at its corners) on two clay feet. On it:
//   THE SLAB        drawn by the domains' clash's program in its slab mode (vfx/duelview/domains.js): the Courier's half Lachryma's deep
//                   with the film's sheen, the foe's its feeling fired dark, the cells' faint grid, each cell's gravity etched as a
//                   chevron (the board's own map, board.grav), the Line a seam of the film's light
//   THE LINE'S BEADS a brass bead at the Line's head and foot on the frame, sliding with it
//   THE AP BEADS    five Lachrymite beads a side in the frame's foot (DUEL.ap): the Courier's in the film, the foe's in its feeling, dark
//                   when spent, cracked black when a stun or a delay took them (the `turn` event's `lost`)
//   THE EMO COLUMNS a side's EmO, a bar of its colour up the frame's outer edge, white at a break
//   THE KINTSUGI    the frame's gold seam, lit when the Courier wins
//   THE FLOOR LIPS  a darker clay ledge on the edge each half's gravity points to (the aberrant Lantern Wisp's half, burning upward:
//                   at its top), sliding with the Line
//   THE FOG         Dread's (dread.js visibleTo): a texture of the cells the slab reads, hidden ground and the lantern's light
//
// Prior art: the tsuitate (衝立) on its feet, Puzzle Fighter's well frames, the go-ban's legs; kintsugi (a mend in gold that shows the
// break); the sukiya joinery of a shōji frame (the bosses where the members meet).
//
//   const B = new DuelBoard(parent, clash)   B.build(kernelBoard, foeAspect)   B.setGravity(kernelBoard)   B.setLine(column)
//   B.setAP(side, left, max, lost)   B.crack(side) -> the local point of the bead that cracked   B.setEmo(side, emo)   B.whiteEmo(side)
//   B.setFog(fog, lamp) (Float32Arrays a cell, 0..1)   B.won(k)   B.update(dt)   B.slab (its mesh: the god hand's ray hits it)   B.apAt(side, k, out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CrystalFrets } from '../crystalfrets.js';
import { featTint } from '../oxidation.js';
import { DUEL_VIEW, feelColour } from './layout.js';
import { duelMaterials } from './pieces.js';

const TERRACOTTA = [0x94603e, 0x7a4a30, 0x5a3322], ASH = 0xa7ad7c, FOOT = 0x5e3622, BACK = 0x3a2016;
const SPENT = new THREE.Color(0x2a1a14), LOST = new THREE.Color(0x0c0808);
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();

/** A box of one vertex colour (sRGB hex), its centre and size in metres. */
function box(w, h, d, x, y, z, hex) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z); g.deleteAttribute('uv');
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3), p = g.attributes.position.array;
  for (let i = 0; i < n; i++) { const shade = 1 + 0.06 * Math.sin(p[i * 3] * 7.3 + p[i * 3 + 1] * 5.1); a[i * 3] = c.r * shade; a[i * 3 + 1] = c.g * shade; a[i * 3 + 2] = c.b * shade; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}

export class DuelBoard {
  constructor(parent, clash) {
    this.parent = parent; this.clash = clash; this.group = new THREE.Group(); this.group.name = 'duel-tsuitate'; parent.add(this.group);
    this.built = null; this.ap = [[5, 5, 0], [5, 5, 0]]; this.emo = [0, 0]; this.white = [0, 0]; this.t = 0; this.cracks = [];
  }

  /** The frame, the slab and the beads for a board of w x h (made once a size). */
  build(board, foeAspect = 'fury') {
    this.foe = foeAspect; this.w = board.w; this.h = board.h;
    if (this.built !== `${board.w}x${board.h}`) this.make(board.w, board.h);
    this.setGravity(board); this.setLine(board.line);
  }

  make(w, h) {
    const { cs, base, border: b, depth, lip } = DUEL_VIEW, W = w * cs, H = h * cs, M = duelMaterials();
    if (this.meshes) for (const m of this.meshes) { this.group.remove(m); m.geometry?.dispose(); }
    const top = base + H, parts = [];
    // the frame's members, proud of the face; the back plate behind the slab; the feet
    parts.push(box(W + 2 * b, b, depth + lip, 0, top + b / 2, (lip - depth) / 2, TERRACOTTA[0]), box(W + 2 * b, b, depth + lip, 0, base - b / 2, (lip - depth) / 2, TERRACOTTA[2]));
    parts.push(box(b, H, depth + lip, -W / 2 - b / 2, base + H / 2, (lip - depth) / 2, TERRACOTTA[1]), box(b, H, depth + lip, W / 2 + b / 2, base + H / 2, (lip - depth) / 2, TERRACOTTA[1]));
    parts.push(box(W, H, 0.04, 0, base + H / 2, -depth + 0.02, BACK));
    parts.push(box(W + 2 * b + 0.01, b * 0.32, depth + lip + 0.01, 0, top + b * 0.86, (lip - depth) / 2, ASH)); // (the ash run along its top)
    for (let i = 0; i < 9; i++) { const x = -W / 2 + ((i + 0.5) / 9) * W + Math.sin(i * 7.1) * 0.08, l = b * (0.5 + 0.4 * Math.abs(Math.sin(i * 3.3))); parts.push(box(0.035, l, 0.012, x, top + b - l / 2, lip + 0.003, ASH)); }
    for (const fx of [-W * 0.36, W * 0.36]) parts.push(box(0.5, base - b, 0.34, fx, (base - b) / 2, -0.05, FOOT), box(0.62, 0.06, 0.44, fx, 0.03, -0.05, TERRACOTTA[2]));
    const frame = new THREE.Mesh(mergeGeometries(parts), M.clayVc); frame.castShadow = true; frame.receiveShadow = true; frame.name = 'duel-frame';
    parts.forEach((g) => g.dispose());
    // the bosses at the corners, and the Line's beads (brass)
    this.brass = new THREE.MeshStandardMaterial({ name: 'duel-brass', color: 0xb8904a, metalness: 0.75, roughness: 0.35, emissive: 0x2a1a08, emissiveIntensity: 0.4 });
    const bossGeo = new THREE.SphereGeometry(b * 0.36, 12, 8), bosses = [];
    for (const [x, y] of [[-W / 2 - b / 2, top + b / 2], [W / 2 + b / 2, top + b / 2], [-W / 2 - b / 2, base - b / 2], [W / 2 + b / 2, base - b / 2]]) bosses.push(bossGeo.clone().translate(x, y, lip));
    const boss = new THREE.Mesh(mergeGeometries(bosses), this.brass);
    this.head = new THREE.Mesh(bossGeo, this.brass); this.foot = new THREE.Mesh(bossGeo, this.brass);
    // the kintsugi: a gold seam down the frame's foe-side member
    this.gold = new THREE.MeshStandardMaterial({ name: 'duel-kintsugi', color: 0xf2c35a, metalness: 0.85, roughness: 0.3, emissive: 0xf2a030, emissiveIntensity: 0 });
    const seam = [], P = [[W / 2 + b, base + H * 0.72], [W / 2 + b * 0.5, base + H * 0.68], [W / 2 + b * 0.6, base + H * 0.6], [W / 2, base + H * 0.56]];
    for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], L = Math.hypot(x1 - x0, y1 - y0); const g = new THREE.BoxGeometry(L, 0.018, 0.012); g.rotateZ(Math.atan2(y1 - y0, x1 - x0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, lip + 0.004); seam.push(g); }
    const kin = new THREE.Mesh(mergeGeometries(seam), this.gold);
    // the slab (the clash's program, its slab mode) and its gravity map
    this.grav = new THREE.DataTexture(new Uint8Array(w * h * 4), w, h); this.grav.magFilter = this.grav.minFilter = THREE.NearestFilter;
    this.fog = new THREE.DataTexture(new Uint8Array(w * h * 4), w, h); this.fog.magFilter = this.fog.minFilter = THREE.LinearFilter; this.fog.needsUpdate = true;
    this.slab = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.clash.slabMaterial(this.grav, w, h, this.fog));
    this.lips = [0, 1].map(() => { const m = new THREE.Mesh(box(1, 1, 1, 0, 0, 0, 0x2e1810), M.clayVc); m.name = 'duel-floorlip'; return m; });
    this.slab.position.set(0, base + H / 2, 0); this.slab.name = 'duel-slab'; this.slab.receiveShadow = false;
    // the action point beads (Lachrymite: the gems' program), five a side by default (room for eight)
    const beadGeo = new THREE.IcosahedronGeometry(0.05, 1);
    this.beads = new THREE.InstancedMesh(beadGeo, M.gem, 16); this.beads.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(16 * 3), 3);
    new CrystalFrets(this.beads); this.beads.frustumCulled = false; this.beads.count = 0; this.beads.name = 'duel-ap';
    // the EmO columns, up the frame's outer members
    const bar = new THREE.PlaneGeometry(0.045, 1); bar.translate(0, 0.5, 0);
    this.emoBars = [0, 1].map((side) => { const m = new THREE.Mesh(bar, new THREE.MeshBasicMaterial({ name: 'duel-emo', fog: false, toneMapped: false })); m.position.set((side ? 1 : -1) * (W / 2 + b / 2), base, lip + 0.003); m.scale.y = 0.001; return m; });
    this.meshes = [frame, boss, this.head, this.foot, kin, this.slab, this.beads, ...this.emoBars, ...this.lips];
    this.group.add(...this.meshes);
    this.built = `${w}x${h}`; this.W = W; this.H = H;
  }

  /** Each cell's gravity into the slab's grain (a ruleset's map; changed by a `line` on rulesets whose map follows the sides). */
  setGravity(board) {
    const a = this.grav.image.data;
    for (let y = 0; y < board.h; y++) for (let x = 0; x < board.w; x++) { const [dx, dy] = board.grav(x, y), i = (y * board.w + x) * 4; a[i] = (dx + 1) * 127; a[i + 1] = (dy + 1) * 127; a[i + 2] = 0; a[i + 3] = 255; }
    this.grav.needsUpdate = true;
    this.lipDir = [board.grav(0, board.h >> 1), board.grav(board.w - 1, board.h >> 1)]; this.placeLips();
  }

  /** The floor lips: on the edge each half's gravity points to, across that half's columns (or down the Line, for a fall toward it). */
  placeLips() {
    if (!this.lips || !this.lipDir) return;
    const { cs, base, border: b, lip } = DUEL_VIEW, W = this.W, H = this.H, lx = ((this.line ?? this.w / 2) - this.w / 2) * cs, t = b * 0.42;
    for (const side of [0, 1]) {
      const m = this.lips[side], [dx, dy] = this.lipDir[side], x0 = side ? lx : -W / 2, x1 = side ? W / 2 : lx;
      m.visible = !!(dx || dy);
      if (dy) m.position.set((x0 + x1) / 2, dy > 0 ? base - t / 2 + 0.01 : base + H + t / 2 - 0.01, lip + 0.012), m.scale.set(Math.max(0.01, x1 - x0), t, 0.03);
      else m.position.set(dx > 0 === (side === 0) ? lx : side ? W / 2 + t / 2 : -W / 2 - t / 2, base + H / 2, lip + 0.012), m.scale.set(t * 0.5, H, 0.03);
    }
  }

  /** Dread's fog on the slab: a cell's hidden share, and the lantern's light on it (0..1 each). */
  setFog(fog, lamp) {
    if (!this.fog) return; const a = this.fog.image.data;
    for (let i = 0; i < fog.length; i++) { a[i * 4] = Math.round(255 * fog[i]); a[i * 4 + 1] = Math.round(255 * (lamp?.[i] || 0)); a[i * 4 + 3] = 255; }
    this.fog.needsUpdate = true;
  }

  /** The Line at a (fractional) column: its beads and the slab's seam. */
  setLine(col) {
    const { cs, base, border: b, lip } = DUEL_VIEW, x = (col - this.w / 2) * cs;
    this.head.position.set(x, base + this.H + b / 2, lip + 0.01); this.foot.position.set(x, base - b / 2, lip + 0.01);
    this.clash.setLine(col); this.line = col; this.placeLips();
  }

  /** A side's beads: `left` lit of `max`, the last `lost` cracked. */
  setAP(side, left, max = 5, lost = 0) { this.ap[side] = [left, max, lost]; }
  /** One more of a side's beads cracked (the `turn` event's `lost`, one at a time): returns where, for a puff of chips. */
  crack(side, out = new THREE.Vector3()) {
    const A = this.ap[side]; A[2] = Math.min(A[1], A[2] + 1); A[0] = Math.min(A[0], A[1] - A[2]);
    this.cracks.push({ side, k: A[1] - A[2], age: 0 });
    return this.apAt(side, A[1] - A[2], out);
  }
  apAt(side, k, out = new THREE.Vector3()) {
    const { base, border: b, lip } = DUEL_VIEW, W = this.W; return out.set(side ? W / 2 - 0.2 - k * 0.17 : -W / 2 + 0.2 + k * 0.17, base - b / 2, lip + 0.02);
  }
  setEmo(side, emo) { this.emo[side] = Math.max(0, Math.min(1, emo || 0)); }
  whiteEmo(side) { this.white[side] = 1; }
  won(k) { this.gold.emissiveIntensity = 1.6 * k; this.clash.won(k); }

  update(dt) {
    if (!this.built) return;
    this.t += dt;
    let n = 0;
    for (const side of [0, 1]) {
      const [left, max, lost] = this.ap[side];
      for (let k = 0; k < max && n < 16; k++) {
        const isLost = k >= max - lost, lit = !isLost && k < left, cr = this.cracks.find((c) => c.side === side && c.k === k && c.age < 0.4);
        this.apAt(side, k, _p); if (cr) _p.x += Math.sin(cr.age * 90) * 0.01 * (1 - cr.age / 0.4);
        if (lit) { if (side) feelColour(this.foe, _c).multiplyScalar(1.3); else featTint(this.t * 0.08 + k * 0.15, _c); } else _c.copy(isLost ? LOST : SPENT);
        this.beads.setMatrixAt(n, _m.compose(_p, _q.identity(), _s.setScalar(lit ? 1 : isLost ? 0.8 : 0.9)));
        this.beads.setColorAt(n++, _c);
      }
    }
    this.beads.count = n; this.beads.instanceMatrix.needsUpdate = true; this.beads.instanceColor.needsUpdate = true;
    for (const c of this.cracks) c.age += dt; this.cracks = this.cracks.filter((c) => c.age < 0.4);
    for (const side of [0, 1]) {
      const m = this.emoBars[side]; this.white[side] = Math.max(0, this.white[side] - dt / 0.4);
      m.scale.y = Math.max(0.001, this.H * this.emo[side]);
      if (side) feelColour(this.foe, m.material.color); else featTint(this.t * 0.05, m.material.color);
      m.material.color.lerp(_c.setRGB(1, 1, 1), this.white[side]);
    }
  }
}
