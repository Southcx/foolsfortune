// ---------------------------------------------------------------------------------------
// TRACKING, THE PARTY: what the log says when a sibling is called or dismissed, what you tell them (coop/party.js), and what a
// division's session has its sibling say (coop/channel.js). Nothing is counted yet: what a sibling earns or costs is Dovina's to rule
// (docs/plans/COOP.md). Words are placeholders for Espada's.
//
//   partyRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const NAMES = { petra: 'Petra', dovina: 'Dovina', wanda: 'Wanda', calissa: 'Calissa', espada: 'Espada' };
const nameOf = (id) => NAMES[id] || id;

export function partyRules({ on, log }) {
  on('party.call', (e) => log.say('info', `${nameOf(e.sibling)} joins you.`, { key: 'party.call', win: 1, fmt: (n) => `${n} siblings join you.` }));
  on('party.dismiss', (e) => log.say('info', `${nameOf(e.sibling)} goes home.`, { key: 'party.dismiss', win: 1, fmt: (n) => `${n} siblings go home.` }));
  on('party.order', (e) => log.say('info', e.order === 'hold' ? 'Your siblings hold where they stand.' : 'Your siblings follow you.', { key: 'party.order', throttle: 0.5 }));
  on('party.say', (e) => log.say('info', `${nameOf(e.sibling)}${e.near ? '' : ' (from afar)'}: ${e.line}`)); // (a division's own words, through the store: coop/channel.js)
  on('party.list', (e) => log.say('system', e.siblings.length ? `With you: ${e.siblings.map(nameOf).join(', ')}.` : 'No one is with you. /party call all brings your siblings.'));
}
