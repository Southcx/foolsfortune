// ---------------------------------------------------------------------------------------
// THE SHIP'S MOUNTS: the Courier's own tools on the sloop (docs/plans/RAIL.md). The Emocean has no parts of its own (SLICE.md: the
// same tools, the same purse), so where Kingdom Hearts' Gummi Ship bolts on gummi weapons and Einhander takes gunpods off the enemy,
// the ship here carries two of the tools you wear, chosen at the pier, each turned into what it is at sea. The psygun is always the
// gun. Costs are Lachryma from the pool (which absorbing your own feeling's shots refills: score.js), or charges a crossing (a shmup's
// bombs: three).
//
// Prior art: Kingdom Hearts 1 and 2 (the Gummi Ship's weapon blocks), Einhander (one gunpod at a time, with its own ammunition),
// Gradius's power-up bar (a choice of what to be good at), and every shmup's bomb (few, and it clears the screen).
//
//   MOUNTS[tool] = { name (the label), lore, verb, does (the card line), detail, cost?, charges?, cooldown? (bars), range? (m), angle? (degrees) }   SLOTS   slotsOf(ship)   mountable(worn) -> [tool]   loadout(chosen, worn, ship?) -> [tool]
//   The slots are the hull's (the owner, 2026-10-08: "mount slots by hull"; ships.js SHIPS[ship].mounts): sloop 2, frigate 3, destroyer 2,
//   tanker and galleon 1. Keys 1 to 3 fire them in the order chosen at the pier.
// ---------------------------------------------------------------------------------------
import { SHIPS } from './ships.js';

/** How many tools the sloop carries besides the psygun (the default where no ship is named). */
export const SLOTS = 2;

/** How many tools a ship carries besides the psygun: its hull's slots. */
export const slotsOf = (ship = 'sloop') => SHIPS[ship]?.mounts ?? SLOTS;

/** Each tool at sea. Keys 1 to 3 fire those mounted (as many as the hull's slots), in the order chosen at the pier. */
export const MOUNTS = {
  // name: the label the player sees (a genre word: docs/plans/CLARITY.md section 9; Espada's to settle); does: the card's one line, verb
  // first, at most 8 words; lore: the world's name (the Codex, the folk); detail: the whole of it, for a hover or the wiki.
  psygun:     { name: 'Blaster', lore: 'the gun', verb: 'fire', does: 'Fire with LMB; hold RMB to lock on', detail: 'full auto on LMB (a shot each sixteenth note: Rez), the lock-on sweep on RMB held (up to 8, a lance each, released together)', cost: 3, always: true },
  soulbrush:  { name: 'Absorb Spray', lore: 'the wake brush', verb: 'spray', does: 'Eats enemy shots of your colour', detail: 'a fan of your feeling over the water ahead (50 degrees, 9 m): it drinks enemy shots of your feeling in it and cuts fish three to a stroke', cost: 4, range: 9, angle: 50 },
  crucibelle: { name: 'Bomb', lore: 'the toll', verb: 'toll', does: 'Clears every shot around you', detail: 'a ring that clears every shot within 10 m (14 on the beat), scatters a shoal, staggers boarders', charges: 3, range: 10 },
  lockheart:  { name: 'Vacuum', lore: 'the gulp', verb: 'gulp', does: 'Sucks in shots and small fish; refills energy', detail: 'the coffin swallows a cone ahead for a second (35 degrees, 8 m): shots and Guppy-class fish, each 2 Lachryma to the pool', cooldown: 4, range: 8, angle: 35 },
  veritome:   { name: 'Snapshot', lore: 'the plate', verb: 'snap', does: 'Opens weak points for a few seconds', detail: 'a photograph of what is in frame (a set piece goes in the Compendium), and its Flash holds a weak point open two bars', cost: 6, cooldown: 4 },
  sondelass:  { name: 'Grapple', lore: 'the hook', verb: 'hook', does: 'Pulls loot in; yanks boarders off', detail: 'grapples what it is aimed at within 16 m: a cask or flotsam reeled aboard, a boarder yanked into the sea', cooldown: 1, range: 16 },
  dreamvane:  { name: 'Radar', lore: 'the vane', verb: null, does: 'Warns you of attacks earlier (passive)', detail: 'passive: the reckoning marks half again as early, the shoal\'s caller is shown, the Leviathan\'s breach is marked a bar ahead' },
};

/** The tools that can be mounted, from those worn (game.belt): every worn tool but the psygun, which is always the gun. */
export const mountable = (worn = []) => worn.filter((t) => MOUNTS[t] && !MOUNTS[t].always);
/** The loadout as sailed: the first `slotsOf(ship)` of `chosen` that are worn and mountable, in order. */
export const loadout = (chosen = [], worn = [], ship = 'sloop') => chosen.filter((t, i) => chosen.indexOf(t) === i && mountable(worn).includes(t)).slice(0, slotsOf(ship));
