import * as THREE from 'three';
import { HeldTool } from '../tools/heldtool.js';
import { CrucibelleModel } from '../crucibelle/model.js';
import { SCALE, SONGS, INSTRUMENTS, DEGREE_COLOR, match } from '../crucibelle/songs.js';
import { Band } from '../music/band.js';
import { REL } from '../ai/index.js';
import { sfx } from '../audio.js';

// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE: the sixth of the Courier's psychic tools. A smoking bell held up like a lantern (crucibelle/model.js), worn at the hip.
// It RECEIVES what is played into it and TRANSFORMS it: an amplifier for a musician, and the musician is her. A battle bard: everyone
// she plays for burns brighter.
//
//  - FIVE NOTES (1 to 5): the minor pentatonic of whatever music is playing, in its key, so nothing played is wrong (the grid comes from
//    music/player.js; with no music the bell keeps its own time at 96). Hold RMB and they sound an octave up. The voice is the
//    instrument fitted to the bell (the Pneuka Box): the bell itself, a clay ocarina, a kalimba, a lute (band.js plays them).
//  - ON THE BEAT: a note within a small window of the music's eighth notes builds FEVER; off the beat, or long silence, lets it fall.
//    Fever is the ember in the bell and the smoke out of it, and it makes every song stronger and cheaper (Patapon's fever).
//  - SONGS: a short motif played in order (crucibelle/songs.js: Ocarina of Time's songs) is TAKEN by the bell and comes out as more:
//    THE SONG OF SEEING shows what is veiled (crystal rises: lachryma/crystals.js; every Lachryma signature marked), THE SONG OF
//    SEEMING puts up a Courier of smoke that hunts are drawn to (crucibelle/mirage.js; a decoy every mind sees: ai/brain.js) and veils
//    her a moment, THE RALLY makes her spirits and her kin quicker and harder (statuses haste and empower) and her Lachryma quick,
//    THE LULLABY puts what is near and against her to sleep, THE CALL stands a smoke spirit up out of the bell (spirits.js).
//  - TOLL (LMB): the bell struck: a ring of sound that staggers what is close in front (a little stun, a shove), and on the beat it
//    counts for fever too (the drum to the songs' melody).
//
//   U      draw / stow          1-5  notes (RMB held: an octave up)          LMB  toll          (the Codex: THE TOOLS has the songs)
//
// Prior art: Ocarina of Time (songs), Patapon (rhythm, fever, an army that the song commands), Crypt of the NecroDancer and Hi-Fi Rush
// (on the beat, leniently), the tabletop bard (inspire courage, fascinate, summon), Brütal Legend (a guitar that summons and rallies:
// a rockstar's army), and the pentatonic scale, on which nothing is wrong.
// ---------------------------------------------------------------------------------------
const WINDOW = 0.085, OWN_BPM = 96, TOLL = { cool: 0.4, range: 4.2, cone: 1.1 };
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Crucibelle extends HeldTool {
  constructor(mgr) {
    super(mgr, 'crucibelle', {
      key: 'KeyU',
      // hung at the right hip by its crown ring, the mouth down
      worn: { at: [-0.24, 1.02, 0.1], along: [0.05, -1, 0.15], out: [-1, 0, 0] },
      draw: { twist: 10, lean: 6, via: [-0.4, 1.15, 0.35] },
      idle: 'stance:crucibelle', idles: ['stance:crucibelle', 'idle'], grip: 'torchIdle', // (its own stance: anim/stances.js)
    });
    this.model = new CrucibelleModel();
    this.mount();
    this.mgr.game.crucibelle = this;
    this.fever = 0; this.history = []; this.lastNote = -99; this.ownT0 = 0; this.tollT = -1; this.tollCool = 0; this.swing = 0; this.swingV = 0;
    this.notes = 0; this.onBeat = 0;
  }
  get busy() { return this.tollT >= 0; }
  get instrument() { return this.game.pneuka?.fitted('instrument')[0] || 'bell'; }

  onDraw() { this.ownT0 = this.now(); }
  onStow() { this.history = []; this.tollT = -1; }

  // ---------------------------------------------------------------- the clock and the voice
  now() { return sfx.ok?.() ? sfx.ctx.currentTime : performance.now() / 1000; }
  /** The beat to play to: the music's (in its key), or the bell's own. */
  grid() {
    const G = sfx.ok?.() ? this.game.music?.grid?.() : null;
    return G || { t0: this.ownT0, spb: 60 / OWN_BPM, root: 63 };
  }
  /** How far from the nearest eighth note `t` is (seconds). */
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
    for (let d = 1; d <= 5; d++) if (inp.wasPressed(`Digit${d}`)) this.note(d, inp.isDown('Mouse2'));
    if (inp.wasPressed('Mouse0') && this.tollCool <= 0) this.toll();
  }

  note(d, high = false) {
    const g = this.game, G = this.grid(), t = this.now();
    const off = this.offBeat(t, G), on = off < WINDOW;
    this.voice(G.root + SCALE[d - 1] + (high ? 12 : 0), on ? 0.7 : 0.55);
    this.beatHit(on, t, G);
    this.notes++;
    this.model.lightVent(d - 1, 1);
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
  /** On the beat or not: the fever rises or falls (Patapon's fever). */
  beatHit(on, t, G) {
    this.fever = THREE.MathUtils.clamp(this.fever + (on ? 0.1 : -0.18), 0, 1);
    if (on) this.onBeat++;
    if (on && this.fever >= 1 && !this.feverHot) { this.feverHot = true; this.game.events?.emit('crucibelle.fever', {}); }
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
    sfx.chime?.(1);
    g.ai?.stimuli.emit('noise', P.pos, { radius: 18, strength: 0.5, by: 'courier' });
    g.events?.emit('song.play', { song: id, fever: +this.fever.toFixed(2), power: +power.toFixed(2), instrument: this.instrument, n });
  }

  // ---------------------------------------------------------------- the toll
  toll() {
    const g = this.game, P = this.P, G = this.grid(), t = this.now();
    const on = this.offBeat(t, G) < WINDOW;
    this.tollT = 0; this.tollCool = TOLL.cool; this.swingV += 9;
    const B = this.band(); if (B) { try { B.bell(sfx.ctx.currentTime + 0.005, G.root - 12, 0.9); } catch { /* silent */ } }
    this.beatHit(on, t, G);
    P.bodyYaw = P.yaw;
    const f = this.aimFlat(_b).clone(), k = (on ? 1.4 : 1) * (1 + this.fever);
    let n = 0;
    for (const c of g.creatures.near(P.pos, TOLL.range)) {
      if (c.ally) continue;
      const d = _a.set(c.pos.x - P.pos.x, 0, c.pos.z - P.pos.z); if (d.length() > 0.3 && d.normalize().angleTo(f) > TOLL.cone) continue;
      g.stun?.add(c, 0.22 * k, { by: 'courier', cause: 'toll' }); c.knock?.(d.clone().multiplyScalar(2.5 * k).setY(1)); n++;
    }
    for (const c of g.clappers?.list || []) {
      if (!c.alive || c.ally || c.pos.distanceTo(P.pos) > TOLL.range) continue;
      const d = _a.set(c.pos.x - P.pos.x, 0, c.pos.z - P.pos.z); if (d.normalize().angleTo(f) > TOLL.cone) continue;
      g.clappers.knock(c, d.clone().multiplyScalar(5 * k).setY(3)); n++;
    }
    this.ring(this.model.mouthWorld(_a).clone(), 0xffd76a, 18 + Math.round(10 * this.fever), 3.5);
    g.ai?.stimuli.emit('noise', P.pos, { radius: 20, strength: 0.7, by: 'courier' });
    g.events?.emit('crucibelle.toll', { onBeat: on, n });
  }

  // ---------------------------------------------------------------- smoke
  puff(at, color, n) {
    const fx = this.game.fx?.alpha; if (!fx?.emit) return;
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) fx.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8), life: 1 + Math.random() * 0.6, size: 0.08, sizeEnd: 0.35, color: c, alpha: 0.5, drag: 1.4, gravity: -0.4 });
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
    this.tollCool -= dt;
    if (this.tollT >= 0) { this.tollT += dt; if (this.tollT > 0.45) this.tollT = -1; }
    // the fever falls in silence (two bars without a note), and slowly anyway
    const G = this.grid();
    if (this.now() - this.lastNote > G.spb * 8) this.fever = Math.max(0, this.fever - dt * 0.25);
    if ((P.veiledT ?? 0) > 0) P.veiledT -= dt;
    g.mirage?.update(dt);
    // the clapper swings (a spring), the vents fade, the ember is the fever, and the bell smokes while it is out
    this.swingV += (-this.swing * 60 - this.swingV * 4) * dt; this.swing += this.swingV * dt;
    this.model.setSwing(THREE.MathUtils.clamp(this.swing * 0.2, -0.6, 0.6));
    this.model.update(raw);
    this.model.setFever(this.fever);
    if (this.drawT > 0.5 && (this.smokeT = (this.smokeT || 0) - dt) <= 0) {
      this.smokeT = 0.5 / (1 + 6 * this.fever);
      this.puff(this.model.mouthWorld(_a).clone(), this.fever > 0.6 ? 0xb49be6 : 0x8a8090, 1);
    }
  }

  // ---------------------------------------------------------------- animation
  pose(C, out) {
    if (this.tollT >= 0) { C.sample('castShoot', 0.1 + this.tollT * 0.9, out, false); return { pose: out, w: Math.min(1, this.tollT / 0.05) * (1 - smooth(0.3, 0.45, this.tollT)) }; }
    return null;
  }
  fpArc() { return this.tollT >= 0 ? { arc: 'raise', u: Math.min(1, this.tollT / 0.3) } : { lift: 0.04 * this.fever }; }
  restSig() { return `${Math.round(this.fever * 10)}`; }
}
