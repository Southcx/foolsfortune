// Pose buffers and clip sampling for the Courier.
//
// A pose is one quaternion per driven bone plus the pelvis position. Clips are
// sampled into poses and poses are blended (normalised lerp, per-bone masks), then
// written onto the skeleton once. IK runs afterwards as a correction on top of the
// animated pose - it never replaces it.

export class Pose {
  constructor(nb) { this.q = new Float32Array(nb * 4); this.p = new Float32Array(3); }
  copy(o) { this.q.set(o.q); this.p.set(o.p); return this; }
}

export class Clips {
  constructor(pack) {
    this.fps = pack.fps;
    this.bones = pack.bones;
    this.nb = pack.bones.length;
    this.clips = pack.clips;
    this.index = Object.fromEntries(pack.bones.map((b, i) => [b, i]));
  }

  pose() { return new Pose(this.nb); }

  /** Sample `name` at time t (seconds) into `out`. Loops wrap, one-shots clamp. */
  sample(name, t, out, loop = true) {
    const c = this.clips[name];
    const nb = this.nb;
    let f;
    if (loop) { const d = c.dur; f = (((t % d) + d) % d) * this.fps; }
    else f = Math.min(Math.max(t, 0) * this.fps, c.n - 1);
    let i0 = Math.floor(f);
    if (i0 >= c.n - 1) i0 = c.n - 2;
    const a = Math.min(1, f - i0), i1 = i0 + 1;
    const q = c.q, o = out.q;
    const b0 = i0 * nb * 4, b1 = i1 * nb * 4;
    for (let i = 0; i < nb * 4; i += 4) {
      const x0 = q[b0 + i], y0 = q[b0 + i + 1], z0 = q[b0 + i + 2], w0 = q[b0 + i + 3];
      let x1 = q[b1 + i], y1 = q[b1 + i + 1], z1 = q[b1 + i + 2], w1 = q[b1 + i + 3];
      if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
      const x = x0 + (x1 - x0) * a, y = y0 + (y1 - y0) * a, z = z0 + (z1 - z0) * a, w = w0 + (w1 - w0) * a;
      const l = 1 / (Math.hypot(x, y, z, w) || 1);
      o[i] = x * l; o[i + 1] = y * l; o[i + 2] = z * l; o[i + 3] = w * l;
    }
    for (let k = 0; k < 3; k++) out.p[k] = c.p[i0 * 3 + k] + (c.p[i1 * 3 + k] - c.p[i0 * 3 + k]) * a;
    return out;
  }

  /** out = lerp(out, src, w * mask[bone]). mask: Float32Array per bone (optional); hipW scales the pelvis position. */
  blend(out, src, w, mask = null, hipW = 1) {
    if (w <= 0) return out;
    const o = out.q, s = src.q;
    for (let b = 0, i = 0; b < this.nb; b++, i += 4) {
      const k = mask ? w * mask[b] : w;
      if (k <= 0) continue;
      let x = s[i], y = s[i + 1], z = s[i + 2], ww = s[i + 3];
      if (o[i] * x + o[i + 1] * y + o[i + 2] * z + o[i + 3] * ww < 0) { x = -x; y = -y; z = -z; ww = -ww; }
      if (k >= 1) { o[i] = x; o[i + 1] = y; o[i + 2] = z; o[i + 3] = ww; continue; }
      const nx = o[i] + (x - o[i]) * k, ny = o[i + 1] + (y - o[i + 1]) * k, nz = o[i + 2] + (z - o[i + 2]) * k, nw = o[i + 3] + (ww - o[i + 3]) * k;
      const l = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
      o[i] = nx * l; o[i + 1] = ny * l; o[i + 2] = nz * l; o[i + 3] = nw * l;
    }
    const kp = Math.min(1, w * hipW);
    for (let k = 0; k < 3; k++) out.p[k] += (src.p[k] - out.p[k]) * kp;
    return out;
  }

  /** Per-bone weights from a {boneName: weight} table (others 0, or `rest`). */
  mask(table, rest = 0) {
    const m = new Float32Array(this.nb).fill(rest);
    for (const [k, v] of Object.entries(table)) {
      if (k.endsWith('*')) { const pre = k.slice(0, -1); this.bones.forEach((b, i) => { if (b.startsWith(pre)) m[i] = v; }); }
      else if (k in this.index) m[this.index[k]] = v;
    }
    return m;
  }
}

/**
 * A one-shot-or-loop player with a crossfade from whatever played before - enough
 * of a state machine for "jump start, then the airborne loop" style sequences.
 */
export class Track {
  constructor(clips, loops) {
    this.c = clips;
    this.loops = loops; // Set of looping clip names
    this.cur = null; this.t = 0;
    this.prev = null; this.pt = 0;
    this.fade = 1; this.fadeTime = 0.15;
    this.a = clips.pose(); this.b = clips.pose();
  }
  play(name, t0 = 0, fade = 0.15) {
    if (this.cur) { this.prev = this.cur; this.pt = this.t; this.fade = 0; this.fadeTime = Math.max(1e-3, fade); }
    else this.fade = 1;
    this.cur = name; this.t = t0;
  }
  update(dt) {
    this.t += dt; this.pt += dt;
    this.fade = Math.min(1, this.fade + dt / this.fadeTime);
  }
  get dur() { return this.c.clips[this.cur].dur; }
  sample(out) {
    const C = this.c;
    C.sample(this.cur, this.t, out, this.loops.has(this.cur));
    if (this.fade < 1 && this.prev) {
      C.sample(this.prev, this.pt, this.b, this.loops.has(this.prev));
      const f = this.fade * this.fade * (3 - 2 * this.fade);
      this.a.copy(out); out.copy(this.b);
      C.blend(out, this.a, f);
    }
    return out;
  }
}
