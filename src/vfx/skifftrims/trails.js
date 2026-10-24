// ---------------------------------------------------------------------------------------
// A TRAIL'S LOOK (the owner, 2026-10-24: "more customization options for the racing module ... new paintjobs for the skiff"): the wake
// the Solar Skiff leaves on the sand (world/ground/wake.js) worn as one of five trails past the sand's own, Lachryma and the hull's glaze
// (those three stay vfx/skiffpaintlook.js's). Dovina's catalogue keys each (progress/skiffpaint.js PAINT.trail); an id this file does
// not know is the wake as it stands. Each is laid over the wake's own machinery, never beside it: the wake builds its band and its two
// lines as it always does, then calls `after` (its `look`), and this repaints those same vertices by each sample's age and throws a few
// particles off them into the house's shared pools (game.vfx.alpha and .add, vfx/sprites.js: their atlas has the petal, the sparkle,
// the puff). No new program, no new draw call, nothing allocated a frame (one emit record, rewritten).
//   PETALS     a blossom wake: the lines pale cherry, the band blush, petals lifted off its edges that drift aft, tumble and settle.
//   EMBERS     a smouldering line: the lines hot gold at the bow, cooling through red to char down the wake, flickering as coals do;
//              the band a scorch; sparks rising off the fresh end.
//   INK        a calligraphy stroke: the V gives way to one brush stroke whose width breathes with the ground it crosses, wet sumi at
//              the bow drying to a warm grey (the lines its dry-brush hairs, broken where the brush ran dry: kasure), a few drops flung.
//   STARLIGHT  the band a dusk indigo, the lines starlight, tiny glints that twinkle out across it (added to the frame at night, laid
//              over it by day, where an added glint washed out on the sand).
//   FROST      rime: the band and lines ice white and blue, going thin and glassy as it ages, and sublimating: wisps rising off the
//              older stretch, a few frost stars glinting on it.
//
// Prior art: Rocket League's and Mario Kart Tour's trails (the board's passage drawn, opened by play, never a number); Okami's Brush
// trail and its blossoming footsteps (petals and ink as the wake of a god); a sumi stroke's kasure and nijimi (the drying, the dry
// brush); Journey's sand (the glint in the trail); a coal bed's flicker; hoar frost subliming in the sun.
//
//   const T = new SkiffTrailLook(game)   T.set(id) -> bool (a look it knows)   T.wakeColour(id) -> hex | null (the bow's bubbles)
//   T.after(wake, dt, opts)  (world/ground/wake.js, `wake.look`, after it builds)   TRAIL_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WAKE } from '../../world/ground/wake.js';
import { lightAt } from '../../progress/weather.js';

/** The numbers. Each trail: its lines' and band's colours (fresh and old, by the sample's age 0..1), what it does to their alpha, the bow's
 *  bubbles' colour; its particles (`emit`): how many a real second at full speed, from what span of the wake's age, the sprite's shape and
 *  pool, its size, life (real s), speed out and up (m/s), gravity, drag, spin, colours. The ink's brush (its half width m, how much it
 *  breathes, the dry brush's break), the embers' flicker (rate, depth), the starlight's twinkle. */
