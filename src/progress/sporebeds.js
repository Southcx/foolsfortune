// ---------------------------------------------------------------------------------------
// THE SPORE BEDS: the mycelium's beds as kept and worked (docs/plans/MYCELIUM.md section 3; the rules are progress/mycelium.js). A bed is
// granted when its feature is placed in the Inner Realm (the world's: Petra's), INOCULATED with a strain you hold, then SET with what
// you give it from the Pneuka Box (one thing, or two curios for the lichen's graft). It works for its strain's game hours (paced by its
// neighbours' strains, which the world tells it), and what it gives WAITS in it, never spoiling, until you take it. For the first game
// hour a thing set may be taken back unchanged (the colony has not taken). A spirit set to tend a bed works it a quarter faster.
//
// The strains held: the oyster and the inkcap (rot and print: the colour road first) come with the first bed; the others are seeded by
// Myggdrasil's branches and its seventh cap (progress/myggdrasil.js calls `learn`).
//
// Prior art: Stardew Valley's kegs and casks (set it, leave it, it waits), Legend of Mana's planting, and the garden's own beds
// (progress/garden.js: the same save, the same clock).
//
//   game.sporeBeds = new SporeBeds(game, { itemOf })   .beds -> [{ strain, set, at, hours, near, tend, plot }]   .strains -> { feeling: true }
//   .grant(plot?)   .bedOf(plot) -> i   .moved(from, to)   .learn(feeling)   .inoculate(i, feeling) -> { ok, why? }   .set(i, boxSlots) -> { ok, why? }   .back(i) -> { ok, why? }
//   .near(i, feelings)   .tend(i, on)   .worker(i, entry|null)   .workerOf(i)   .seedBy()   .surround(i, { ground, water }) -> k   .ready(i) -> bool   .left(i) -> real ms   .harvest(i) -> { ok, why?, out }
// events: spore.bed, spore.learn { strain }, spore.inoculate { bed, strain }, spore.set { bed, strain, things }, spore.back { bed },
//         spore.tend { bed, spirit, kind, on }, spore.seeded { bed, strain, spirit, kind }, spore.harvest { bed, strain, verb, made, things, tier, up, pair, bent }, each with `by`
// ---------------------------------------------------------------------------------------
import { STRAINS, digest, bedHours, signatureOf } from './mycelium.js';
import * as calendar from '../core/calendar.js';
import { growthK } from './bedgrowth.js';

const clock = calendar.now, GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24;
/** The numbers: the first strains given, how long a thing set may be taken back, what a tending spirit adds to the pace. */
export const SPORE = { first: ['grief', 'desire'], takeBack: 1, tend: 0.25 };
/** A spirit at a bare bed (G155): after `days` game days beside it, a spirit of `bond` or more whose own feeling's strain you hold seeds
 *  that strain there (the colony takes in its own time; nothing is spent). A spirit tending a bed is `worker`, its entry's key kept. */
export const SEED = { days: 3, bond: 30 };
const fresh = () => ({ beds: [], strains: {}, seed: 1 });

/** A thing out of the Pneuka Box as the mycelium reads it (a material's own kind kept as `of`). `itemOf` is the box's (pneuka/items.js),
 *  passed in, so this module stays pure enough for a Node script (the gate's data.three rule). */
export function thingOf(slot, itemOf) {
  if (!slot?.id || !itemOf) return null;
  const it = itemOf(slot.id); if (!it) return null;
  return it.kind === 'material' ? { ...it, ...(slot.data || {}), of: slot.data?.kind, kind: 'material', id: slot.id } : { ...it, ...(slot.data || {}), kind: it.kind, id: slot.id };
}
/** A thing back into the box (a material with its colour and path as its data). */
function give(game, x) {
  if (x.kind === 'material') return game.pneuka?.add(`mat.${x.of}`, 'garden', 0, { kind: x.of, tier: x.tier, hue: x.hue, sat: x.sat, path: x.path }) ?? -1;
  return game.pneuka?.add(x.id, 'garden') ?? -1;
}

