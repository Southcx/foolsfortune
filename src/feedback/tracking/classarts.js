// ---------------------------------------------------------------------------------------
// TRACKING, A CLASS'S ARTS: the log's lines for the class arts (progress/classarts.js; CLASS-ARTS.md): an art opened (once), worn, refused,
// and `/art`'s answer. Placeholder words, Espada's to word (CLARITY.md: the label, then one line of what it does).
//
//   classArtsRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { CLASS_ARTS, classWords } from '../../progress/classarts.js';

const KIND = { action: 'action', reaction: 'reaction' };

export function classArtsRules({ on, log }) {
  on('art.learn', (e) => { const A = CLASS_ARTS[e.art]; if (A) log.say('gain', `${classWords(A.cls)} teaches you ${A.label} (a ${KIND[A.kind]}): ${A.line}`); });
  on('art.wear', (e) => { const A = CLASS_ARTS[e.art]; if (A) log.say('system', `You wear ${A.label} as your ${KIND[A.kind]}.`, { key: 'art.wear', throttle: 0.5 }); });
  on('art.refuse', (e) => log.say('warn', e.why === 'unknown' ? `No art is called ${e.art}.` : `You have not opened ${CLASS_ARTS[e.art].label} yet.`, { key: 'art.refuse', throttle: 1 }));
  on('art.ask', (e) => {
    const W = (id) => (id ? CLASS_ARTS[id]?.label : 'none');
    log.say('system', `You read as ${classWords(e.cls)}. Worn: ${W(e.worn.action)} (action), ${W(e.worn.reaction)} (reaction).`, { key: 'art.ask', throttle: 0.5 });
    for (const h of e.here || []) { const A = CLASS_ARTS[h.art], P = h.progress;
      log.say('system', h.open ? `${A.label} (${h.art}): open. ${A.line}` : `${A.label}: ${P.minutes} of ${P.of} real minutes as this class, or ${P.done} of ${P.n} (${P.feat}).`, { key: `art.ask.${h.art}`, throttle: 0.5 }); }
  });
}
