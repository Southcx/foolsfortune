// ---------------------------------------------------------------------------------------
// THE CLASS ARTS' LOOKS, gathered (docs/plans/art/VFX-LIBRARY.md 4): the 76 class arts (progress/classarts.js CLASS_ARTS) as library
// effects, one module a suit's courts, one the twelve zodiac Majors, one the Fool, the World and the other eight, and the reactions' one
// base, all from the class arts' kit (kit.js). vfx/library.js spreads CLASS_ART_EFFECTS into LIBRARY; vfx/classartlooks.js plays them:
//   art.<id>.use     every action, at the act               art.<id>.hold    an action that lasts, while it does (held: h.stop())
//   art.<id>.fire    every reaction (extending art.react), and an action's own later moment (Beginner's Luck spent, Payback's return)
//   art.<id>.armed   a reaction the runtime holds ready (Momentum, Steadfast, Running on Empty) and Beginner's Luck waiting
//   art.<id>.mark    an action's second place, played at the event's `at` or `target` (Prospect's source, Veil's eye)
//   art.react        the reactions' shared base (reactions.js)
//   and what an art leaves running, the lasting looks' own (lasting.js: played by vfx/classartlasting.js over its meshes)
// ART_DOMAIN says which domain's grammar each art is drawn in (a reaction takes its class's action's), for the caller's ctx.domain.
//
// Prior art: the Dragon Quest and Parasite Eve II spell families (a hundred spells as a dozen shapes in rungs: VFX-PRIOR-ART.md 4).
//
//   CLASS_ART_EFFECTS   ART_DOMAIN[id] -> a domain id ('world' for the World's: all seven)
// ---------------------------------------------------------------------------------------
import { REACTION_BASE } from './reactions.js';
import { WANDS_ART_EFFECTS } from './wands.js';
import { CUPS_ART_EFFECTS } from './cups.js';
import { SWORDS_ART_EFFECTS } from './swords.js';
import { PENTACLES_ART_EFFECTS } from './pentacles.js';
import { MAJOR_ART_EFFECTS } from './majors.js';
import { ARCANA_ART_EFFECTS } from './arcana.js';
import { LASTING_ART_EFFECTS } from './lasting.js';
import { CLASS_ARTS, artsOf } from '../../../progress/classarts.js';

export const CLASS_ART_EFFECTS = {
  ...REACTION_BASE, ...WANDS_ART_EFFECTS, ...CUPS_ART_EFFECTS, ...SWORDS_ART_EFFECTS, ...PENTACLES_ART_EFFECTS, ...MAJOR_ART_EFFECTS, ...ARCANA_ART_EFFECTS, ...LASTING_ART_EFFECTS,
};

/** Each art's domain (the plan's table, section 4; Beginner's Luck, which it leaves out, Divination's: seeing chance). A class's reaction
 *  is drawn in its action's grammar, quietened. */
const ACTION_DOMAIN = {
  beginnersLuck: 'divination', spark: 'manifestation', charge: 'psychokinesis', kindleHeart: 'alteration', command: 'psychokinesis',
  offering: 'manifestation', wade: 'alteration', wellUp: 'ouranurgy', stillWaters: 'possession', scout: 'divination', ripostRush: 'psychokinesis',
  clearSight: 'divination', verdict: 'spellscription', prospect: 'divination', bulwark: 'manifestation', harvest: 'alteration', stronghold: 'manifestation',
  ram: 'psychokinesis', tame: 'possession', arrowOfTime: 'ouranurgy', ride: 'possession', reap: 'alteration', mirageStep: 'alteration', weigh: 'spellscription',
  wish: 'ouranurgy', echo: 'spellscription', bind: 'spellscription', sanctum: 'spellscription', lantern: 'manifestation', completion: 'world',
  sleight: 'alteration', veil: 'possession', bloom: 'manifestation', spin: 'divination', collapse: 'psychokinesis', daybreak: 'ouranurgy',
  suspend: 'ouranurgy', reckoning: 'spellscription',
};
/** Every art's: an action's own, a reaction its class's action's (progress/classarts.js artsOf: the action first). */
export const ART_DOMAIN = Object.fromEntries(Object.entries(CLASS_ARTS).map(([id, R]) => [id, ACTION_DOMAIN[R.kind === 'action' ? id : artsOf(R.cls)[0]]]));
