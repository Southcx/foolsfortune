// ---------------------------------------------------------------------------------------
// A RIBBON'S SHAPE (the owner, 2026-10-24: "new paintjobs for the skiff"): the boost's ribbon behind the Solar Skiff while it flares in
// the air (vfx/skiffpaintlook.js draws the plain one, `on`), in three more shapes, each keyed by Dovina's catalogue's id
// (progress/skiffpaint.js PAINT.ribbon); an id this file does not know is the ribbon as it stands.
//   HELIX    two strands wound round the path the stern flew, the dye's (or Lachryma's, the film walking down it) and gold, rungs of
//            cream between them: the wind of it laid where it was flown, so it reads as a thing left in the air, not a spinning one.
//   COMET    a dust tail widening and cooling as it ages (white-hot at the head, the dye's colour, violet at its end) and an ion tail
//            beside it, straight back from the head and thin, ice blue; a bright head and motes shed off the tail (the shared pools).
//   SUITS    a paper streamer chain: cards strung on a gold thread, each in its suit's ink with its pip in the house deck's cream stock
//            (cups, swords, pentacles, wands in turn: progress/casino/table.js SUIT_COLOURS, the house deck's), fluttering on the
//            thread as they trail, popping out to size as they are let out.
// Each is one mesh of vertex colours on the plain ribbon's own material settings (the same program), drawn only while it has a sample
// alive; samples are recycled, nothing allocated a frame once warm.
//
// Prior art: Rocket League's boost trails (the shape is the reward), a rhythmic gymnast's ribbon, the double helix and a DNA ladder's
// rungs (the helix), a comet's two tails (the dust curved and yellow, the ion straight and blue), a paper chain of playing cards and a
// carnival streamer (the suits), the house deck (vfx/bazaarfaces.js) for the stock and the pips.
//
//   const R = new SkiffRibbonShapes(scene, game)   R.set(id) -> bool   R.update(dt, t, emit, stern, camera, dyeHex)   R.clear()   R.dispose()
//   RIBBON_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { featTint } from '../oxidation.js';
import { LACHRYMA_TINT } from '../racewayeffects.js';
import { SUIT_COLOURS } from '../../progress/casino/table.js';

/** The numbers (m, real s): samples kept and how far apart; their life; each shape's widths, radius, twist (rad a m flown) and spin,
 *  alpha and colours; the comet's tail growth and its ion tail; the suits' card (width, height, a sample a card), pip size, flutter. */
export const RIBBON_LOOK = {
  n: 48, step: 0.12, life: 0.7,
  helix: { r: 0.28, grow: 0.5, strand: 0.05, twist: 7, spin: 2.2, alpha: 0.95, rungEvery: 3, rung: 0.022, gold: 0xffd36a, cream: 0xf6e6c8, film: 0.4 },
  comet: { w0: 0.1, w1: 0.95, rise: 0.6, alpha: 0.92, head: 0xfff4d6, tail: 0x6a3cb8, cool: 0.22, ion: { n: 12, len: 2.8, w: 0.05, colour: 0x9fd8ff, alpha: 0.75 }, motes: 36 },
  suits: { w: 0.3, h: 0.42, every: 3, pip: 0.1, flutter: 9, flap: 0.7, thread: 0.012, stock: 0xf7efdc, gold: 0xc9a24a, alpha: 0.95, pop: 9 },
};
const RL = RIBBON_LOOK;
const SHAPES = ['helix', 'comet', 'suits'];

