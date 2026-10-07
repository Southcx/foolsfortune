// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE: the sixth of the Courier's psychic tools. A smoking bell held up like a lantern (tools/crucibelle/model.js), worn at the hip.
// It RECEIVES what is played into it and TRANSFORMS it: an amplifier for a musician, and the musician is them. A battle bard: everyone
// they play for burns brighter.
//
//  - FIVE NOTES (1 to 5): the minor pentatonic of whatever music is playing, in its key, so nothing played is wrong (the grid comes from
//    music/player.js; with no music the bell keeps its own time at 96). Hold RMB and they sound an octave up. The voice is the
//    instrument fitted to the bell (the Pneuka Box): the bell itself, a clay ocarina, a kalimba, a lute (band.js plays them).
//  - ON THE BEAT: a note within a small window of the music's eighth notes builds FEVER; off the beat, or long silence, lets it fall.
//    Fever is the ember in the bell and the smoke out of it, and it makes every song stronger and cheaper (Patapon's fever). Its peak,
//    once a fever, rings out at its widest and strikes all round (Dovina's feverPeak row, progress/combat/moves.js, once earned).
//  - SONGS: a short motif played in order (tools/crucibelle/songs.js: Ocarina of Time's songs) is TAKEN by the bell and comes out as more:
//    THE SONG OF SEEING shows what is veiled (crystal rises: world/dunes/crystals.js; every Lachryma signature marked), THE SONG OF
//    SEEMING puts up a Courier of smoke that hunts are drawn to (tools/crucibelle/mirage.js; a decoy every mind sees: creatures/ai/brain.js) and veils
//    them a moment, THE RALLY makes their spirits and their kin quicker and harder (statuses haste and empower) and their Lachryma quick,
//    THE LULLABY puts what is near and against them to sleep, THE CALL stands a smoke spirit up out of the bell (spirits.js).
//  - TOLL (LMB): the bell struck: a ring of sound that staggers what is close in front (a little stun, a shove), and on the beat it
//    counts for fever too (the drum to the songs' melody). Pressed again in time, the TOLL STRING: four tolls, each a toll, the bell
//    swung wider each time (a forehand, a backhand), the last brought down overhead and rung all round them (the combo engine,
//    tools/moveset.js: Bell_Toll and Bell_TollCombo1-3 of the Courier's own suite). Each toll strikes for its row's power and status
//    (toll1-3, progress/combat/moves.js).
//  - THE BODY (the Courier's own suite, Bell_*): the bell held up before them as a lantern (Bell_Idle, its wrist turned out so the bell
//    clears the face), a gesture for every note (Bell_Note1-5, the octave Bell_NoteHigh), the fever's peak (Bell_FeverPeak), a song cast
//    out of it (Bell_SongCast). At a busker's mat the busking body is the rhythm mode's (courier/moves/rhythmhold.js); the bell stays out.
//
//   U      draw / stow          1-5  notes (RMB held: an octave up)          LMB  toll (in time: the string)   (the Codex: THE TOOLS has the songs)
//
// Prior art: Ocarina of Time (songs), Patapon (rhythm, fever, an army that the song commands), Crypt of the NecroDancer and Hi-Fi Rush
// (on the beat, leniently; Hi-Fi Rush's rule that the blow lands with the press, so a string is played like a drum part), the tabletop
// bard (inspire courage, fascinate, summon), Brütal Legend (a guitar that summons and rallies: a rockstar's army), the handbell choir's
// swing (the forehand ring, the backhand, the bell brought down), and the pentatonic scale, on which nothing is wrong.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HeldTool } from '../heldtool.js';
import { Moveset } from '../moveset.js';
import { MOVES as RULES, unlocked } from '../../progress/combat/moves.js';
import { Gestures, Crossfade, standLegs } from '../heldclips.js';
import { Track } from '../../courier/anim/animator.js';
import { T } from '../../core/config.js';
import { CrucibelleModel } from './model.js';
import { SCALE, SONGS, INSTRUMENTS, DEGREE_COLOR, match } from './songs.js';
import { Band } from '../../music/band.js';
import { REL } from '../../creatures/ai/index.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/crucibelle/crucibelle'); // (the simulation's chance: core/rng.js, the same twice)

