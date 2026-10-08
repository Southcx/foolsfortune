// ---------------------------------------------------------------------------------------
// THE ARRANGER: plays a score written as events (music/fortune.js) on the band (music/band.js), a bar at a time ahead of the audio
// clock, as the Dunes' player does (music/player.js) but for music that builds and drops: each section can sweep a low-pass over
// everything (a build opening up), pump the synths and the bass against the kick (the sidechain of every drop since the 2000s), and
// fall silent for a beat before the drop. The score is data: per bar it says what plays; the arranger says when.
//
//   score = { title, bpm, arrange: true, loopFrom, then?: score (played straight on into, at the bar line), lead?, fadeIn?, cut? (a cue that
//   must land on a moment: its first bar this soon, its fade-in this short, what it replaces cut, not faded), sections: [{ id, bars, bpm?, beats?, gain?, sweep: [hzFrom, hzTo] | null, pump: bool, bar(i) -> [event] }] }
//   event = { i: instrument, b: beat in the bar, d: beats, n: midi | [midi], v: velocity, o: options, deep?: heard through the crude (a low-pass) }
//   arranger.layer = (score, section, bar) => [event] (the mood: music/mood.js)   arranger.thin = { hit, bass, rest } (the night)   score.scale / section.scale
//   score.jump(section, bar) -> the next section's index, -1 to end, or null (a score that follows the game: music/greatjelly.js)
//   arranger.setUnder(on) (the rail's Umbral form: the music heard through the crude, and the lift of the breach)
//
// Prior art: Chris Wilson's lookahead scheduling ("A Tale of Two Clocks"), the DAW's automation lane (a filter cutoff drawn across a
// build), sidechain compression as a rhythmic device (French house, then every EDM drop), and the arrangement of a melodic bass
// track (intro, build, drop, breakdown, build, drop, outro: Crywolf's "Datura" among many), and LucasArts' iMUSE (a score that moves
// between its sections on the bar line as the game asks, Monkey Island 2's).
// ---------------------------------------------------------------------------------------
import { Band } from './band.js';

const UNDER_HZ = 650; // (the music heard from under the crude)
const BASS = new Set(['upright', 'moog', 'sub', 'growl', 'pick', 'pizz', 'eight']); // (what the night's thinning takes down with the drums)
const HITS = new Set(['kick', 'snare', 'clap', 'hat', 'shaker', 'crash', 'impact', 'taiko', 'ride', 'brush', 'hammer', 'stomp', 'huh', 'scrape', 'bongo', 'timbale', 'tabla', 'bodhran', 'bubble', 'bigkick', 'bigsnare', 'tom', 'gang', 'crackle', 'tick', 'ohat', 'snap']);

export class Arranger {
  constructor(sfx) { this.sfx = sfx; this.alive = false; this.score = null; this.volume = 0.34; this.jitter = 0.008; } // (jitter: a player's few ms early or late; 0 for a loop render)
  get ctx() { return this.sfx.ctx; }

