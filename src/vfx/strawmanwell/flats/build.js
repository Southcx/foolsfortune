// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, ONE LANE'S: a stage's backdrop built from its theme (vfx/strawmanwell/flats/<theme>.js) as up to four
// layers of toy-theatre flats at increasing depth behind the plane, each layer one canvas (an atlas of its pieces, at most 1024 x 512)
// and one merged mesh: its STRIPS (a ground row painted to repeat, laid end to end along the lane, every other one turned over), its
// SPRITES (single cut-outs placed by the theme: a windmill, a haystack, a cloud; one that turns, a windmill's sails, a mesh of its own) and, for the farthest, its BODY (the sky drop, one
// painting stretched over all it must cover). Each layer is sized to what the side-on camera can see of it from anywhere along the lane
// (wellframe.js SIDE_CAM: its seat, its field of view and lead, the lane's ends and height band), on the desk's 16:9 and a phone's up to
// 2.4:1. Every layer stands in a groove on a deck of walnut boards that runs back from the stage's boards (the deck hides the void
// below the flats; a dark velvet hangs under its front edge, seen down a pit). A strip row may rock (the Flood's sea): its own mesh,
// slid and bobbed in its groove. The painting runs in steps (`steps()`: one region of one canvas a step) so a lane's backdrop is
// painted across a few frames; each canvas lets go of its pixels once uploaded (vfx/letgo.js) and is painted again whole only if asked.
// Unlit: the footlights' warmth is painted in, and a layer's vertex colours lift its foot warmer and its top cooler.
//
// Prior art: the console's parallax planes (Hercules, PS1, 1997: its painted layers; Donkey Kong Country's), a sprite atlas packed by
// shelves (the texture packers' "shelf" fit), Pollock's toy theatre (flats slid in the stage's grooves, the sea in rows); this house's
// baked canvases (render/bakedcanvas.js, vfx/letgo.js).
//
//   const F = new FlatLane(ctx, theme, laneId, { wallRun })   F.steps() -> [fn]   F.done   F.group   F.update(dt)   F.dispose()
//   extentOf(lane, D) -> { x0, x1, top, bottom }   VIEW (the camera's reach, per metre of distance)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SIDE_CAM } from '../../../world/strawmanwell/wellframe.js';
import { seeded } from '../../../core/rng.js';
import { letGo } from '../../letgo.js';
import { css, finish, strokes, INK } from './brush.js';

/** The canvas's size, the gap round each region and the margin round a sprite's painting (texels: its keyline and card edge stand in
 *  it), the widest screen allowed for, the deck's reach behind the plane (m). */
const SHEET = { w: 1024, h: 512, pad: 6, margin: 8 }, ASPECT = 2.4, DECK = { front: 1.55, back: 0.8, rail: 0.16, lip: 0.25 };

/** How far the side-on camera sees, per metre of distance from it: half the width, up and down from its height (its pitch included). */
export const VIEW = (() => {
  const tv = Math.tan(THREE.MathUtils.degToRad(SIDE_CAM.fov / 2)), p = Math.atan2(SIDE_CAM.look, SIDE_CAM.dist), c = Math.cos(p), s = Math.sin(p);
  return { half: (tv * ASPECT) / (c - tv * s), up: (tv * c - s) / (tv * s + c), down: (tv * c + s) / (c - tv * s) };
})();