const WINDOW = 0.085, OWN_BPM = 96, TOLL = { range: 4.2, cone: 1.1 };
// The toll string, a table for the combo engine (tools/moveset.js). Each move is a toll at `at` (clip seconds: the swing's fastest moment,
// measured), begun near it (`from`) so the bell rings with the press: a rhythm game's blow lands on the input, never a windup later.
// The chain windows are the old cooldown (0.4 s between tolls) reshaped to the string: the next toll may begin 0.3 s after this one, so
// a string keeps time with eighth notes up to about 100 bpm and quarter notes at any tempo. `toll`: its strength (k, times the old toll's),
// its cone and reach (the last, brought down overhead, rings all round them). Numbers proposed to Dovina: docs/handoffs/dovina/.
const MOVES = {
  toll: { rule: 'toll1', clip: 'Bell_Toll', from: 0.13, at: 0.25, chain: [0.43, 0.7], toll: { k: 1 }, arc: 'raise' },
  t1: { rule: 'toll2', clip: 'Bell_TollCombo1', from: 0.13, at: 0.26, chain: [0.44, 0.7], toll: { k: 1.15 }, arc: 'r2l' },
  t2: { rule: 'toll2', clip: 'Bell_TollCombo2', from: 0.13, at: 0.26, chain: [0.44, 0.7], toll: { k: 1.3 }, arc: 'l2r' },
  t3: { rule: 'toll3', clip: 'Bell_TollCombo3', from: 0.22, at: 0.45, toll: { k: 1.8, cone: Math.PI, range: 5.2 }, arc: 'over' },
};
const STRINGS = { ground: ['toll', 't1', 't2', 't3'] };
/** The bell hand's wrist turned out (about the hand's own Y, radians): the suite holds the hand before the right shoulder, and the bell,
 *  which stands up out of the fist like a lantern, would stand in front of the face; turned out, it is held beside it. */
