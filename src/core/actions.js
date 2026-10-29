// ---------------------------------------------------------------------------------------
// INPUT ACTIONS (docs/plans/MOBILE.md 6.1; the table core/bindings.js): a verb read as the bindings name it, whatever device gave it, and
// the resolution of a pad button or a touch control to the code it presses NOW. The game reads its keys as ever (core/input.js); a
// driver asks here which code a control means in the live context (CTX_ORDER: race, the rail, the air, the skiff, the rhythm mode, a
// puzzle duel, the god hand, the Spirit Garden, a tool in hand, on foot, anywhere), presses it through `input.hold` (a row's `mods`
// first: a chord), and lets go of those same codes on release, even if the context changed while it was held (a hop held off a crest
// is still Space when it lands).
//
// Prior art: Unity's Input System (action maps switched by context), Unreal's Enhanced Input (mapping contexts with a priority, a lower
// one shadowed key by key), Steam Input's action set layers.
//
//   game.actions = new Actions(game, input)   .live() -> Set of ctx   .resolve(kind, id) -> row | null   .press(kind, id, on) -> code
//   .down(actionId)   .pressed(actionId)   .axis(axisId)   .release()   (the drivers call press; new code may read down / pressed)
// ---------------------------------------------------------------------------------------
import { ACTIONS, rowsFor, codeFor } from './bindings.js';

const BY_ID = new Map(ACTIONS.map((r) => [r.id, r]));
/** The ctx of the tool in hand: its id, the Sondelass's by its form, the Soul Brush's `brush` (bindings.js's `tool.<id>` rows). */
const toolCtx = (t) => `tool.${t.id === 'sondelass' ? t.form || 'cutlass' : t.id === 'soulbrush' ? 'brush' : t.id}`;

export class Actions {
  constructor(game, input) {
    this.game = game; this.input = input;
    this.held = new Map(); // `${kind}:${id}` -> the codes it pressed (a chord's mods, then its key)
    this.cache = null; this.cacheFrame = -1;
  }

  /** The contexts live now (read once a frame): any; riding the Solar Skiff (in the air, on a rail), the Spirit Garden, a puzzle duel,
   *  the god hand, the crossing (`rail`), the open sea's helm, or on foot (and the tool in hand, narrower); a race running; the rhythm
   *  mode playing. */
  live() {
    const g = this.game, frame = g.clock?.frame ?? -1;
    if (this.cache && frame === this.cacheFrame && frame >= 0) return this.cache;
    const L = new Set(['any']), sk = g.techs?.get?.('skiff');
    if (sk?.riding) { L.add('skiff'); if (sk.air) L.add('skiff.air'); if (sk.grind?.on) L.add('skiff.rail'); }
    else if (g.realm?.active) L.add('garden'); // (the garden's own hand: world/garden/hand.js)
    else if (g.duel?.active) L.add('duel'); // (the duel's board has the keys: world/duel/duelsession.js)
    else if (g.god?.active) L.add('godhand');
    else if (g.emocean?.stage?.active) L.add('rail'); // (the crossing: the ship on the stick, the sweep on the look area, core/touchtools.js)
    else if (!g.emocean?.active) {
      if (g.opensea?.sailing) L.add('helm'); // (the open sea's free helm: the stick the rudder, W / S the throttle's taps; not on foot, so no foot tile shows there)
      else {
        L.add('foot'); const t = g.belt?.inHand; if (t) L.add(toolCtx(t));
        const P = g.player, b = g.techs?.get?.('blink');
        if (P?.grounded && (P.posture ?? 'stand') === 'stand' && (b?.usable ? b.usable() : !!b?.enabled)) L.add('foot.ground'); // (the DASH tile's ground press: BLINK, bindings.js)
      }
    }
    if (g.race?.running) L.add('race');
    if (g.rhythm?.active) L.add('rhythm'); // (the rhythm mode's lanes: Wanda's music/rhythm, the digits as pads)
    this.cache = L; this.cacheFrame = frame;
    return L;
  }

  /** The row a pad button or a touch control means now: the narrowest live ctx that binds it (bindings.js CTX_ORDER). */
  resolve(kind, id) { const L = this.live(); return rowsFor(kind, id).find((r) => L.has(r.ctx)) || null; }

  /** A driver's control pressed or let go: the code it means now is held (a chord's mods first, so the key is read with them); on
   *  release, the codes it pressed are let go. Returns the key's code. */
  press(kind, id, on) {
    const k = `${kind}:${id}`;
    if (on) {
      if (this.held.has(k)) return this.held.get(k).at(-1);
      const row = this.resolve(kind, id), code = row && codeFor(row);
      if (!code) return null;
      const codes = [...(row.mods || []), code];
      this.held.set(k, codes); for (const c of codes) this.input.hold(c, true, c === code); // (the key's edge always: a person pressed it, core/input.js)
      return code;
    }
    const codes = this.held.get(k); if (!codes) return null;
    this.held.delete(k); for (const c of [...codes].reverse()) this.input.hold(c, false); // (counted: another control holding one keeps it down, core/input.js)
    return codes.at(-1);
  }
  /** Every control let go (the page hidden, the driver gone). */
  release() { for (const k of [...this.held.keys()]) { const [kind, ...id] = k.split(':'); this.press(kind, id.join(':'), false); } }

  /** An input action held, by its id (any of its keys or its mouse button). */
  down(id) { const r = BY_ID.get(id); return !!r && ((r.keys || []).some((c) => this.input.isDown(c)) || (!!r.mouse && this.input.isDown(r.mouse))); }
  /** An input action pressed this frame. */
  pressed(id) { const r = BY_ID.get(id); return !!r && ((r.keys || []).some((c) => this.input.wasPressed(c)) || (!!r.mouse && this.input.wasPressed(r.mouse))); }
  axis(id) { return this.input.axis(id); }
}
