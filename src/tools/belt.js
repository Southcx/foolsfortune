// ---------------------------------------------------------------------------------------
// THE TOOL BELT: the Courier's psychic tools, and the one set of rules for them. There will be seven; four exist (the Psygun, the
// Sondelass, the Soul Brush and the Veritome). Every tool is worn somewhere on the body (a holster), drawn into the hands by its own key, and while it is out it owns
// what it owns: the mouse, the number keys, the V key. Only one is in the hands at a time: drawing one first puts the other away, and
// the new one comes out only once the old one is back in its place. Anything that asks "is a tool out?" (the kick, first person, the
// HUD, the ledger) asks the belt, not a particular tool, so a new tool is one file and one line here, not a hunt through the game.
//
// A tool is anything with this shape (an adapter, as all four are):
//
//   { id, name, key,            'psygun', 'THE PSYGUN', 'KeyX'  (the key that draws / stows it: the tool reads it itself)
//     slot,                     where it is worn: 'back' | 'hip' | 'chest' | 'wrist' | ...
//     drawT,                    0..1, how far out it is (0 in its holster, 1 in the hands)
//     wants,                    true while it has been asked to come out (it may still be waiting for the hands to be free)
//     stow(),                   put it away (the belt calls this on the others when one is drawn)
//     model,                    the worn model (an Object3D), or none (the psygun's is the body's: character.setHidden hides it)
//     rules: { mouse, digits, kick, firstPerson } }   while out: takes the mouse / takes 1-9 / allows the kick / allows first person
//
// Prior art: the item belts of Zelda (one item per button, one in the hands, a draw and put-away animation that gates the next), and the
// weapon wheels of Ratchet & Clank and Devil May Cry (a small fixed set of very different tools behind one shared contract).
//
//   game.belt.add(tool)    game.belt.get('sondelass')    game.belt.inHand    game.belt.mayDraw(tool)    game.belt.draw(tool)
//   game.belt.allows('kick')   game.belt.others(tool)   game.belt.hideWorn()  (every worn model put out of sight at once: the Courier
//   has become something else and her tools' own ticks are not running, the God Hand's jar)
// ---------------------------------------------------------------------------------------
export const BELT_SIZE = 7;

export class ToolBelt {
  constructor(game) {
    this.game = game;
    this.tools = [];
  }

  add(tool) {
    if (this.tools.length >= BELT_SIZE) throw new Error(`The belt holds ${BELT_SIZE} tools.`);
    tool.rules = { mouse: true, digits: true, kick: false, firstPerson: true, ...(tool.rules || {}) };
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
  /** Any tool but this one out, or asked for. */
  others(tool) { return this.tools.some((t) => t !== tool && (t.drawT > 0.02 || t.wants)); }
  /** May this tool come out yet? (every other one is back in its holster) */
  mayDraw(tool) { return this.tools.every((t) => t === tool || t.drawT < 0.02); }
  /** Ask for a tool: the others are put away first. */
  draw(tool) { for (const t of this.tools) if (t !== tool && (t.wants || t.drawT > 0)) t.stow(); }
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
  id: 'psygun', name: 'THE PSYGUN', key: 'KeyX', slot: 'back',
  get drawT() { return weapon.drawT; },
  get wants() { return weapon.drawTarget > 0; },
  stow() { weapon.drawTarget = 0; weapon.manualHolster = true; },
  rules: { mouse: true, digits: true, kick: false, firstPerson: true },
});

export const sondelassTool = (tech) => ({
  id: 'sondelass', name: 'THE SONDELASS', key: 'KeyQ', slot: 'back',
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; },
  get model() { return tech.model?.group; },
  rules: { mouse: true, digits: true, kick: false, firstPerson: true }, // (V is its guard)
});

export const veritomeTool = (tech) => ({
  id: 'veritome', name: 'THE VERITOME', key: 'KeyJ', slot: 'hip',
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; },
  get model() { return tech.model?.group; },
  rules: { mouse: true, digits: false, kick: false, firstPerson: true },
});

export const soulBrushTool = (tech) => ({
  id: 'soulbrush', name: 'THE SOUL BRUSH', key: 'KeyG', slot: 'hip',
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; },
  get model() { return tech.model?.group; },
  rules: { mouse: true, digits: false, kick: false, firstPerson: true },
});
