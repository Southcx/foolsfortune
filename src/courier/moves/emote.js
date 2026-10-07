// ---------------------------------------------------------------------------
// THE EMOTE (a tech that owns the body while it lasts): stand where you are and play the emote's clips (emotes.js) through their
// phases: in (a clip, or a chain of them) -> the loop (or the one-shot, held or not) -> out (a clip or a chain). Moving ends it:
// through its way out if it has one (sitting stands up first; halfway into a chain, the chain's way back from that step), straight
// away if not. It is asked for (`request(id)`) and begins on the next step it can: on the ground, the hands free of anything heavy,
// nothing else going on, and its clips in (the suite's social pack is fetched the first time an emote asks for it, courier/anim/suite.js:
// the emote waits for it, and walking off before it lands forgets the emote; a pack that fails is refused like a busy body).
//
// How it reads: every phase change is a crossfade (the phase it leaves is held where it was and faded out under the new one, 0.22 s),
// and so is the end (the last pose held and faded off the body's own, 0.3 s: a one-shot that does not end where it began, a dance left
// mid-step, or one emote straight into another never snaps). A floor pose (`floor`: sitting, kneeling, lying, the hover) keeps its
// own legs (no foot IK bending the folded knees) and is lifted, frame by frame, so no foot sinks under the floor (measured on this
// skeleton the first time it plays: the hover's legs swing down before its hips rise). Lying down (`bare`) puts the worn tools out of
// sight while the body is down, and under any floor pose a worn tool that would go through the floor is out of sight until it is above it.
//
// Prior art: the emote state of FFXIV (begin, loop, end clips, cancelled by moving, the end clip played on the way out), Unreal's
// Montage sections (a chain of clips with a way out from each), and the inertial/crossfade blends of every engine's animation graph.
//
//   game.techs.get('emote').request('wave') -> true | 'already' | 'busy' | 'unknown'        .stop()   (events: emote.start, emote.end)
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from './techs.js';
import { EMOTES } from '../emotes.js';

const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
const FADE = 0.22; // (s: a phase change's crossfade)
const TAIL = 0.3; // (s: the last pose faded off the body's own when it ends)
const FLOOR = -0.025; // (m: the lowest a foot or toe may go, measured as the standing feet are: rest height to the floor)
const smooth = (x) => x * x * (3 - 2 * x);
const _v = new THREE.Vector3(), _box = new THREE.Box3();

export class Emote extends Tech {
  constructor(mgr) {
    super(mgr, 'emote');
    this.want = null; this.cur = null; this.phase = null; this.step = 0; this.ct = 0; this.blendIn = 9;
    this.prev = null; this.tail = null; this.last = { name: null, t: 0, loop: false }; this.lifts = {}; this.sunk = new Set();
  }
  get enabled() { return true; }
  usable() { return true; }
  get overrides() { return this.cur || this.tail ? 1 : 0; }
  /** The weight follows the last pose's fade (not the techs' quicker one), so what the body's own layers do as it ends (the knee guard,
   *  the joint limits, the foot IK) comes back with it: switched on at once under a squat (the cossack), the knee guard turned a foot
   *  55 degrees in a frame (measured). */
  tick(dt) {
    const tl = this.tail;
    if (!tl || this.active) return;
    tl.f -= dt / TAIL; // (counted here, every frame, so a fade never outlives a frame that draws no Courier)
    if (tl.f <= 0) { this.tail = null; return; }
    this.w = Math.max(this.w, smooth(tl.f) * tl.k);
  }
  get handsBusy() { return true; } // (the gun goes away for it)
  /** A floor pose's legs are the clip's (the foot IK would fold the knees its own way), to the end of its fade: the IK switched back on
   *  under a pose still half the clip's turned the knee 10 degrees in a frame (measured); under the body's own it moves nothing. */
  get keepsLegs() { return this.cur ? !!EMOTES[this.cur].floor : !!this.tail?.floor; }
  label() { return this.cur ? this.cur.toUpperCase() : 'EMOTE'; }

  /** Ask for an emote by id; false (and a reason) if it cannot begin now. */
  request(id) {
    const P = this.P, g = this.game;
    if (!EMOTES[id]) return 'unknown';
    if (this.active && this.cur === id) return 'already';
    if (g.god?.controlling || g.techs.active && !this.active) return 'busy';
    if (!P.grounded || P.sliding || P.wallrun || g.techs.get('carry')?.item) return 'busy';
    if (!this.ready(id)) {
      const pack = g.clipPack?.social; // (fetched now if nothing has asked yet; the emote begins when it lands)
      if (!pack) return 'busy';
      pack.then((ok) => { if (this.want === id && !(ok && this.ready(id))) { this.want = null; g.log?.say('warn', 'You cannot do that right now.', { key: 'emote.busy', throttle: 1 }); } });
    }
    // (from a floor pose, up through its way out first and the new one begins when that is done: crossfaded straight from sitting to a
    //  wave, the legs unfolded through the floor in 0.2 s, 0.14 m under it, measured; any other emote straight into the next, its last
    //  pose faded under the new)
    if (this.active && EMOTES[this.cur].floor && EMOTES[this.cur].exit) { this.leaving(); this.want = id; return true; }
    if (this.active) this.mgr.stop();
    this.want = id;
    return true;
  }
  stop() { this.want = null; if (this.active) this.leaving(); }