// the suits' pips as outlines round their middles (unit, y up): cups a heart, swords a spade, pentacles a diamond, wands a club
const K = 16;
const heart = (t) => [16 * Math.sin(t) ** 3 / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 3) / 17];
const PIPS = {
  cups: Array.from({ length: K }, (_, i) => heart((i / K) * Math.PI * 2)),
  swords: Array.from({ length: K }, (_, i) => { const [x, y] = heart((i / K) * Math.PI * 2); return [x, -y * 0.95 + 0.1]; }),
  pentacles: Array.from({ length: K }, (_, i) => { const a = (i / K) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), d = Math.abs(c) / 0.68 + Math.abs(s); return [c / d, s / d]; }),
  wands: Array.from({ length: K }, (_, i) => { const a = (i / K) * Math.PI * 2, r = 0.5 + 0.48 * Math.max(0, Math.cos(3 * (a - Math.PI / 2))) ** 0.7; return [Math.cos(a) * r, Math.sin(a) * r]; }),
};
const SUIT = SUIT_COLOURS.map((c) => ({ pip: PIPS[c.suit], colour: new THREE.Color(c.hex) }));

const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(), _h = new THREE.Vector3(), _n = new THREE.Vector3(), _c0 = new THREE.Vector3(), _c1 = new THREE.Vector3(), _e = new THREE.Vector3();
const _col = new THREE.Color(), _fc = new THREE.Color(), _base = new THREE.Color(), _gold = new THREE.Color(RL.helix.gold), _cream = new THREE.Color(RL.helix.cream), _head = new THREE.Color(RL.comet.head), _tail = new THREE.Color(RL.comet.tail), _ion = new THREE.Color(RL.comet.ion.colour), _stock = new THREE.Color(RL.suits.stock), _thread = new THREE.Color(RL.suits.gold);
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
const M = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0.5, size: 0.1, sizeEnd: 0.02, color: 0xffffff, colorEnd: 0xffffff, alpha: 0.9, alphaEnd: 0, drag: 1, gravity: 0, shape: 'sparkle', rot: 0, spin: 0, stretch: 0, twinkle: 0, floor: -1e9, grow: 0, delay: 0 };

/** One mesh of quads (4 vertices each, two triangles) or fans, its buffers written in place. */
class Strips {
  constructor(scene, mat, verts, index) {
    this.pos = new Float32Array(verts * 3); this.col = new Float32Array(verts * 4); this.n = 0;
    const g = this.g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(index); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 2; this.mesh.userData.zoneFree = true;
    scene?.add(this.mesh);
  }
  v(i, p, c, a) { const o = i * 3, q = i * 4; this.pos[o] = p.x; this.pos[o + 1] = p.y; this.pos[o + 2] = p.z; this.col[q] = c.r; this.col[q + 1] = c.g; this.col[q + 2] = c.b; this.col[q + 3] = a; }
  hide(from, to) { for (let i = from; i < to; i++) this.col[i * 4 + 3] = 0; }
  flush() { this.g.attributes.position.needsUpdate = true; this.g.attributes.color.needsUpdate = true; }
}
/** The index of `count` strips of `len` sample pairs, laid one after another, then `quads` free quads, then `fans` fans of K + 1. */
function indexOf(strips, len, quads, fans) {
  const idx = []; let v = 0;
  for (let s = 0; s < strips; s++) { for (let i = 0; i < len - 1; i++) { const a = v + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } v += len * 2; }
  for (let q = 0; q < quads; q++) { const a = v + q * 4; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } v += quads * 4;
  for (let f = 0; f < fans; f++) { const c = v + f * (K + 1); for (let k = 0; k < K; k++) idx.push(c, c + 1 + k, c + 1 + ((k + 1) % K)); }
  return idx;
}

