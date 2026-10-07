// A sound bank of the one mixer (audio/sfx.js): sounds made somewhere else, by someone else: a co-op sibling's body (coop/sibling.js)
// and anything else that moves and makes the Courier's own sounds. `sfx.voiceAt(where, { listener, tag })` hands back a stand-in for the
// mixer: every sound called on it plays through a gain and a pan set from where the maker is against the camera (quieter with distance,
// gone past `far`, panned to its side), and keeps its own rate limits (`tag`), so a sibling's footsteps never take the Courier's.
// Prior art: the stereo panning and distance roll-off of every third-person game with companions (Ico's Yorda, Journey's companion,
// Dark Souls' summons), cheaper than a 3-D panner a sound and enough at 480 lines.
// Every method runs on the Sfx itself (`this.ctx`, `this.master`: audio/core.js, which sends `this.route` instead of master when set).

export class PositionalSounds {
  /** A stand-in for the mixer that plays each sound from `where()` (a {x, y, z}), heard from `listener()` (a camera). */
  voiceAt(where, { listener = () => null, tag = 'other', gain = 0.8, near = 4, far = 30 } = {}) {
    const S = this;
    return new Proxy({}, { get: (_, name) => (...args) => {
      const fn = S[name];
      if (typeof fn !== 'function' || !S.ok?.()) return undefined;
      const p = where(), cam = listener();
      let k = gain, pan = 0;
      if (p && cam?.position) {
        const dx = p.x - cam.position.x, dy = p.y - cam.position.y, dz = p.z - cam.position.z, d = Math.hypot(dx, dy, dz);
        if (d > far) return undefined; // (out of earshot: nothing made at all)
        k = gain * (d <= near ? 1 : Math.pow(1 - (d - near) / (far - near), 2));
        const e = cam.matrixWorld?.elements; // (the camera's right is its first column)
        if (e && d > 0.01) pan = Math.max(-0.9, Math.min(0.9, (dx * e[0] + dy * e[1] + dz * e[2]) / d));
      }
      if (k < 0.02) return undefined;
      const g = S.ctx.createGain(), pn = S.ctx.createStereoPanner(); g.gain.value = k; pn.pan.value = pan; g.connect(pn).connect(S.master);
      const was = [S.route, S.limitTag]; S.route = g; S.limitTag = `${tag}:`;
      try { return fn.apply(S, args); } finally { [S.route, S.limitTag] = was; }
    } });
  }
}