/** What a layer D m behind the plane must cover (lane metres): from anywhere the camera may stand along the lane and in its band. */
export function extentOf(L, D) {
  const d = SIDE_CAM.dist + D, lo = -2 + SIDE_CAM.edge, hi = L.len + 2 - SIDE_CAM.edge, c0 = lo < hi ? lo : L.len / 2, c1 = lo < hi ? hi : L.len / 2;
  return { x0: c0 - VIEW.half * d - 1, x1: c1 + VIEW.half * d + 1, top: L.band[1] + VIEW.up * d + 0.6, bottom: L.band[0] - VIEW.down * d - 0.6 };
}

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The swatches every lane's nearest sheet carries: the deck's boards, a plain white (the rails, the velvet: tinted by colour). */
const SWATCHES = {
  planks: { w: 8, h: 4, paint(g, P) {
    const R = P.R;
    for (let i = 0; i < 8; i++) {
      const y = i * 0.5, c = [0x6b4226, 0x5e3a22, 0x74492a, 0x664026][i % 4];
      g.fillStyle = css(c); g.fillRect(-1, y, P.w + 2, 0.5);
      strokes(g, R, { x: -1, y: y + 0.05, w: P.w + 2, h: 0.4, n: 26, len: [1.2, 3], lw: 0.03, cols: [0x4a2c18, 0x8a5a34], alpha: [0.25, 0.5], lean: 0.02, bend: 0.02 });
      g.fillStyle = css(INK, 0.55); g.fillRect(-1, y, P.w + 2, 0.06);
    }
  } },
  white: { w: 0.4, h: 0.4, paint(g) { g.fillStyle = '#ffffff'; g.fillRect(-1, -1, 3, 3); } },
};

/** The quads of one mesh: vertical (facing the stalls) and floor (facing up), each with its corners' uvs and colours. */
class Quads {
  constructor() { this.p = []; this.uv = []; this.c = []; this.i = []; this.n = 0; }
  add(v, uv, c) {
    const n = this.n; for (let k = 0; k < 4; k++) { this.p.push(...v[k]); this.uv.push(...uv[k]); this.c.push(...c[k]); }
    this.i.push(n, n + 1, n + 2, n, n + 2, n + 3); this.n += 4;
  }
  /** x0..x1, y0..y1 at depth z; r = [u0, v0, u1, v1] (left, bottom, right, top); lit(y) -> [r, g, b]. */
  wall(x0, x1, y0, y1, z, r, lit, flip = false) {
    const [ua, ub] = flip ? [r[2], r[0]] : [r[0], r[2]], lb = lit(y0), lt = lit(y1);
    this.add([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [[ua, r[1]], [ub, r[1]], [ub, r[3]], [ua, r[3]]], [lb, lb, lt, lt]);
  }
  /** A w x h quad facing the stalls, centred at (cx, cy), turned by `ang` in its plane, all one colour c (a gear set at a slant). */
  turned(cx, cy, w, h, z, r, c, ang, flip = false) {
    const co = Math.cos(ang), si = Math.sin(ang), at = (dx, dy) => [cx + dx * co - dy * si, cy + dx * si + dy * co, z], [ua, ub] = flip ? [r[2], r[0]] : [r[0], r[2]];
    this.add([at(-w / 2, -h / 2), at(w / 2, -h / 2), at(w / 2, h / 2), at(-w / 2, h / 2)], [[ua, r[1]], [ub, r[1]], [ub, r[3]], [ua, r[3]]], [c, c, c, c]);
  }
  /** x0..x1 along the lane, from the front (z0) back to z1, at height y; cf and cb the front's and the back's colours. */
  floor(x0, x1, z0, z1, y, r, cf, cb) { this.add([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], [cf, cf, cb, cb]); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  }
}

export class FlatLane {
  /** ctx: the look's (look.js); theme: a lane's flats (flats/<theme>.js); wallRun: the Run's wall-run flat's box (boxes.js), or null. */
  constructor(ctx, theme, laneId, { wallRun = null } = {}) {
    this.ctx = ctx; this.theme = theme; this.L = ctx.lanes[laneId]; this.id = laneId; this.wallRun = wallRun;
    this.sheets = []; this.rows = []; this.spins = []; this.group = null; this.done = false; this.t = 0; this.gone = false;
  }

  /** The layers, farthest first, the nearest carrying the swatches (and the wall-run flat's face). */
  layers() {
    const T = this.theme, list = T.layers;
    return list.map((Ly, i) => {
      const near = i === list.length - 1, sprites = { ...(Ly.sprites || {}) };
      if (near) { Object.assign(sprites, SWATCHES); if (this.wallRun && T.wallRun) sprites.wallrun = { w: this.wallRun.w, h: this.wallRun.h, paint: T.wallRun }; }
      return { ...Ly, sprites, near, ext: extentOf(this.L, Ly.D) };
    });
  }

