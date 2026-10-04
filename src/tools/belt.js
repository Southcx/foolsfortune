// ---------------------------------------------------------------------------------------
// THE TOOL BELT: the Courier's psychic tools, and the one set of rules for them: seven (the Psygun, the Sondelass, the Soul Brush,
// the Veritome, the Dreamvane, the Crucibelle and the Lockheart). Every tool is worn somewhere on the body (a holster), drawn into the hands by its own key, and while it is out it owns
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
// (The last three are built on tools/heldtool.js and joined with `heldTool`: the Dreamvane (K, back), the Crucibelle (U, hip) and the
// Lockheart (I, neck: the one place free, so they start with it on).)
//
// WORN or CARRIED: a tool is worn in a PLACE on their body (two across the back, one at each hip, one at the neck: PLACES) and drawn with
// its key, or carried in the Pneuka Box as a thing (pneuka/items.js) and not to hand. Seven tools and five places: what they take out is
// a choice, Resident Evil's and Zelda's inventory made a matter of where on the body a thing can go (the box puts them on and off).
//
//   game.belt.add(tool)    game.belt.get('sondelass')    game.belt.inHand    game.belt.mayDraw(tool)    game.belt.draw(tool)
//   game.belt.isWorn(id)   game.belt.wear(id) / takeOff(id) (the box calls these)   game.belt.ready(id) (a key pressed: true, or says why not)
//   game.belt.allows('kick')   game.belt.others(tool)   game.belt.hideWorn()  (every worn model put out of sight at once: the Courier
//   has become something else and their tools' own ticks are not running, the God Hand's jar)
// ---------------------------------------------------------------------------------------
export const BELT_SIZE = 7;
/** The places on their body a tool can be worn, and how many of each: seven tools, five places (the rest ride in the Pneuka Box). */
export const PLACES = { back: 2, hip: 2, neck: 1 };
const KEY = 'foolsfortune.pneuka.belt'; // (progress: cleared with the box on a new build, progress.js)

export class ToolBelt {
  constructor(game) {
    this.game = game;
    this.tools = [];
    this.worn = null; // Set of tool ids, or null until the first load (then: the four they start with)
    try { const w = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(w)) this.worn = new Set(w); } catch { /* nothing kept */ }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify([...this.worn])); } catch { /* this session only */ } }

  /** Is this tool worn (and so drawn with its key), or in the box? */
  isWorn(id) { return !this.worn || this.worn.has(id); }
  /** The tools worn in a place. */
  inPlace(place) { return this.tools.filter((t) => t.slot === place && this.isWorn(t.id)); }
  /** Put a tool on: into a free place of its kind, or in place of the one there longest. Returns the id taken off to make room, null if
   *  there was room, or false if it cannot be worn at all. */
  wear(id) {
    const t = this.get(id);
    if (!t || !PLACES[t.slot]) return false;
    if (this.isWorn(id)) return null;
    const there = this.inPlace(t.slot);
    let off = null;
    if (there.length >= PLACES[t.slot]) { off = there[0].id; this.takeOff(off, true); } // (said with the wearing: tool.wear's `off`)
    this.worn.add(id); this.save();
    this.game.events?.emit('tool.wear', { tool: id, off });
    return off;
  }
  takeOff(id, quiet = false) {
    const t = this.get(id);
    if (!t || !this.worn.has(id)) return false;
    if (t.drawT > 0 || t.wants) t.stow();
    this.worn.delete(id); this.save();
    if (t.model) t.model.visible = false;
    if (!quiet) this.game.events?.emit('tool.off', { tool: id });
    return true;
  }
  /** A tool's key was pressed: may it come out? (worn: yes; in the box: no, and they say why) */
  ready(id) {
    if (this.isWorn(id)) return true;
    const t = this.get(id);
    this.game.log?.say('warn', `${(t?.name || 'That tool').replace(/^THE /, 'The ').replace(/\B[A-Z]+/g, (m) => m.toLowerCase())} is in your Pneuka Box (P).`, { key: `belt.${id}`, throttle: 2 });
    return false;
  }
  /** Once a frame: what is not worn stays put away and out of sight (the Psygun's is part of their body: the character hides it). */
  tick() {
    if (!this.worn) { this.worn = new Set(this.tools.filter((t) => t.start !== false).map((t) => t.id)); this.save(); }
    for (const t of this.tools) {
      if (this.worn.has(t.id)) continue;
      if (t.drawT > 0 || t.wants) t.stow();
      if (t.model && t.model.visible) t.model.visible = false;
    }
    const ch = this.game.character;
    if (ch) { const off = !this.isWorn('psygun'); if (off !== ch.gunOff) { ch.gunOff = off; ch.gun.visible = !off && !ch.hidden; } }
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
  rules: { mouse: true, digits: true, kick: false, firstPerson: true }, // (1 is its flash: tools/veritome/flash.js)
});

/** A tool made on tools/heldtool.js (the Dreamvane, the Crucibelle, the Lockheart): its adapter. `start`: worn by a new Courier. */
export const heldTool = (tech, name, slot, start = false) => ({
  id: tech.id, name, key: tech.key, slot, start,
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; },
  get model() { return tech.model?.group; },
  rules: { mouse: true, digits: true, kick: false, firstPerson: true },
});

export const soulBrushTool = (tech) => ({
  id: 'soulbrush', name: 'THE SOUL BRUSH', key: 'KeyG', slot: 'hip',
  get drawT() { return tech.drawT; },
  get wants() { return tech.drawTarget > 0; },
  stow() { tech.drawTarget = 0; },
  get model() { return tech.model?.group; },
  rules: { mouse: true, digits: false, kick: false, firstPerson: true },
});
