// ---------------------------------------------------------------------------------------
// A STANDARD TRIAL RUN (docs/plans/APTITUDE.md 9 and 10; the trials as data Dovina's, progress/assaytrials.js TRIALS): one of the
// Touchstone's five tests played on its stone, from the start to the record handed to the Assay (`assay.trial.end { trial, record }`,
// which progress/aptitude.js scores and keeps apart from the passive readings). The Courier is held still while it runs; the stone's face
// is the only thing that changes. Each answer is timed by its own input event (a key's or a touch's `timeStamp`), never by the frame, so
// the reaction box and the tapping read the hand, not the refresh.
//
//   gonogo    a light on the stone: press on a plain one (Space, a tap), withhold on an outlined one
//   pitch     two tones in turn, the left shard then the right: which is higher (A or 1 the first, D or 2 the second; a tap's half)
//   colour    three tiles, one off: which (A W D, or 1 2 3; a tap's third)
//   rhythm    tap along with the beat (Space, a tap)
//   react     a windup ring flashes after a wait you cannot guess: press (Space, a tap); a press before it is a guess
//   F (on touch, a finger held a real second) leaves a trial; nothing is recorded.
//
// The sounds are placeholders (a sine pair, a click on the audio clock), Wanda's to make; the stone's look is a placeholder, Calissa's.
//
// Prior art: the psychophysics lab's two-alternative forced choice and its odd-one-out (three-alternative), the Go/No-Go task, Repp's
// synchronised tapping, the simple reaction box (Human Benchmark's: a wait, a change, a press), PsychoPy's practice of timing a response
// by the input event's own stamp.
//
//   const R = new TrialRun(game, id, stage)   stage { group, at (the stone's face centre), right, up, normal }   R.update(raw)   R.done
//   R.stop()   R.taker (a touch's start: core/touchdriver.js take)   events: assay.trial.start { trial, by }, assay.trial.end { trial, record, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TRIALS, staircase } from '../../progress/assaytrials.js';
import { oklabColour } from '../../vfx/wheelcolour.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';

const KEYS = { press: ['Space', 'Enter'], first: ['KeyA', 'Digit1', 'ArrowLeft'], mid: ['KeyW', 'Digit2', 'ArrowUp'], second: ['KeyD', 'Digit3', 'ArrowRight'], quit: ['KeyF'] };
const BLOCK = new Set([...KEYS.press, ...KEYS.first, ...KEYS.mid, ...KEYS.second, ...KEYS.quit]);
const COL = { plain: 0xffd76a, outline: 0xfff4e6, dark: 0x111014, ember: 0xff5a3a, shard: 0x9fd8ff };
const simRand = stream('world/touchstone/trialrun'); // (the trials' chance: core/rng.js)
const rnd = (a, b) => a + simRand() * (b - a);

