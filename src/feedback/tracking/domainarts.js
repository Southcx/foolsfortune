// ---------------------------------------------------------------------------------------
// TRACKING, THE DOMAINS' RUNGS: the log's lines for a domain's rungs (progress/domainarts.js; courier/domainarts/run.js; DOMAINS.md 12,
// 16): a rung opened (once, with its lesson), what each one does as it fires, a refusal at the key, and /rung and /rule's answers. Plain
// words, Espada's to word (CLARITY.md: the label, then one line of what it does).
//
//   domainArtsRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { DOMAIN_ARTS, FEAT_WORDS, RULE_WHEN, RULE_THEN } from '../../progress/domainarts.js';
import { DOMAINS } from '../../progress/domains.js';
import { TYPES } from '../../progress/combat/types.js';

const KIND = { passive: 'always on while it holds a notch', reaction: 'always on while it holds a notch', action: 'worn on the art key' };
const WHY = { closed: 'You have not opened that rung yet.', cool: 'It is still settling.', pool: 'Your pool is too low for it.', none: 'No creature near enough.', unknown: 'No rung is called that.' };
const tname = (t) => TYPES[t]?.name || t;

export function domainArtsRules({ on, log }) {
  on('domain.art.learn', (e) => { const A = DOMAIN_ARTS[e.art]; if (!A) return;
    log.say('gain', `You open ${A.label}, ${DOMAINS[A.domain].name}'s first rung (${KIND[A.kind]}). ${A.line}`);
    log.say('system', A.how, { key: `rung.how.${e.art}` }); });
  on('domain.art.fire', (e) => {
    if (e.art === 'postpone') log.say('system', e.parried ? 'The blow you are holding is halved.' : `A blow is held. It lands in ${e.delay} seconds.`, { key: 'rung.postpone', throttle: 0.5 });
    else if (e.art === 'plating') log.say('system', `Your ${e.region} is plated.`, { key: 'rung.plating', throttle: 0.5 });
    else if (e.art === 'retype') log.say('system', `Your blows strike as ${tname(e.type)}${e.known ? `: what the ${e.kind} is weak to` : ''}.`, { key: 'rung.retype', throttle: 0.5 });
    else if (e.art === 'shatter') log.say('gain', 'Shattered.', { key: 'rung.shatter', throttle: 1 });
    else if (e.art === 'standingRule') log.say('system', `Your rule: ${RULE_THEN[e.then]?.label ?? e.then}.`, { key: 'rung.rule', throttle: 2 });
  });
  on('domain.art.end', (e) => {
    if (e.art === 'postpone') log.say('warn', e.why === 'parried' ? 'The held blow lands, halved.' : 'The held blow lands.', { key: 'rung.postpone.end', throttle: 0.5 });
    else if (e.art === 'plating') log.say('system', e.why === 'struck' ? `The plate on your ${e.region} takes the blow and breaks.` : 'Your plate melts back into your pool.', { key: 'rung.plating.end', throttle: 0.5 });
    else if (e.art === 'retype') log.say('system', 'Your blows strike as themselves again.', { key: 'rung.retype.end', throttle: 0.5 });
  });
  on('domain.art.refuse', (e) => log.say('warn', `${DOMAIN_ARTS[e.art]?.label ?? e.art}: ${WHY[e.why] || e.why}`, { key: 'rung.refuse', throttle: 1 }));
  on('domain.art.wear', (e) => log.say('system', `${DOMAIN_ARTS[e.art]?.label}: ${e.on ? 'on' : 'off'}.`, { key: 'rung.wear', throttle: 0.3 }));
  on('domain.art.ask', (e) => {
    log.say('system', `Your rungs, ${e.on.length} of ${e.notches} notches worn.`, { key: 'rung.ask', throttle: 0.5 });
    for (const r of e.rungs) { const A = DOMAIN_ARTS[r.art], P = r.progress;
      log.say('system', r.open ? `${A.label} (${r.art}), ${DOMAINS[A.domain].name}: open${A.kind === 'action' ? '' : r.on ? ', on' : ', off'}. ${A.line}`
        : `${A.label}, ${DOMAINS[A.domain].name}: level ${P.level} of ${P.of}, or ${P.done} of ${P.n} ${FEAT_WORDS[P.feat] || P.feat}.`, { key: `rung.ask.${r.art}`, throttle: 0.5 }); }
  });
  on('domain.rule.ask', (e) => log.say('system', e.open
    ? `Your rule: when ${RULE_WHEN[e.rule.when]?.label}, ${RULE_THEN[e.rule.then]?.label}. When: ${e.when.join(', ')}. Then: ${e.then.join(', ')}.`
    : 'A Standing Rule is not open yet (/rung shows how near).', { key: 'rule.ask', throttle: 0.5 }));
  on('domain.rule.set', (e) => log.say('system', `Rule written: when ${RULE_WHEN[e.when]?.label}, ${RULE_THEN[e.then]?.label}.`, { key: 'rule.set', throttle: 0.3 }));
  on('domain.rule.refuse', (e) => log.say('warn', e.why === 'closed' ? 'A Standing Rule is not open yet.' : `No rule reads "${e.when} ${e.then}". /rule lists the choices.`, { key: 'rule.refuse', throttle: 1 }));
}