export const TRAIL_LOOK = {
  petals: {
    line: [0xffe3ea, 0xf3a7bd], band: [0xf6b8c9, 0xf9dde4], lineA: 0.85, bandA: 1.1, bubble: 0xffeef2,
    emit: { rate: 26, age: [0.05, 0.7], shape: 'petal', pool: 'alpha', size: [0.07, 0.13], life: [1.6, 2.8], out: 1.1, up: [0.5, 1.4], gravity: 0.55, drag: 1.3, spin: 3.2,
      colours: [0xf7b8c8, 0xfde8ee, 0xec8fab, 0xffffff] },
  },
  embers: {
    line: [0xffd27a, 0xe8501e, 0x5a1c10], band: [0x6e2412, 0x2a1a14], lineA: 1, bandA: 1.5, bubble: 0xffb35a, flicker: { rate: 13, depth: 0.35 },
    emit: { rate: 30, age: [0, 0.35], shape: 'sparkle', pool: 'alpha', size: [0.04, 0.08], life: [0.5, 1.1], out: 0.35, up: [0.8, 2], gravity: -0.6, drag: 1.6, spin: 6,
      colours: [0xffd27a, 0xff9a3a, 0xffe6b0], end: 0x8a2410 },
  },
  ink: {
    wet: 0x0e1014, dry: 0x5a4c40, bandA: 0.82, lineA: 0.7, bubble: 0x1a1612, dryAt: [0.12, 0.6],
    brush: { w: 0.42, breathe: 0.45, hair: 0.86, hairW: 0.022, kasure: 0.25 },
    emit: { rate: 6, age: [0, 0.08], shape: 'disc', pool: 'alpha', size: [0.04, 0.09], life: [1.4, 2.2], out: 2.2, up: [1.2, 2.6], gravity: 11, drag: 0.6, spin: 0,
      colours: [0x0e1014, 0x1a1612], alpha: 1.6 },
  },
  starlight: {
    line: [0xe8f0ff, 0x9fb8ff], band: [0x26306e, 0x141a3e], lineA: 0.9, bandA: 1.2, bubble: 0xdfe8ff,
    emit: { rate: 40, age: [0.05, 0.95], shape: 'sparkle', pool: 'night', size: [0.05, 0.12], life: [0.5, 1.3], out: 0, up: [0.05, 0.25], gravity: 0, drag: 0, spin: 0.6,
      colours: [0xffffff, 0xcfe0ff, 0xfff1c8], twinkle: [8, 15] },
  },
  frost: {
    line: [0xd8f0ff, 0x8fc8ec], band: [0xbfe2f6, 0xa8d4f0], lineA: 1, bandA: 1.4, bubble: 0xf2fbff, sublime: 1.6,
    emit: { rate: 18, age: [0.3, 0.9], shape: 'puff', pool: 'alpha', size: [0.18, 0.3], sizeEnd: 0.7, life: [1, 1.8], out: 0.2, up: [0.3, 0.7], gravity: -0.15, drag: 1.2, spin: 0.5,
      colours: [0xf4faff, 0xe6f2fb], alpha: 0.3 },
    stars: { rate: 14, age: [0.05, 0.5], size: [0.05, 0.09], life: [0.3, 0.7], colour: 0xffffff },
  },
};
const IDS = Object.keys(TRAIL_LOOK);

const lin = (hex) => new THREE.Color(hex); // (linear, as the wake's vertex colours are)
const ramp = (list) => list.map(lin);
const R = Object.fromEntries(IDS.map((id) => {
  const L = TRAIL_LOOK[id];
  return [id, { line: L.line && ramp(L.line), band: L.band && ramp(L.band), wet: L.wet != null && lin(L.wet), dry: L.dry != null && lin(L.dry), cols: L.emit.colours }];
}));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rr = (a) => a[0] + Math.random() * (a[1] - a[0]);
/** A colour along a ramp (2 or 3 stops) at t 0..1, written into out's r, g, b (no allocation). */
function along(stops, t, out) {
  const n = stops.length - 1, x = Math.min(0.9999, Math.max(0, t)) * n, i = Math.floor(x), f = x - i, a = stops[i], b = stops[i + 1];
  out.r = a.r + (b.r - a.r) * f; out.g = a.g + (b.g - a.g) * f; out.b = a.b + (b.b - a.b) * f; return out;
}
const _c = { r: 0, g: 0, b: 0 };
const E = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 1, size: 0.1, sizeEnd: 0.1, color: 0xffffff, colorEnd: 0xffffff, alpha: 1, alphaEnd: 0, drag: 0, gravity: 0, shape: 'soft', rot: 0, spin: 0, stretch: 0, twinkle: 0, floor: -1e9, grow: 0, delay: 0 };

