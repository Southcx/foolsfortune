// ---------------------------------------------------------------------------------------
// THE SHRINE GARDEN: the pocket inside the vessel where play already done well keeps paying (docs/DESIGN.md, section 16; ECONOMY.md,
// rule 6; SYSTEMS.md, D7, D8, E3). Rules and state; the place is Petra's, the press Calissa's to draw.
//
// (Real time is read from core/calendar.js now(): the same milliseconds in play, pinned by a replay.)
// - DIVIDEND SLOTS: an ENCOUNTER is mastered when every achievement in its group is done (a predicate over the ledger: retroactive). A
//   mastered encounter set in a slot pays ECON.dividend.share of what farming it by hand pays an hour, in real time, filling for
//   capHours and then waiting to be collected (checking in is rewarded; leaving it for a month is not).
// - BEDS (foraging, a herb run): a material planted grows ECON.garden.yield more of its kind over growHours real hours. The Wells give
//   the seed stock; what grows feeds the spirit press (progress/alchemy.js).
// - UPGRADES (the long sink): another slot or another bed, each dearer than the last, paid in cubes.
// Later, caught Figments (the Lockheart's summoning) work the slots and the beds, Palworld's way.
//
// Prior art: Old School RuneScape's Kingdom of Miscellania (pays while you are away, to a cap) and its herb runs (plant, leave, come
// back), Palworld's base, Stardew Valley's farm, and FFXIV's housing as the sink a player chooses.
//
//   ENCOUNTERS[id] = { id, name, cat, sub }   game.garden = new Garden(game)
//   .mastered(enc) -> bool   .slots -> [{ enc, since }]   .slot(i, enc) -> { ok, why? }   .accrued(i) -> cubes   .collect() -> cubes
//   .beds -> [{ kind, tier, at } | null]   .plant(i, boxSlot) -> { ok, why? }   .ripe(i) -> bool   .harvest(i) -> n
//   .price(kind) -> cubes | null   .upgrade(kind) -> { ok, why? }      (kind: 'slot' | 'bed')
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { makeMaterial } from './econ/materials.js';
import { stream } from '../core/rng.js';
import { now as clock } from '../core/calendar.js'; // (the calendar's clock, not Date.now: a replay pins it, so a replayed visit pays what it paid)

const simRand = stream('progress/garden'); // (what a bed's harvest is seeded from: core/rng.js, the same twice)
const G = ECON.garden, D = ECON.dividend, H = 3600 * 1000, M = (n) => Math.max(1, Math.round(n * ECON.perMinute));

/** The encounters a slot can work: each a group of achievements (achievements.js CATS) that, all done, is mastery of it. */
export const ENCOUNTERS = {
  jelly:     { id: 'jelly',     name: 'the slip jellies',      cat: 'battle',  sub: 'Slip Jellies' },
  crystal:   { id: 'crystal',   name: 'the crystal formations', cat: 'explore', sub: 'The Dreamvane' },
  well:      { id: 'well',      name: 'the Great Dunemaw',     cat: 'explore', sub: 'The Wells' },
  lockheart: { id: 'lockheart', name: 'the Lockheart',         cat: 'battle',  sub: 'The Lockheart' },
  angling:   { id: 'angling',   name: 'the catch',             cat: 'angle',   sub: 'The Catch' },
};

const fresh = () => ({ slots: Array.from({ length: D.slots }, () => ({ enc: null, since: 0 })), beds: Array.from({ length: G.beds }, () => null), bought: { slot: 0, bed: 0 } });

