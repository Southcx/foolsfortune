// ---------------------------------------------------------------------------------------
// THE BOWL AND THE NURSERY HEARD (Petra's world/well/bowl.js and world/well/nursery.js: the Great Slip Jelly's arena under the Great
// Dunemaw's third floor). The impact under each is the runtime's own (`sfx.shatter`, `sfx.jellyPop`, at its distance); these are the
// material and the story on top, so a ram's toll on the room is heard as the room giving way, beat by beat.
//   SPEND   (bowl.spend { what, state }) a pillar struck: 'cracked' a split running up the stone; 'fallen' heard on bowl.fall; a log
//           broken to 'rubble' a heap settling; a stalactite 'gone' a bright crystal shatter of Lachrymite tinkling down
//   FALL    (bowl.fall { what }) a pillar: a long groan off the vertical, then the ground struck, its boom rolling round the bowl; a
//           stalactite: a whistle down the 6 m and a burst on the floor
//   SHAKE   (bowl.shake) a stalactite worked loose: stone grinding on stone, a rain of pebbles, the warning before the fall
//   POOL    (bowl.pool) the Courier into a slip pool: the slip's deep swallow, a gulp and bubbles (the crack is the vessel's own)
//   BREAK   (clutch.break { roe }) a clutch broken: its eggs cracking one after another, a glint for each roe kept
//   HATCH   (clutch.hatch { called }) a brood out of its egg: the cap lifting with a wet crack and a small chirp; called by the FOE, the
//           chirp answers lower, a call back to it
//
// Prior art: Monster Hunter's arenas (a wall's crack heard before it goes), Shadow of the Colossus's falling columns (slow, then all at
// once), the cave's ring in Spelunky's falling rocks, Alien's egg (the wet crack before the face).
//
//   sfx.bowlSpend(what, state) .bowlFall(what) .bowlShake() .bowlPool() .clutchBreak(roe) .clutchHatch(called)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { spend: 2.8, fall: 0.45, shake: 3.1, pool: 2.2, break: 1.7, hatch: 2 };