export class SkiffRibbonShapes {
  constructor(scene, game) {
    this.scene = scene; this.game = game; this.id = null; this.meshes = {}; this.S = []; this.spare = []; this.born = 0; this.acc = 0;
    // (the plain ribbon's settings: vfx/skiffpaintlook.js Ribbon, so the same program)
    this.mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending, fog: false, toneMapped: false });
  }

  /** Wear a shape by its id: true if this file draws it (else the plain ribbon's own). */
  set(id) { const was = this.id; this.id = SHAPES.includes(id) ? id : null; if (was !== this.id) this.clear(); return !!this.id; }

  mesh(id) {
    if (this.meshes[id]) return this.meshes[id];
    const n = RL.n, cards = Math.ceil(n / RL.suits.every) + 1, rungs = Math.ceil(n / RL.helix.rungEvery) + 1;
    const make = {
      helix: () => new Strips(this.scene, this.mat, n * 2 * 2 + rungs * 4, indexOf(2, n, rungs, 0)),
      comet: () => new Strips(this.scene, this.mat, n * 2 + RL.comet.ion.n * 2, [...indexOf(1, n, 0, 0), ...indexOf(1, RL.comet.ion.n, 0, 0).map((i) => i + n * 2)]),
      suits: () => new Strips(this.scene, this.mat, n * 2 + cards * 4 + cards * 2 * (K + 1), indexOf(1, n, cards, cards * 2)),
    }[id];
    const m = (this.meshes[id] = make()); m.mesh.name = `skiff-ribbon-${id}`; return m;
  }

  clear() { this.spare.push(...this.S); this.S.length = 0; for (const m of Object.values(this.meshes)) m.mesh.visible = false; }

  /** Per frame (vfx/skiffpaintlook.js frame): age the samples, lay one at the stern while flaring, and draw the worn shape. */
  update(dt, t, emit, at, cam, dye) {
    const S = this.S, id = this.id;
    for (const p of S) p.age += dt;
    while (S.length && S[0].age > RL.life) this.spare.push(S.shift());
    if (!id) { if (S.length) this.clear(); return; }
    if (emit) {
      const last = S[S.length - 1];
      if (!last || Math.hypot(at.x - last.x, at.y - last.y, at.z - last.z) > RL.step) {
        const p = this.spare.pop() || {}; p.x = at.x; p.y = at.y; p.z = at.z; p.age = 0; p.born = this.born++; p.flown = (last?.flown ?? 0) + (last ? Math.hypot(at.x - last.x, at.y - last.y, at.z - last.z) : 0); p.ph = Math.random() * 6.28;
        S.push(p); if (S.length > RL.n) this.spare.push(S.shift());
      } else { last.x = at.x; last.y = at.y; last.z = at.z; last.age = 0; }
    }
    const m = this.mesh(id), n = S.length;
    if (n < 2 || !cam) { m.mesh.visible = false; return; }
    m.mesh.visible = true;
    _base.set(dye ?? LACHRYMA_TINT);
    if (id === 'helix') this.helix(m, t, cam);
    else if (id === 'comet') this.comet(m, t, cam, emit, dt);
    else this.suits(m, t, cam);
    m.flush();
  }

  /** The path's frame at sample i: its way (_d), a side (_s) and an up (_u) square to it. */
  frame(i) {
    const S = this.S, n = S.length, q = S[Math.min(i + 1, n - 1)], o = S[Math.max(i - 1, 0)];
    _d.set(q.x - o.x, q.y - o.y, q.z - o.z); if (_d.lengthSq() < 1e-8) _d.set(0, 0, 1); _d.normalize();
    _s.crossVectors(_d, Math.abs(_d.y) > 0.95 ? X : Y).normalize(); _u.crossVectors(_s, _d);
  }
  /** A camera-facing pair at c, half width w, along the way _d: vertices j and j + 1. */
  pair(m, j, c, w, col, a, cam) {
    _h.copy(cam.position).sub(c); _n.crossVectors(_d, _h); const l = _n.length(); if (l > 1e-6) _n.multiplyScalar(w / l); else _n.set(0, w, 0);
    m.v(j, _e.copy(c).sub(_n), col, a); m.v(j + 1, _e.copy(c).add(_n), col, a);
  }

  helix(m, t, cam) {
    const H = RL.helix, S = this.S, n = S.length, N = RL.n;
    let rung = 0; const rungBase = N * 4, rungs = Math.ceil(N / H.rungEvery) + 1;
    for (let i = 0; i < N; i++) {
      const p = S[Math.min(i, n - 1)], live = i < n, k = live ? 1 - p.age / RL.life : 0;
      this.frame(Math.min(i, n - 1));
      const r = H.r * (1 + H.grow * (1 - k)), w = H.strand * (0.4 + 0.6 * k), a = live ? H.alpha * k * k : 0;
      for (let s = 0; s < 2; s++) {
        const ph = p.flown * H.twist + t * H.spin + s * Math.PI; // (the wind laid where it was flown, turning slowly)
        _a.set(p.x, p.y, p.z).addScaledVector(_s, Math.cos(ph) * r).addScaledVector(_u, Math.sin(ph) * r);
        (s ? _c1 : _c0).copy(_a);
        if (s) _col.copy(_gold); else _col.copy(_base).lerp(featTint(t * 0.6 - i * 0.05, _fc, { bright: 1.2 }), H.film);
        this.pair(m, s * N * 2 + i * 2, _a, w, _col, a, cam);
      }
      if (live && p.born % H.rungEvery === 0 && rung < rungs) { // (a rung between the strands, every few samples as they were laid)
        const j = rungBase + rung * 4, rw = H.rung;
        m.v(j, _e.copy(_c0).addScaledVector(_d, -rw), _cream, a * 0.7); m.v(j + 1, _e.copy(_c0).addScaledVector(_d, rw), _cream, a * 0.7);
        m.v(j + 2, _e.copy(_c1).addScaledVector(_d, -rw), _cream, a * 0.7); m.v(j + 3, _e.copy(_c1).addScaledVector(_d, rw), _cream, a * 0.7);
        rung++;
      }
    }
    m.hide(rungBase + rung * 4, rungBase + rungs * 4);
  }

  comet(m, t, cam, emit, dt) {
    const C = RL.comet, S = this.S, n = S.length, N = RL.n;
    for (let i = 0; i < N; i++) {
      const p = S[Math.min(i, n - 1)], live = i < n, k = live ? 1 - p.age / RL.life : 0;
      this.frame(Math.min(i, n - 1));
      const w = C.w0 + (C.w1 - C.w0) * Math.pow(1 - k, 0.8), head = i / Math.max(1, n - 1);
      _a.set(p.x, p.y + C.rise * (1 - k) * (1 - k), p.z); // (the dust tail curving up off the line as it ages)
      const cool = 1 - k;
      if (cool < C.cool) _col.copy(_head).lerp(_base, cool / C.cool); else _col.copy(_base).lerp(_tail, (cool - C.cool) / (1 - C.cool));
      const a = live ? C.alpha * Math.pow(k, 1.5) * Math.min(1, (1 - head) * 6 + 0.25) : 0;
      this.pair(m, i * 2, _a, w * Math.min(1, 0.35 + head * 2), _col, a, cam);
    }
    // the ion tail: straight back from the head, thin and blue, while the head is fresh
    const hp = S[n - 1], tp = S[Math.max(0, n - 4)], I = C.ion, j0 = N * 2;
    _d.set(hp.x - tp.x, hp.y - tp.y, hp.z - tp.z); if (_d.lengthSq() < 1e-8) _d.set(0, 0, 1); _d.normalize();
    const fresh = Math.max(0, 1 - hp.age / RL.life);
    for (let i = 0; i < I.n; i++) {
      const u = i / (I.n - 1);
      _a.set(hp.x, hp.y, hp.z).addScaledVector(_d, -u * I.len);
      this.pair(m, j0 + i * 2, _a, I.w * (1 - 0.6 * u), _ion, I.alpha * fresh * (1 - u), cam);
    }
    // the head and the motes, from the shared pools
    const V = this.game?.vfx; if (!V?.alpha || !emit) return;
    M.pos.set(hp.x, hp.y, hp.z); M.vel.set(0, 0, 0); M.life = 0.12; M.size = 0.55; M.sizeEnd = 0.4; M.color = C.head; M.colorEnd = C.head; M.alpha = 0.9; M.shape = 'core'; M.drag = 0; M.gravity = 0; M.spin = 0; M.twinkle = 0;
    V.add.emit(M);
    this.acc += dt * C.motes;
    while (this.acc >= 1) {
      this.acc -= 1;
      const p = S[(Math.random() * n) | 0];
      M.pos.set(p.x + (Math.random() - 0.5) * 0.4, p.y + (Math.random() - 0.5) * 0.4, p.z + (Math.random() - 0.5) * 0.4); M.vel.set(0, 0.3, 0);
      M.life = 0.4 + Math.random() * 0.5; M.size = 0.05 + Math.random() * 0.06; M.sizeEnd = 0.01; M.color = 0xffffff; M.colorEnd = C.tail; M.alpha = 1; M.shape = 'sparkle'; M.spin = 2; M.drag = 1; M.rot = Math.random() * 6.28;
      V.alpha.emit(M);
    }
  }

  suits(m, t, cam) {
    const U = RL.suits, S = this.S, n = S.length, N = RL.n, cards = Math.ceil(N / U.every) + 1, qBase = N * 2, fBase = qBase + cards * 4;
    for (let i = 0; i < N; i++) { // the thread
      const p = S[Math.min(i, n - 1)], live = i < n, k = live ? 1 - p.age / RL.life : 0;
      this.frame(Math.min(i, n - 1));
      _a.set(p.x, p.y, p.z); this.pair(m, i * 2, _a, U.thread, _thread, live ? U.alpha * k : 0, cam);
    }
    let c = 0;
    for (let i = 0; i < n && c < cards; i++) {
      const p = S[i]; if (p.born % U.every) continue;
      const k = 1 - p.age / RL.life, pop = Math.min(1, p.age * U.pop + 0.15), a = U.alpha * Math.min(1, k * 2.5);
      this.frame(i);
      // the card hangs from the thread, turned about it by the flutter
      _h.set(0, -1, 0).addScaledVector(_d, _d.y).normalize();
      const th = Math.sin(t * U.flutter + p.ph) * U.flap;
      _n.crossVectors(_d, _h); _h.multiplyScalar(Math.cos(th)).addScaledVector(_n, Math.sin(th)); _n.crossVectors(_d, _h);
      const w = U.w * 0.5 * pop, h = U.h * pop, j = qBase + c * 4;
      _a.set(p.x, p.y, p.z);
      const suit = SUIT[(p.born / U.every) % 4 | 0], ps = U.pip * pop, ink = suit.colour; // (the card in its suit's ink, its pip the stock: read at a distance)
      m.v(j, _e.copy(_a).addScaledVector(_d, -w), ink, a); m.v(j + 1, _e.copy(_a).addScaledVector(_d, w), ink, a);
      m.v(j + 2, _e.copy(_a).addScaledVector(_d, -w).addScaledVector(_h, h), ink, a); m.v(j + 3, _e.copy(_a).addScaledVector(_d, w).addScaledVector(_h, h), ink, a);
      // its pip, both faces (a hair off the card, so neither face is hidden behind it)
      _c0.copy(_a).addScaledVector(_h, h * 0.5);
      for (let f = 0; f < 2; f++) {
        const fj = fBase + (c * 2 + f) * (K + 1), off = f ? -0.006 : 0.006;
        _c1.copy(_c0).addScaledVector(_n, off); m.v(fj, _c1, _stock, a);
        for (let q = 0; q < K; q++) { const [x, y] = suit.pip[q]; m.v(fj + 1 + q, _e.copy(_c1).addScaledVector(_d, x * ps * (f ? -1 : 1)).addScaledVector(_h, -y * ps), _stock, a); }
      }
      c++;
    }
    m.hide(qBase + c * 4, qBase + cards * 4); m.hide(fBase + c * 2 * (K + 1), fBase + cards * 2 * (K + 1));
  }

  dispose() { for (const m of Object.values(this.meshes)) { m.mesh.removeFromParent(); m.g.dispose(); } this.mat.dispose(); this.meshes = {}; }
}
