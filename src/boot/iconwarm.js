// ---------------------------------------------------------------------------------------
// THE ICONS WARMED AHEAD: the Pneuka Box's pictures (pneuka/icons.js: each a model rendered into a little target and read back) all
// drawn in one go where a wait is already shown, so the window's first opening finds them made: the end of the boot's warm-up (under the
// loading screen: the tools and a kept save's things) and the title's DEBUG choice (its kit, given there). Measured on an emulated iPhone
// XR (v274): the first opening took 2,274 ms of script, 2,251 of it the icons (1,663 the read-backs, 1,054 shader compiles), and the
// second 8 ms; the owner felt it on the phone. One go, one task: the icons' material copies (and their programs) are let go together
// at its end (icons.js), so nothing is compiled in play and no program is kept (made a few at a time in play, perf v275 measured 12
// programs kept and 72 ms ticks).
//
// Prior art: every console game's loading screen doing the menu's work ahead (the thumbnails baked while the bar fills).
//
//   game.iconWarm = new IconWarm(game)   .warmAll() -> how many were made   .left -> how many of the box's pictures are not yet made
// ---------------------------------------------------------------------------------------
import { itemIcon, toolIcon } from '../pneuka/icons.js';
import { skinNow } from '../vfx/toolskinwear.js';

const TOOLS = ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];

export class IconWarm {
  constructor(game) { this.game = game; this.done = new Set(); this.left = 0; }

  /** What the window would draw next that is not yet made: the belt's tools that have models, then the box's things. */
  next() {
    const g = this.game, want = [];
    for (const id of TOOLS) {
      const has = id === 'psygun' ? g.character?.gunModel : g.belt?.get?.(id)?.model;
      if (has) want.push({ key: `t:${id}:${skinNow(id)}`, make: () => toolIcon(g, id) });
    }
    for (const s of g.pneuka?.slots || []) if (s?.id) want.push({ key: `i:${s.id}`, make: () => itemIcon(g, s.id) });
    const todo = want.filter((w) => !this.done.has(w.key));
    this.left = todo.length;
    return todo[0] || null;
  }

  /** Every picture the window would draw that is not yet made, now. */
  warmAll() {
    let n = 0;
    for (let w = this.next(); w; w = this.next()) { this.done.add(w.key); try { w.make(); n++; } catch { /* the window falls back to the glyph */ } }
    return n;
  }

}