  /** The atlas of one sheet: the body, the strips (each the sheet's width), the sprites packed by shelves at the densest scale that fits. */
  pack(Ly) {
    const { w: W, h: H, pad, margin: M } = SHEET, A = { body: null, strips: {}, sprites: {} };
    let y = pad;
    if (Ly.body) { A.body = { x: pad, y, w: W - 2 * pad, h: Ly.body.px }; y += Ly.body.px + 2 * pad; }
    for (const s of Ly.strips || []) { const k = (W - 2 * pad) / s.w, h = Math.ceil(s.h * k); A.strips[s.id] = { x: pad, y, w: W - 2 * pad, h, k }; y += h + 2 * pad; }
    const list = Object.entries(Ly.sprites).sort((a, b) => b[1].h - a[1].h);
    for (let k = Ly.k; k > 2; k *= 0.92) {
      let x = pad, sy = y, shelf = 0, ok = true; const out = {};
      for (const [id, s] of list) {
        const w = Math.max(4, Math.ceil(s.w * k)) + 2 * M, h = Math.max(4, Math.ceil(s.h * k)) + 2 * M;
        if (x + w > W - pad) { x = pad; sy += shelf + 2 * pad; shelf = 0; }
        if (w > W - 2 * pad || sy + h > H - pad) { ok = false; break; }
        out[id] = { x, y: sy, w, h, k, inner: { x: x + M, y: sy + M, w: w - 2 * M, h: h - 2 * M } }; x += w + 2 * pad; shelf = Math.max(shelf, h);
      }
      if (ok) { A.sprites = out; break; }
    }
    return A;
  }

