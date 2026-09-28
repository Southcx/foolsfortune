// Decode the clip pack written by tools/bake_anims.mjs (Quaternius' Universal
// Animation Library, retargeted onto the Courier) into flat per-frame arrays.
// Quaternions are int16 (x/32767), the pelvis position int16 * posScale; a track
// stored with a single frame is constant.
//
// { fps, bones: [name], clips: { name: { dur, n, q: Float32Array(n * bones * 4), p: Float32Array(n * 3) } } }
export function decodeAnims(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const hl = new DataView(bin.buffer).getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(bin.subarray(4, 4 + hl)));
  const data = new Int16Array(bin.buffer, 4 + hl, (bin.length - 4 - hl) >> 1);
  const nb = header.bones.length;
  const clips = {};
  for (const c of header.clips) {
    const n = c.frames;
    const q = new Float32Array(n * nb * 4), p = new Float32Array(n * 3);
    for (const t of c.tracks) {
      const w = t.k === 'q' ? 4 : 3;
      const k = t.k === 'q' ? 1 / 32767 : header.posScale;
      for (let f = 0; f < n; f++) {
        const src = t.o + Math.min(f, t.n - 1) * w;
        if (t.k === 'q') {
          const o = (f * nb + t.b) * 4;
          let x = data[src] * k, y = data[src + 1] * k, z = data[src + 2] * k, ww = data[src + 3] * k;
          const l = Math.hypot(x, y, z, ww) || 1;
          q[o] = x / l; q[o + 1] = y / l; q[o + 2] = z / l; q[o + 3] = ww / l;
        } else {
          p[f * 3] = data[src] * k; p[f * 3 + 1] = data[src + 1] * k; p[f * 3 + 2] = data[src + 2] * k;
        }
      }
    }
    clips[c.name] = { name: c.name, dur: c.dur, n, q, p };
  }
  return { fps: header.fps, bones: header.bones, clips };
}