/** A tone on the audio clock (placeholder: Wanda's to make): a sine of `hz` for `len` real s, starting `at` s from now. */
function tone(hz, len, at = 0, v = 0.35) {
  if (!sfx.ok?.()) return;
  const c = sfx.ctx, t = c.currentTime + at, g = c.createGain(), o = c.createOscillator();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.setValueAtTime(v, t + len - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.type = 'sine'; o.frequency.value = hz; o.connect(g); g.connect(sfx.out(0.9, 0.1, true)); o.start(t); o.stop(t + len + 0.02);
}
/** The beat's click (placeholder), scheduled on the audio clock. */
const click = (at) => tone(1320, 0.05, at, 0.4);

export class TrialRun {
  constructor(game, id, stage) {
    this.game = game; this.id = id; this.T = TRIALS[id]; this.stage = stage; this.done = false; this.t = 0;
    this.rec = {}; this.n = 0; this.phase = 'wait'; this.timer = 1.2; // (a breath before the first)
    this.keys = (e) => this.onKey(e); addEventListener('keydown', this.keys, true);
    this.held = new Map(); // (a finger held a real second stops the trial: touch has no F)
    this.taker = (touch, ts) => { this.held.set(touch.identifier, ts); this.answer(this.touchChoice(touch), ts); return true; };
    this.lift = (e) => { for (const t of e.changedTouches || []) { const at = this.held.get(t.identifier); this.held.delete(t.identifier); if (at != null && e.timeStamp - at > 1000) this.stop(); } };
    addEventListener('touchend', this.lift, true);
    this.build();
    if (this.T.kind === 'staircase') this.S = staircase(this.T);
    if (id === 'gonogo') { const n = this.T.trials, no = Math.round(n * this.T.noGo); this.order = Array.from({ length: n }, (_, i) => i < no); for (let i = n - 1; i > 0; i--) { const j = Math.floor(simRand() * (i + 1)); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; } Object.assign(this.rec, { hits: 0, misses: 0, fas: 0, crs: 0, rts: [] }); }
    if (id === 'react') this.rec.times = [];
    if (id === 'rhythm') this.rec.async = [];
    if (this.T.kind === 'staircase') this.rec.answers = [];
    game.events?.emit('assay.trial.start', { trial: id, by: 'courier' });
  }

  // ---- the stone's face ------------------------------------------------------
  build() {
    const s = this.stage, grp = this.grp = new THREE.Group();
    const mat = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, fog: false });
    const put = (geo, c, x = 0, y = 0) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, 0.02); m.visible = false; grp.add(m); return m; };
    this.disc = put(new THREE.CircleGeometry(0.34, 40), COL.plain);
    this.ring = put(new THREE.RingGeometry(0.42, 0.54, 48), COL.outline);
    this.wind = put(new THREE.RingGeometry(0.5, 0.7, 48), COL.ember);
    this.tiles = [-1.15, 0, 1.15].map((x) => put(new THREE.PlaneGeometry(0.86, 0.86), 0x808080, x, 0));
    this.shards = [-0.9, 0.9].map((x) => put(new THREE.OctahedronGeometry(0.22, 0), COL.shard, x, 0));
    grp.position.copy(s.at); grp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(s.right, s.up, s.normal));
    s.group.add(grp);
  }
  hideAll() { for (const m of [this.disc, this.ring, this.wind, ...this.tiles, ...this.shards]) m.visible = false; }

  // ---- input -----------------------------------------------------------------
  onKey(e) {
    if (!BLOCK.has(e.code) || e.repeat) return;
    e.stopPropagation(); // (the keys are the trial's while it runs: no jump, no tool form, no F at the plinth)
    if (KEYS.quit.includes(e.code)) { this.stop(); return; }
    const which = KEYS.press.includes(e.code) ? 'press' : KEYS.first.includes(e.code) ? 0 : KEYS.mid.includes(e.code) ? (this.T.choices === 3 ? 1 : 'press') : this.T.choices === 3 ? 2 : 1;
    this.answer(which, e.timeStamp);
  }
  /** A tap's answer: the half (two choices) or the third (three) of the screen it lands in; else a press. */
  touchChoice(t) {
    const k = this.T.choices; if (!k) return 'press';
    return Math.min(k - 1, Math.floor((t.clientX / innerWidth) * k));
  }
  answer(which, ts) {
    if (this.done) return;
    const T = this.T, now = performance.now();
    ts = Number.isFinite(ts) && ts > 0 && ts <= now + 5 ? ts : now;
    if (!T.choices && which !== 'press') return; // (the press trials answer to the press alone)
    if (this.id === 'gonogo') {
      if (this.phase !== 'show' || this.pressed) return;
      this.pressed = true;
      if (this.noGo) this.rec.fas++; else { this.rec.hits++; this.rec.rts.push(Math.round(ts - this.shownAt)); }
      this.hideAll(); this.phase = 'wait'; this.timer = rnd(...T.gap); this.next();
    } else if (this.id === 'react') {
      if (this.phase === 'show') { this.rec.times.push(Math.round(ts - this.shownAt)); this.hideAll(); this.phase = 'wait'; this.timer = rnd(...T.wait); this.next(); }
      else if (this.phase === 'wait' && this.n > 0) { this.rec.times.push(0); this.timer = rnd(...T.wait); } // (a press before the windup: a guess, dropped by the scoring; the wait starts over)
    } else if (this.id === 'rhythm') {
      if (this.phase !== 'beat') return;
      const P = T.bpm ? 60000 / T.bpm : 600, k = Math.round((ts - this.beat0) / P);
      if (k < 0) return;
      this.rec.async.push(Math.round(ts - (this.beat0 + k * P)));
      this.disc.scale.setScalar(1.25);
      if (this.rec.async.length >= T.taps + T.settle) this.finish();
    } else if (T.kind === 'staircase') {
      if (this.phase !== 'ask' || which === 'press') return;
      const right = which === this.odd;
      this.rec.answers.push(right); this.S.next(right);
      this.hideAll(); this.phase = 'wait'; this.timer = 0.5;
      if (this.S.done || this.rec.answers.length >= 90) this.finish(); else this.next();
    }
  }

  // ---- a trial at a time -------------------------------------------------------
  next() { this.n++; }
  present() {
    const T = this.T;
    if (this.id === 'gonogo') {
      const i = this.n - 1; if (i >= this.order.length) return this.finish();
      this.noGo = this.order[i]; this.pressed = false;
      this.disc.visible = true; this.ring.visible = this.noGo;
      this.shownAt = performance.now(); this.phase = 'show'; this.timer = T.window;
    } else if (this.id === 'react') {
      if (this.rec.times.length >= T.trials) return this.finish();
      this.wind.visible = true; this.shownAt = performance.now(); this.phase = 'show'; this.timer = 2;
    } else if (this.id === 'pitch') {
      const base = 440 * 2 ** (rnd(-4, 4) / 12), up = base * 2 ** (this.S.level / 1200);
      this.odd = simRand() < 0.5 ? 0 : 1; // (which of the two is the higher)
      const [a, b] = this.odd === 0 ? [up, base] : [base, up];
      tone(a, 0.45, 0.05); tone(b, 0.45, 0.75);
      this.shards[0].visible = true; this.lit = [[0, 0.05, 0.5], [1, 0.75, 1.2]]; this.since = 0;
      this.phase = 'ask';
    } else if (this.id === 'colour') {
      const L = rnd(0.55, 0.72), h = rnd(0, Math.PI * 2), ch = rnd(0.04, 0.1), A = Math.cos(h) * ch, B = Math.sin(h) * ch;
      const d = this.S.level / 100, u = rnd(0, Math.PI * 2), v = Math.acos(rnd(-1, 1)); // (a random direction in Oklab: deltaE OK is its length)
      const off = [Math.cos(v) * d, Math.sin(v) * Math.cos(u) * d, Math.sin(v) * Math.sin(u) * d];
      this.odd = Math.floor(simRand() * 3);
      this.tiles.forEach((m, k) => { const o = k === this.odd ? off : [0, 0, 0]; oklabColour(L + o[0], A + o[1], B + o[2], m.material.color); m.visible = true; });
      this.phase = 'ask';
    }
  }
  startBeat() {
    const T = this.T, P = 60 / T.bpm, lead = 0.6, total = T.taps + T.settle + 8;
    if (!sfx.ok?.()) sfx.unlock?.();
    for (let k = 0; k < total; k++) click(lead + k * P);
    this.beat0 = performance.now() + lead * 1000; this.beatEnd = this.beat0 + total * P * 1000;
    this.disc.visible = true; this.phase = 'beat';
  }

  update(raw) {
    if (this.done) return;
    this.t += raw;
    if (this.id === 'rhythm') {
      if (this.phase === 'wait' && (this.timer -= raw) <= 0) this.startBeat();
      if (this.phase === 'beat') {
        const P = 60000 / this.T.bpm, now = performance.now(), ph = ((now - this.beat0) / P) % 1;
        if (now >= this.beat0) this.disc.scale.setScalar(Math.max(this.disc.scale.x * 0.9, 1 + 0.18 * Math.max(0, 1 - ph * 5)));
        if (now > this.beatEnd) this.finish();
      }
      return;
    }
    if (this.id === 'pitch' && this.phase === 'ask' && this.lit) {
      this.since += raw;
      for (const [k, a, b] of this.lit) this.shards[k].visible = this.since >= a && this.since < b + 3; // (both stay lit once sounded, so the answer has a place)
    }
    if (this.phase === 'wait') { if ((this.timer -= raw) <= 0) { if (this.n === 0) this.next(); this.present(); } return; }
    if (this.phase === 'show' && (this.timer -= raw) <= 0) {
      if (this.id === 'gonogo') { if (this.noGo) this.rec.crs++; else this.rec.misses++; this.hideAll(); this.phase = 'wait'; this.timer = rnd(...this.T.gap); this.next(); }
      else if (this.id === 'react') { this.hideAll(); this.phase = 'wait'; this.timer = rnd(...this.T.wait); } // (missed: shown again later, not counted)
    }
  }

  finish() {
    if (this.done) return;
    const record = { ...this.rec }; delete record.rts;
    if (this.id === 'gonogo') record.rtMs = this.rec.rts.length ? Math.round(this.rec.rts.reduce((a, v) => a + v, 0) / this.rec.rts.length) : null;
    this.end();
    this.game.events?.emit('assay.trial.end', { trial: this.id, record, by: 'courier' });
  }
  /** Left (F, or out of the room): nothing recorded. */
  stop() { if (this.done) return; this.end(); this.game.events?.emit('assay.trial.stop', { trial: this.id, by: 'courier' }); }
  end() {
    this.done = true;
    removeEventListener('keydown', this.keys, true); removeEventListener('touchend', this.lift, true);
    this.stage.group.remove(this.grp);
    this.grp.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }
}