export class SkiffTrailLook {
  constructor(game) { this.game = game; this.id = null; this.acc = 0; this.acc2 = 0; }

  /** Wear a trail by its id: true if this file draws it (else the wake is left as it stands). */
  set(id) { this.id = TRAIL_LOOK[id] ? id : null; return !!this.id; }
  /** The bow's bubbles' colour for a trail of this file's (null: the wake's own). */
  wakeColour(id = this.id) { return TRAIL_LOOK[id]?.bubble ?? null; }

  /** After the wake has built its strips (world/ground/wake.js): repaint them and throw the trail's particles. */
  after(wake, dt, o = {}) {
    const id = this.id; if (!id) return;
    const S = wake.s, n = Math.min(S.length, WAKE.N); if (n < 2) return;
    const L = TRAIL_LOOK[id], K = R[id], N = WAKE.N, P = wake.pos, C = wake.col, now = (this.t = (this.t || 0) + dt);
    for (let i = 0; i < n; i++) {
      const p = S[i], t = p.age / WAKE.LIFE;
      for (let strip = 0; strip < 3; strip++) {
        const base = (strip * N + i) * 2, line = strip > 0;
        let a = 1;
        if (id === 'ink') {
          // the brush: one stroke whose width breathes with the ground it crosses (a stable field, so it never crawls), wet to dry
          const B = L.brush, pr = 1 - B.breathe * (0.5 + 0.5 * Math.sin(p.x * 0.9 + p.z * 0.7) * Math.sin(p.x * 0.31 - p.z * 0.43));
          const hw = B.w * pr * (0.75 + 0.25 * p.k) * (1 - 0.25 * t), lx = -p.fz, lz = p.fx;
          const cx = line ? (strip === 1 ? 1 : -1) * hw * B.hair : 0, half = line ? B.hairW : hw;
          for (let e = 0; e < 2; e++) { const off = cx + (e ? half : -half), q = (base + e) * 3; P[q] = p.x + lx * off; P[q + 2] = p.z + lz * off; }
          const dry = smooth(L.dryAt[0], L.dryAt[1], t);
          _c.r = K.wet.r + (K.dry.r - K.wet.r) * dry; _c.g = K.wet.g + (K.dry.g - K.wet.g) * dry; _c.b = K.wet.b + (K.dry.b - K.wet.b) * dry;
          const hold = p.brk ? 0 : p.k * (1 - smooth(0.72, 1, t)); // (a stroke stays until the end, then goes: ink does not fade as foam does)
          const kas = line && Math.sin(p.x * 4.1 + p.z * 3.3 + strip * 2) > 1 - 2 * B.kasure ? 0 : 1; // (the dry brush's breaks)
          a = (line ? L.lineA * kas : L.bandA) * hold;
          for (let e = 0; e < 2; e++) { const q = (base + e) * 4; C[q] = _c.r; C[q + 1] = _c.g; C[q + 2] = _c.b; C[q + 3] = a; }
          continue;
        }
        along(line ? K.line : K.band, t, _c);
        if (id === 'embers') { const F = L.flicker, f = 1 - F.depth * (0.5 + 0.5 * Math.sin(now * F.rate + i * 1.37 + strip)) * smooth(0.05, 0.4, t); _c.r *= f; _c.g *= f; _c.b *= f; }
        if (id === 'frost') a = Math.pow(Math.max(0, 1 - t), L.sublime - 1); // (thinning as it sublimates, sooner than foam fades)
        a *= line ? L.lineA : L.bandA;
        for (let e = 0; e < 2; e++) { const q = (base + e) * 4; C[q] = _c.r; C[q + 1] = _c.g; C[q + 2] = _c.b; C[q + 3] = Math.min(1, C[q + 3] * a); }
      }
    }
    if (id === 'ink') wake.g.attributes.position.needsUpdate = true;
    wake.g.attributes.color.needsUpdate = true;
    this.throw(wake, dt, L, K, n, o);
  }

