// A sound bank of the one mixer (audio/sfx.js): the sea chart at the pier (docs/plans/PASSAGE.md), where a passage is drafted.
//   READING   the reading of the sea (the Dreamvane's dowse held over the chart, PASSAGE.md section 5): two glass tones, the true one and the
//             needle's. Off true, the needle's tone sits away from it and wavers, and the two beat against each other fast; as the needle
//             comes true the beating slows to stillness (the crystals' lesson: tuning by ear is hearing the beats stop), and holding it
//             true brings up its fifth and its octave, a chord gathering over the four beats. Ended, a held reading rings the Answer's
//             last notes; a poor one sighs down.
//   THE TABLE the chart's ambience while it is open: the crude lapping under the pier, a rope's creak, a bell buoy far out, and the
//             chart's stars (the passage's waypoints drawn as a constellation: Calissa's) twinkling in E major's pentatonic.
// Prior art: tuning by beats (a piano tuner's, the crystals of the Dunes: audio/crystal.js), Sunless Sea's chart room (the sea heard from
// the desk), a harbour's bell buoy.
//   sfx.reading(off, held) every frame while the dowse is held: off -1..1 (the needle from true over its swing), held 0..1 (of the four
//   beats); it fades out by itself 0.3 real seconds after the last call   sfx.readingEnd(q) (0..1, the reading's quality)
//   sfx.seaChart(on) (the table's ambience: on while the chart is open)
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TRUE = 76; // (E5: the true bearing's note)
const STARS = [76, 78, 80, 83, 85, 88, 90, 92]; // (E major's pentatonic, high: the chart's stars)

export class SeaChartSounds {
  reading(off = 0, held = 0) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    let R = this._reading;
    if (!R) {
      const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.out(0.28, 0.35, true));
      const mk = (m, type, v) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = hz(m); og.gain.value = v; o.connect(og).connect(g); o.start(); return { o, og }; };
      R = this._reading = { g, ref: mk(TRUE, 'sine', 0.5), needle: mk(TRUE, 'triangle', 0.4), fifth: mk(TRUE + 7, 'sine', 0), octave: mk(TRUE + 12, 'sine', 0) };
      g.gain.setTargetAtTime(1, t, 0.15);
    }
    const o = Math.max(-1, Math.min(1, off)), h = Math.max(0, Math.min(1, held));
    // the needle's note: up to a whole tone off true, wavering as much as it is off (a needle that swings)
    const cents = o * 200, wob = Math.abs(o) * 25 * Math.sin(t * 7);
    R.needle.o.frequency.setTargetAtTime(hz(TRUE) * Math.pow(2, (cents + wob) / 1200), t, 0.05);
    R.fifth.og.gain.setTargetAtTime(0.18 * h, t, 0.2); R.octave.og.gain.setTargetAtTime(0.12 * h * h, t, 0.2); // (the chord gathering as it holds)
    clearTimeout(R.quiet); R.quiet = setTimeout(() => this.readingStop(), 300);
  }
  readingStop() {
    const R = this._reading; if (!R) return;
    this._reading = null; clearTimeout(R.quiet);
    const t = this.ctx.currentTime; R.g.gain.cancelScheduledValues(t); R.g.gain.setTargetAtTime(0.0001, t, 0.12);
    setTimeout(() => { for (const k of ['ref', 'needle', 'fifth', 'octave']) try { R[k].o.stop(); } catch { /* gone */ } R.g.disconnect(); }, 800);
  }
  readingEnd(q = 0) {
    this.readingStop();
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6, true);
    if (q >= 0.6) [71, 74, 76, 83].slice(0, q >= 0.9 ? 4 : 3).forEach((m, k) => this.tone(t + 0.05 + k * 0.12, 1.4, { f0: hz(m), type: 'sine', gain: 0.2, dest: d })); // (the Answer's last notes: B D E, and the high B for a true one)
    else this.tone(t, 0.6, { f0: hz(TRUE), f1: hz(TRUE - 3), type: 'sine', gain: 0.18, dest: d }); // (a sigh down a third)
  }

  seaChart(on = true) {
    if (!this.ok()) return;
    const c = this.ctx;
    if (!on) { const A = this._chart; if (!A) return; this._chart = null; clearInterval(A.timer); A.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.4); setTimeout(() => { try { A.src.stop(); A.lfo.stop(); } catch { /* gone */ } A.g.disconnect(); }, 2000); return; }
    if (this._chart) return;
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.out(0.5, 0.25, true)); g.gain.setTargetAtTime(1, c.currentTime, 0.8);
    // the crude lapping under the planks: low noise, swelling slowly
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const lap = c.createGain(); lap.gain.value = 0.12;
    const lfo = c.createOscillator(), depth = c.createGain(); lfo.frequency.value = 0.18; depth.gain.value = 0.08; lfo.connect(depth).connect(lap.gain); lfo.start();
    src.connect(lp).connect(lap).connect(g); src.start();
    const A = this._chart = { g, src, lfo };
    let next = { creak: 2, bell: 4, star: 0.5 };
    A.timer = setInterval(() => {
      if (!this._chart) return;
      const t = c.currentTime;
      if ((next.creak -= 0.25) <= 0) { next.creak = 4 + Math.random() * 6; this.tone(t, 0.5, { f0: 180 + Math.random() * 60, f1: 140, type: 'sawtooth', gain: 0.025, dest: g }); }
      if ((next.bell -= 0.25) <= 0) { next.bell = 6 + Math.random() * 5; for (const [r, a] of [[1, 0.06], [2.76, 0.02]]) this.tone(t, 3, { f0: hz(64) * r, type: 'sine', gain: a, dest: g }); } // (the bell buoy, far: E)
      if ((next.star -= 0.25) <= 0) { next.star = 0.6 + Math.random() * 1.6; const m = STARS[Math.floor(Math.random() * STARS.length)]; this.tone(t, 0.9, { f0: hz(m), type: 'sine', gain: 0.03, dest: g }); }
    }, 250);
  }
}