export class SporeBeds {
  constructor(game, { itemOf = () => null } = {}) {
    this.game = game; this.s = fresh(); this.itemOf = itemOf;
    game.save?.section('sporebeds', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    game.events?.on?.('garden.place', (e) => { if (e.by === 'courier' && e.feature === 'sporebed') { const i = this.grant(e.plot); if (STRAINS[e.feeling] && this.s.strains[e.feeling]) this.inoculate(i, e.feeling); } }); // (placed in a feeling you hold spores of: that strain)
    game.events?.on?.('garden.move', (e) => { if (e.feature === 'sporebed') this.moved(e.from, e.to); });
    game.events?.on?.('spirit.release', (e) => { if (e.by === 'courier') this.beds.forEach((b, i) => { if (b.worker && (e.spirit ? b.worker.name === e.spirit : !b.worker.name && b.worker.kind === e.kind)) this.worker(i, null); }); }); // (a spirit let go leaves its bed)
    game.events?.on?.('garden.enter', (e) => { if ((e?.by ?? 'courier') === 'courier') this.seedBy(); });
  }
  dirty() { this.game.save?.dirty('sporebeds'); }
  get beds() { return this.s.beds; }
  get strains() { return this.s.strains; }
  emit(name, e) { this.game.events?.emit(name, { ...e, by: 'courier' }); }

  /** A bed granted (its feature placed in a plot: the world pays for it); the first comes with the oyster and the inkcap. */
  grant(plot = null) {
    this.s.beds.push({ strain: null, set: null, at: 0, hours: 0, near: [], tend: false, plot });
    if (this.s.beds.length === 1) for (const f of SPORE.first) this.learn(f);
    this.dirty(); this.emit('spore.bed', { bed: this.s.beds.length - 1 });
    return this.s.beds.length - 1;
  }
  /** The bed standing in a plot (world/garden/plots.js's id), or -1. */
  bedOf(plot) { return plot == null ? -1 : this.s.beds.findIndex((b) => b.plot === plot); }
  /** The hand moved a bed to another plot: its colony goes with it. */
  moved(from, to) { const i = this.bedOf(from); if (i >= 0) { this.s.beds[i].plot = to; this.dirty(); } }
  learn(feeling) { if (!STRAINS[feeling] || this.s.strains[feeling]) return false; this.s.strains[feeling] = true; this.dirty(); this.emit('spore.learn', { strain: feeling }); return true; }

  inoculate(i, feeling) {
    const b = this.s.beds[i];
    if (!b) return { ok: false, why: 'There is no such bed.' };
    if (!this.s.strains[feeling]) return { ok: false, why: 'You hold no spores of that strain.' };
    if (b.set) return { ok: false, why: 'Something is working in it. Take it out first.' };
    b.strain = feeling; this.dirty(); this.emit('spore.inoculate', { bed: i, strain: feeling });
    return { ok: true };
  }
  /** The strains of the beds beside this one (the world's layout says; they pace it: mycelium.js bedHours). */
  near(i, feelings = []) { const b = this.s.beds[i]; if (b) { b.near = feelings.filter((f) => STRAINS[f]); if (b.set) b.hours = this.hoursOf(b); this.dirty(); } }
  tend(i, on = true) { const b = this.s.beds[i]; if (b) { b.tend = !!on; if (b.set) b.hours = this.hoursOf(b); this.dirty(); } }
  hoursOf(b) { return bedHours(b.strain, b.near) / (b.tend ? 1 + SPORE.tend : 1) / (b.k || 1); }

  /** A spirit set to work a bed (G153; `entry` from game.bound.list, or null to let it go): the bed is tended, a quarter faster, and the
   *  spirit's grain bends what it makes (mycelium.js BEND). The world's page does the assigning; a spirit standing by one does it too. */
  worker(i, entry = null) {
    const b = this.s.beds[i]; if (!b) return { ok: false, why: 'There is no such bed.' };
    if (entry && !entry.sp) return { ok: false, why: 'It has not been raised yet.' };
    const was = b.worker; b.worker = entry ? { name: entry.name || null, kind: entry.kind, key: entry.name || `${entry.kind}@${entry.at ?? 0}`, day: calendar.today() } : null;
    b.tend = !!entry; if (b.set) b.hours = this.hoursOf(b);
    this.dirty(); this.emit('spore.tend', { bed: i, spirit: entry?.name || was?.name || null, kind: entry?.kind || was?.kind || null, on: !!entry });
    return { ok: true };
  }
  /** The bound entry working a bed, if it is still bound. */
  workerOf(i) { const w = this.s.beds[i]?.worker; return w ? (this.game.bound?.list || []).find((e) => (e.name || `${e.kind}@${e.at ?? 0}`) === w.key) || null : null; }
  /** The game day's look at the bare beds: a spirit that has been beside one for SEED.days seeds its own feeling's strain in it. */
  seedBy(day = calendar.today()) {
    this.s.beds.forEach((b, i) => {
      const e = b.worker && !b.strain && !b.set ? this.workerOf(i) : null, f = e?.sp?.feeling;
      if (!e || !STRAINS[f] || !this.s.strains[f] || (e.sp.bond || 0) < SEED.bond || day - (b.worker.day ?? day) < SEED.days) return;
      if (this.inoculate(i, f).ok) this.emit('spore.seeded', { bed: i, strain: f, spirit: e.name || null, kind: e.kind });
    });
  }
  /** The ground and water at a bed (the world's, whenever they change): a bed on its own strain's ground or watered with it grows faster
   *  (realm.js GROWTH; bedgrowth.js). What is set keeps the share of its work done when the pace changes. */
  surround(i, ctx = {}) {
    const b = this.s.beds[i]; if (!b) return 1;
    const k = growthK({ feeling: b.strain, ground: ctx.ground, water: ctx.water }), was = b.k || 1;
    if (k !== was) { if (b.set) { const done = (clock() - b.at) / (b.hours * GAME_HOUR); b.k = k; b.hours = this.hoursOf(b); b.at = clock() - done * b.hours * GAME_HOUR; } else b.k = k; this.dirty(); }
    return k;
  }

  /** Set what you give it from the box (one slot, or two for the lichen's graft): checked against its strain first, taken only if good. */
  set(i, boxSlots = []) {
    const b = this.s.beds[i], box = this.game.pneuka;
    if (!b) return { ok: false, why: 'There is no such bed.' };
    if (!b.strain) return { ok: false, why: 'The bed has no strain in it yet.' };
    if (b.set) return { ok: false, why: 'Something is already working in it.' };
    const slots = [...new Set(boxSlots)], things = slots.map((k) => thingOf(box?.slots[k], this.itemOf));
    if (things.some((x) => !x)) return { ok: false, why: 'There is nothing there to set.' };
    const trial = digest(b.strain, things, 1);
    if (!trial.ok) return { ok: false, why: `It will not take: ${trial.why}.` };
    for (const k of slots.sort((a, c) => c - a)) box.take(k);
    b.set = things.map((x) => ({ ...x })); b.at = clock(); b.hours = this.hoursOf(b);
    this.dirty(); this.emit('spore.set', { bed: i, strain: b.strain, things: things.map((x) => x.id) });
    return { ok: true };
  }
  /** Taken back unchanged, within the first game hour (after that the colony has taken). */
  back(i) {
    const b = this.s.beds[i];
    if (!b?.set) return { ok: false, why: 'There is nothing set in it.' };
    if (clock() - b.at > SPORE.takeBack * GAME_HOUR) return { ok: false, why: 'The colony has taken. Let it work.' };
    for (const x of b.set) give(this.game, x);
    b.set = null; this.dirty(); this.emit('spore.back', { bed: i });
    return { ok: true };
  }
  left(i, now = clock()) { const b = this.s.beds[i]; return b?.set ? Math.max(0, b.at + b.hours * GAME_HOUR - now) : 0; }
  ready(i, now = clock()) { const b = this.s.beds[i]; return !!b?.set && this.left(i, now) <= 0; }

  /** What it made, into the box (a full box drops it at your feet, as every gift does); the bed is free again, its strain kept. */
  harvest(i) {
    const b = this.s.beds[i];
    if (!this.ready(i)) return { ok: false, why: b?.set ? 'It is still working.' : 'There is nothing set in it.' };
    const seed = (this.s.seed = (this.s.seed * 48271) % 2147483647), r = digest(b.strain, b.set, seed, { grain: this.workerOf(i)?.traits || this.workerOf(i)?.grain || null });
    if (!r.ok) { for (const x of b.set) give(this.game, x); b.set = null; this.dirty(); return { ok: false, why: r.why }; } // (cannot happen once set; given back if it does)
    for (const x of r.out) give(this.game, x);
    const verb = STRAINS[b.strain].verb, things = b.set.map((x) => x.id), was = Math.max(...b.set.map((x) => signatureOf(x)?.tier ?? 0));
    b.set = null; this.dirty();
    this.emit('spore.harvest', { bed: i, strain: b.strain, verb, made: r.out.map((x) => x.id), names: r.out.map((x) => this.itemOf(x.id)?.name || x.id), things, tier: Math.max(0, ...r.out.map((x) => this.itemOf(x.id)?.tier ?? x.tier ?? 0)), up: verb === 'graft' && (this.itemOf(r.out[0].id)?.tier ?? 0) > was, pair: verb === 'graft' ? `${[...things].sort().join('+')}>${r.out[0]?.id}` : null, bent: r.bent || null }); // (pair: the Grimoire's line, a graft's two and what it made)
    return { ok: true, out: r.out };
  }
}
