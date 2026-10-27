// ---------------------------------------------------------------------------------------
// SALVAGE AND THE SHIP'S PARTS (docs/plans/OPEN-SEA.md 14.4; the owner, 2026-10-27: the open sea "feels underwhelming/underbaked"): what
// the sea gives that is worth sailing for, beyond a find's fee paid once.
//   SALVAGE   a wreck is a site: alongside it, with the Sondelass worn (the hook: the harpoon mount at sea), a crate is hauled up. The first
//             salvage of a wreck gives its tier's crates; after that the sea gives one more a game day (what the swell turns up), so the
//             open sea keeps a small faucet once it is charted (section 9's open call). A crate is cubes, mostly; sometimes a ship's part.
//   THE SHIP'S PARTS  a sail, a keel and a hull fitting, each a trade, never an upgrade (the skiff garage's rule, skiffparts.js): the sea
//             feeds the ship you sail it in. A part is found in salvage (rare wrecks more often) or taken from a legend beast; worn at a
//             dock; it changes the polar the wind reads (wind.js `rig`), the helm's turn and way, the hull's hits.
//
// Prior art: Sea of Thieves (shipwrecks' crates and the harpoon that pulls them in), Subnautica (wrecks worth swimming to for what they
// hold), Mario Kart 8's parts (traded stats, none strictly better), real sail plans: a lateen points higher, a spinnaker runs, a deep keel
// tracks through a current.
//
//   SALVAGE (its numbers)   cratesOf(tier, first) -> n   crateOf(r, tier) -> { cubes } | { part }   SHIP_PARTS[slot][id] = { name, does,
//   rig?, mult? }   rigOf(worn) -> wind.js's rig   multOf(worn, key) -> number   game.shipParts = new ShipParts(game)   .owned .worn
//   .has(id) .wear(slot, id) .give(id) -> bool (new)   .rig() .mult(key)   events: sea.salvage { wreck, tier, crate }, ship.part { slot, part, how }
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** crates: a wreck's on its first salvage, by tier; daily: more a game day after; cubes: a cube crate's worth (minutes of play at the aim,
 *  by tier); part: a crate's chance of a ship's part, by tier; reach: m alongside; haul: real s a crate takes to come up. */
export const SALVAGE = {
  crates: { common: 2, uncommon: 3, rare: 4, legend: 6 }, daily: 1,
  cubes: { common: 1, uncommon: 1.5, rare: 2.5, legend: 4 },
  part: { common: 0.04, uncommon: 0.08, rare: 0.15, legend: 0.35 },
  reach: 30, haul: 2,
};

/** A wreck's crates now: its tier's on the first salvage, `daily` after. */
export const cratesOf = (tier, first) => (first ? SALVAGE.crates[tier] ?? 2 : SALVAGE.daily);

/** One crate opened: a ship's part (one not yet owned, by `r`) or cubes. */
export function crateOf(r, tier, owned = new Set()) {
  if (r() < (SALVAGE.part[tier] ?? 0.04)) { const left = PART_IDS.filter((id) => !owned.has(id)); if (left.length) return { part: left[Math.floor(r() * left.length)] }; }
  return { cubes: Math.round((SALVAGE.cubes[tier] ?? 1) * ECON.perMinute * (0.8 + 0.4 * r())) };
}

/** The ship's parts, a slot each: `rig` overrides the wind's polar (wind.js WIND: irons, best, run, and lo/hi a light and strong wind's
 *  share), `mult` the helm's and the hull's numbers (turn, cruise, rip: a current's push, bears: hits added). `stock` is as built. */
export const SHIP_PARTS = {
  sail: {
    stock:     { name: 'Square sail', does: 'As built: best on a reach' },
    lateen:    { name: 'Lateen sail', does: 'Points higher into the wind; slower running before it', rig: { irons: (30 * Math.PI) / 180, best: (95 * Math.PI) / 180, run: 0.55 } },
    spinnaker: { name: 'Spinnaker', does: 'Flies downwind; useless close to it', rig: { irons: (60 * Math.PI) / 180, best: (150 * Math.PI) / 180, run: 1 } },
    storm:     { name: 'Storm sail', does: 'Strong in a gale, weak in light airs', rig: { lo: 0.55, hi: 1.2 } },
  },
  keel: {
    stock:   { name: 'Keel', does: 'As built' },
    deep:    { name: 'Deep keel', does: 'Tracks through currents; turns slower', mult: { rip: 0.5, turn: 0.85 } },
    shallow: { name: 'Shallow keel', does: 'Turns fast; currents push it more', mult: { rip: 1.3, turn: 1.25 } },
  },
  hull: {
    stock:  { name: 'Hull', does: 'As built' },
    scaled: { name: 'Scaled hull', does: 'Bears one more hit; a little slower', mult: { bears: 1, cruise: 0.94 } },
    light:  { name: 'Light hull', does: 'Faster; bears one hit fewer', mult: { bears: -1, cruise: 1.08 } },
  },
};
export const PART_SLOTS = Object.keys(SHIP_PARTS);
const PART_IDS = PART_SLOTS.flatMap((slot) => Object.keys(SHIP_PARTS[slot]).filter((id) => id !== 'stock'));
const slotOf = (id) => PART_SLOTS.find((slot) => SHIP_PARTS[slot][id]);

/** What the worn sail does to the wind's polar (wind.js sailOf's `rig`), or null as built. */
export const rigOf = (worn) => SHIP_PARTS.sail[worn?.sail]?.rig ?? null;
/** A key's multiplier from the worn keel and hull (`bears` is added, not multiplied: 0 as built). */
export function multOf(worn, key) {
  let m = key === 'bears' ? 0 : 1;
  for (const slot of ['keel', 'hull']) { const v = SHIP_PARTS[slot][worn?.[slot]]?.mult?.[key]; if (v != null) m = key === 'bears' ? m + v : m * v; }
  return m;
}

export class ShipParts {
  constructor(game) {
    this.game = game; this.owned = new Set(); this.worn = { sail: 'stock', keel: 'stock', hull: 'stock' };
    game.save?.section('shipParts', { scope: 'player', version: 1, dump: () => ({ owned: [...this.owned], worn: { ...this.worn } }),
      load: (d) => { this.owned = new Set((d?.owned || []).filter((id) => slotOf(id))); this.worn = { sail: 'stock', keel: 'stock', hull: 'stock' };
        for (const slot of PART_SLOTS) { const id = d?.worn?.[slot]; if (id && (id === 'stock' || this.owned.has(id)) && SHIP_PARTS[slot][id]) this.worn[slot] = id; } },
      reset: () => { this.owned = new Set(); this.worn = { sail: 'stock', keel: 'stock', hull: 'stock' }; } });
  }
  has(id) { return id === 'stock' || this.owned.has(id); }
  /** A part found (salvage, a legend's spoils): true if it is new. */
  give(id, how = 'salvage') { const slot = slotOf(id); if (!slot || this.owned.has(id)) return false; this.owned.add(id); this.game.save?.dirty?.('shipParts'); this.game.events?.emit('ship.part', { slot, part: id, how, by: 'courier' }); return true; }
  /** A part worn (at a dock: the room asks): refused if not owned. */
  wear(slot, id) { if (!SHIP_PARTS[slot]?.[id] || !this.has(id)) return false; this.worn[slot] = id; this.game.save?.dirty?.('shipParts'); this.game.events?.emit('ship.part', { slot, part: id, how: 'wear', by: 'courier' }); return true; }
  rig() { return rigOf(this.worn); }
  mult(key) { return multOf(this.worn, key); }
}