export class Garden {
  constructor(game) {
    this.game = game;
    this.s = fresh();
    game.save?.section('garden', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
  }
  dirty() { this.game.save?.dirty('garden'); }
  get slots() { return this.s.slots; }
  get beds() { return this.s.beds; }

  // ---------------------------------------------------------------- the dividend
  /** Every achievement in the encounter's group done. */
  mastered(enc) {
    const E = ENCOUNTERS[enc], list = this.game.achievements?.list || [], done = this.game.ledger?.done || {};
    const group = E ? list.filter((a) => a.cat === E.cat && a.sub === E.sub) : [];
    return group.length > 0 && group.every((a) => done[a.id] !== undefined);
  }
  /** Set a mastered encounter to work a slot (null clears it); what had accrued there is collected first. */
  slot(i, enc) {
    const S = this.s.slots[i];
    if (!S) return { ok: false, why: 'There is no such slot.' };
    if (enc && !ENCOUNTERS[enc]) return { ok: false, why: 'There is no such encounter.' };
    if (enc && !this.mastered(enc)) return { ok: false, why: `You have not mastered ${ENCOUNTERS[enc].name}: its achievements are not all done.` };
    if (enc && this.s.slots.some((x, j) => j !== i && x.enc === enc)) return { ok: false, why: `${ENCOUNTERS[enc].name} already works a slot.` };
    this.collect(i);
    S.enc = enc || null; S.since = clock();
    this.dirty();
    this.game.events.emit('garden.slot', { slot: i, encounter: S.enc, by: 'courier' });
    return { ok: true };
  }
  /** What a slot has filled with (cubes), to the cap. */
  accrued(i, now = clock()) {
    const S = this.s.slots[i];
    if (!S?.enc) return 0;
    return Math.floor(G.farmRate * D.share * Math.min(D.capHours, Math.max(0, now - S.since) / H));
  }
  /** Collect a slot (or every slot): the cubes come out, and the slot starts filling again. */
  collect(i = null) {
    let n = 0;
    for (const [j, S] of this.s.slots.entries()) {
      if (i != null && j !== i) continue;
      const c = this.accrued(j);
      if (c > 0) { n += c; this.game.events.emit('garden.collect', { slot: j, encounter: S.enc, cubes: c, by: 'courier' }); }
      if (S.enc) S.since = clock();
    }
    if (n > 0) { this.game.cubes?.earn(n, 'dividend'); this.dirty(); }
    return n;
  }

  // ---------------------------------------------------------------- the beds
  /** Plant the material in this box slot in a bed: it grows more of its kind. */
  plant(i, boxSlot) {
    const box = this.game.pneuka, s = box?.slots[boxSlot];
    if (i < 0 || i >= this.s.beds.length) return { ok: false, why: 'There is no such bed.' };
    if (this.s.beds[i]) return { ok: false, why: 'Something already grows there.' };
    if (!s?.id?.startsWith('mat.') || !s.data?.kind) return { ok: false, why: 'Only what a Well gives will grow here.' };
    this.s.beds[i] = { kind: s.data.kind, tier: s.data.tier || 0, at: clock() };
    box.take(boxSlot);
    this.dirty();
    this.game.events.emit('garden.plant', { bed: i, kind: s.data.kind, by: 'courier' });
    return { ok: true };
  }
  ripe(i, now = clock()) { const b = this.s.beds[i]; return !!b && now - b.at >= G.growHours * H; }
  /** Harvest a ripe bed: its yield, of its kind and tier, into the box (each with its own path); the bed is empty again. */
  harvest(i) {
    const b = this.s.beds[i];
    if (!b || !this.ripe(i)) return 0;
    let n = 0;
    for (let k = 0; k < G.yield; k++) {
      const seed = Math.floor(simRand() * 1e9);
      this.game.pneuka?.add(`mat.${b.kind}`, 'garden', 0, makeMaterial(b.kind, seed, b.tier)); n++; // (a full box drops it at their feet)
    }
    this.s.beds[i] = null;
    this.dirty();
    this.game.events.emit('garden.harvest', { bed: i, kind: b.kind, count: n, by: 'courier' });
    return n;
  }

  // ---------------------------------------------------------------- the long sink
  /** What the next slot or bed costs (null when there are no more to buy). */
  price(kind) { const list = G.upgrade[kind], n = this.s.bought[kind] || 0; return list && n < list.length ? M(list[n]) : null; }
  upgrade(kind) {
    const p = this.price(kind);
    if (p == null) return { ok: false, why: `The garden has no room for another ${kind}.` };
    if (!this.game.cubes?.spend(p, 'garden')) return { ok: false, why: `Another ${kind} costs ${p} cubes.` };
    this.s.bought[kind] = (this.s.bought[kind] || 0) + 1;
    if (kind === 'slot') this.s.slots.push({ enc: null, since: 0 }); else this.s.beds.push(null);
    this.dirty();
    this.game.events.emit('garden.upgrade', { kind, price: p, by: 'courier' });
    return { ok: true };
  }
}
