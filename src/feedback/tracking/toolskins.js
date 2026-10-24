// ---------------------------------------------------------------------------------------
// TRACKING, A TOOL'S SKIN (vfx/toolskins.js, vfx/toolskinwear.js): the ledger counts the skins worn (a skin's achievements, Dovina's, are
// predicates over them: `toolskin.set`, `toolskin.<tool>.<skin>`); the log says the change once, in the second person.
//
// Prior art: the skiff's paint (tracking/race.js `skiff.paint`): a look counted and said when chosen.
//
//   toolSkinRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { TOOL_LABEL, skinOf } from '../../vfx/toolskins.js';

export function toolSkinRules({ on, L, log }) {
  on('toolskin.set', (e) => {
    if (e.by !== 'courier') return;
    L.inc('toolskin.set'); L.inc(`toolskin.${e.tool}.${e.skin}`);
    const name = TOOL_LABEL[e.tool] || 'tool';
    log.say('system', e.skin === 'stock' ? `Your ${name} is as it was made.` : `Your ${name} wears ${skinOf(e.tool, e.skin).label}.`, { key: 'toolskin.set', throttle: 0.3 });
  });
}
