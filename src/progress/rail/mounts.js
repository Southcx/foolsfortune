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
//   MOUNTS[tool] = { name, verb, does, cost?, charges?, cooldown? (bars) }   SLOTS   mountable(worn) -> [tool]   loadout(chosen, worn) -> [tool]
// ---------------------------------------------------------------------------------------

/** How many tools the sloop carries besides the psygun (a bigger ship, later, carries more: ECON.ships). */
export const SLOTS = 2;

/** Each tool at sea. Keys 1 and 2 fire the two mounted, in the order chosen at the pier. */
export const MOUNTS = {
  psygun:     { name: 'the gun', verb: 'fire', does: 'full auto on LMB (a shot each sixteenth note: Rez), the lock-on sweep on RMB held (up to 8, a lance each, released together)', cost: 3, always: true },
  soulbrush:  { name: 'the wake brush', verb: 'spray', does: 'a fan of your feeling over the water ahead (50 degrees, 9 m): it drinks enemy shots of your feeling in it and cuts fish three to a stroke', cost: 4 },
  crucibelle: { name: 'the toll', verb: 'toll', does: 'the bomb: a ring that clears every shot within 10 m (14 on the beat), scatters a shoal, staggers boarders', charges: 3 },
  lockheart:  { name: 'the gulp', verb: 'gulp', does: 'the coffin swallows a cone ahead for a second (35 degrees, 8 m): shots and Guppy-class fish, each 2 Lachryma to the pool', cooldown: 4 },
  veritome:   { name: 'the plate', verb: 'snap', does: 'a photograph of what is in frame (a set piece goes in the Compendium), and its Flash holds a weak point open two bars', cost: 6, cooldown: 4 },
  sondelass:  { name: 'the hook', verb: 'hook', does: 'grapples what it is aimed at within 16 m: a cask or flotsam reeled aboard, a boarder yanked into the sea', cooldown: 1 },
  dreamvane:  { name: 'the vane', verb: null, does: 'passive: the reckoning marks half again as early, the shoal\'s caller is shown, the Leviathan\'s breach is marked a bar ahead' },
};

/** The tools that can be mounted, from those worn (game.belt): every worn tool but the psygun, which is always the gun. */
export const mountable = (worn = []) => worn.filter((t) => MOUNTS[t] && !MOUNTS[t].always);
/** The loadout as sailed: the first SLOTS of `chosen` that are worn and mountable, in order. */
export const loadout = (chosen = [], worn = []) => chosen.filter((t, i) => chosen.indexOf(t) === i && mountable(worn).includes(t)).slice(0, SLOTS);