const WRIST = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.8);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Crucibelle extends HeldTool {
  constructor(mgr) {
    super(mgr, 'crucibelle', {
      key: 'KeyU',
      // hung at the left hip by its crown ring, the mouth down (the Veritome has the right: the owner, 2026-10-06), and drawn across the
      // body by the right hand; with the Soul Brush worn first it goes to the right hip instead, mirrored (tools/belt.js hipSide)
      worn: { at: [0.24, 1.02, 0.1], along: [-0.05, -1, 0.15], out: [1, 0, 0], side: 'L' },
      draw: { twist: 10, lean: 6, via: [0.1, 1.15, 0.45] },
      idle: 'Bell_Idle', idles: ['Bell_Idle'], grip: 'torchIdle', // (the suite's own bell idle; without the suite, its old stance: courier/anim/stances.js)
    });
    this.model = new CrucibelleModel();
    this.mount();
    this.mgr.game.crucibelle = this;
    this.fever = 0; this.history = []; this.lastNote = -99; this.ownT0 = 0; this.swing = 0; this.swingV = 0; this.pressAt = -99;
    this.notes = 0; this.onBeat = 0; this.legSt = {};
    this.moves = new Moveset(this, {
      id: 'crucibelle', moves: MOVES, strings: STRINGS, cause: 'bashed', tip: 0.3, events: { swing: 'crucibelle.swing', hit: 'crucibelle.hit' },
      onAt: (c) => this.toll(c),
    });
  }
  get busy() { return this.moves.busy; }
  get instrument() { return this.game.pneuka?.fitted('instrument')[0] || 'bell'; }
  /** At a busker's mat the rhythm mode holds the body, and the bell with it (courier/moves/rhythmhold.js): its weight, 0..1. */
  get busking() { const R = this.mgr.get?.('rhythm'); return R?.posed === this ? R.w : 0; }

  onDraw() { this.ownT0 = this.now(); }
  onStow() { this.history = []; this.moves.cancel(); this.gestures?.stop(0.1); }

  // ---------------------------------------------------------------- the clock and the voice
  now() { return sfx.ok?.() ? sfx.ctx.currentTime : performance.now() / 1000; }
  /** The beat to play to: the music's (in its key), or the bell's own. */
  grid() {
    const G = sfx.ok?.() ? this.game.music?.grid?.() : null;
    return G || { t0: this.ownT0, spb: 60 / OWN_BPM, root: 63 };
  }
  /** How far from the nearest eighth note `t` is (seconds). */
  /** Is now on the song's beat (within WINDOW)? The toll's parry widens on it (courier/parries.js). */
  get onTheBeat() { return this.offBeat(this.now(), this.grid()) < WINDOW; }
  offBeat(t, G) { const e = G.spb / 2, p = ((((t - G.t0) / e) % 1) + 1) % 1; return Math.min(p, 1 - p) * e; }
  band() {
    if (this.bandObj || !sfx.ok?.()) return this.bandObj || null;
    const ctx = sfx.ctx, dry = ctx.createGain(); dry.gain.value = 0.9; dry.connect(sfx.master);
    const verb = ctx.createConvolver(); verb.buffer = sfx.impulse(2.6, 2.2);
    const vin = ctx.createGain(); vin.gain.value = 0.45; vin.connect(verb).connect(dry);
    const ein = ctx.createGain(); ein.gain.value = 0.28;
    const dl = ctx.createDelay(2), fb = ctx.createGain(); dl.delayTime.value = 0.3; fb.gain.value = 0.3; ein.connect(dl); dl.connect(dry); dl.connect(fb).connect(dl);
    this.bandObj = new Band(ctx, { dry, pump: dry, verb: vin, echo: ein, kicked: () => {} }, sfx.noiseBuf);
    return this.bandObj;
  }
  voice(midi, v = 0.6, dur = 0.55) {
    const B = this.band();
    if (!B) return;
    const t = sfx.ctx.currentTime + 0.005, I = INSTRUMENTS[this.instrument] || INSTRUMENTS.bell;
    try {
      if (I.voice === 'bell') B.bell(t, midi + 12, v * 0.7);
      else if (I.voice === 'guitar') B.guitar(t, dur * 1.4, midi - 12, v * 0.75, { vib: 0.035 });
      else if (I.voice === 'flute') B.flute(t, dur, midi + 12, v * 0.8);
      else B[I.voice]?.(t, dur, midi + 12, v * 0.8);
    } catch { /* a voice that failed is silent */ }
  }

  // ---------------------------------------------------------------- input, while it is in the hands
  use(dt, raw, inp) {
    if (this.mgr.get?.('rhythm')?.bell === this) return; // (at a busker's mat the rhythm mode has the keys and the body)
    for (let d = 1; d <= 5; d++) if (inp.wasPressed(`Digit${d}`)) this.note(d, inp.isDown('Mouse2'));
    if (inp.wasPressed('Mouse0')) this.pressAt = this.now(); // (the beat is judged at the press, though a buffered toll rings later)
    this.moves.update(dt, inp, { allow: this.P.techs.active?.id !== 'swim' });
  }
  note(d, high = false) {
    const g = this.game, G = this.grid(), t = this.now();
    const off = this.offBeat(t, G), on = off < WINDOW;
    this.voice(G.root + SCALE[d - 1] + (high ? 12 : 0), on ? 0.7 : 0.55);
    this.beatHit(on, t, G);
    this.notes++;
    this.model.lightVent(d - 1, 1);
    if (!this.moves.busy) this.gesture(high ? 'Bell_NoteHigh' : `Bell_Note${d}`, { from: 0.05, fadeOut: 0.12 }); // (a toll swinging owns the arm)
    const mouth = this.model.mouthWorld(_a).clone();
    g.glyphs?.pop('note', mouth.clone().setY(mouth.y + 0.25), { color: DEGREE_COLOR[d - 1], size: 0.28 + 0.12 * this.fever, life: 0.8 });
    this.puff(mouth, DEGREE_COLOR[d - 1], 4 + Math.round(6 * this.fever));
    // the motif: the notes in order (a long pause starts it again)
    if (t - this.lastNote > G.spb * 4) this.history = [];
    this.lastNote = t;
    this.history.push(d); if (this.history.length > 8) this.history.shift();
    const song = match(this.history);
    if (song) { this.history = []; this.sing(song); }
    g.events?.emit('crucibelle.note', { degree: d, onBeat: on });
  }
  /** The fever's peak, once a fever: the ring at its widest, Dovina's feverPeak row (its power to all within its radius, once earned). */
  peak() {
    const g = this.game, P = this.P, R = RULES.crucibelle?.feverPeak;
    if (!R || !unlocked('crucibelle', 'feverPeak', g.ledger)) return;
    for (const cr of g.creatures.near(P.pos, R.radius ?? 6)) {
      if (cr.ally) continue;
      const d = _a.set(cr.pos.x - P.pos.x, 0, cr.pos.z - P.pos.z).normalize();
      g.creatures.strike(cr, cr.pos, d, R.power, 'toll'); cr.knock?.(d.clone().multiplyScalar(4).setY(2));
    }
    this.ring(this.model.mouthWorld(_a).clone(), 0xffd76a, 40, 5.5);
  }
  /** On the beat or not: the fever rises or falls (Patapon's fever). */
  beatHit(on, t, G) {
    this.fever = THREE.MathUtils.clamp(this.fever + (on ? 0.1 : -0.18), 0, 1);
    if (on) this.onBeat++;
    if (on && this.fever >= 1 && !this.feverHot) { this.feverHot = true; this.game.events?.emit('crucibelle.fever', { by: 'courier' }); if (!this.moves.busy) this.gesture('Bell_FeverPeak', { fadeOut: 0.25 }); this.peak(); }
    if (this.fever < 0.6) this.feverHot = false;
  }

  // ---------------------------------------------------------------- the songs
  sing(id) {
    const g = this.game, P = this.P, S = SONGS[id], I = INSTRUMENTS[this.instrument] || INSTRUMENTS.bell;
    const cost = S.cost * (1 - 0.45 * this.fever);
    if (!g.lachryma.spend(cost, 'song')) { sfx.fizzle?.(); g.log?.say('warn', 'Your mind is too dry to sing it.', { key: 'song.dry', throttle: 3 }); return; }
    const power = (1 + this.fever) * (I.school && I.school === S.school ? 1.5 : 1);
    const mouth = this.model.mouthWorld(_a).clone();
    let n = 0;
    if (id === 'reveal') {
      const r = 16 * power;
      n += g.crystals?.reveal(P.pos, r, 'courier', 'song') || 0;
      // every signature in reach marked where it is (a mark on the thing: vfx/glyphs.js)
      const all = (g.signatures?.around(P.pos, r) || []).sort((a, b) => a.d - b.d).slice(0, 14);
      for (const s of all) g.glyphs?.pop('bang1', s.pos.clone().setY(s.pos.y + 1.1), { color: 0xcdb8f2, size: 0.45, life: 3 });
      n += all.length;
    } else if (id === 'mirage') {
      const secs = 7 * power;
      g.mirage?.raise(P.pos.clone(), secs, power);
      P.veiledT = Math.max(P.veiledT || 0, 2 * power);
      for (const c of g.creatures.near(P.pos, 22)) if (!c.ally && c.brain?.action?.hunt) { g.creatures.apply(c, 'forget', 1.5, 1, 'courier'); n++; }
    } else if (id === 'rally') {
      const secs = 12 * power;
      g.spirits?.rally(secs, Math.min(2, power));
      for (const c of g.creatures.near(P.pos, 20)) if (!c.ally && g.ai.eco.relation(c, P) === REL.KIN) { g.creatures.apply(c, 'haste', secs, 1, 'courier'); g.creatures.apply(c, 'empower', secs, 1, 'courier'); n++; }
      n += g.spirits?.list.length || 0;
      g.lachryma.addModifier('rally', { regenMult: 2.5, regenDelayMult: 0.3, costMult: { '*': 0.75 } });
      clearTimeout(this.rallyTimer); this.rallyTimer = setTimeout(() => g.lachryma.removeModifier('rally'), secs * 1000);
    } else if (id === 'lull') {
      for (const c of g.creatures.near(P.pos, 11 * power)) if (!c.ally && g.ai.eco.relation(c, P) !== REL.KIN) { g.creatures.apply(c, 'sleep', 7 * power, 1, 'courier'); n++; }
      for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceTo(P.pos) < 9 * power) { g.clappers.stun(c, 3 * power, g.shells.glowOutline, g.shells.xray); n++; }
    } else if (id === 'summon') {
      const at = P.pos.clone().add(this.aimFlat(_b).clone().multiplyScalar(2));
      const count = power >= 2.2 ? 2 : 1;
      for (let k = 0; k < count; k++) if (g.spirits?.summon(at.clone().add(new THREE.Vector3((k - 0.5) * 1.4 * (count - 1), 0, 0)), { life: 22 * power, power: 0.7 + 0.35 * power, from: 'crucibelle' })) n++;
    }
    // what the bell makes of it: a ring of smoke, its colour the song's last note's
    const col = DEGREE_COLOR[S.notes[S.notes.length - 1] - 1];
    this.ring(mouth, col, 26 + Math.round(30 * this.fever));
    g.glyphs?.pop('note', mouth.clone().setY(mouth.y + 0.5), { color: col, size: 0.7, life: 1.3, burst: true });
    for (let i = 0; i < 5; i++) this.model.lightVent(i, 1);
    if (!this.moves.busy) this.gesture('Bell_SongCast', { fadeOut: 0.3 }); // (the song thrown out of the bell, arms wide)
    sfx.chime?.(1);
    g.ai?.stimuli.emit('noise', P.pos, { radius: 18, strength: 0.5, by: 'courier' });
    g.events?.emit('song.play', { song: id, fever: +this.fever.toFixed(2), power: +power.toFixed(2), instrument: this.instrument, n });
  }

  // ---------------------------------------------------------------- the toll
  /** The bell rung, at the strike of a move of the toll string (`c`: the combo engine's move; none: a toll on its own). */
  toll(c = null) {
    const g = this.game, P = this.P, G = this.grid(), t = this.now(), spec = c?.def.toll || {}, R = c ? this.moves.rule(c.def) : null;
    const at = t - this.pressAt < 0.5 ? this.pressAt : t; // (judged when it was pressed: a toll buffered in the string rings at its turn)
    const on = this.offBeat(at, G) < WINDOW;
    this.swingV += 9 * (spec.k ?? 1);
    const B = this.band(); if (B) { try { B.bell(sfx.ctx.currentTime + 0.005, G.root - 12, Math.min(1, 0.9 * (spec.k ?? 1))); } catch { /* silent */ } }
    this.beatHit(on, at, G);
    const yaw = c?.yaw ?? P.bodyYaw ?? P.yaw, f = _b.set(Math.sin(yaw), 0, Math.cos(yaw)).clone();
    const k = (on ? 1.4 : 1) * (1 + this.fever) * (spec.k ?? 1), range = spec.range ?? TOLL.range, cone = spec.cone ?? TOLL.cone;
    let n = 0;
    for (const cr of g.creatures.near(P.pos, range)) {
      if (cr.ally) continue;
      const d = _a.set(cr.pos.x - P.pos.x, 0, cr.pos.z - P.pos.z); if (d.length() > 0.3 && d.normalize().angleTo(f) > cone) continue;
      g.stun?.add(cr, 0.22 * k, { by: 'courier', cause: 'toll' }); cr.knock?.(d.clone().multiplyScalar(2.5 * k).setY(1)); n++;
      if (R) { g.creatures.strike(cr, cr.pos, d, R.power, 'toll'); if (c) this.moves.struck(cr, c); } // (the row's power and status: progress/combat/moves.js crucibelle)
    }
    for (const cl of g.clappers?.list || []) {
      if (!cl.alive || cl.ally || cl.pos.distanceTo(P.pos) > range) continue;
      const d = _a.set(cl.pos.x - P.pos.x, 0, cl.pos.z - P.pos.z); if (d.normalize().angleTo(f) > cone) continue;
      g.clappers.knock(cl, d.clone().multiplyScalar(5 * k).setY(3)); n++;
    }
    this.ring(this.model.mouthWorld(_a).clone(), 0xffd76a, 18 + Math.round(10 * this.fever) + (spec.cone > 2 ? 14 : 0), 3.5 * Math.min(1.6, spec.k ?? 1));
    if (n) P.shake = Math.max(P.shake || 0, 0.06 * (spec.k ?? 1));
    g.ai?.stimuli.emit('noise', P.pos, { radius: 20, strength: 0.7, by: 'courier' });
    g.events?.emit('crucibelle.toll', { onBeat: on, n, move: c?.id ?? 'toll', by: 'courier' });
  }
  /** A gesture of the bell's own (a note, the fever's peak, a song cast): played over the stance, cut off by the next. */
  gesture(clip, o) { this.gestures?.play(clip, o); }

  // ---------------------------------------------------------------- smoke
  puff(at, color, n) {
    const fx = this.game.fx?.alpha; if (!fx?.emit) return;
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) fx.emit({ pos: at.clone(), vel: new THREE.Vector3((simRand() - 0.5) * 0.8, 0.8 + simRand() * 1.2, (simRand() - 0.5) * 0.8), life: 1 + simRand() * 0.6, size: 0.08, sizeEnd: 0.35, color: c, alpha: 0.5, drag: 1.4, gravity: -0.4 });
  }
  /** A ring of smoke going out level from the bell (a shockwave you can see the shape of). */
  ring(at, color, n, speed = 5) {
    const fx = this.game.fx?.alpha; if (!fx?.emit) return;
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; fx.emit({ pos: at.clone(), vel: new THREE.Vector3(Math.cos(a) * speed, 0.3, Math.sin(a) * speed), life: 0.9, size: 0.12, sizeEnd: 0.45, color: c, alpha: 0.55, drag: 2.2, gravity: 0 }); }
  }

  // ---------------------------------------------------------------- every frame
  always(dt, raw) {
    const g = this.game, P = this.P;
    // the fever falls in silence (two bars without a note), and slowly anyway
    const G = this.grid();
    if (this.now() - this.lastNote > G.spb * 8) this.fever = Math.max(0, this.fever - dt * 0.25);
    if ((P.veiledT ?? 0) > 0) P.veiledT -= dt;
    g.mirage?.update(dt);
    // the clapper swings (a spring), the vents fade, the ember is the fever, and the bell smokes while it is out
    this.swingV += (-this.swing * 60 - this.swingV * 4) * dt; this.swing += this.swingV * dt;
    this.model.setSwing(THREE.MathUtils.clamp(this.swing * 0.2, -0.6, 0.6));
    { const G = this.grid(); this.model.setBeat((this.now() - G.t0) / (G.spb / 2)); } // (the metronome on the bell: tools/crucibelle/model.js)
    this.model.update(raw);
    this.model.setFever(this.fever);
    if (this.drawT > 0.5 && (this.smokeT = (this.smokeT || 0) - dt) <= 0) {
      this.smokeT = 0.5 / (1 + 6 * this.fever);
      this.puff(this.model.mouthWorld(_a).clone(), this.fever > 0.6 ? 0xb49be6 : 0x8a8090, 1);
    }
  }

  // ---------------------------------------------------------------- animation
  /** The upper body's layer: the bell's idle (the suite's Bell_Idle), a gesture over it, the toll string's moves over that; every change
   *  of what plays crossfaded (tools/heldclips.js); the legs the clip's while they stand to play. At a busker's mat the rhythm mode's
   *  busking body takes over (courier/moves/rhythmhold.js), this layer stepping aside as it comes in. */
  animate(ch, base, dt) {
    const C = ch.clips, P = this.P;
    if (!this.track) {
      this.idleClip = C.clips.Bell_Idle ? 'Bell_Idle' : 'stance:crucibelle';
      this.track = new Track(C, new Set([this.idleClip]));
      this.track.play(this.idleClip, 0, 0.01);
      this.P1 = C.pose(); this.P2 = C.pose(); this.gestures = new Gestures(C); this.X = new Crossfade(C, 0.1);
    }
    this.gestures.update(dt);
    const layerW = this.w * smooth(T.weapon.drawGrab, 1, this.drawT) * (1 - this.mgr.override) * (1 - this.busking);
    if (layerW <= 0.001) { this.X.reset(); return; }
    this.track.update(dt);
    const layer = this.track.sample(this.P1);
    const sw = this.gestures.sample(this.P2);
    if (sw > 0) C.blend(layer, this.P2, sw);
    const m = this.moves.pose(C, this.P2);
    if (m) C.blend(layer, m.pose, m.w);
    if (this.gestures.fresh || this.moves.cur !== this.lastMove) { this.X.cut(this.moves.cur && this.lastMove ? 0.07 : 0.1); this.gestures.fresh = false; this.lastMove = this.moves.cur; }
    if (this.moves.cur && this.gestures.playing) this.gestures.stop(0.06); // (a toll cuts a gesture off)
    this.X.apply(layer, dt);
    if (this.idleClip === 'Bell_Idle') this.wrist(C, layer);
    C.blend(base, layer, layerW, ch.MASK_UPPER, 0);
    standLegs(ch, P, base, layer, layerW * Math.max(sw, m?.w ?? 0), this.legSt, dt);
  }
  /** The bell hand's wrist turned out (WRIST), on a pose of the suite's Bell_* clips (the busking body asks for it too). */
  wrist(C, pose) {
    const i = C.index.handR * 4, q = pose.q;
    _q.set(q[i], q[i + 1], q[i + 2], q[i + 3]).multiply(WRIST);
    q[i] = _q.x; q[i + 1] = _q.y; q[i + 2] = _q.z; q[i + 3] = _q.w;
    return pose;
  }
  fpArc() { return this.moves.fpArc() || { lift: 0.04 * this.fever }; }
  restSig() { return `${Math.round(this.fever * 10)}`; }
}
