// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS HEARD (Calissa's world/strawmanwell/targets.js; her handoff of 2026-11-02): Pip's ramshackle
// contraptions, each heard as what it is made of, on one event, `well.target { kind, beat, id, at, by }`, its beat what the body just did,
// heard by its distance from the camera (`at`; gone past 22 m: case 407).
//   THE TARGET HOPPER  hop: a bedspring's boing, rising a little each hop; crouch: the spring wound down, a creak falling; leap: a big
//                      deep boing; land: a straw thump
//   THE QUINTAIN       wind: the arm's wooden creak; swing: a whoosh and the sandbag's thud; home: the spool wheels' rolling clatter
//   THE GALLERY DUCK   fly: a tin rotor's whirr, held until the next beat (or 4 real s), re-levelled by distance each leg and let
//                      go at a change of stage (`wellTargetsHush`, on well.stage.enter); tip: the tin clank of a gallery duck going over;
//                      dive: a falling whistle
//   ANY                struck: a knock of straw on tin and wood (its KO is the dummies' roar, well.dummy.ko)
//
// Prior art: a fairground shooting gallery (the ducks' clank as they tip, the rotor's chain), a bedspring's boing (every cartoon),
// the quintain's creak and swing, Super Smash Bros.' Sandbag.
//
//   sfx.wellTarget(kind, beat, id, at, camera)   sfx.wellTargetsHush()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** The duck's whirr: let go on its own after this many real s if no other beat comes. */
const FLY_MAX = 4;
/** How far a target is heard (m, from the camera): whole inside `near`, gone past `far` (the duck's whirr held at full level the whole
 *  stage, wherever the duck flew, was South's buzz on entering a door: case 407). */
const EAR = { near: 5, far: 22 };
const reach = (at, cam) => { const c = cam?.position; if (!at || !c) return 1; const d = Math.hypot(at.x - c.x, at.y - c.y, at.z - c.z); return d <= EAR.near ? 1 : d >= EAR.far ? 0 : (1 - (d - EAR.near) / (EAR.far - EAR.near)) ** 2; };
/** Each beat's level (a gain on its sounds), set by ear against the house's stings: gestures sit 4 to 13 dB under a quest's fanfare. */
const LEVEL = { 'hopper.hop': 3.5, 'hopper.leap': 2.2, 'hopper.land': 2.2, 'hopper.crouch': 16, 'quintain.wind': 12, 'quintain.swing': 0.45, 'quintain.home': 6, 'duck.tip': 8, 'duck.dive': 7, struck: 3 };