  build() {
    const ctx = this.ctx, S = this.score;
    this.spb = 60 / S.bpm;
    this.bus = ctx.createGain(); this.bus.gain.value = 0.0001;
    this.duckG = ctx.createGain();
    this.sweep = ctx.createBiquadFilter(); this.sweep.type = 'lowpass'; this.sweep.frequency.value = 18000; this.sweep.Q.value = 0.9;
    const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -16; glue.ratio.value = 3; glue.attack.value = 0.01; glue.release.value = 0.2;
    // under the crude (the rail's Umbral form) the music is heard through the sea: a low-pass; breaching lifts the top back (setUnder)
    this.depth = ctx.createBiquadFilter(); this.depth.type = 'lowpass'; this.depth.frequency.value = this.under ? UNDER_HZ : 20000; this.depth.Q.value = 0.6;
    this.lift = ctx.createBiquadFilter(); this.lift.type = 'highshelf'; this.lift.frequency.value = 5000; this.lift.gain.value = 0;
    this.bus.connect(this.sweep).connect(this.depth).connect(this.lift).connect(glue).connect(this.duckG).connect(this.sfx.main ?? this.sfx.master); // (the music's own way out: it never ducks with the effects)
    const dry = ctx.createGain(); dry.connect(this.bus);
    const pump = ctx.createGain(); pump.connect(this.bus);
    const verb = ctx.createConvolver(); verb.buffer = this.sfx.impulse(3.2, 2.6);
    const vin = ctx.createGain(); vin.gain.value = 0.5; const vlp = ctx.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 5000;
    vin.connect(vlp).connect(verb).connect(this.bus);
    // the leads' echo: a dotted eighth, ping-ponged
    const ein = ctx.createGain(); ein.gain.value = 0.35;
    const dl = ctx.createDelay(2), dr = ctx.createDelay(2), fb = ctx.createGain(), elp = ctx.createBiquadFilter();
    dl.delayTime.value = dr.delayTime.value = this.spb * 0.75; this.echo = [dl, dr]; fb.gain.value = 0.33; elp.type = 'lowpass'; elp.frequency.value = 3000;
    const pl = ctx.createStereoPanner(), pr = ctx.createStereoPanner(); pl.pan.value = -0.55; pr.pan.value = 0.55;
    ein.connect(dl); dl.connect(pl).connect(this.bus); dl.connect(dr); dr.connect(pr).connect(this.bus); dr.connect(elp).connect(fb).connect(dl);
    this.pumpG = pump;
    this.band = new Band(ctx, { dry, pump, verb: vin, echo: ein, kicked: (t) => this.kicked(t) }, this.sfx.noiseBuf);
    // a second band heard through the crude: an event marked `deep` plays here (a foe under the surface: music/legs.js, Charybdis)
    const deepLp = ctx.createBiquadFilter(); deepLp.type = 'lowpass'; deepLp.frequency.value = 520; deepLp.Q.value = 0.7; deepLp.connect(this.bus);
    const ddry = ctx.createGain(), dpump = ctx.createGain(); ddry.connect(deepLp); dpump.connect(deepLp);
    this.deepBand = new Band(ctx, { dry: ddry, pump: dpump, verb: vin, echo: ein, kicked: () => {} }, this.sfx.noiseBuf);
  }
  /** The sidechain: the synths and the bass dip under each kick of a section that pumps. */
  kicked(t) {
    if (!this.pumpOn) return;
    const g = this.pumpG.gain; g.setValueAtTime(1, t - 0.002); g.linearRampToValueAtTime(this.score?.pumpDepth ?? 0.5, t + 0.01); g.setTargetAtTime(1, t + 0.04, this.spb * 0.22);
  }

