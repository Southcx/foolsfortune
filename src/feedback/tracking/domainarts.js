// ---------------------------------------------------------------------------------------
// TRACKING, THE DOMAINS' RUNGS: the log's lines for a domain's rungs (progress/domainarts.js; courier/domainarts/run.js; DOMAINS.md 12,
// 16): a rung opened (once, with its lesson), what each one does as it fires, a refusal at the key, and /rung and /rule's answers. Plain
// words, Espada's to word (CLARITY.md: the label, then one line of what it does).
//
//   domainArtsRules({ on, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { DOMAIN_ARTS, FEAT_WORDS, RULE_WHEN, RULE_THEN, VOWS } from '../../progress/domainarts.js';
import { DOMAINS } from '../../progress/domains.js';
import { TRAITS } from '../../progress/domainladder.js';
import { TYPES } from '../../progress/combat/types.js';
import { CREATURES } from '../../tools/veritome/bestiary.js';

const kname = (k) => (CREATURES[k]?.name || { wisp: 'Lantern Wisp', greatjelly: 'Great Slip Jelly' }[k] || k).toLowerCase();

const KIND = { passive: 'always on while it holds a notch', reaction: 'always on while it holds a notch', action: 'worn on the art key' };
const WHY = { closed: 'You have not opened that rung yet.', cool: 'It is still settling.', pool: 'Your pool is too low for it.', none: 'No creature near enough.', unknown: 'No rung is called that.', here: 'You are where you stood.', record: 'Not while a time is being kept.', bare: 'No creature near carries an affliction.', still: 'No creature near is winding up a blow.', foe: 'A FOE keeps its own rule.' };
const SW = { doubt: 'doubt', charm: 'charm', blind: 'blindness', confusion: 'confusion', stun: 'a stun' };
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const tname = (t) => TYPES[t]?.name || t;
const share = (k) => (Math.abs(k - 0.5) < 0.01 ? 'half' : Math.abs(k - 0.25) < 0.01 ? 'a quarter' : Math.abs(k - 2 / 3) < 0.01 ? 'two thirds' : `${Math.round(k * 100)} in a hundred`);
const cap = (w) => w[0].toUpperCase() + w.slice(1);

