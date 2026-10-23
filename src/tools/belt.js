// ---------------------------------------------------------------------------------------
// THE TOOL BELT: the Courier's seven psychic tools (the psygun, the Sondelass, the Soul Brush, the Veritome, the Dreamvane, the
// Crucibelle and the Lockheart), and the one set of rules for them. The Courier wears TWO (the owner, 2026-10-23; progress/toolpairs.js):
// the MAIN, drawn into the hands with X and owning what it owns while out (the mouse, the number keys, V), and the SUB, which stays
// where it hangs and lends the main one verb on R (SUB_GIFTS) and its passive. The other five are always owned and wait on the loadout's
// shelf, in the Pneuka Box's window (docs/plans/PNEUKA-BOX.md). Only the main is ever drawn: drawing it first puts any other away, and
// it comes out only once the hands are free. Anything that asks "is a tool out?" (the kick, first person, the HUD, the ledger) asks the
// belt, not a particular tool, and "is it worn?" (a passive, the wire compass) asks `isWorn`, which is the main or the sub.
//
// A tool is anything with this shape (an adapter, as all seven are):
//
//   { id, name,                 'psygun', 'THE PSYGUN'
//     slot,                     where its worn model hangs: 'back' | 'hip' | 'neck' (a place on the body, no longer a capacity)
//     drawT,                    0..1, how far out it is (0 in its holster, 1 in the hands)
//     wants,                    true while it has been asked to come out (it may still be waiting for the hands to be free)
//     stow(), out(),            put it away / ask it out (the belt calls these; a tool never reads a draw key of its own)
//     lend(),                   the sub's verb on R, done from where it hangs (true if it went off)
//     model,                    the worn model (an Object3D), or none (the psygun's is the body's: character.setHidden hides it)
//     rules: { mouse, kick, firstPerson } }   while out: takes the mouse / allows the kick / allows first person
//
// Prior art: Elden Ring's main hand and off hand and NieR: Automata's light and heavy pair (two tools worn, one verb lent by the other);
// Zelda's item belt (one in the hands, a draw and put-away that gates the next); Monster Hunter's loadout changed at camp, never mid-hunt
// (the swap rule: toolpairs.js swapRefusal).
//
//   game.belt.add(tool)   game.belt.get(id)   game.belt.main / .sub (ids)   game.belt.pair (pairOf(main, sub): the card)
//   game.belt.equip(id, 'main' | 'sub', { quiet }) -> true | false (refused: the log says why)   game.belt.mayEquip(id) -> null | the reason
//   game.belt.isWorn(id) (main or sub)   game.belt.isMain(id)   game.belt.keys(input) (X and R, once a frame on foot: main.js; event tool.lend)
//   game.belt.inHand   game.belt.mayDraw(tool)   game.belt.draw(tool)   game.belt.hands (Dexterity: every draw and stow times this)
//   game.belt.allows('kick')   game.belt.others(tool)   game.belt.hipSide(id)   game.belt.hideWorn()   game.belt.only (the Anim Lab's)
// ---------------------------------------------------------------------------------------
import { TOOL_IDS, START, pairOf, swapRefusal } from '../progress/toolpairs.js';

/** X draws and stows the main; R is the sub's verb, on the press (PNEUKA-BOX.md 5: Gulp is a parry, so R can never wait for its release). */
export const DRAW_KEY = 'KeyX', LEND_KEY = 'KeyR';
/** Which hip each hip tool hangs at by choice (R: their right). Two worn on the same side: the one first in the belt's order (TOOL_IDS)
 *  keeps it, the other goes to the other hip, its holster mirrored (the owner, 2026-10-06). */
export const HIP_SIDE = { veritome: 'R', soulbrush: 'L', crucibelle: 'L' };

export class ToolBelt {
  constructor(game) {
    this.game = game;
    this.tools = [];
    this.main = START.main; this.sub = START.sub; // (kept in the kit, pneuka/box.js)
    this.only = null; // a Set of ids shown worn instead (the Anim Lab's stage: workbench/animrig.js), or null
  }
  save() { this.game.save?.dirty('kit'); } // (the belt is kept with the box, whole: core/save.js)

