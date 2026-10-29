// ---------------------------------------------------------------------------------------
// TRACKING, THE APTITUDES: the log's lines for the Assay's readings (progress/aptitude.js; APTITUDE.md). The passive readings are silent
// while they are taken (APTITUDE.md 10.4); `/assay` asks for them, and each is said as the System reads it: ??? until five readings,
// then its number in its unit. Placeholder words, Espada's to word; the window is Calissa's.
//
//   aptitudeRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { APTITUDES, APT } from '../../progress/aptitude.js';

const num = (v) => (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

export function aptitudeRules({ on, log }) {
  on('aptitude.ask', (e) => {
    const R = e.readings || {}, any = Object.values(R).some((r) => r.n > 0);
    if (!any) { log.say('system', 'The System has not measured you yet. It watches as you play.', { key: 'assay', throttle: 1 }); return; }
    for (const [id, r] of Object.entries(R)) {
      const A = APTITUDES[id]; if (!A || !r.n) continue;
      if (!r.shown) { log.say('system', `${A.label}: ??? (${r.n} of ${APT.shown} readings)`, { key: `assay.${id}`, throttle: 1 }); continue; }
      const trend = r.trend == null ? '' : r.trend > 0 ? ', better than at first' : r.trend < 0 ? ', worse than at first' : '';
      log.say('system', `${A.label}: ${num(r.median)} ${A.unit} (best ${num(r.best)}, ${r.n} readings${trend})`, { key: `assay.${id}`, throttle: 1 });
    }
  });
}