export function domainArtsRules({ on, log }) {
  on('domain.art.learn', (e) => { const A = DOMAIN_ARTS[e.art]; if (!A) return;
    log.say('gain', `You open ${A.label}, a ${DOMAINS[A.domain].name} rung (${KIND[A.kind]}). ${A.line}`);
    log.say('system', A.how, { key: `rung.how.${e.art}` });
    if (A.kind !== 'action' && e.on === false) log.say('system', `All notches in use. Type /rung ${e.art} to swap it in.`, { key: `rung.full.${e.art}` }); });
  on('domain.trait.learn', (e) => { const T = TRAITS[e.trait]; if (!T) return; // (progress/domainladder.js: a milestone's trait)
    log.say('gain', `${T.label}: ${T.line}`); });
  on('domain.art.fire', (e) => {
    if (e.art === 'postpone') log.say('system', e.parried ? `Postponed blow reduced to ${share(e.left ?? 0.5)}.` : `Blow postponed. It lands in ${e.delay} seconds.`, { key: 'rung.postpone', throttle: 0.5 });
    else if (e.art === 'plating') log.say('system', `Your ${e.region} is plated.`, { key: 'rung.plating', throttle: 0.5 });
    else if (e.art === 'retype') log.say('system', `Your blows strike as ${tname(e.type)}${e.known ? `: what the ${kname(e.kind)} is weak to` : ''}.`, { key: 'rung.retype', throttle: 0.5 });
    else if (e.art === 'shatter') log.say('gain', 'Shattered.', { key: 'rung.shatter', throttle: 1 });
    else if (e.art === 'recall') log.say('system', 'You are back where you stood.', { key: 'rung.recall', throttle: 0.5 });
    else if (e.art === 'catch') log.say('system', 'You catch the shot. Let go to throw it.', { key: 'rung.catch', throttle: 0.5 });
    else if (e.art === 'link') log.say('system', `${cap(share(e.share ?? 0.5))} of the blow goes to the ${kname(e.kind)} you are linked to.`, { key: 'rung.link', throttle: 1.5 });
    else if (e.art === 'fuse') log.say('system', `${cap(kname(e.kind))} fused. Afflictions on it are delayed ${e.window} seconds.`, { key: 'rung.fuse', throttle: 0.5 });
    else if (e.art === 'walkCycle') log.say('system', `Walked: ${list(e.turned.map(([a, b]) => `${SW[a] || a} into ${SW[b] || b}`))}.`, { key: 'rung.cycle', throttle: 0.5 });
    else if (e.art === 'sealCreature') log.say('system', e.broke ? `The seal breaks off the ${kname(e.kind)}'s ${e.blow}.` : `Sealed: the ${kname(e.kind)} cannot ${e.blow} for ${e.dur} seconds.`, { key: 'rung.seal', throttle: 0.5 });
    else if (e.art === 'relay') log.say('gain', e.links > 1 ? `The force passes on, ${e.links} links.` : 'The force passes on.', { key: 'rung.relay', throttle: 1 });
    else if (e.art === 'catchWeather') log.say('system', `Your Bottle catches ${cap(e.aspect)}: ${e.lachryma} Lachryma.`, { key: 'rung.catchweather', throttle: 20 });
    else if (e.art === 'borrowVerb') log.say('system', `The ${kname(e.kind)} lends you its move. Press R to throw it for the next ${e.dur} seconds.`, { key: 'rung.borrow', throttle: 0.5 });
    else if (e.art === 'standingRule') log.say('system', `Your rule: ${RULE_THEN[e.then]?.label ?? e.then}.`, { key: 'rung.rule', throttle: 2 });
  });
  on('domain.react', (e) => log.say('system', e.kind === 'cancel' ? 'The paints cancel: bare ground, and calm.' : `The paints flare: ${e.agate}.`, { key: 'rung.react', throttle: 1 }));
  on('domain.art.end', (e) => {
    if (e.art === 'postpone') log.say('warn', e.why === 'parried' ? 'The postponed blow lands, halved.' : 'The postponed blow lands.', { key: 'rung.postpone.end', throttle: 0.5 });
    else if (e.art === 'plating') log.say('system', e.why === 'struck' ? `The plate on your ${e.region} takes the blow and breaks.` : 'Your plate melts back into your pool.', { key: 'rung.plating.end', throttle: 0.5 });
    else if (e.art === 'retype') log.say('system', 'Your blows strike as themselves again.', { key: 'rung.retype.end', throttle: 0.5 });
    else if (e.art === 'fuse' && e.why !== 'gone') log.say('system', !e.n ? 'The fuse goes off with nothing in it.' : e.why === 'chosen' ? `The fuse goes off: ${list(e.statuses.map((x) => SW[x] || x))} at once, half again as long.` : `The fuse runs out: ${list(e.statuses.map((x) => SW[x] || x))} as they were.`, { key: 'rung.fuse.end', throttle: 0.5 });
    else if (e.art === 'sealCreature' && e.why === 'time') log.say('system', 'Your seal fades.', { key: 'rung.seal.end', throttle: 1 });
    else if (e.art === 'borrowVerb') log.say('system', `The ${kname(e.kind)} takes its move back.`, { key: 'rung.borrow.end', throttle: 1 });
    else if (e.art === 'vow') log.say('warn', `You broke your vow to ${VOWS[e.vow]?.label}. It cracks you.`, { key: 'rung.vow.end', throttle: 0.5 });
  });
  on('domain.art.refuse', (e) => log.say('warn', `${DOMAIN_ARTS[e.art]?.label ?? e.art}: ${WHY[e.why] || e.why}`, { key: 'rung.refuse', throttle: 1 }));
  on('domain.art.wear', (e) => log.say('system', `${DOMAIN_ARTS[e.art]?.label}: ${e.on ? 'on' : 'off'}.`, { key: 'rung.wear', throttle: 0.3 }));
  on('domain.art.ask', (e) => {
    log.say('system', `Your rungs, ${e.on.length} of ${e.notches} notches worn.`, { key: 'rung.ask', throttle: 0.5 });
    for (const r of e.rungs) { const A = DOMAIN_ARTS[r.art], P = r.progress;
      log.say('system', r.open ? `${A.label} (${r.art}), ${DOMAINS[A.domain].name}: open${A.kind === 'action' ? '' : r.on ? ', on' : ', off'}. ${A.line}`
        : `${A.label}, ${DOMAINS[A.domain].name}: level ${P.level} of ${P.of}, or ${P.done} of ${P.n} ${FEAT_WORDS[P.feat] || P.feat}.`, { key: `rung.ask.${r.art}`, throttle: 0.5 }); }
  });
  on('domain.makeup', (e) => log.say('system', `The ${kname(e.kind)}'s body is ${tname(e.weak) ? `weak to ${tname(e.weak)}` : 'read'}.${e.first ? ' Re-type knows it now.' : ''}`, { key: `makeup.${e.kind}`, throttle: 2 }));
  on('domain.vow.set', (e) => log.say('system', e.vow ? `You vow to ${VOWS[e.vow].label}. Every cost is a quarter less while you keep it.` : 'You set your vow aside.', { key: 'vow.set', throttle: 0.3 }));
  on('domain.vow.ask', (e) => log.say('system', e.open ? `Your vow: ${e.vow ? VOWS[e.vow].label : 'none'}. Vows: ${e.vows.map((v) => `${v} (${VOWS[v].label})`).join(', ')}.` : 'A Vow is not open yet (/rung shows how near).', { key: 'vow.ask', throttle: 0.5 }));
  on('domain.vow.refuse', (e) => log.say('warn', e.why === 'closed' ? 'A Vow is not open yet.' : e.why === 'wait' ? 'After a broken vow, wait before swearing another.' : `No vow is called "${e.vow}". /vow lists them.`, { key: 'vow.refuse', throttle: 1 }));
  on('domain.rule.ask', (e) => log.say('system', e.open
    ? `Your rule: when ${RULE_WHEN[e.rule.when]?.label}, ${RULE_THEN[e.rule.then]?.label}. When: ${e.when.join(', ')}. Then: ${e.then.join(', ')}.`
    : 'A Standing Rule is not open yet (/rung shows how near).', { key: 'rule.ask', throttle: 0.5 }));
  on('domain.rule.set', (e) => log.say('system', `Rule written: when ${RULE_WHEN[e.when]?.label}, ${RULE_THEN[e.then]?.label}.`, { key: 'rule.set', throttle: 0.3 }));
  on('domain.rule.refuse', (e) => log.say('warn', e.why === 'closed' ? 'A Standing Rule is not open yet.' : `No rule reads "${e.when} ${e.then}". /rule lists the choices.`, { key: 'rule.refuse', throttle: 1 }));
}