export class BowlSounds {
  bowlOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 8000); return d; }

  bowlSpend(what = 'pillar', state = 'cracked') {
    if (!this.ok() || !this.allow('bowlSpend', 6)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('spend', 0.4, 0.8);
    if (what === 'pillar' && state === 'cracked') { // (a split running up the stone)
      this.noise(t, 0.05, { type: 'bandpass', f0: 900, q: 2, gain: 0.5, dest: d });
      for (let i = 0; i < 6; i++) this.noise(t + 0.04 + i * 0.05, 0.03, { type: 'bandpass', f0: 1200 + i * 350, q: 3, gain: 0.25 - i * 0.03, dest: d });
      this.tone(t, 0.6, { f0: 70, f1: 50, gain: 0.2, dest: d });
    } else if (what === 'log') { // (the log broken to a heap settling)
      for (let i = 0; i < 8; i++) this.noise(t + i * 0.07 + Math.random() * 0.04, 0.06, { type: 'lowpass', f0: 900 + Math.random() * 500, gain: 0.3 - i * 0.025, dest: d });
      this.noise(t + 0.3, 0.9, { type: 'lowpass', f0: 1500, f1: 400, gain: 0.15, attack: 0.1, dest: d }); // (dust and grit sliding)
    } else if (what === 'stal') { // (Lachrymite shattered: crystal tinkling down)
      for (let i = 0; i < 10; i++) { const at = t + i * 0.04 + Math.random() * 0.05, f = 2000 + Math.random() * 3000; this.tone(at, 0.25, { f0: f, gain: 0.03, dest: d }); this.tone(at, 0.12, { f0: f * 2.7, gain: 0.01, dest: d }); }
    }
  }
  bowlFall(what = 'pillar') {
    if (!this.ok() || !this.allow(`bowlFall.${what}`, 2)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('fall', 0.5, 0.9);
    if (what === 'pillar') {
      this.noise(t, 1.1, { type: 'bandpass', f0: 300, f1: 180, q: 3, gain: 0.3, attack: 0.5, dest: d }); this.tone(t, 1.1, { f0: 55, f1: 42, type: 'sawtooth', gain: 0.03, dest: d }); // (the groan off the vertical)
      const at = t + 1.1; this.tone(at, 1.8, { f0: 60, f1: 28, gain: 0.55, dest: d }); this.noise(at, 0.1, { type: 'lowpass', f0: 1800, gain: 0.6, dest: d }); // (the ground struck)
      this.noise(at + 0.05, 1.6, { type: 'lowpass', f0: 700, f1: 200, gain: 0.25, attack: 0.05, dest: d }); // (its boom rolling round the bowl)
      for (let i = 0; i < 6; i++) this.noise(at + 0.15 + Math.random() * 0.6, 0.04, { type: 'bandpass', f0: 1000 + Math.random() * 1000, q: 2, gain: 0.15, dest: d }); // (stones bouncing off it)
    } else {
      this.tone(t, 0.55, { f0: 1800, f1: 600, gain: 0.03, dest: d }); this.noise(t, 0.55, { type: 'bandpass', f0: 3000, f1: 1200, q: 4, gain: 0.12, attack: 0.3, dest: d }); // (whistling down)
      this.tone(t + 0.55, 0.5, { f0: 120, f1: 50, gain: 0.35, dest: d }); this.noise(t + 0.55, 0.15, { type: 'bandpass', f0: 2400, q: 1, gain: 0.4, dest: d }); // (the burst on the floor)
    }
  }
  bowlShake() {
    if (!this.ok() || !this.allow('bowlShake', 3)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('shake', 0.4, 0.9);
    this.noise(t, 0.9, { type: 'bandpass', f0: 220, f1: 300, q: 4, gain: 0.3, attack: 0.15, dest: d }); // (stone grinding on stone)
    for (let i = 0; i < 9; i++) this.noise(t + 0.1 + Math.random() * 0.8, 0.02, { type: 'bandpass', f0: 1800 + Math.random() * 2500, q: 3, gain: 0.15, dest: d }); // (pebbles raining)
  }
  bowlPool() {
    if (!this.ok() || !this.allow('bowlPool', 1)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('pool', 0.4, 0.6);
    this.tone(t, 0.35, { f0: 220, f1: 60, gain: 0.35, dest: d }); this.noise(t, 0.3, { type: 'lowpass', f0: 900, f1: 200, gain: 0.35, dest: d }); // (the swallow)
    for (let i = 0; i < 6; i++) { const at = t + 0.25 + i * 0.08 + Math.random() * 0.05, f = 300 + Math.random() * 300; this.tone(at, 0.07, { f0: f, f1: f * 2, gain: 0.08, dest: d }); } // (bubbles)
  }
  clutchBreak(roe = 0) {
    if (!this.ok() || !this.allow('clutchBreak', 3)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('break', 0.4, 0.5);
    for (let i = 0; i < 5; i++) { const at = t + i * 0.07 + Math.random() * 0.03; this.noise(at, 0.025, { type: 'bandpass', f0: 2600 + Math.random() * 1200, q: 2, gain: 0.35, dest: d }); this.noise(at + 0.01, 0.12, { type: 'lowpass', f0: 600, gain: 0.15, dest: d }); } // (eggs cracking, wet)
    const n = Math.max(0, Math.min(4, Math.round(Number(roe) || 0)));
    for (let i = 0; i < n; i++) this.tone(t + 0.45 + i * 0.09, 0.4, { f0: hz(88 + i * 3), gain: 0.04, dest: d }); // (a glint a roe kept)
  }
  clutchHatch(called = false) {
    if (!this.ok() || !this.allow('clutchHatch', 5)) return;
    const t = this.ctx.currentTime, d = this.bowlOut('hatch', 0.4, 0.4);
    this.noise(t, 0.03, { type: 'bandpass', f0: 2200, q: 2, gain: 0.3, dest: d }); this.noise(t + 0.02, 0.15, { type: 'lowpass', f0: 800, gain: 0.2, dest: d }); // (the cap's wet crack)
    const f = called ? 300 : 520; this.tone(t + 0.15, 0.18, { f0: f, f1: f * 1.4, type: 'triangle', gain: 0.08, dest: d }); this.tone(t + 0.34, 0.14, { f0: f * 1.2, f1: f * 0.9, type: 'triangle', gain: 0.06, dest: d }); // (its chirp; called, lower)
  }
}