  /** Is this tool worn: the main or the sub? */
  isWorn(id) { return this.only ? this.only.has(id) : id === this.main || id === this.sub; }
  isMain(id) { return id === this.main; }
  /** The card the two make (progress/toolpairs.js PAIRS), or null. */
  get pair() { return pairOf(this.main, this.sub); }

  /** May this tool be made the main or the sub now? Null if so, else the reason in the log's words (quiet: the window asks it to show the
   *  refusal before a click). */
  mayEquip(id) { return this.get(id) ? swapRefusal(this.game) : 'There is no such tool.'; }
  /** Make a tool the main or the sub. The one it replaces goes to the shelf, or, if it was the other of the two, they change places.
   *  Refused by the swap rule, and the log says why at the point of use. `quiet`: a script's own (the overture, the pose audit), never
   *  refused and never said. */
  equip(id, as = 'main', { quiet = false } = {}) {
    if (!this.get(id) || (as !== 'main' && as !== 'sub')) return false;
    if (this[as] === id) return true;
    const why = quiet ? null : this.mayEquip(id);
    if (why) { this.game.log?.say('warn', why, { key: 'belt.swap', throttle: 2 }); return false; }
    const other = as === 'main' ? 'sub' : 'main', was = this[as];
    if (this[other] === id) this[other] = was; // (the two change places)
    this[as] = id;
    const off = was && !this.isWorn(was) ? was : null;
    for (const t of this.tools) if (t.id !== this.main && (t.drawT > 0 || t.wants)) t.stow(); // (only the main is ever drawn)
    if (off) { const t = this.get(off); if (t?.model) t.model.visible = false; }
    this.save();
    if (!quiet) this.game.events?.emit('tool.equip', { tool: id, as, off, pair: this.pair?.n ?? null, by: 'courier' });
    return true;
  }

  /** X and R, read once a frame while the Courier is on foot and theirs (main.js, before the psygun reads its own keys): X draws the main
   *  or puts away whatever is out; R lends the sub's verb. Both hands taken (a ladder, a carry), lying down, a window open: neither. */
  keys(inp) {
    const g = this.game;
    if (!inp?.enabled || g.god?.controlling || g.windowOpen?.() || g.proneHolster?.busy) return;
    const busy = !!g.techs?.active?.handsBusy || !!g.techs?.get?.('carry')?.item;
    if (inp.wasPressed(DRAW_KEY)) {
      const m = this.get(this.main);
      if (m && (m.wants || m.drawT > 0.02)) m.stow(); // (the main out, or on its way: away)
      else if (m && !busy) this.draw(m); // (anything else still going back, an old main just set aside, is put away by the draw)
      else this.inHand?.stow();
    }
    if (inp.wasPressed(LEND_KEY) && !busy) {
      const t = this.get(this.sub);
      if (t?.lend?.()) this.game.events?.emit('tool.lend', { tool: t.id, main: this.main, by: 'courier' }); // (each verb says what it did by its own event: shot.fire, hook.fire, flash.fire ...)
    }
  }

  /** The hip a hip tool hangs at now ('L' | 'R'): its own (HIP_SIDE), unless the other worn hip tool comes first in the belt's order and
   *  wants the same side. */
  hipSide(id) {
    const own = HIP_SIDE[id] || 'R';
    if (!this.isWorn(id)) return own;
    const first = TOOL_IDS.find((x) => x !== id && this.isWorn(x) && this.get(x)?.slot === 'hip');
    return first && TOOL_IDS.indexOf(first) < TOOL_IDS.indexOf(id) && (HIP_SIDE[first] || 'R') === own ? (own === 'R' ? 'L' : 'R') : own;
  }
  /** Once a frame: only the main is drawn, and what is not worn is put away and out of sight (the psygun's is part of their body: the
   *  character hides it). */
  tick() {
    for (const t of this.tools) {
      if (t.id !== this.main && !this.only && (t.drawT > 0 || t.wants)) t.stow();
      if (!this.isWorn(t.id) && t.model?.visible) t.model.visible = false;
    }
    const ch = this.game.character;
    if (ch) { const off = !this.isWorn('psygun'); if (off !== ch.gunOff) { ch.gunOff = off; ch.gun.visible = !off && !ch.hidden; } }
  }

