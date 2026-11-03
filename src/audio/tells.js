// ---------------------------------------------------------------------------------------
// TWO SMALL TELLS HEARD (GAPS G167 and G240; Petra's events). Each a second avenue for a number or a state the eye already has.
//   THE POOL LOW   (pool.low { share }, once below a quarter on a spend, re-armed above 35%) the Lachrimeter's glass ringing hollow:
//                  two falling notes like a bottle nearly empty, lower the lower the share
//   A HEAD COMES UP (creature.look { kind, at }, a Figment's head up from its business: STEALTH.md) heard from where it is, close only
//                  (near 3 m, far 18 m), by its kind (LOOK): a slip jelly's wet blink, a Lantern Wisp's flame drawing up, a clapperjar's
//                  clay tick, a sentinel's breath; any other a soft sniff. Throttled, so a herd looking up is one or two, not a chorus.
//
// Prior art: Metal Gear Solid's "!" sting kept small (no alert, only noticing), Hitman's and Thief's guards' murmurs, Dark Souls'
// estus sound for a resource running low.
//
//   sfx.poolLow(share) .creatureLook(kind)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Each kind's head coming up (a creature's `kind`). */
const LOOK = {
  jelly:    (s, t, d) => { s.tone(t, 0.12, { f0: 300, f1: 520, type: 'triangle', gain: 0.18, dest: d }); s.noise(t, 0.06, { type: 'lowpass', f0: 900, gain: 0.2, dest: d }); },
  wisp:     (s, t, d) => s.noise(t, 0.35, { type: 'bandpass', f0: 800, f1: 1800, q: 1.5, gain: 0.25, attack: 0.1, dest: d }),
  clapper:  (s, t, d) => { s.noise(t, 0.02, { type: 'bandpass', f0: 1800, q: 4, gain: 0.35, dest: d }); s.tone(t, 0.06, { f0: 420, type: 'triangle', gain: 0.12, dest: d }); },
  sentinel: (s, t, d) => s.tone(t, 0.5, { f0: hz(55), f1: hz(57), type: 'triangle', gain: 0.12, attack: 0.15, dest: d }),
  other:    (s, t, d) => { s.noise(t, 0.08, { type: 'bandpass', f0: 2200, q: 2, gain: 0.25, dest: d }); s.noise(t + 0.12, 0.08, { type: 'bandpass', f0: 2400, q: 2, gain: 0.2, dest: d }); }, // (a sniff)
};
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { low: 1.85, jelly: 4.4, wisp: 2.6, clapper: 7.4, sentinel: 5, other: 2.7 };

export class TellSounds {
  tellOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb, key === 'low')); setTimeout(() => d.disconnect(), 4000); return d; }

  poolLow(share = 0.25) {
    if (!this.ok() || !this.allow('poolLow', 0.5)) return;
    const t = this.ctx.currentTime, d = this.tellOut('low', 0.3, 0.3), drop = Math.round((0.25 - Math.max(0, Math.min(0.25, share))) * 20);
    [76, 72].forEach((m, i) => this.tone(t + i * 0.16, 0.5, { f0: hz(m - drop), type: 'sine', gain: 0.12, dest: d })); // (a bottle nearly empty, rung)
  }
  creatureLook(kind = 'other') {
    if (!this.ok() || !this.allow('creatureLook', 1.5)) return;
    const id = LOOK[kind] ? kind : 'other';
    LOOK[id](this, this.ctx.currentTime, this.tellOut(id, 0.3, 0.4));
  }
}