  /** Every clip the emote names is in the pack. */
  ready(id) { const c = this.game.character?.clips?.clips; return !!c && clipsOf(EMOTES[id]).every((n) => c[n]); }
  canStart() {
    if (!this.want) return false;
    if (MOVE_KEYS.some((k) => this.game.input.isDown(k))) { this.want = null; return false; } // (walked off while it was on its way)
    return this.P.grounded && this.ready(this.want);
  }
  start() {
    const P = this.P, g = this.game, E = EMOTES[this.want];
    this.cur = this.want; this.want = null;
    P.endCore?.(); P.vel.set(0, 0, 0);
    this.yaw = P.yaw;
    for (const t of g.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
    this.prev = this.tail ? { ...this.tail, f: 1 - this.tail.f } : null; this.tail = null; this.sunk.clear(); // (an emote still fading out is faded under this one, from where its fade had got to)
    this.phase = null; this.set(E.enter ? 'enter' : E.loop ? 'loop' : 'once');
    g.events.emit('emote.start', { emote: this.cur, by: 'courier' });
  }
  /** Begin a phase (and a step of its chain); the one it leaves is held where it was and faded out under it. */
  set(phase, step = 0) {
    if (this.phase && this.phase !== 'done') { const n = this.clipOf(); this.prev = { name: n, t: this.timeIn(n), loop: this.phase === 'loop', f: 0 }; }
    this.phase = phase; this.step = step;
    this.ct = phase === 'once' ? EMOTES[this.cur].from || 0 : 0;
  }
  clipOf() {
    const E = EMOTES[this.cur], c = this.phase === 'enter' ? E.enter : this.phase === 'loop' ? E.loop : this.phase === 'exit' ? E.exit : E.once;
    return Array.isArray(c) ? c[this.step] : c;
  }
  steps(phase) { const c = EMOTES[this.cur][phase]; return Array.isArray(c) ? c.length : 1; }
  dur(name) { return this.game.character?.clips?.clips?.[name]?.dur || 1; }
  /** Where the phase ends (a once may be cut short: `to`). */
  endOf() { const n = this.clipOf(); return this.phase === 'loop' ? Infinity : this.phase === 'once' ? Math.min(EMOTES[this.cur].to ?? Infinity, this.dur(n)) : this.dur(n); }
  timeIn(name) { return this.phase === 'loop' ? this.ct % this.dur(name) : Math.min(this.ct, this.endOf() - 0.001); }
  leaving() {
    const E = EMOTES[this.cur];
    if (!E || this.phase === 'exit' || this.phase === 'done') return;
    if (!E.exit) { this.phase = 'done'; return; }
    // (halfway into a chain, out by the way back from that step: the hover's rise is undone before the sitting is; and halfway into a
    //  way in, as far into the way out as the way in had still to go, so the body goes back from where it is: begun at its start, the
    //  hover's way out from a rise left halfway sprang 0.3 m up to the top of the hover in 0.15 s before it came down, measured)
    const into = this.phase === 'enter' ? Math.min(1, this.ct / this.endOf()) : 0;
    this.set('exit', this.phase === 'enter' ? Math.max(0, this.steps('exit') - 1 - this.step) : 0);
    if (into > 0) this.ct = (1 - into) * this.dur(this.clipOf());
  }
  update(dt) {
    const P = this.P, inp = this.game.input, E = EMOTES[this.cur];
    if (!E) return false;
    P.vel.set(0, -2, 0); P.move(dt);
    this.ct += dt;
    if (!P.grounded && this.t > 0.2) return false; // (knocked off a ledge: it ends)
    if (MOVE_KEYS.some((k) => inp.isDown(k))) this.leaving();
    if (this.phase === 'done') return false;
    if (this.ct < this.endOf()) return true;
    if (this.phase === 'enter') { if (this.step + 1 < this.steps('enter')) this.set('enter', this.step + 1); else this.set(E.loop ? 'loop' : 'once'); }
    else if (this.phase === 'exit') { if (this.step + 1 < this.steps('exit')) this.set('exit', this.step + 1); else return false; }
    else if (this.phase === 'once' && !E.hold) return false;
    return true;
  }
  end() {
    this.game.events.emit('emote.end', { emote: this.cur, by: 'courier' });
    this.tail = this.last.name ? { ...this.last, f: 1, k: this.w, floor: !!EMOTES[this.cur]?.floor } : null; // (the last pose, faded off the body's own from the weight it had: tick counts it down, animate draws it)
    this.cur = null; this.phase = null; this.prev = null; this.last.name = null;
  }
  reset() { this.want = null; this.tail = null; }

  animate(ch, base, dt = 1 / 60) {
    const C = ch.clips;
    if (!this.cur || this.phase === 'done') {
      const tl = this.tail;
      if (tl) C.blend(base, this.pose(ch, tl.name, tl.t, tl.loop), smooth(tl.f) * tl.k);
      return;
    }
    if (EMOTES[this.cur].floor && this.measured !== this.cur) { for (const n of clipsOf(EMOTES[this.cur])) this.liftOf(ch, n); this.measured = this.cur; }
    const name = this.clipOf(), t = this.timeIn(name), loop = this.phase === 'loop';
    const L = this.last; L.name = name; L.t = t; L.loop = loop;
    if (EMOTES[this.cur].floor) this.offFloor();
    // (lying down: the worn tools out of sight while the body is down, from halfway down to halfway up; each tool shows itself again
    //  from its own tick, which runs before this, so nothing is left hidden: tools/belt.js hideWorn)
    if (EMOTES[this.cur].bare && (loop || (this.phase === 'enter' && t > 0.5 * this.dur(name)) || (this.phase === 'exit' && t < 0.5 * this.dur(name)))) this.game.belt?.hideWorn();
    const pv = this.prev;
    if (pv) {
      pv.f = Math.min(1, pv.f + dt / FADE);
      C.blend(base, this.pose(ch, pv.name, pv.t, pv.loop), this.w);
      C.blend(base, this.pose(ch, name, t, loop), this.w * smooth(pv.f));
      if (pv.f >= 1) this.prev = null;
      return;
    }
    C.blend(base, this.pose(ch, name, t, loop), this.w);
  }
  /** Under a floor pose, a worn tool that reaches the floor (the Soul Brush at the hip, under a crossed leg: 0.13 to 0.46 m down,
   *  measured) is put out of sight until it is back 3 cm above it, measured on its own model as the last frame hung it; its own tick
   *  shows it again (tools/belt.js hideWorn), so nothing is left hidden when the emote ends. */
  offFloor() {
    const S = this.sunk, y0 = this.P.pos.y;
    for (const tool of this.game.belt?.tools || []) {
      const m = tool.model;
      if (!m || (!m.visible && !S.has(tool.id))) continue;
      const low = _box.setFromObject(m).min.y - y0;
      if (low < 0) S.add(tool.id); else if (low > 0.03) S.delete(tool.id);
      if (S.has(tool.id)) m.visible = false;
    }
  }
  /** A clip's pose at t, lifted out of the floor where it sinks (a floor pose's clips: liftOf). */
  pose(ch, name, t, loop) {
    const C = ch.clips, out = C.sample(name, t, ch.P.tmp, loop), L = this.lifts[name];
    if (L) { const f = Math.min(Math.max(t, 0) * C.fps, L.length - 1), i = Math.min(Math.floor(f), L.length - 2), a = f - i; out.p[1] += L[i] + (L[i + 1] - L[i]) * a; }
    return out;
  }
  /** How far each frame of a clip must be raised so no foot or toe goes under the floor: measured once on this skeleton (FK of the
   *  legs only), widened by three frames each way and smoothed, so the lift eases in before the dip and out after it. Null if none. */
  liftOf(ch, name) {
    if (name in this.lifts) return this.lifts[name];
    const C = ch.clips, c = C.clips[name], B = ch.bones, root = ch.root, n = c.n, raw = new Float32Array(n);
    let any = false;
    for (let f = 0; f < n; f++) {
      ch.applyPose(C.sample(name, f / C.fps, ch.P.tmp, false));
      let low = Infinity;
      for (const [b, rest] of [[B.footL, ch.ankleRest], [B.footR, ch.ankleRest], [B.toeL, ch.toeRest], [B.toeR, ch.toeRest]]) {
        b.updateWorldMatrix(true, false);
        low = Math.min(low, root.worldToLocal(_v.setFromMatrixPosition(b.matrixWorld)).y - rest);
      }
      raw[f] = Math.max(0, FLOOR - low); any ||= raw[f] > 0.002;
    }
    if (!any) return (this.lifts[name] = null);
    const wide = raw.map((_, f) => { let m = 0; for (let k = -3; k <= 3; k++) m = Math.max(m, raw[Math.min(n - 1, Math.max(0, f + k))]); return m; });
    return (this.lifts[name] = wide.map((_, f) => { let s = 0; for (let k = -2; k <= 2; k++) s += wide[Math.min(n - 1, Math.max(0, f + k))]; return s / 5; }));
  }
  faceYaw() { return this.cur ? this.yaw : null; }
}

/** Every clip an emote names (its chains flattened). */
function clipsOf(E) { return [E.enter, E.loop, E.once, E.exit].flat().filter(Boolean); }
