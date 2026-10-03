// ---------------------------------------------------------------------------------------
// MACROS: what the Courier has composed (on the lattice, lattice.js, in the Codex: VERITOME, THE MIND), kept, and what a macro does to a
// mind when it is run (veritome/reprogram.js runs it on a stunned creature, after its words are typed).
//
// The book holds FIVE macros (the five a mind shows when it is opened). Each is a lattice; compiled, it is a list of Functions in the order
// the signal met them, the words to type (NEURALESE: SIVA-LON), and a QUALITY that is its strength:
//
//   how long     each Function's base time x (0.5 + q)              x LON for each LON after it
//   how deep     (0.6 + 0.6 q)                                      x DEO for each DEO after it (a status's strength; a drive's push)
//   accepted     a mind takes it with chance 0.45 + 0.55 q (+ how deep, a little); a mind that throws it off wakes, and remembers them
//
// What a Function does is done through the parts of the mind, never round them (docs/AI.md):
//   act     the Brain is given a DIRECTIVE: for so long, that action is what it does (unless something urgent takes it: a stun, a sleep)
//   status  creatures.apply (halt, calm, sleep, melt: the creature decides what each means for it)
//   rel     its own view of another: the Courier taken for kin, or its own kind taken for rivals, for so long (ai/ecology.js relation)
//   drive   a drive pushed toward full (it will want water now: its own reasoning does the rest)
//   mem     a memory wiped (what it knew of them)
// A new creature gets every Function its mind has the parts for: an action it does not have is refused, and the window says so.
//
//   const book = new MacroBook()   book.slots[i] (a Lattice)   book.compiled(i)   book.save()
//   runMacro(game, creature, compiled) -> { ok, refused: [fnIds], q }
// ---------------------------------------------------------------------------------------
import { Lattice } from './lattice.js';
import { FUNCTIONS, knownList } from './functions.js';
import { REL } from '../ai/index.js';

export const SLOTS = 5;
const KEY = 'foolsfortune.veritome.macros';

/** A first macro, so that the first mind opened has something to be told: STIL, straight through (a good one: q 1). */
const STARTER = { pieces: [{ fn: 'stil', x: 0, y: 2, rot: 0 }, { fn: 'wire', x: 2, y: 2, rot: 0 }, { fn: 'wire', x: 3, y: 2, rot: 0 }, { fn: 'wire', x: 4, y: 2, rot: 0 }, { fn: 'wire', x: 5, y: 2, rot: 0 }, { fn: 'wire', x: 6, y: 2, rot: 0 }] };
const STARTER2 = { pieces: [{ fn: 'eza', x: 0, y: 2, rot: 0 }, { fn: 'lon', x: 2, y: 2, rot: 0 }, { fn: 'voyd', x: 3, y: 2, rot: 0 }, { fn: 'wire', x: 5, y: 2, rot: 0 }, { fn: 'wire', x: 6, y: 2, rot: 0 }] };

export class MacroBook {
  /** Once a second or so: any Function newly known (its fact photographed, its deed done) is announced, once (tracking.js says it). */
  watch(game) {
    if (!this.known) {
      let s = null;
      try { s = localStorage.getItem(`${KEY}.known`); } catch { s = null; }
      // (the first time: what is known from the start is simply known, not announced)
      this.known = new Set(s ? JSON.parse(s) : knownList(null).concat(Object.keys(FUNCTIONS).filter((id) => FUNCTIONS[id].how === 'Known from the start.')));
    }
    let changed = false;
    for (const id of knownList(game.ledger)) if (!this.known.has(id)) { this.known.add(id); changed = true; if (FUNCTIONS[id].word) game.events?.emit('mind.learn', { fn: id }); }
    if (changed) try { localStorage.setItem(`${KEY}.known`, JSON.stringify([...this.known])); } catch { /* this session */ }
  }

  constructor() {
    this.slots = Array.from({ length: SLOTS }, () => new Lattice());
    this.names = new Array(SLOTS).fill('');
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
    if (s?.slots) s.slots.forEach((st, i) => { if (i < SLOTS) { this.slots[i] = new Lattice(st); this.names[i] = s.names?.[i] || ''; } });
    else { this.slots[0] = new Lattice(STARTER); this.slots[1] = new Lattice(STARTER2); }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ slots: this.slots.map((l) => l.state()), names: this.names })); } catch { /* this session only */ } }
  compiled(i) { return this.slots[i]?.compile() || null; }
  /** The macros worth offering a mind: those with at least one Function. */
  ready() { return this.slots.map((l, i) => ({ i, c: l.compile() })).filter((m) => m.c.effects.length); }
}

/** Run a compiled macro on a creature (stunned, its mind open). */
export function runMacro(g, c, m, { by = 'courier' } = {}) {
  const q = m.q, refused = [];
  const deep = m.effects.reduce((a, e) => Math.max(a, e.pow), 1);
  const chance = Math.min(0.98, 0.45 + 0.55 * q + (deep - 1) * 0.15);
  if (Math.random() > chance) return { ok: false, refused, q, chance };
  const brain = c.brain;
  for (const e of m.effects) {
    const f = FUNCTIONS[e.fn];
    const dur = (f.base || 10) * (0.5 + q) * e.dur, pow = (0.6 + 0.6 * q) * e.pow;
    if (f.kind === 'status') g.creatures.apply(c, f.status, dur, pow, by);
    else if (f.kind === 'act') {
      if (!brain?.direct?.(f.act, dur)) { refused.push(f.id); continue; }
      if (f.act === 'fetch') c.macro = { id: 'fetch', until: (brain.now || 0) + dur };
    } else if (f.kind === 'rel') {
      c.rel ||= new Map(); c.relUntil ||= new Map();
      const key = f.who === 'courier' ? 'courier' : c.kind;
      c.rel.set(key, f.rel === 'kin' ? REL.KIN : REL.RIVAL); c.relUntil.set(key, (brain?.now || 0) + dur);
      if (f.who === 'courier') { const m = c.mem?.fact?.(g.player); if (m) { m.grudge = 0; m.threat = 0; } } // (kin: no grudge left)
    } else if (f.kind === 'drive') { if (c.drives) c.drives.set(f.drive, Math.min(1, (c.drives.get(f.drive) || 0) + pow)); else refused.push(f.id); }
    else if (f.kind === 'mem') { c.mem?.wipe?.(f.mem); g.creatures.apply(c, 'forget', 3, 1, by); }
  }
  brain?.signal?.();
  return { ok: true, refused, q, chance };
}