  play(score) {
    if (!this.sfx.ok?.() || this.alive) return false;
    this.score = score; this.build();
    const ctx = this.ctx;
    this.bus.gain.setTargetAtTime(this.volume, ctx.currentTime, score.fadeIn ?? 0.8);
    this.alive = true; this.next = this.started = ctx.currentTime + (score.lead ?? 0.15); this.section = 0; this.bar = 0; this.ended = false; this.finished = null;
    this.spb = 60 / (score.sections[0].bpm || score.bpm);
    this.timer = setInterval(() => this.run(), 50);
    this.run();
    return true;
  }
  stop(fade = 2) {
    if (!this.alive) return;
    this.alive = false; clearInterval(this.timer);
    const ctx = this.ctx, bus = this.bus;
    bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
    setTimeout(() => { try { bus.disconnect(); } catch { /* gone */ } }, fade * 1000 + 800);
  }
  follow(score) {
    if (score && score === this.finished) return; // (a one-shot that has played does not start again by itself)
    if (score && (!this.alive || this.score !== score)) { if (this.alive) this.stop(score.cut ? 0.15 : 1.2); else this.play(score); }
    else if (!score && this.alive) this.stop(2);
  }
  duck(sec = 2) {
    if (!this.alive) return;
    const t = this.ctx.currentTime, g = this.duckG.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(0.35, t, 0.08); g.setTargetAtTime(1, t + sec, 0.5);
  }
  /** Under the surface or above it (music/player.js setUnder): the low-pass closes over half a bar; breaching opens it with a lift of air. */
  setUnder(on) {
    on = !!on; if (on === !!this.under) return;
    this.under = on;
    if (!this.alive || !this.depth) return;
    const t = this.ctx.currentTime, f = this.depth.frequency, half = (this.spb || 0.375) * 2;
    f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.exponentialRampToValueAtTime(on ? UNDER_HZ : 20000, t + half);
    const g = this.lift.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    if (!on) { g.linearRampToValueAtTime(5, t + half); g.setTargetAtTime(0, t + half, 0.6); } // (the breach: a lift of air, settling)
    else g.setTargetAtTime(0, t, 0.1);
  }
  setVolume(v) { this.volume = v; if (this.alive) this.bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.3); }

  run() {
    if (!this.alive) return;
    const ctx = this.ctx;
    if (this.ended && ctx.currentTime > this.endAt) { this.finished = this.score; this.stop(0.3); this.onEnd?.(this.score); return; }
    if (this.next < ctx.currentTime - 0.2) this.next = ctx.currentTime + 0.1;
    while (this.next < ctx.currentTime + 0.6) this.step();
  }
  /** Lay out one bar at `this.next` (also used to render offline, bar after bar). */
  step() {
    const S = this.score, t0 = this.next;
    if (this.ended) { this.next += 1; return; }
    const sec = S.sections[this.section];
    // (a section may have its own tempo and its own bar: a movement at 75 bpm, another in 5/4)
    const spb = this.spb = 60 / (sec.bpm || S.bpm), beats = sec.beats || S.beats || 4;
    if (this.bar === 0) {
      this.pumpOn = !!sec.pump;
      const f = this.sweep.frequency;
      f.cancelScheduledValues(t0);
      if (sec.sweep) { f.setValueAtTime(sec.sweep[0], t0); f.exponentialRampToValueAtTime(sec.sweep[1], t0 + sec.bars * beats * spb - 0.05); }
      else f.setValueAtTime(18000, t0);
      if (!sec.pump) { this.pumpG.gain.cancelScheduledValues(t0); this.pumpG.gain.setValueAtTime(1, t0); }
    }
    for (const e of sec.bar(this.bar)) this.play1(e, t0, sec.gain ?? 1);
    // the weather's colour over a cue that loops (music/mood.js), and the scale this bar is in, from when it sounds (player.scale())
    if (this.layer && !S.moodless && S.loopFrom !== null) for (const e of this.layer(S, sec, this.bar) || []) this.play1(e, t0, 1);
    this.scaleAt = { t: t0, scale: sec.scale || S.scale || null };
    this.next += spb * beats;
    // a score that follows the game (iMUSE's horizontal resequencing): asked after every bar which section plays next; a number moves
    // there on the next bar line (its own index on its last bar loops it), -1 ends the score, null carries on as written
    const to = S.jump?.(this.section, this.bar);
    if (to === -1) { this.ended = true; this.endAt = this.next + (S.tail ?? 3); }
    else if (to != null && S.sections[to] && (to !== this.section || this.bar >= sec.bars - 1)) { this.section = to; this.bar = 0; }
    else if (++this.bar >= sec.bars) {
      this.bar = 0; this.section++;
      if (this.section >= S.sections.length) {
        // (a score with no loop plays once: a fanfare, a jingle)
        if (S.then) { // (a score that hands on: the next begins on the bar line, on the same bus, nothing stopped; the echo takes its tempo)
          this.score = S.then; this.section = 0;
          for (const d of this.echo) d.delayTime.setValueAtTime(60 / S.then.bpm * 0.75, this.next);
        } else if (S.loopFrom === null) { this.ended = true; this.endAt = this.next + (S.tail ?? 3); }
        else this.section = S.loopFrom ?? 0;
      }
    }
  }
  // (`gain`: a section's own level, so a climax can stand above a verse without every note in it being rewritten)
  play1(e, t0, gain = 1) {
    const B = e.deep ? this.deepBand || this.band : this.band, t = t0 + e.b * this.spb + (e.i === 'kick' || e.i === 'snare' ? 0 : (Math.random() - 0.5) * this.jitter), d = (e.d || 1) * this.spb;
    const th = this.score?.moodless ? null : this.thin; if (th) gain *= HITS.has(e.i) ? th.hit : BASS.has(e.i) ? th.bass : th.rest; // (the night: music/player.js setNight)
    try {
      if (HITS.has(e.i)) B[e.i](t, (e.v ?? 0.6) * gain, e.o);
      else if (e.i === 'riser' || e.i === 'breath' || e.i === 'reverse' || e.i === 'whoosh') B[e.i](t, d, (e.v ?? 0.3) * gain, e.o);
      else if (e.i === 'bell') B.bell(t, e.n, (e.v ?? 0.5) * gain);
      else B[e.i](t, d, e.n, (e.v ?? 0.5) * gain, e.o || {});
    } catch (err) { console.warn('music', e.i, err); }
  }
}
