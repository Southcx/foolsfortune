// ---------------------------------------------------------------------------------------
// THE ITANO RIBBONS: the lances' trails (docs/plans/RAIL-OVERHAUL.md sections 3 and 5: "the lock-on ... now an Itano swarm: each lance
// launched fanned, overshooting, then homing ... with ribbon trails"). Each lance leaves a ribbon: a strip through the last 0.6 real
// seconds of where it was, full width at the lance and tapering to nothing at the end, fading as it ages, in the lance's colour laid
// over what is behind it (light added would go white on the storm's gold), a paler heart and a shade at its edges; at its head a hot
// spark (light added). The motion is the runtime's (Petra's proportional navigation, the fan and the
// overshoot): a ribbon only follows the one position a frame it is given, so any flight draws the same way. One instanced draw for all
// of them (vfx/railmark.js's ribbon style: each segment's ends turned by its neighbours, so the strip is seamless at 480 lines).
//
// Prior art: Ichiro Itano's missile barrages (Macross, 1982; Ideon, 1980), each missile with its own smoke tail; the trails as
// camera-facing ribbons over 16 to 32 points, alpha by age (docs/plans/research/RAIL-PATTERNS.md section 3); the weapon trail of every
// action game (vfx/trail.js: a ribbon of samples aging out); Rez's and Panzer Dragoon's homing lasers.
//
//   const R = new ItanoRibbons({ max: 40, life: 0.6, width: 0.08, color })   parent.add(R.mesh)   R.parked() -> [mesh]
//   R.start(id, pos, { color }?)   a lance launched (any key: the lance's record, a number)
//   R.push(id, pos)                where it is now (every frame it flies)
//   R.end(id)                      it struck, or ran out: its ribbon runs out behind it and is gone
//   R.update(rawDt)                once a frame, after the pushes          R.clear()   R.show(on)
//   (positions in the parent's frame: the world in the game; up to `max` ribbons at once, 8 a volley, about 40 in the surge)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE } from './railmark.js';

const STEP = 1 / 60;   // (a sample kept at most this often: a 0.6 s ribbon is 36 points at most)

export class ItanoRibbons {
  constructor({ max = 40, life = 0.6, width = 0.08, color = 0x9ff3ff } = {}) {
    this.max = max; this.life = life; this.width = width; this.color = new THREE.Color(color);
    this.N = Math.ceil(life / STEP) + 3;
    this.buf = new MarkBuffer(max * (this.N + 1), { renderOrder: 41 });
    this.mesh = this.buf.mesh;
    this.recs = Array.from({ length: max }, () => ({ id: null, live: false, used: false, pts: new Float32Array(this.N * 3), ts: new Float32Array(this.N), n: 0, head: 0, hx: 0, hy: 0, hz: 0, last: -1, color: new THREE.Color() }));
    this.byId = new Map(); this.t = 0;
  }

  parked() { return [this.mesh]; }
  show(on) { this.mesh.visible = on; }

  start(id, pos, { color = null } = {}) {
    if (this.byId.has(id)) this.end(id);
    let r = this.recs.find((x) => !x.used);
    if (!r) r = this.recs.reduce((a, b) => (a.last < b.last ? a : b)); // (all in use: the oldest gives way)
    if (r.id != null && this.byId.get(r.id) === r) this.byId.delete(r.id);
    r.id = id; r.used = true; r.live = true; r.n = 0; r.head = 0; r.last = -1; r.color.copy(color != null ? new THREE.Color(color) : this.color);
    this.byId.set(id, r);
    this.sample(r, pos, true);
    return r;
  }
  push(id, pos) { const r = this.byId.get(id); if (r?.live) this.sample(r, pos, false); }
  end(id) { const r = this.byId.get(id); if (!r) return; r.live = false; this.byId.delete(id); }
  clear() { for (const r of this.recs) { r.used = r.live = false; r.id = null; r.n = 0; } this.byId.clear(); this.buf.count = 0; this.buf.flush(); }

  /** The head moves every push; a point is kept when STEP has passed since the last (a ring of N). */
  sample(r, p, first) {
    r.hx = p.x; r.hy = p.y; r.hz = p.z;
    if (!first && this.t - r.last < STEP * 0.999) return;
    const i = (r.head + r.n) % this.N, o = i * 3;
    r.pts[o] = p.x; r.pts[o + 1] = p.y; r.pts[o + 2] = p.z; r.ts[i] = this.t; r.last = this.t;
    if (r.n < this.N) r.n++; else r.head = (r.head + 1) % this.N;
  }

  update(raw = 1 / 60) {
    this.t += raw; this.buf.time(this.t);
    const B = this.buf, L = this.life, W = this.width, N = this.N;
    let k = 0;
    for (const r of this.recs) {
      if (!r.used) continue;
      while (r.n && this.t - r.ts[r.head] > L) { r.head = (r.head + 1) % N; r.n--; } // (the oldest points age out)
      if (!r.n && !r.live) { r.used = false; r.id = null; continue; }
      // the chain: the kept points, oldest first, then the live head (while it flies)
      const cnt = r.n + (r.live ? 1 : 0);
      const P = (j, out) => {
        j = Math.max(0, Math.min(cnt - 1, j));
        if (j >= r.n) { out[0] = r.hx; out[1] = r.hy; out[2] = r.hz; out[3] = this.t; return out; }
        const i = (r.head + j) % N, o = i * 3; out[0] = r.pts[o]; out[1] = r.pts[o + 1]; out[2] = r.pts[o + 2]; out[3] = r.ts[i]; return out;
      };
      const c = r.color;
      for (let j = 0; j < cnt - 1; j++) {
        const a = P(j, _a), b = P(j + 1, _b), p = P(j - 1, _p), n = P(j + 2, _n);
        const ka = Math.max(0, 1 - (this.t - a[3]) / L), kb = Math.max(0, 1 - (this.t - b[3]) / L);
        B.put(k++, a[0], a[1], a[2], W * ka, b[0], b[1], b[2], W * kb, p[0], p[1], p[2], ka ** 1.3, n[0], n[1], n[2], kb ** 1.3, STYLE.ribbon, c.r, c.g, c.b);
      }
      if (r.live) B.put(k++, r.hx, r.hy, r.hz, W * 1.8, r.hx, r.hy, r.hz, 0, r.hx, r.hy, r.hz, 1, r.hx, r.hy, r.hz, 1, STYLE.spark, c.r, c.g, c.b);
    }
    B.count = k; B.flush();
  }

  /** How many ribbons are drawn (live or running out). */
  get active() { return this.recs.filter((r) => r.used).length; }
  dispose() { this.buf.dispose(); }
}
const _a = [0, 0, 0, 0], _b = [0, 0, 0, 0], _p = [0, 0, 0, 0], _n = [0, 0, 0, 0];