  add(tool) {
    if (this.get(tool.id)) throw new Error(`The belt has the ${tool.id} already.`);
    tool.rules = { mouse: true, kick: false, firstPerson: true, ...(tool.rules || {}) };
    this.tools.push(tool);
    return tool;
  }
  get(id) { return this.tools.find((t) => t.id === id) || null; }

  /** The tool in the hands (or on its way into them), or null. */
  get inHand() {
    let best = null;
    for (const t of this.tools) if (t.drawT > 0.02 || t.wants) if (!best || t.drawT > best.drawT) best = t;
    return best;
  }
  /** How fast every tool comes out and goes back (Dexterity's widening, SOUL-ALCHEMY.md 6): each tool's draw step is times this. */
  get hands() { return this.game.alchemy?.widen?.('dexterity.draw') ?? 1; }
  /** Any tool but this one out, or asked for. */
  others(tool) { return this.tools.some((t) => t !== tool && (t.drawT > 0.02 || t.wants)); }
  /** May this tool come out yet? (every other one is back in its holster) */
  mayDraw(tool) { return !(tool.id !== 'psygun' && this.game.techs?.active?.oneHand) && this.tools.every((t) => t === tool || t.drawT < 0.02); } // (a tech that leaves one hand free, a walking climb, lets only the gun out: SWEEPS group 8)
  /** Ask for a tool: the others are put away first, and it is asked out (`out()`: the prone holster gives back what it put away
   *  through this, tools/proneholster.js). */
  draw(tool) { for (const t of this.tools) if (t !== tool && (t.wants || t.drawT > 0)) t.stow(); tool.out?.(); }
  /** What the tool in the hands allows (true when nothing is out). */
  allows(rule) {
    for (const t of this.tools) if (t.drawT > 0.25 && !t.rules[rule]) return false;
    return true;
  }
  /** Out of sight, every one (each tool shows itself again from its own tick, once it runs). */
  hideWorn() { for (const t of this.tools) if (t.model) t.model.visible = false; }
}

// ---------------------------------------------------------------------------------------
// The tools, as belt tools.
// ---------------------------------------------------------------------------------------
export const psygunTool = (weapon) => ({
  id: 'psygun', name: 'THE PSYGUN', slot: 'back',
  get drawT() { return weapon.drawT; },
  get wants() { return weapon.drawTarget > 0; },
  stow() { weapon.drawTarget = 0; weapon.manualHolster = true; weapon.idleT = 0; },
  out() { weapon.drawTarget = 1; weapon.manualHolster = false; weapon.idleT = 0; }, // (drawn, its idle clock starts over: handed back after the belly, it no longer holsters a second later)
  lend() { return !!weapon.lend?.(); },
  rules: { mouse: true, kick: false, firstPerson: true },
});

/** A tool that is a tech with `drawT` / `drawTarget` and its model at `model.group` (all six but the psygun): its adapter. */
const techTool = (tech, id, name, slot) => ({
  id, name, slot,
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; tech.resume = false; },
  out() { tech.drawTarget = 1; },
  lend() { return !!tech.lend?.(); },
  get model() { return tech.model?.group; },
  rules: { mouse: true, kick: false, firstPerson: true }, // (V is each one's parry while out)
});
export const sondelassTool = (tech) => techTool(tech, 'sondelass', 'THE SONDELASS', 'back');
export const veritomeTool = (tech) => techTool(tech, 'veritome', 'THE VERITOME', 'hip');
export const soulBrushTool = (tech) => techTool(tech, 'soulbrush', 'THE SOUL BRUSH', 'hip');
/** A tool made on tools/heldtool.js (the Dreamvane, the Crucibelle, the Lockheart). */
export const heldTool = (tech, name, slot) => techTool(tech, tech.id, name, slot);
