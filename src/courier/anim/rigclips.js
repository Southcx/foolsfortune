// ---------------------------------------------------------------------------------------
// A RIG'S OWN CLIPS: one small rig (the god hand, the Pneuka Jar) played from its own authored actions on its own AnimationMixer, by
// named MOVES. A move is a clip played one of four ways: a LOOP; a ONCE that goes on to its `then` (or holds its last frame); a clip
// played IN to a held stretch that is rocked back and forth (`hold`, ping-pong, so a still stretch with a little life in it never jumps
// at a seam) until `release()`, then OUT (`out`, the rest of the clip) or on to its `then`. Moves crossfade (`fade`, real seconds). The
// rig's joint limits are applied last, after the mixer (rom.js: every posed joint passes through it). A move may mark a contact
// frame (`contact`): `hit` is true on the update the clip crosses it, for a sound or an effect on the beat of the blow.
//
// Prior art: three.js's AnimationMixer and AnimationUtils.subclip (the clips and the cut stretches), the clapperjar's crossfades
// (creatures/clappers.js play()), and the in / loop / out split of a held pose that the Courier's suite uses for its emotes (Enter,
// Loop, Exit: courier/emotes.js) and Unity's Animator gives as states with exit times.
//
//   const R = new RigClips(root, gltf.animations, MOVES, { limits })   R.play('grab')   R.release()   R.update(dt)
//   R.move (the move's name)   R.busy (a once still playing)   R.done   R.hit   R.speed = 1.6   R.start('spawn')   R.variant('hop', 'hopGarden', ['root.position'])
//   MOVES = { idle: { clip: 'idle', loop: true }, grab: { clip: 'grab', then: 'grabHold', fade: 0.1 }, point: { clip: 'point', hold: [18, 32] } }
//   (frames at the clips' 30 fps; `from` starts a move at a frame; `clamp` holds a once's last frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class RigClips {
  constructor(root, clips, moves, { limits = null, fps = 30, fade = 0.18 } = {}) {
    this.root = root; this.moves = moves; this.limits = limits; this.fps = fps; this.fadeDefault = fade;
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = new Map(clips.map((c) => [c.name, c]));
    this.cuts = new Map(); // ('point:18-32' -> its subclip)
    this.move = null; this.phase = null; this.action = null; this.spec = null; this.hit = false; this.done = false; this._speed = 1;
    this.mixer.addEventListener('finished', (e) => { if (e.action === this.action) this.done = true; });
  }

  /** A copy of a clip under a new name with some tracks dropped (a hop without its root's rise, for a body that rises itself). */
  variant(name, as, drop = []) {
    const c = this.clips.get(name); if (!c) return null;
    const v = new THREE.AnimationClip(as, c.duration, c.tracks.filter((t) => !drop.includes(t.name)).map((t) => t.clone()));
    this.clips.set(as, v);
    return v;
  }

  has(move) { return !!this.moves[move] && this.clips.has(this.moves[move].clip); }
  /** A once (or a held clip's way out) is still playing: the chooser waits for it. */
  get busy() { return !!this.spec && (this.phase === 'once' || this.phase === 'out') && !this.done; }
  get speed() { return this._speed; }
  set speed(s) { this._speed = s; if (this.action) this.action.timeScale = s; }
  /** The current clip's time in frames. */
  get frame() { return this.action ? this.action.time * this.fps : 0; }

  /** The stretch of `clip` from frame `a` to `b` as a clip of its own, each track sampled at every frame through its own interpolant. (Not
   *  AnimationUtils.subclip: that keeps only the keys inside the stretch, and the exported clips are lean, a straight line of poses
   *  being one pair of keys: a bone with none inside dropped out of the held clip and fell to its rest pose, 102 degrees on the pointing
   *  hand's ring finger. CASEBOOK, 2026-10-08.) */
  cut(clip, a, b) {
    const key = `${clip.name}:${a}-${b}`;
    let s = this.cuts.get(key);
    if (!s) {
      const n = b - a + 1, times = Array.from({ length: n }, (_, i) => i / this.fps);
      const tracks = clip.tracks.map((t) => {
        const I = t.createInterpolant(), k = t.getValueSize(), values = new Float32Array(n * k);
        for (let i = 0; i < n; i++) values.set(I.evaluate(Math.min(clip.duration, (a + i) / this.fps)), i * k);
        return new t.constructor(t.name, times, values);
      });
      s = new THREE.AnimationClip(key, (n - 1) / this.fps, tracks);
      this.cuts.set(key, s);
    }
    return s;
  }

  /** Go to a move (a no-op if already in it, unless `again`). `fade` real seconds, `speed`, `from` a frame to start at, `weight` how much
   *  of it over the rest pose (a landing as hard as it was). */
  play(move, { fade, speed = null, from = null, again = false, weight = 1 } = {}) {
    const spec = this.moves[move];
    if (!spec || !this.clips.has(spec.clip)) return false;
    if (move === this.move && !again && !(this.phase === 'out')) { if (speed != null) this.speed = speed; return true; }
    const clip = this.clips.get(spec.clip);
    const f = fade ?? spec.fade ?? this.fadeDefault;
    this.move = move; this.spec = spec; this.done = false; this.hit = false;
    this._speed = speed ?? spec.speed ?? 1; this.weight = weight;
    const start = from ?? spec.from ?? 0;
    if (spec.loop) this.go(clip, THREE.LoopRepeat, f, start, 'loop');
    else if (spec.hold && start >= spec.hold[0]) this.go(this.cut(clip, ...spec.hold), THREE.LoopPingPong, f, start - spec.hold[0], 'hold');
    else this.go(clip, THREE.LoopOnce, f, start, spec.hold ? 'in' : 'once');
    return true;
  }

  /** A held move goes on: the rest of its clip (`out`), else its `then`. Anything else is left as it is. */
  release({ fade } = {}) {
    const S = this.spec; if (!S || !(this.phase === 'in' || this.phase === 'hold')) return false;
    const clip = this.clips.get(S.clip);
    if (S.out) { this.go(clip, THREE.LoopOnce, fade ?? 0.08, S.out[0], 'out'); return true; }
    if (S.then) return this.play(S.then, { fade, again: true });
    this.go(clip, THREE.LoopOnce, fade ?? 0.08, S.hold ? S.hold[1] : 0, 'out');
    return true;
  }

  /** Straight to a move's first frame, no fade, posed now (a rig shown again: the Jar entering the garden, the hand spawning). */
  start(move, opts = {}) { this.mixer.stopAllAction(); this.action = null; this.move = null; this.play(move, { ...opts, fade: 0 }); this.update(0); }

  go(clip, loop, fade, startFrame, phase) {
    const prev = this.action, a = this.mixer.clipAction(clip);
    const same = prev === a;
    if (!same) a.reset();
    a.setLoop(loop, Infinity);
    a.clampWhenFinished = true; a.enabled = true; a.paused = false;
    a.time = Math.min(clip.duration, Math.max(0, startFrame / this.fps));
    a.timeScale = this._speed;
    a.setEffectiveWeight(this.weight ?? 1);
    a.play();
    if (prev && !same && fade > 0) prev.crossFadeTo(a, fade, false);
    else if (prev && !same) prev.stop();
    this.action = a; this.phase = phase; this.done = false;
  }

  update(dt) {
    const S = this.spec, a = this.action;
    const t0 = a ? a.time : 0;
    this.mixer.update(dt);
    this.hit = false;
    if (S && a) {
      const f0 = t0 * this.fps, f1 = a.time * this.fps;
      if (S.contact != null && f0 < S.contact && f1 >= S.contact) this.hit = true;
      if (this.phase === 'in' && f1 >= S.hold[0]) this.go(this.cut(this.clips.get(S.clip), ...S.hold), THREE.LoopPingPong, 0, f1 - S.hold[0], 'hold');
      else if ((this.phase === 'once' || this.phase === 'out') && this.done) {
        const out = this.phase === 'out', then = S.then;
        if (out) this.phase = 'once'; // (finished: the chooser may move on)
        if (then && !S.clamp) this.play(then, { again: true, fade: S.thenFade });
      }
    }
    this.limits?.apply();
  }

  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }
}