  /** The trail's particles, off its samples in the span of age it names, more the faster the board is going. */
  throw(wake, dt, L, K, n, o) {
    const V = this.game?.vfx; if (!V?.alpha) return;
    const M = L.emit, S = wake.s, k = Math.min(1, (o.speed || 0) / 14) * (o.air ? 0.4 : 1);
    const night = lightAt() < 0.35, pool = M.pool === 'night' ? (night ? V.add : V.alpha) : M.pool === 'add' ? V.add : V.alpha;
    this.acc += dt * M.rate * (0.25 + 0.75 * k);
    while (this.acc >= 1) { this.acc -= 1; this.one(S, n, M, K.cols, pool, night); }
    if (L.stars) { this.acc2 += dt * L.stars.rate * (0.25 + 0.75 * k); while (this.acc2 >= 1) { this.acc2 -= 1; this.star(S, n, L.stars, night ? V.add : V.alpha); } }
  }

  /** A sample in the span of age (a few tries), or null. */
  pick(S, n, age) {
    for (let k = 0; k < 4; k++) { const p = S[(Math.random() * n) | 0], t = p.age / WAKE.LIFE; if (!p.brk && t >= age[0] && t <= age[1]) return p; }
    return null;
  }

  one(S, n, M, cols, pool, night) {
    const p = this.pick(S, n, M.age); if (!p) return;
    const t = p.age / WAKE.LIFE, sp = wakeSpreadOf(t, p.k), side = Math.random() < 0.5 ? -1 : 1, lx = -p.fz, lz = p.fx;
    const off = this.id === 'ink' ? side * 0.1 : side * sp * (0.7 + Math.random() * 0.45);
    E.pos.set(p.x + lx * off, p.y + 0.06, p.z + lz * off);
    const out = M.out * (0.4 + Math.random() * 0.8) * side;
    E.vel.set(lx * out - p.fx * (this.id === 'ink' ? 1.5 : 0.3), rr(M.up), lz * out - p.fz * (this.id === 'ink' ? 1.5 : 0.3));
    E.life = rr(M.life); E.size = rr(M.size); E.sizeEnd = M.sizeEnd ?? E.size * 0.8;
    E.color = cols[(Math.random() * cols.length) | 0]; E.colorEnd = M.end ?? E.color;
    E.alpha = M.alpha ?? 0.95; E.alphaEnd = 0; E.drag = M.drag; E.gravity = M.gravity; E.shape = M.shape;
    E.rot = Math.random() * Math.PI * 2; E.spin = (Math.random() - 0.5) * 2 * M.spin; E.twinkle = M.twinkle ? rr(M.twinkle) : 0;
    E.floor = p.y + 0.02; E.stretch = 0; E.grow = 0; E.delay = 0;
    if (night && this.id === 'starlight') E.alpha = 0.9;
    pool.emit(E);
  }

  /** The frost's stars: a glint on the rime, short. */
  star(S, n, M, pool) {
    const p = this.pick(S, n, M.age); if (!p) return;
    const t = p.age / WAKE.LIFE, off = (Math.random() * 2 - 1) * wakeSpreadOf(t, p.k);
    E.pos.set(p.x - p.fz * off, p.y + 0.07, p.z + p.fx * off); E.vel.set(0, 0, 0);
    E.life = rr(M.life); E.size = rr(M.size); E.sizeEnd = E.size * 0.3; E.color = M.colour; E.colorEnd = M.colour; E.alpha = 1; E.alphaEnd = 0;
    E.drag = 0; E.gravity = 0; E.shape = 'star4'; E.rot = Math.random() * 0.8; E.spin = 0; E.twinkle = 0; E.floor = -1e9; E.stretch = 0; E.grow = 12; E.delay = 0;
    pool.emit(E);
  }
}
const wakeSpreadOf = (t, k) => WAKE.spread(t, k);
