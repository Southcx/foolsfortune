// ---------------------------------------------------------------------------------------
// TRACKING, THE SPIRIT GARDEN AND SOUL ALCHEMY: the rules that hear the garden (progress/garden.js) and the spirit press
// (progress/alchemy.js), the spirits and the Firings (progress/spirits.js: docs/plans/SPIRIT-GARDEN.md), keep their counts for the achievements, and say the few things worth a sentence. The words are placeholders
// for Espada's. tracking.js calls it from listen().
//
//   gardenRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { ATTRIBUTES } from '../../progress/alchemy.js';
import { KINDS } from '../../progress/econ/materials.js';
import { ENCOUNTERS } from '../../progress/garden.js';
import { firingOf, ranksOf, FIRING_NAMES } from '../../progress/spirits.js';
import { FEATURES, VISITORS } from '../../progress/realm.js';
import { CAPS, STRAIN_NAMES } from '../../progress/mycelium.js';
import { DECOR, SETS } from '../../progress/decor.js';
import { seasonOf } from '../../progress/seasons.js';
import { FAREWELL_LINES } from '../../progress/spiritlife.js';

export function gardenRules({ on, L, log }) {
  // the mycelium (progress/sporebeds.js, progress/myggdrasil.js, progress/keepsakes.js: MYCELIUM.md); names Espada's (LORE.md "The
  // mycelium"), the lines placeholders for hers
  const STRAIN = STRAIN_NAMES;
  on('spore.bed', (e) => { if (e.by === 'courier') L.inc('spore.bed'); });
  on('spore.learn', (e) => { if (e.by !== 'courier') return; L.inc('spore.learn'); L.inc(`spore.learn.${e.strain}`); log.say('gain', `You have spores of ${STRAIN[e.strain]}.`); });
  on('spore.inoculate', (e) => { if (e.by === 'courier') L.inc('spore.inoculate'); });
  on('spore.set', (e) => { if (e.by === 'courier') L.inc('spore.set'); });
  on('spore.harvest', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spore.harvest'); L.inc(`spore.${e.verb}`);
    if (e.verb === 'graft') { if (e.pair) L.inc(`spore.graft.pair.${e.pair}`); L.hi('spore.graft.tier', e.tier || 0); if (e.up) L.inc('spore.graft.up'); for (const id of e.made) L.inc(`spore.graft.made.${id}`); }
    log.say('loot', `${STRAIN[e.strain][0].toUpperCase()}${STRAIN[e.strain].slice(1)} gives up ${(e.names || e.made).join(', ')}.`);
  });
  on('myggdrasil.feed', (e) => { if (e.by !== 'courier') return; L.inc('myggdrasil.feed'); L.inc('myggdrasil.fed', e.worth || 0); });
  on('myggdrasil.girth', (e) => { if (e.by !== 'courier') return; L.hi('myggdrasil.caps', e.caps); { const c = CAPS[e.caps - 1]; log.say('gain', `Myggdrasil grows. ${c[0].toUpperCase()}${c.slice(1)} opens.`); } });
  on('myggdrasil.fruit', (e) => { if (e.by === 'courier') L.inc('myggdrasil.fruit', e.n || 0); });
  on('myggdrasil.pick', (e) => { if (e.by !== 'courier') return; L.inc('myggdrasil.pick', e.n || 0); log.say('loot', `You pick ${e.n} from Myggdrasil's crown.`); });
  on('myggdrasil.hang', (e) => { if (e.by !== 'courier') return; L.inc('myggdrasil.hang'); L.inc(`myggdrasil.hang.${e.arcana}`); log.say('info', 'You hang the card on its branch. The branch takes it.'); });
  on('keepsake.pot', (e) => { if (e.by === 'courier') { L.inc('keepsake.pot'); log.say('info', `${e.spirit || 'Your spirit'} is fired into a keepsake pot. It stays.`); } });

  // one line a press, never one a material (SOUL-ALCHEMY 4.20, Espada's words): the press emits alchemy.press as each material's walk
  // ends, about a real second apart, so the lines fold into one that names them all; "The colour greys." once a press
  let pressed = [], greyed = false;
  const line = () => `You press ${list(pressed)} into the bath.${greyed ? ' The colour greys.' : ''}`;
  const list = (a) => (a.length < 2 ? a[0] : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  on('alchemy.press', (e) => {
    if (e.by !== 'courier') return;
    L.inc('alchemy.press', e.count || 1);
    const names = (e.kinds || []).map((k) => (k === 'edge' ? 'edges' : KINDS[k]?.name || k)); // ("edges and tools" would read as two in the list; the words Espada's)
    const l = log.say('info', '', { key: 'alchemy.press', win: 2.5, fmt: line });
    if (l && l.n === 1) { pressed = []; greyed = false; } // (a new press: start the line again)
    for (const n of names) if (!pressed.includes(n)) pressed.push(n);
    greyed = greyed || !!e.greyed;
    if (l) { l.text = pressed.length ? line() : (greyed ? 'The colour greys.' : 'You press it into the bath.'); if (l.el) l.el.lastChild.textContent = l.text; }
  });
  on('alchemy.refuse', (e) => { if (e.by === 'courier') L.inc(`alchemy.refuse.${e.why}`); });
  on('alchemy.fire', (e) => {
    if (e.by !== 'courier') return;
    L.inc('alchemy.fire'); L.hi(`alchemy.rank.${e.attribute}`, e.rank);
    if (e.true) L.inc('alchemy.true'); // (a true firing: within a quarter of the swatch's radius, SOUL-ALCHEMY.md 3.3; the words are placeholders for Espada's)
    log.say('gain', `${e.true ? 'A true firing.' : 'The press fires.'} ${ATTRIBUTES[e.attribute]?.name || e.attribute}: rank ${e.rank}, for ${e.fuel} cubes.`);
  });
  on('alchemy.seasoned', (e) => { if (e.by === 'courier') log.say('info', `Your ${ATTRIBUTES[e.attribute]?.name || e.attribute} is seasoned: its swatch is as wide as practice makes it.`); });
  on('garden.slot', (e) => { if (e.by === 'courier' && e.encounter) { L.inc('garden.slot'); { const n = ENCOUNTERS[e.encounter]?.name || e.encounter; log.say('info', `${n.charAt(0).toUpperCase()}${n.slice(1)} now works a garden slot.`); } } });
  on('garden.collect', (e) => { if (e.by === 'courier') L.inc('garden.dividend', e.cubes); });
  on('garden.plant', (e) => { if (e.by === 'courier') L.inc('garden.plant'); });
  on('garden.harvest', (e) => { if (e.by === 'courier') { L.inc('garden.harvest', e.count); log.say('loot', `You harvest ${e.count} from the bed.`); } });
  // (a spirit's or a realm's own name rides as `spirit` / `realm`: the bus writes its own `name` over a payload's: core/events.js)
  // the spirits (SPIRIT-GARDEN.md 5): bound (caught by the Lockheart or the god hand, awakened, dug, settled, merged), fed, matured, released
  const FROM = { lockheart: 'The Lockheart catches', hand: 'Your Pneuka Jar draws in', plate: 'From a photo:', fossil: 'A fossil wakes:', visit: 'A visitor settles:', merge: 'From the cocoon:' };
  on('spirit.bind', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spirit.bind'); L.inc(`spirit.bind.${e.from}`); L.hi('spirit.bind.cls', (e.cls || 0) + 1);
    log.say('gain', `${FROM[e.from] || 'Bound:'} ${e.spirit || (e.kind ? `a ${e.kind}` : 'a Figment')}.${e.from === 'lockheart' || e.from === 'hand' ? ' It waits in your Pneuka Jar for the garden.' : ''}`);
  });
  // a catch that fails: the wheel came up free, or the hand let go (Petra's rail of the catch: tools/lockheart, godhand)
  on('catch.miss', (e) => { if (e.by !== 'courier') return; L.inc('catch.miss'); log.say('info', `It slips the coffin. (${Math.round((e.odds || 0) * 100)}%)`, { key: 'catchmiss', throttle: 1 }); });
  on('catch.free', (e) => { if (e.by !== 'courier') return; L.inc('catch.free'); log.say('info', e.why === 'woke' ? 'It wakes in your grip and breaks free.' : 'You let it go.', { key: 'catchfree', throttle: 1 }); });
  on('spirit.feed', (e) => { if (e.by === 'courier') L.inc('spirit.feed'); });
  on('spirit.mature', (e) => { if (e.by !== 'courier') return; L.inc('spirit.mature'); L.inc(`spirit.form.${e.feeling}.${e.side}`); log.say('gain', `${e.spirit || 'A spirit'} matures.`); });
  on('spirit.merge', (e) => { if (e.by === 'courier') L.inc('spirit.merge'); });
  on('spirit.release', (e) => { if (e.by === 'courier') { L.inc('spirit.release'); log.say('info', `You release ${e.spirit || 'a spirit'}.`); } });
  // the Firings: the tribulation at the Chimney crosses the one the attributes' ranks have opened
  on('cultivation.tribulation', (e) => {
    if (e.by !== 'courier') return;
    L.inc('tribulation.tried');
    if (!e.passed) { log.say('info', 'The Heavenly Kiln closes. Try again when you are ready.'); return; }
    const open = firingOf(ranksOf(L)), n = Math.min(e.firing || open, open), ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    L.hi('firing', n); log.say('gain', `${ORD[n - 1] || `Firing ${n}`}${ORD[n - 1] ? ' Firing' : ''}${FIRING_NAMES[n - 1] ? `: ${FIRING_NAMES[n - 1]}` : ''}. Complete.`); // (Espada's line)
  });
  on('cultivation.kiln', (e) => { if (e.by === 'courier') log.say('info', 'The Heavenly Kiln opens.'); });
  // the Inner Realm as a place (progress/realm.js): features placed, the planetoids sculpted, drills, visitors who settle
  on('garden.place', (e) => { if (e.by === 'courier' && FEATURES[e.feature]) { L.inc('garden.place'); L.inc(`garden.place.${e.feature}`); } });
  on('garden.sculpt', (e) => { if (e.by === 'courier') L.inc('garden.sculpt'); });
  on('garden.paint', (e) => { if (e.by === 'courier') { L.inc('garden.paint'); if (e.ground !== 'none') L.inc(`garden.paint.${e.ground}`); } });
  on('garden.move', (e) => { if (e.by === 'courier') L.inc('garden.move'); });
  on('garden.track', (e) => { if (e.by === 'courier') L.inc('garden.track'); });
  on('spirit.race', (e) => { if (e.by !== 'courier') return; L.inc('spirit.race'); if (e.seconds != null) L.lo('spirit.race.fastest', e.seconds); });
  on('spirit.spar', (e) => { if (e.by === 'courier') { L.inc('spirit.spar'); L.hi('spirit.spar.bumps', e.bumps); } });
  on('garden.reset', (e) => { if (e.by === 'courier') L.inc('garden.reset'); });
  on('garden.water', (e) => { if (e.by === 'courier') { L.inc('garden.water'); L.inc(`garden.water.${e.how}`); } }); // (pour, drink, spring, drain, unset: Petra's waterworks)
  on('spirit.drill', (e) => { if (e.by === 'courier') { L.inc('spirit.drill'); if (!e.gain) log.say('info', `${e.spirit || 'The spirit'} is too tired to drill.`, { key: 'tired', throttle: 3 }); } });
  on('spirit.visit', (e) => {
    if (!VISITORS[e.kind]) return;
    L.inc(`spirit.visit.${e.kind}`);
    if (e.settled) { L.inc(`spirit.settle.${e.kind}`); log.say('gain', `A ${e.kind} settles in your Inner Realm.`); } else log.say('info', `A ${e.kind} visits your Inner Realm.`, { key: `visit.${e.kind}`, throttle: 30 });
  });
  on('realm.name', (e) => { if (e.by === 'courier') log.say('info', `Your Inner Realm is named ${e.realm}.`); });
  on('garden.upgrade', (e) => { if (e.by === 'courier') { L.inc(`garden.upgrade.${e.kind}`); log.say('info', `Garden widened: one more ${e.kind}.`); } });

  // the garden made cozy (docs/plans/GARDEN-COZY.md: progress/harmony.js, progress/decor.js, progress/seasons.js); Espada's words, plain
  // until the owner calls the garden finished
  const an = (n = '') => (/^(Incense|Raked Gravel)$/.test(n) || /[^s]s$/.test(n) ? 'some' : /^[AEIOU]/.test(n) ? 'an' : 'a') + ` ${n}`; // (a Bench, an Arbor, some Lily Pads)
  const PLANET = { dantian: 'the Dantian', terraces: 'the Herb Terraces', athanor: 'the Athanor', pavilions: 'the Pavilions of Echoes', mulberryGrove: 'the Mulberry Grove', chimney: 'the Chimney', myggdrasil: "Myggdrasil's planetoid" };
  const planet = (id) => PLANET[id] || 'a planetoid', Planet = (id) => { const p = planet(id); return p[0].toUpperCase() + p.slice(1); };
  on('garden.tend', (e) => { if (e.by === 'courier') { L.inc('garden.tend'); L.inc(`garden.tend.${e.kind}`); } });
  on('garden.harmony', (e) => {
    if (e.band === 'bloom') { L.inc('garden.bloom'); L.hi('garden.bloom.most', e.blooming || 1); log.say('gain', `${Planet(e.planetoid)} comes into bloom.`, { key: `bloom.${e.planetoid}`, throttle: 10 }); }
    else if (e.band === 'briar') { L.inc('garden.briar'); log.say('info', `Briar creeps over ${planet(e.planetoid)}.`, { key: `briar.${e.planetoid}`, throttle: 10 }); }
  });
  on('garden.thorn', (e) => log.say('info', `Thorns sprout on ${planet(e.planetoid)}.`, { key: `thorn.${e.planetoid}`, throttle: 30 }));
  on('garden.prune', (e) => { if (e.by === 'courier') { L.inc('garden.prune'); log.say('loot', 'You prune a thorn and keep the cutting.', { key: 'prune', throttle: 2 }); } });
  on('garden.briar.held', (e) => { if (e.by === 'courier') L.hi('garden.briar.held', e.days); });
  on('garden.harmony.ask', (e) => {
    if (!e.planets?.length) { log.say('system', 'Your garden is at rest.', { key: 'harmony.ask', throttle: 1 }); return; }
    for (const p of e.planets) log.say('system', `${Planet(p.planetoid)}: ${p.band === 'bloom' ? 'in bloom' : p.band === 'briar' ? 'overgrown' : 'at rest'}${p.thorns ? `, ${p.thorns} thorn${p.thorns > 1 ? 's' : ''}` : ''}.`, { key: `harmony.${p.planetoid}`, throttle: 0.5 });
  });
  on('decor.get', (e) => {
    if (e.by !== 'courier') return;
    L.inc('decor.get', e.n || 1); if (e.first) L.inc('decor.owned');
    if (e.from !== 'shop' && e.from !== 'gift' && e.from !== 'farewell') log.say('loot', `You get ${an(DECOR[e.id]?.name || 'garden piece')} for the shed.`, { key: 'decor.get', throttle: 1 });
  });
  on('decor.buy', (e) => { if (e.by === 'courier') { L.inc('decor.buy'); L.inc('decor.spent', e.cubes || 0); log.say('info', `You buy ${an(DECOR[e.id]?.name || 'garden piece')} for the shed: ${e.cubes} cubes.`, { key: 'decor.buy', throttle: 0.5 }); } });
  on('decor.refuse', (e) => { if (e.by === 'courier') log.say('warn', e.why === 'cubes' ? 'Not enough cubes.' : e.why === 'locked' ? 'That piece is not in the catalogue yet.' : 'No such piece.', { key: 'decor.refuse', throttle: 1 }); });
  // the garden's rating, as the decor layer reports it (Petra's, when built): the lotuses open on the Dantian's lake, a set finished
  on('garden.rating', (e) => {
    if (e.by !== 'courier') return;
    const was = L.best('garden.lotuses') || 0; L.hi('garden.lotuses', e.lotuses || 0);
    if ((e.lotuses || 0) > was) log.say('gain', `A lotus opens on the Dantian's lake. (${e.lotuses} of 5)`, { key: 'lotus', throttle: 5 });
    for (const set of e.sets || []) if (!L.get(`decor.set.${set}`)) { L.inc(`decor.set.${set}`); L.inc('decor.sets'); }
  });
  on('garden.enter', (e) => { // (a season said once, on the first visit in it: the season's number on the ledger as a best)
    if (e.by !== 'courier') return;
    const S = seasonOf(), n = S.year * 4 + S.i;
    if (n > (L.best('garden.season.n') || 0)) { L.hi('garden.season.n', n); L.inc(`garden.season.${S.id}`); log.say('info', `${S.name} comes to your Inner Realm.`, { key: 'season', throttle: 5 }); }
  });
  // the spirits' wishes and the morning's digest (progress/spiritlife.js; GARDEN-COZY.md C2, C7): Espada's words. A wish is said as a
  // noun ("Pip has a wish: a Grief meal."), so the digest can list them
  const SEASON = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }, PHASE_WORD = { dawn: 'dawn', day: 'daytime', dusk: 'dusk', night: 'night' };
  const who = (e) => e.spirit || `your ${e.kind || 'spirit'}`, Who = (e) => { const w = who(e); return w[0].toUpperCase() + w.slice(1); };
  const Cap = (x = '') => x.charAt(0).toUpperCase() + x.slice(1);
  const wishWords = (w = {}) => w.kind === 'food' ? `${an(Cap(w.stat || 'wonder'))} meal`
    : w.kind === 'feature' ? `${an(FEATURES[w.feature]?.name || w.feature)} in the garden`
    : w.kind === 'decor' ? `a piece from the ${SETS[w.set]?.name || Cap(w.set)} set`
    : w.kind === 'photo' ? (w.of ? `a photo of a wild ${w.of}` : 'a photo of its kind in the wild')
    : w.kind === 'visit' ? `a visit from you at ${PHASE_WORD[w.phase] || w.phase}` : 'something small';
  on('spirit.wish', (e) => { if (e.by === 'courier') log.say('info', `${Who(e)} has a wish: ${wishWords(e.wish)}.`, { key: `wish.${who(e)}`, throttle: 30 }); });
  on('spirit.wish.done', (e) => { if (e.by !== 'courier') return; L.inc('spirit.wish.done'); L.inc(`spirit.wish.${e.wish?.kind}`); log.say('gain', `You grant ${who(e)}'s wish.`, { key: `wishdone.${who(e)}`, throttle: 2 }); });
  on('garden.digest', (e) => {
    if (e.by !== 'courier') return;
    log.say('system', `${SEASON[e.season] || 'A new season'} in your Inner Realm: game day ${e.seasonDay} of ${e.seasonDay + e.left - 1}.`, { key: 'digest.0', throttle: 5 });
    const w = (e.wishes || []).slice(0, 2);
    if (w.length) log.say('system', `Wishes: ${w.map((x) => `${who(x)}, ${wishWords(x.wish)}`).join('; ')}${e.wishes.length > 2 ? `; and ${e.wishes.length - 2} more` : ''}.`, { key: 'digest.1', throttle: 5 });
    if (e.bloom?.length) log.say('system', `In bloom: ${e.bloom.map(planet).join(', ')}.`, { key: 'digest.2', throttle: 5 });
    if (e.briar?.length) log.say('system', `Overgrown: ${e.briar.map(planet).join(', ')}.`, { key: 'digest.3', throttle: 5 });
    if (e.mail) log.say('system', `${e.mail} letter${e.mail > 1 ? 's wait' : ' waits'} in the mailbox. Type /letters to read.`, { key: 'digest.4', throttle: 5 });
  });
  // letters and gifts (progress/spiritlife.js MAIL; GARDEN-COZY.md C5): Espada's words. A thank-you says which wish it thanks you for;
  // a released spirit's three postcards run in order: arriving, settling, letting you go on (Spiritfarer's Everdoor, then the mail)
  const THANKS = {
    food: () => 'That meal was just right. I saved the last bite for later, then ate it straight away.',
    feature: (w) => `I sit by the new ${(FEATURES[w.feature]?.name || 'spot').toLowerCase()} every evening. It feels like mine.`,
    decor: () => 'I keep walking past the new piece just to look at it.',
    photo: () => "You found one of my kind out there! I've looked at the photo a hundred times.",
    visit: (w) => `You came at ${PHASE_WORD[w.phase] || 'the time I asked'}, just like I asked. I wasn't sure you would.`,
  };
  const POSTCARDS = [
    "I made it home. It's bigger than I remembered, and louder. I miss how quiet your garden is.",
    "I've made friends here. I told them about you. They don't believe a whole garden fits in a jar.",
    'I still keep my old spot in my head. Look after the new ones for me. Thank you for everything.',
  ];
  const LETTER = {
    thanks: (m) => `${m.from || `Your ${m.kind || 'spirit'}`} writes: "${(THANKS[m.wish?.kind] || (() => "Thank you. I didn't think you'd remember."))(m.wish || {})}"`,
    postcard: (m) => `A postcard from ${m.from || `your old ${m.kind || 'spirit'}`}: "${POSTCARDS[(m.n || 1) - 1] || 'Thinking of you.'}"`,
  };
  on('spirit.letter', (e) => { if (e.by !== 'courier') return; L.inc('spirit.letter'); L.inc(`spirit.letter.${e.about}`); });
  on('spirit.letters', (e) => { if (!e.letters?.length) { log.say('system', 'The mailbox is empty.', { key: 'letters', throttle: 1 }); return; } e.letters.forEach((m, i) => log.say('info', (LETTER[m.about] || (() => 'A letter.'))(m), { key: `letter.${i}`, throttle: 0.2 })); });
  // the season's material (progress/gardenseason.js, GARDEN-COZY.md E3) and a layout's code (/layout, D8): placeholder words, Espada's
  on('garden.season.gift', (e) => { if (e.by !== 'courier') return; L.inc('garden.season.gift'); log.say('loot', `The garden kept you some ${e.label}${e.tier ? ', a fine one' : ''}. It is in your Pneuka Box.`, { key: 'season.gift', throttle: 2 }); });
  on('decor.layout', (e) => log.say('system', e.pieces ? `Your garden's layout (${e.pieces} pieces): ${e.code}` : 'Your garden has nothing placed to share yet.', { key: 'layout', throttle: 1 }));
  on('spirit.gift', (e) => { if (e.by !== 'courier') return; L.inc('spirit.gift'); log.say('loot', `${Who(e)} left a gift on the doorstep: ${an(DECOR[e.id]?.name || 'garden piece')}.`, { key: 'gift', throttle: 2 }); });
  // the farewell (progress/spiritlife.js FAREWELL; GARDEN-COZY.md C6): placeholders for Espada's words
  on('spirit.farewell.ask', (e) => { if (e.by === 'courier') log.say('info', `${Who(e)} asks to go home${FAREWELL_LINES[e.feeling]?.ask ? `: "${FAREWELL_LINES[e.feeling].ask}"` : '.'} When you are ready, let it go from its page; until then it stays.`, { key: `farewell.${who(e)}`, throttle: 30 }); });
  on('spirit.farewell', (e) => { if (e.by !== 'courier') return; L.inc('spirit.farewell'); L.inc(`spirit.farewell.${e.feeling}`); log.say('gain', `${Who(e)} goes home${FAREWELL_LINES[e.feeling]?.go ? `: "${FAREWELL_LINES[e.feeling].go}"` : '.'} It leaves you a statue of itself.`, { key: 'farewell', throttle: 2 }); });
}
