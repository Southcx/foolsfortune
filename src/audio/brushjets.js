// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S LOAD, THE JETS AND THE TOOLS' PARRIES HEARD (Petra's placeholders of 2026-10-06 and 07, made real): the brush is a
// pump and a bottle (FLUDD's), the jets are that bottle let out under pressure, and each tool answers a parry in its own material.
//   THE BRISTLES FULL  brushReady (tools/soulbrush/load.js): a wet draw into the bristles and a soft glint, the load ready
//   THE SPRAY          while the hold paints: a nozzle's hiss fluttering with the pump's stroke
//   THE MOP            while the hold mops: a slow slosh, gurgling louder while it drinks (`load.mopAt`)
//   THE BOTTLE CRACKED glassCrack (bottle.crack): a sharp glass tick, the crack running in high ticks, the spill's trickle
//   THE JETS           jetStart (the hover, the skim): a valve's pop into a held hiss (the skim's with spray under it); jetCharge (the
//                      rocket gathering): the pressure's whine climbing while Space is held; jetLaunch: the blast, a thump and crackle
//   THE PARRIES        layered over the parry's clang (sfx.parry, courier/parry.js) on move.parry by tool and how: the psygun's point-blank
//                      bang (stagger), the brush's wooden thock (return) or a slurp into glass (soak), the Veritome's shutter, the
//                      Dreamvane's ting (turn), the Crucibelle's bell and the shot breaking (shatter), the Lockheart's lid slammed (gulp:
//                      its gulp itself is sfx.gulp, parry.js drink); the Dreamvane's held spin (dreamvane.twirl) a vane's whirr
//
// Prior art: Super Mario Sunshine's FLUDD (the nozzle's hiss, the hover's sputter, the rocket's charge and boom), Splatoon's ink tank
// gurgle, Sekiro's deflect under every answer (the clang stays the shape; the tool is its colour), Fatal Frame's shutter.
//
//   sfx.brushReady() .glassCrack() .jetStart() .jetCharge() .jetLaunch() .parryAnswer(tool, how, what) .vaneSpin(on)
//   sfx.brushNow (set by cues.js hearEvents: the load's and the jets' state, read by the loop)
// ---------------------------------------------------------------------------------------

/** How often the loop reads the brush and the jets (real ms), and how many quiet reads end it. */
const TICK = 60, QUIET = 3;
/** Each sound's level (a gain on it), set by ear against the parry's clang and a quest's fanfare: a parry's layer sits 8 to 12 dB under
 *  the clang it rides, the brush's and the jets' moments are gestures (the launch the one big one). */
const LEVEL = { brushReady: 2.8, jetStart: 3.2, jetCharge: 8, jetLaunch: 0.7, 'psygun.stagger': 1.2, 'soulbrush.return': 2, 'soulbrush.soak': 2.4, 'veritome.shutter': 1.1, 'veritome.turn': 1.1, 'dreamvane.turn': 6, 'crucibelle.shatter': 1.6, 'lockheart.gulp': 1.6 };

