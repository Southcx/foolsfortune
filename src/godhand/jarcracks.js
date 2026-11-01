// ---------------------------------------------------------------------------------------
// THE GOD HAND'S PNEUKA JAR AS CRACKS (SUBSTRATE.md F1, South's ruling 2026-11-01: one rule for any shelled body, the Jar among them).
// The Jar keeps a vessel state of the `jar` form (progress/combat/vessel.js FORMS: lip, shoulder, belly, foot), every blow laid on it
// through `blowOn`; `jar.hp` stays the readout every reader knew (the Pneuka Jar's plate, `god.readout()`, the clips, the menders, the
// Soul Brush's +25), now read off the cracks (hp = max x (1 - crack sum / break line)) and written back as cracks or mends. A blow of
// `amount` hp is laid in slices of at most `SLICE` crack, each on the least cracked region, so the regions stay level and the Jar breaks
// at hp 0 exactly as before; a blow's `shatter` breaks it sooner. The pool's shield (`pool: true` on the form) is not drawn on yet: the
// god hand's balance stays as measured (a raid wave 14 .. 35 hp undefended, v369) until it is ruled.
// Prior art: the ships' hull on the rail (world/emocean/shiphull.js), the vessel's rule itself (Dovina's).
//
//   jarCracks(jar, max)   jar.hp (get / set)   jar.jarCracks.state   jar.jarCracks.strike(amount, { shatter }) -> { region, shatter }
// ---------------------------------------------------------------------------------------
import { newVessel, blowOn, mend, crackSum, breakLine, FORMS } from '../progress/combat/vessel.js';

const FORM = 'jar', SLICE = 0.1;
const leastOf = (v) => Object.keys(v.crack).reduce((a, b) => (v.crack[b] < v.crack[a] ? b : a));

export function jarCracks(jar, max) {
  const line = breakLine(FORM), crack = FORMS[FORM].crack;
  let v = newVessel(FORM);
  const hpOf = () => Math.max(0, max * (1 - crackSum(v) / line));
  const strike = (amount, { shatter = 0 } = {}) => {
    let left = Math.max(0, amount) / max * line, out = { region: null, shatter: false };
    while (left > 1e-9) {
      const add = Math.min(SLICE, left), r = leastOf(v), b = blowOn(v, { region: r, k: add / crack, shatter });
      v = b.state; left -= add; out = { region: out.region || r, shatter: out.shatter || b.shatter };
      if (b.shatter) break;
    }
    return out;
  };
  Object.defineProperty(jar, 'hp', {
    enumerable: true, configurable: true, get: hpOf,
    set: (n) => { const now = hpOf(), want = Math.max(0, Math.min(max, n || 0)); if (want > now) v = mend(v, crackSum(v) - (1 - want / max) * line); // (to the exact sum: a break's last slice may lie past the line)
 else if (want < now) strike(now - want); },
  });
  jar.jarCracks = { get state() { return v; }, strike, form: FORM };
  return jar.jarCracks;
}
