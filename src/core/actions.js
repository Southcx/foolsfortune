// ---------------------------------------------------------------------------------------
// INPUT ACTIONS (docs/plans/MOBILE.md 6.1; the table core/bindings.js): a verb read as the bindings name it, whatever device gave it, and
// the resolution of a pad button or a touch control to the code it presses NOW. The game reads its keys as ever (core/input.js); a
// driver asks here which code a control means in the live context (CTX_ORDER: race, the rail, the air, the skiff, on foot, anywhere),
// presses it through `input.hold`, and lets go of that same code on release, even if the context changed while it was held (a hop held
// off a crest is still Space when it lands).
//
// Prior art: Unity's Input System (action maps switched by context), Unreal's Enhanced Input (mapping contexts with a priority, a lower
// one shadowed key by key), Steam Input's action set layers.
//
//   game.actions = new Actions(game, input)   .live() -> Set of ctx   .resolve(kind, id) -> row | null   .press(kind, id, on) -> code
//   .down(actionId)   .pressed(actionId)   .axis(axisId)   .release()   (the drivers call press; new code may read down / pressed)
// ---------------------------------------------------------------------------------------
import { ACTIONS, rowsFor, codeFor } from './bindings.js';

const BY_ID = new Map(ACTIONS.map((r) => [r.id, r]));

export class Actions {
  constructor(game, input) {
    this.game = game; this.input = input;
    this.held = new Map(); // `${kind}:${id}` -> the code it pressed
    this.cache = null; this.cacheFrame = -1;
  }

  /** The contexts live now (read once a frame): any; on foot, or riding the Solar Skiff (in the air, on a rail); a race running. */
  live() {
    const g = this.game, frame = g.clock?.frame ?? -1;
    if (this.cache && frame === this.cacheFrame && frame >= 0) return this.cache;
    const L = new Set(['any']), sk = g.techs?.get?.('skiff');
    if (sk?.riding) { L.add('skiff'); if (sk.air) L.add('skiff.air'); if (sk.grind?.on) L.add('skiff.rail'); }
    else if (!g.god?.active && !g.realm?.active && !g.emocean?.active) L.add('foot');
    if (g.race?.running) L.add('race');
    if (g.rhythm?.active) L.add('rhythm'); // (the rhythm mode's lanes: Wanda's music/rhythm, the digits as pads)
    this.cache = L; this.cacheFrame = frame;
    return L;
  }

  /** The row a pad button or a touch control means now: the narrowest live ctx that binds it (bindings.js CTX_ORDER). */
  resolve(kind, id) { const L = this.live(); return rowsFor(kind, id).find((r) => L.has(r.ctx)) || null; }

  /** A driver's control pressed or let go: the code it means now is held; on release, the code it pressed is let go. */
  press(kind, id, on) {
    const k = `${kind}:${id}`;
    if (on) {
      if (this.held.has(k)) return this.held.get(k);
      const row = this.resolve(kind, id), code = row && codeFor(row);
      if (!code) return null;
      this.held.set(k, code); this.input.hold(code, true);
      return code;
    }
    const code = this.held.get(k); if (!code) return null;
    this.held.delete(k); this.input.hold(code, false); // (counted: another control holding it keeps it down, core/input.js)
    return code;
  }
  /** Every control let go (the page hidden, the driver gone). */
  release() { for (const k of [...this.held.keys()]) { const [kind, ...id] = k.split(':'); this.press(kind, id.join(':'), false); } }

  /** An input action held, by its id (any of its keys or its mouse button). */
  down(id) { const r = BY_ID.get(id); return !!r && ((r.keys || []).some((c) => this.input.isDown(c)) || (!!r.mouse && this.input.isDown(r.mouse))); }
  /** An input action pressed this frame. */
  pressed(id) { const r = BY_ID.get(id); return !!r && ((r.keys || []).some((c) => this.input.wasPressed(c)) || (!!r.mouse && this.input.wasPressed(r.mouse))); }
  axis(id) { return this.input.axis(id); }
}