  /** One region painted in metres (y up from its foot), clipped to `clip` (a sprite's whole region) or to it and its gap. */
  region(g, r, wm, hm, paint, Ly, key, clip = null) {
    const pad = SHEET.pad, R = seeded(hash(`${this.id}.${Ly.id}.${key}`)), c = clip || { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
    g.save(); g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip();
    g.translate(r.x, r.y + r.h); g.scale(r.w / wm, -r.h / hm);
    const P = { w: wm, h: hm, px: wm / r.w, R, pal: this.ctx.palette, lane: this.L, ext: Ly.ext, air: this.theme.air,
      /** fn(x) at x and again a tile over where it would cross an end (a strip repeats). */
      tile(x, reach, fn) { fn(x); if (x - reach < 0.5) fn(x + wm); if (x + reach > wm - 0.5) fn(x - wm); } };
    paint(g, P);
    g.restore();
  }

  /** The painting's steps for one sheet (each a region), then its haze and grain. */
  sheetSteps(Ly, S) {
    const out = [() => { S.canvas = document.createElement('canvas'); S.canvas.width = SHEET.w; S.canvas.height = SHEET.h; S.g = S.canvas.getContext('2d'); }];
    const A = S.atlas;
    if (Ly.body) out.push(() => this.region(S.g, A.body, Ly.ext.x1 - Ly.ext.x0, Ly.ext.top + 0.2, Ly.body.paint, Ly, 'body'));
    for (const s of Ly.strips || []) out.push(() => this.region(S.g, A.strips[s.id], s.w, s.h, s.paint, Ly, s.id));
    for (const [id, s] of Object.entries(Ly.sprites)) if (A.sprites[id]) out.push(() => this.region(S.g, A.sprites[id].inner, s.w, s.h, s.paint, Ly, id, A.sprites[id]));
    out.push(() => finish(S.g, SHEET.w, SHEET.h, { haze: this.theme.air, hazeA: Ly.hazeA ?? 0, grain: Ly.grain ?? 1, R: seeded(hash(`${this.id}.${Ly.id}.grain`)) }));
    return out;
  }

  /** Every step of the lane: each sheet painted, made a texture and sent to the card, then the meshes built and shown. */
  steps() {
    const out = [];
    for (const Ly of this.layers()) {
      const S = { Ly, atlas: this.pack(Ly) }; this.sheets.push(S);
      out.push(...this.sheetSteps(Ly, S));
      out.push(() => {
        const repaint = () => { const T = { Ly, atlas: S.atlas }; for (const f of this.sheetSteps(Ly, T)) f(); return T.canvas; };
        const t = new THREE.CanvasTexture(S.canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.name = `well-flats.${this.id}.${Ly.id}`;
        S.tex = letGo(t, repaint); S.canvas = null; S.g = null;
        S.mat = new THREE.MeshBasicMaterial({ name: 'well-flats', map: S.tex, alphaTest: 0.5, vertexColors: true, side: THREE.DoubleSide });
      });
      out.push(() => { try { this.ctx.game.renderer?.initTexture?.(S.tex); } catch { /* (drawn, it uploads anyway) */ } });
    }
    out.push(() => this.build());
    return out;
  }

  /** The region's uv rect [left, bottom, right, top]; inset half a texel for a strip, whose tiles meet. */
  uvOf(r, inset = 0) {
    const { w: W, h: H } = SHEET;
    return [(r.x + inset) / W, 1 - (r.y + r.h - inset) / H, (r.x + r.w - inset) / W, 1 - (r.y + inset) / H];
  }

  /** A strip's height at lane x, as its tiles lie (every other one turned over when the strip says so). */
  stripY(s, x) {
    const n = Math.floor(x / s.w), flip = s.flip && ((n % 2) + 2) % 2 === 1, u = x - n * s.w;
    return s.profile ? s.profile(flip ? s.w - u : u) : s.h;
  }

  /** The meshes: each layer's strips, sprites and body in one mesh (a rocking row its own), the deck, rails and velvet in the nearest. */
  build() {
    if (this.gone) return;
    const AT = this.ctx.at, L = this.L, X = (x) => AT.x + x, Y = (y) => AT.y + y, Z = (D) => L.z - D;
    const group = (this.group = new THREE.Group()); group.name = `well-flats.${this.id}`;
    const meshOf = (q, S, name) => { const m = new THREE.Mesh(q.geometry(), S.mat); m.name = name; m.castShadow = m.receiveShadow = false; m.matrixAutoUpdate = true; group.add(m); return m; };
    const nearS = this.sheets[this.sheets.length - 1], depths = [];
    for (const S of this.sheets) {
      const Ly = S.Ly, A = S.atlas, q = new Quads(), lit = (y) => lerp3(Ly.light?.[0] || [1, 1, 1], Ly.light?.[1] || [1, 1, 1], Math.min(1, Math.max(0, y / (Ly.lightH || 12))));
      const litW = (y) => lit(y - AT.y);
      let dz = 0;
      if (Ly.body) { q.wall(X(Ly.ext.x0), X(Ly.ext.x1), Y(-0.2), Y(Ly.ext.top), Z(Ly.D), this.uvOf(A.body, 0.5), litW); depths.push(Ly.D); }
      const rows = Ly.rows || (Ly.strips?.length ? [{ strip: Ly.strips[0].id, D: Ly.D }] : []);
      const sprites = (Ly.place?.({ lane: L, ext: Ly.ext, R: seeded(hash(`${this.id}.${Ly.id}.place`)), stripY: (x) => (Ly.strips?.[0] ? this.stripY(Ly.strips[0], x) : 0) }) || []);
      const back = sprites.filter((p) => p.back), front = sprites.filter((p) => !p.back);
      const sprite = (qq, p, D) => {
        const s = Ly.sprites[p.s], r = A.sprites[p.s]; if (!s || !r) return;
        // (the quad takes in the region's margin, so the keyline and the card's edge round the painting are drawn too)
        const k = p.scale ?? 1, mx = (SHEET.margin * s.w * k) / r.inner.w, my = (SHEET.margin * s.h * k) / r.inner.h, w = s.w * k + 2 * mx, h = s.h * k + 2 * my, y0 = (p.y ?? 0) - my, z = Z(D) + (p.dz ?? 0) + (dz += 0.01);
        if (!p.spin && !p.turn) { qq.wall(X(p.x - w / 2), X(p.x + w / 2), Y(y0), Y(y0 + h), z, this.uvOf(r), litW, !!p.flip); return; }
        if (!p.spin) { qq.turned(X(p.x), Y(y0 + h / 2), w, h, z, this.uvOf(r), litW(Y(y0 + h / 2)), p.turn, !!p.flip); return; }
        const qs = new Quads(), cy = Y(y0 + h / 2), c = litW(cy);
        qs.wall(-w / 2, w / 2, -h / 2, h / 2, 0, this.uvOf(r), () => c, !!p.flip);
        const m = meshOf(qs, S, `well-flats.${this.id}.${p.s}`); m.position.set(X(p.x), cy, z); m.rotation.z = p.turn ?? 0;
        this.spins.push({ mesh: m, spin: p.spin });
      };
      for (const p of back) sprite(q, p, Ly.D);
      for (const row of rows) {
        const s = Ly.strips.find((x) => x.id === row.strip), r = A.strips[s.id], ext = extentOf(L, row.D), uv = this.uvOf(r, 0.5), qq = row.anim ? new Quads() : q;
        const swing = row.anim ? Math.abs(row.anim.x || 0) + 0.5 : 0, foot = row.foot ?? 0;
        const zr = Z(row.D) + (row.anim ? 0 : (dz += 0.01));
        for (let n = Math.floor((ext.x0 - swing) / s.w); n * s.w < ext.x1 + swing; n++) qq.wall(X(n * s.w), X((n + 1) * s.w), Y(foot - 0.2), Y(foot + s.h), zr, uv, litW, s.flip && ((n % 2) + 2) % 2 === 1);
        if (row.anim) this.rows.push({ mesh: meshOf(qq, S, `well-flats.${this.id}.${s.id}`), ...row.anim });
        depths.push(row.D);
      }
      for (const p of front) sprite(q, p, Ly.D);
      if (!rows.length && !Ly.body) depths.push(Ly.D);
      if (S === nearS) this.stage(q, A, depths, litW);
      if (q.n) meshOf(q, S, `well-flats.${this.id}.${Ly.id}`);
    }
    this.ctx.add(group, this.id);
    this.done = true;
  }

  /** The nearest mesh's share: the deck back from the stage's boards, a groove for every flat, the velvet under the deck's lip, and the
   *  Run's wall-run flat dressed where it stands. */
  stage(q, A, depths, litW) {
    const AT = this.ctx.at, L = this.L, X = (x) => AT.x + x, Y = (y) => AT.y + y, far = Math.max(...depths), E = extentOf(L, far), front = L.z - DECK.front;
    const wh = this.uvOf(A.sprites.white.inner, 1), uvP = this.uvOf(A.sprites.planks.inner), pw = SWATCHES.planks.w, pd = SWATCHES.planks.h;
    const warm = [1.12, 1.0, 0.86], dim = [0.5, 0.44, 0.44], back = L.z - far - DECK.back;
    for (let z = front; z > back; z -= pd) {
      const z1 = Math.max(back, z - pd), t0 = (front - z) / (front - back), t1 = (front - z1) / (front - back), v1 = uvP[1] + (uvP[3] - uvP[1]) * ((z - z1) / pd);
      for (let x = Math.floor(E.x0 / pw) * pw; x < E.x1; x += pw) q.floor(X(x), X(x + pw), z, z1, Y(0), [uvP[0], uvP[1], uvP[2], v1], lerp3(warm, dim, t0), lerp3(warm, dim, t1));
    }
    // (vertex colours are linear multipliers of the white swatch: walnut and maple, the velvet's crimson and its black, the card's core)
    const E0 = extentOf(L, DECK.front), walnut = [0.15, 0.056, 0.02], maple = [0.58, 0.32, 0.11], deep = [0.06, 0.012, 0.018], ink = [0.012, 0.006, 0.006];
    const flat = (c) => () => c;
    q.wall(X(E0.x0), X(E0.x1), Y(-DECK.lip), Y(0), front, wh, flat(walnut));
    q.add([[X(E0.x0), Y(E0.bottom - 2), front - 0.05], [X(E0.x1), Y(E0.bottom - 2), front - 0.05], [X(E0.x1), Y(-DECK.lip), front - 0.05], [X(E0.x0), Y(-DECK.lip), front - 0.05]],
      [[wh[0], wh[1]], [wh[2], wh[1]], [wh[2], wh[3]], [wh[0], wh[3]]], [ink, ink, deep, deep]);
    for (const D of [...new Set(depths)]) {
      const e = extentOf(L, D + 1), z = L.z - D, t = Math.min(1, (D - DECK.front) / (far - DECK.front + 0.01)), k = 1 - 0.45 * t;
      const wal = walnut.map((v) => v * k), map = maple.map((v) => v * k);
      q.wall(X(e.x0), X(e.x1), Y(-0.05), Y(DECK.rail - 0.04), z + 0.3, wh, flat(wal));
      q.wall(X(e.x0), X(e.x1), Y(DECK.rail - 0.04), Y(DECK.rail), z + 0.3, wh, flat(map));
      q.floor(X(e.x0), X(e.x1), z + 0.3, z - 0.12, Y(DECK.rail), wh, wal.map((v) => v * 0.8), wal.map((v) => v * 0.6));
    }
    const B = this.wallRun, r = A.sprites.wallrun;
    if (B && r) {
      const c = B.c, hw = B.w / 2 + 0.012, hh = B.h / 2 + 0.012, hd = B.d / 2 + 0.012, x0 = c.x - hw, x1 = c.x + hw, y0 = c.y - hh, y1 = c.y + hh, zf = c.z + hd, zb = c.z - hd;
      const card = [0.89, 0.79, 0.58], under = [0.3, 0.25, 0.18], light = (y) => lerp3([1.12, 1.02, 0.9], [0.98, 0.95, 0.92], (y - y0) / (y1 - y0));
      q.wall(x0, x1, y0, y1, zf, this.uvOf(r.inner), light);
      q.floor(x0, x1, zf, zb, y1, wh, card, card);
      q.floor(x0, x1, zb, zf, y0, wh, under, under);
      for (const [xa, xb] of [[x0, x0], [x1, x1]]) q.add([[xa, y0, zb], [xb, y0, zf], [xb, y1, zf], [xa, y1, zb]], [[wh[0], wh[1]], [wh[2], wh[1]], [wh[2], wh[3]], [wh[0], wh[3]]], [under, under, card, card]);
    }
  }

  /** The rocking rows (the Flood's sea), slid and bobbed in their grooves; the turning pieces (a windmill's sails, a gear) turned. */
  update(dt) {
    for (const S of this.spins) S.mesh.rotation.z -= S.spin * dt;
    if (!this.rows.length) return;
    this.t += dt;
    for (const R of this.rows) { const a = this.t * (R.w || 1) + (R.ph || 0); R.mesh.position.x = (R.x || 0) * Math.sin(a); R.mesh.position.y = (R.y || 0) * (0.5 + 0.5 * Math.sin(a * 2 + 0.6)); }
  }

  /** Everything let go: the meshes out of the lane, their geometry, materials and textures. */
  dispose() {
    this.gone = true;
    if (this.group) { this.group.removeFromParent(); this.group.traverse((o) => o.geometry?.dispose()); }
    for (const S of this.sheets) { S.mat?.dispose(); S.tex?.dispose(); if (S.canvas) S.canvas.width = S.canvas.height = 0; S.canvas = S.g = null; }
    this.sheets = []; this.rows = []; this.spins = []; this.group = null;
  }
}
