// ---------------------------------------------------------------------------------------
// TRACKING, ACHIEVEMENTS, STANDING AND THE ARTS LEARNED: a domain's level reached, an achievement complete, a standing earned, an art
// learned from the System. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old
// School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   standingRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { sfx } from '../../audio/sfx.js';
import { BY_ID, UNLOGGED_TECHS } from '../../progress/skills.js';
import { DOMAINS } from '../../progress/domains.js';

const DOMAIN_NAME = (d) => DOMAINS[d]?.name || d;

export function standingRules({ on, L, log, g }) {
  on('domain.level', (e) => { if (e.by === 'courier') log.say('gain', `Your ${DOMAIN_NAME(e.domain)} reaches level ${e.level}.`); }); // (progress/psyche.js)
  // ---- achievements and standing (achievements.js decides; the log says it here)
  on('achievement.unlock', (e) => {
    log.say('ach', `Achievement complete (${e.tierName}, ${e.points} ${e.points === 1 ? 'pt' : 'pts'}): ${e.ach}.`);
    if (e.title) log.say('ach', `You have earned the title "${e.title}".`);
  });
  on('rank.up', (e) => log.say('ach', `You are now known as ${/^Fool/.test(e.rank) ? '' : /^[AEIOU]/i.test(e.rank) ? 'an ' : 'a '}${e.rank}.`));

  // ---- the System: what has been learned
  on('system.unlock', (e) => {
    if (g.system?.lendAll) return; // (the all-arts switch lends everything: nothing to say)
    const a = BY_ID[e.ability];
    L.inc(e.variant ? 'art.variant' : a.realm === 'god' ? 'art.god' : 'art.move');
    log.say('art', e.variant ? `You learn the ${e.title} variant of ${a.name}. (B: the Codex)` : `You learn ${a.realm === 'god' ? 'the god art' : 'the art of'} ${e.title}. (B: the Codex)`);
    sfx.systemUnlock?.();
  });
}
