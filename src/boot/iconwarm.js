// ---------------------------------------------------------------------------------------
// THE ICONS WARMED AHEAD: the Pneuka Box's pictures (pneuka/icons.js: each a model rendered into a little target and read back) drawn one
// at a time in play's quiet frames, so the window's first opening finds them made. Measured on an emulated iPhone XR (v274): the first
// opening took 2,274 ms of script, 2,251 of it the icons (1,663 the read-backs, 1,054 shader compiles), and the second 8 ms; the owner felt
// it on the phone. One icon every QUIET real seconds, none while a window is open, the seam is busy or the title is up
// (called from the tick after its pauses: boot/frame.js).
//
// Prior art: every console game's streaming of UI thumbnails behind play (texture streaming's idle budget), the browser's own
// requestIdleCallback: work that waits for nothing done when nothing waits for it.
//
//   game.iconWarm = new IconWarm(game)   .update(rawDt) (each tick)   .left -> how many of the box's pictures are not yet made
// ---------------------------------------------------------------------------------------
import { itemIcon, toolIcon } from '../pneuka/icons.js';
import { skinNow } from '../vfx/toolskinwear.js';

const QUIET = 0.25; // (real seconds between two icons: one read-back each, a few ms on a phone's GPU)
const TOOLS = ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];

export class IconWarm {
  constructor(game) { this.game = game; this.done = new Set(); this.t = 0; this.left = 0; }

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

  update(dt) {
    const g = this.game;
    if (g.windowOpen?.() || g.seam?.busy || g.title?.active) { this.t = 0; return; }
    if ((this.t += dt) < QUIET) return;
    this.t = 0;
    const w = this.next(); if (!w) return;
    this.done.add(w.key);
    try { w.make(); } catch { /* the window falls back to the glyph */ }
  }
}