export class WellTargetSounds {
  wellTarget(kind, beat, id = kind, at = null, cam = null) {
    if (kind === 'duck' && beat !== 'fly') this.duckWhirrEnd(id);
    const k = reach(at, cam);
    if (kind === 'duck' && beat === 'fly' && k < 0.02) { this.duckWhirrEnd(id); return; } // (out of earshot: the rotor let go)
    if (k < 0.02 || !this.ok() || !this.allow(`wellTarget.${kind}.${beat}`, 8)) return;
    const t = this.ctx.currentTime, d = this.ctx.createGain(); d.gain.value = (LEVEL[`${kind}.${beat}`] ?? LEVEL[beat] ?? 1) * k; d.connect(this.out(0.35, 0.35)); setTimeout(() => d.disconnect(), 3000);
    const boing = (f0, f1, len, g) => { this.tone(t, len, { f0, f1, type: 'triangle', gain: g, dest: d }); this.tone(t, len * 0.6, { f0: f0 * 2.01, f1: f1 * 2.01, gain: g * 0.3, dest: d }); };
    const thump = (at, g) => { this.tone(at, 0.12, { f0: 130, f1: 70, type: 'triangle', gain: g, dest: d }); this.noise(at, 0.08, { type: 'lowpass', f0: 1200, gain: g * 0.9, dest: d }); };
    switch (`${kind}.${beat}`) {
      case 'hopper.hop': { const k = (this._hops = ((this._hops ?? 0) + 1) % 4); boing(260 + k * 25, 520 + k * 40, 0.3, 0.12); break; } // (the bedspring)
      case 'hopper.crouch': this.tone(t, 0.35, { f0: 300, f1: 140, type: 'sawtooth', gain: 0.015, dest: d }); break; // (wound down)
      case 'hopper.leap': boing(140, 420, 0.5, 0.16); break; // (the big boing)
      case 'hopper.land': thump(t, 0.3); break; // (straw on the boards)
      case 'quintain.wind': this.tone(t, 0.4, { f0: 180, f1: 140, type: 'sawtooth', gain: 0.02, dest: d }); this.noise(t, 0.35, { type: 'bandpass', f0: 900, q: 6, gain: 0.08, dest: d }); break; // (the arm's creak)
      case 'quintain.swing': this.noise(t, 0.3, { type: 'bandpass', f0: 500, f1: 1600, q: 1, gain: 0.25, attack: 0.15, dest: d }); thump(t + 0.3, 0.4); break; // (the whoosh, the sandbag)
      case 'quintain.home': for (let i = 0; i < 6; i++) this.noise(t + i * 0.07, 0.03, { type: 'bandpass', f0: 700 + (i % 2) * 200, q: 4, gain: 0.15, dest: d }); break; // (the spool wheels)
      case 'duck.fly': this.duckWhirr(id, k); break;
      case 'duck.tip': [0, 0.05].forEach((dt) => this.tone(t + dt, 0.18, { f0: 880 - dt * 2000, type: 'square', gain: 0.02, dest: d })); this.noise(t, 0.05, { type: 'bandpass', f0: 3000, q: 8, gain: 0.25, dest: d }); break; // (the tin clank)
      case 'duck.dive': this.tone(t, 0.55, { f0: hz(96), f1: hz(79), gain: 0.04, dest: d }); break; // (the falling whistle)
      default: if (beat === 'struck') { this.noise(t, 0.04, { type: 'bandpass', f0: kind === 'duck' ? 2600 : 1200, q: 3, gain: 0.45, dest: d }); this.tone(t, 0.1, { f0: kind === 'duck' ? 700 : 180, f1: kind === 'duck' ? 500 : 110, type: 'triangle', gain: 0.15, dest: d }); } // (straw on tin and wood)
    }
  }
  duckWhirr(id, k = 1) {
    const c = this.ctx; (this._whirr ||= new Map());
    if (this._whirr.has(id)) { const W = this._whirr.get(id); clearTimeout(W.timer); W.timer = setTimeout(() => this.duckWhirrEnd(id), FLY_MAX * 1000); W.g.gain.setTargetAtTime(0.1 * k, c.currentTime, 0.3); return; } // (re-levelled each leg: nearer or further)
    const t = c.currentTime, d = this.out(0.35, 0.2), o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 110; lfo.frequency.value = 28; lg.gain.value = 0.5; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.1 * k), t + 0.2);
    const am = c.createGain(); am.gain.value = 0.5; lfo.connect(lg).connect(am.gain); // (the rotor's flutter)
    o.connect(f).connect(am).connect(g).connect(d); o.start(t); lfo.start(t);
    this._whirr.set(id, { o, lfo, g, timer: setTimeout(() => this.duckWhirrEnd(id), FLY_MAX * 1000) });
  }
  duckWhirrEnd(id) {
    const W = this._whirr?.get(id); if (!W) return; this._whirr.delete(id); clearTimeout(W.timer);
    W.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.06);
    setTimeout(() => { try { W.o.stop(); W.lfo.stop(); } catch { /* gone */ } W.g.disconnect(); }, 500);
  }
  /** Every duck's whirr let go: a stage changed (`well.stage.enter`), so the ducks that were flying stand still. */
  wellTargetsHush() { for (const id of [...(this._whirr?.keys() || [])]) this.duckWhirrEnd(id); }
}