export class BrushJetSounds {
  /** out() scaled by a LEVEL row, through its own gain node. */
  levelled(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 4000); return d; }
  brushReady() {
    if (!this.ok() || !this.allow('brushReady', 3)) return;
    const t = this.ctx.currentTime, d = this.levelled('brushReady', 0.35, 0.3);
    this.noise(t, 0.22, { type: 'lowpass', f0: 500, f1: 1400, gain: 0.35, attack: 0.08, dest: d }); // (drawn into the bristles)
    this.tone(t + 0.16, 0.35, { f0: 1760, f1: 1800, gain: 0.04, dest: d }); this.tone(t + 0.16, 0.25, { f0: 2640, gain: 0.015, dest: d }); // (ready)
    this.loadLoop();
  }
  glassCrack() {
    if (!this.ok() || !this.allow('glassCrack', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.4);
    this.noise(t, 0.02, { type: 'highpass', f0: 5000, gain: 0.6, dest: d }); this.tone(t, 0.12, { f0: 3900, f1: 3500, gain: 0.05, dest: d }); // (the tick)
    for (let i = 0; i < 7; i++) this.tone(t + 0.03 + i * (0.02 + Math.random() * 0.03), 0.04, { f0: 4200 + Math.random() * 2400, gain: 0.025, dest: d }); // (the crack running)
    this.noise(t + 0.15, 0.9, { type: 'bandpass', f0: 1100, f1: 700, q: 2, gain: 0.12, attack: 0.1, dest: d }); // (the spill)
  }
  jetStart() {
    if (!this.ok() || !this.allow('jetStart', 3)) return;
    const t = this.ctx.currentTime, d = this.levelled('jetStart', 0.4, 0.3);
    this.tone(t, 0.06, { f0: 260, f1: 120, type: 'triangle', gain: 0.2, dest: d }); this.noise(t, 0.05, { type: 'bandpass', f0: 2000, q: 1, gain: 0.4, dest: d }); // (the valve's pop)
    this.loadLoop();
  }
  jetCharge() {
    if (!this.ok() || !this.allow('jetCharge', 3)) return;
    const t = this.ctx.currentTime, d = this.levelled('jetCharge', 0.3, 0.2);
    this.noise(t, 0.12, { type: 'lowpass', f0: 400, gain: 0.3, dest: d }); // (the bottle braced)
    this.loadLoop();
  }
  jetLaunch() {
    if (!this.ok() || !this.allow('jetLaunch', 2)) return;
    const t = this.ctx.currentTime, d = this.levelled('jetLaunch', 0.6, 0.5);
    this.tone(t, 0.45, { f0: 110, f1: 38, gain: 0.5, dest: d }); // (the thump)
    this.noise(t, 0.9, { type: 'bandpass', f0: 2600, f1: 600, q: 0.7, gain: 0.5, dest: d }); // (the blast)
    for (let i = 0; i < 10; i++) this.noise(t + 0.05 + Math.random() * 0.5, 0.012, { type: 'highpass', f0: 4500, gain: 0.25, dest: d }); // (the spray crackling)
  }

  /** One loop for the spray, the mop and the jets: built on the first need, its voices set from `brushNow()` each read. */
  loadLoop() {
    if (this._load || !this.ok() || !this.brushNow) return;
    const c = this.ctx, bus = c.createGain(); bus.gain.value = 1; bus.connect(this.out(0.4, 0.3));
    const bed = (type, f, q) => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(bus); s.start(); return { s, fl, g }; };
    const spray = bed('bandpass', 3200, 1.2), slosh = bed('lowpass', 600, 0.8), jet = bed('bandpass', 1800, 0.9), wash = bed('lowpass', 900, 0.6);
    const pump = c.createOscillator(), pumpG = c.createGain(); pump.frequency.value = 13; pumpG.gain.value = 0; pump.connect(pumpG).connect(spray.g.gain); pump.start(); // (the pump's flutter)
    const whine = c.createOscillator(), whineG = c.createGain(); whine.type = 'sawtooth'; whine.frequency.value = 120; whineG.gain.value = 0;
    const wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 900; whine.connect(wf).connect(whineG).connect(bus); whine.start();
    const L = this._load = { bus, beds: [spray, slosh, jet, wash], oscs: [pump, whine], quiet: 0, gather: 0, gurgle: 0 };
    L.timer = setInterval(() => {
      const st = this.ok() ? this.brushNow() : null, t = c.currentTime, set = (p, v, tc = 0.05) => p.setTargetAtTime(v, t, tc);
      const on = st && (st.spray || st.mop || st.jet);
      if (!on) { if (++L.quiet >= QUIET) this.loadLoopEnd(); [spray, slosh, jet, wash].forEach((b) => set(b.g.gain, 0)); set(pumpG.gain, 0); set(whineG.gain, 0); return; }
      L.quiet = 0;
      set(spray.g.gain, st.spray ? 0.07 : 0); set(pumpG.gain, st.spray ? 0.03 : 0);
      set(slosh.g.gain, st.mop ? (st.drinking ? 0.16 : 0.06) : 0, 0.15); set(slosh.fl.frequency, 450 + 250 * Math.sin(t * 3.1));
      if (st.mop && st.drinking && t > L.gurgle) { L.gurgle = t + 0.08 + Math.random() * 0.15; this.tone(t, 0.06, { f0: 300 + Math.random() * 500, f1: 700, gain: 0.03, dest: bus }); } // (drunk into the bottle)
      set(jet.g.gain, st.jet === 'hover' || st.jet === 'skim' ? 0.14 * (0.85 + 0.15 * Math.random()) : 0, 0.03); // (the hover's sputter)
      set(wash.g.gain, st.jet === 'skim' ? 0.12 : 0, 0.1);
      L.gather = st.jet === 'gather' ? Math.min(1, L.gather + TICK / 1000) : 0;
      set(whine.frequency, 120 + 520 * L.gather); set(wf.frequency, 600 + 2400 * L.gather); set(whineG.gain, st.jet === 'gather' ? 0.012 + 0.03 * L.gather : 0, 0.03);
    }, TICK);
  }
  loadLoopEnd() {
    const L = this._load; if (!L) return; this._load = null; clearInterval(L.timer);
    L.bus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    setTimeout(() => { for (const b of L.beds) { try { b.s.stop(); } catch { /* gone */ } } for (const o of L.oscs) { try { o.stop(); } catch { /* gone */ } } L.bus.disconnect(); }, 400);
  }

  /** A parry answered (move.parry): the tool's own material over the clang. */
  parryAnswer(tool, how, what) {
    if (!this.ok() || !this.allow('parryAnswer', 6)) return;
    const t = this.ctx.currentTime, d = this.levelled(`${tool}.${how}`, 0.45, 0.4);
    switch (`${tool}.${how}`) {
      case 'psygun.stagger': this.noise(t, 0.06, { type: 'bandpass', f0: 1800, q: 0.8, gain: 0.5, dest: d }); this.tone(t, 0.2, { f0: 160, f1: 50, gain: 0.35, dest: d }); break; // (point-blank)
      case 'soulbrush.return': this.tone(t, 0.09, { f0: 420, f1: 300, type: 'triangle', gain: 0.3, dest: d }); this.noise(t, 0.03, { type: 'bandpass', f0: 900, q: 2, gain: 0.4, dest: d }); break; // (the bat's thock)
      case 'soulbrush.soak': for (let i = 0; i < 4; i++) this.tone(t + i * 0.06, 0.07, { f0: 380 + i * 140, f1: 620 + i * 160, gain: 0.05, dest: d }); break; // (a slurp into glass)
      case 'veritome.shutter': case 'veritome.turn': this.noise(t, 0.012, { type: 'highpass', f0: 3000, gain: 0.5, dest: d }); this.noise(t + 0.05, 0.015, { type: 'bandpass', f0: 2200, q: 3, gain: 0.45, dest: d }); this.tone(t + 0.02, 0.4, { f0: 3000, f1: 6500, gain: 0.012, dest: d }); break; // (click-clack, the flash's whine)
      case 'dreamvane.turn': this.tone(t, 0.6, { f0: 2093, gain: 0.04, dest: d }); this.tone(t, 0.4, { f0: 3140, gain: 0.015, dest: d }); break; // (the vane's ting)
      case 'crucibelle.shatter': this.godBell?.(t, 1.6, 784, 0.07, d); for (let i = 0; i < 6; i++) this.tone(t + 0.03 + Math.random() * 0.15, 0.05, { f0: 3500 + Math.random() * 3000, gain: 0.02, dest: d }); break; // (the bell, the shot broken)
      case 'lockheart.gulp': this.tone(t, 0.12, { f0: 140, f1: 80, type: 'triangle', gain: 0.35, dest: d }); this.noise(t, 0.04, { type: 'bandpass', f0: 1200, q: 3, gain: 0.35, dest: d }); break; // (the lid slammed)
      default: break;
    }
  }
  /** The Dreamvane's spin held (dreamvane.twirl): a vane's whirr until it stops. */
  vaneSpin(on) {
    if (!on) { const V = this._vane; if (!V) return; this._vane = null; V.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05); setTimeout(() => { try { V.o.stop(); V.n.stop(); V.lfo.stop(); } catch { /* gone */ } V.g.disconnect(); }, 400); return; }
    if (this._vane || !this.ok()) return;
    const c = this.ctx, t = c.currentTime, g = c.createGain(), o = c.createOscillator(), am = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'triangle'; o.frequency.value = 330; lfo.frequency.value = 18; lg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lg).connect(am.gain); lfo.start();
    const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true; const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1500; nf.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
    o.connect(am); n.connect(nf).connect(am); am.connect(g).connect(this.out(0.4, 0.3)); o.start(); n.start();
    this._vane = { o, n, g, lfo };
  }
}
