// ---------------------------------------------------------------------------------------
// PANIC'S MARK (plain name; the thrown hit and its panic are Dovina's, world/impacts.js and progress/sandbox.js; docs/plans/SANDBOX.md
// 5, "a burst of panic over a struck creature (a world mark)"): a creature struck by a thrown thing, anywhere in the game (a crate the
// god hand flung, a ball kicked, a brick off a falling tower), wears the comics' startle over its head for a beat: the startle lines
// fanned out from its head and the sweat drops flung off it (vfx/glyphs.js 'panic'), popped with its drops thrown and a ring
// (vfx/library/panic.js 'panic'); a heavy one (the runtime's `heavy`, a flooring hit) bigger, more lines, more drops, the burst
// behind it, and the stars of a knocked head spun off ('panicHeavy', 'panic.heavy'). It follows the creature while it shows. A
// creature already wearing one is not given a second (a heavy one replaces a light one). No words: a world mark (the log says the rest).
// The creature is the one the thrown blow just landed on (vfx/vfx.js `lastThrown`, set in the same call that emits `impact.hit`).
// A sound for it (`impact.hit` with `panic`, by `heavy`) is Wanda's: docs/handoffs/wanda/2026-10-30-from-calissa-mimicry-sandbox-sounds.md.
//
// Prior art: Dawn of Mana's panic (Square Enix, 2006: a foe struck by an object startles, sweating, stars over its head, and pays out
// more while it lasts), Mort Walker's Lexicon of Comicana (1980: emanata, the lines a startled head gives off; plewds, the sweat drops of
// worry; squeans, the stars of a dizzy one), the manga sweat drop, the house's own glyph pops (the "!" over an alerted foe).
//
//   game.panicMarks = new PanicMarks(game)   (boot/rooms.js)   .update(raw) (boot/frame.js)   .mark(c, heavy)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The numbers: the light mark's and the heavy one's glyph (size, life, how far it rises), how high over the head's top it sits (m),
 *  and how fresh the thrown blow must be to be this event's (real ms). */
export const PANIC_LOOK = { light: { size: 0.62, life: 1.05, float: 0.12 }, heavy: { size: 0.95, life: 1.45, float: 0.16, burst: true, ring: true }, over: 0.18, fresh: 60 };
const P = PANIC_LOOK;

export class PanicMarks {
  constructor(game) {
    this.game = game; this.live = new Map();
    game.events?.on?.('impact.hit', (e) => { if (e?.panic) this.struck(e); });
  }

  /** The creature the thrown blow landed on (the vfx's note of it, if it is this event's), and its mark. */
  struck(e) {
    const V = this.game.vfx, n = V?.lastThrown;
    if (!n?.ent || performance.now() - n.t > P.fresh) return;
    V.lastThrown = null;
    this.mark(n.ent, !!e.heavy);
  }

  /** Where the creature's head's top is now. */
  headOf(c, out = new THREE.Vector3()) {
    const h = c.height ?? (c.radius ? c.radius * 2 : 1.2);
    return out.set(c.pos.x, c.pos.y + h + P.over, c.pos.z);
  }

  /** The mark over a creature: its glyph following the head, its drops thrown (a heavy one replaces a light one, never two at once). */
  mark(c, heavy = false) {
    const g = this.game; if (!c?.pos || !g.glyphs) return null;
    const had = this.live.get(c);
    if (had && had.q.t < had.q.life) { if (had.heavy || !heavy) return had.q; had.q.close(); }
    const at = this.headOf(c), O = heavy ? P.heavy : P.light;
    const q = g.glyphs.pop(heavy ? 'panicHeavy' : 'panic', at, { color: 0xffffff, size: O.size, life: O.life, float: O.float, burst: !!O.burst, ring: !!O.ring, follow: () => this.headOf(c, at) });
    this.live.set(c, { q, heavy });
    g.vfx?.play(heavy ? 'panic.heavy' : 'panic', { pos: at.clone(), normal: new THREE.Vector3(0, 1, 0) });
    return q;
  }

  /** Marks whose glyph is done let go of their creature. */
  update() {
    for (const [c, m] of this.live) if (m.q.t >= m.q.life) this.live.delete(c);
  }
}
