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
//   MOUNTS[tool] = { name (the label), lore, verb, does (the card line), detail, cost?, charges?, cooldown? (bars), duration? (real seconds), range? (m), angle? (degrees: the cone's full width) }   SLOTS   slotsOf(ship)   mountable(worn) -> [tool]   loadout(chosen, worn, ship?) -> [tool]
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
  psygun:     { name: 'Blaster', lore: 'the gun', verb: 'fire', does: 'Fire with LMB; hold RMB to lock on', detail: 'Full auto on LMB. Hold RMB to lock on to up to 8 targets; release fires a lance at each.', cost: 3, always: true },
  soulbrush:  { name: 'Absorb', lore: 'the wake brush', verb: 'spray', does: 'Eats enemy shots of your colour', detail: 'A fan of spray ahead. Enemy shots of your colour inside it are drunk, and it cuts up to three small fish.', cost: 4, range: 9, angle: 50 },
  crucibelle: { name: 'Bomb', lore: 'the toll', verb: 'toll', does: 'Clears every shot around you', detail: 'A ring that clears every shot around you, wider on the beat. It scatters fish and staggers boarders.', charges: 3, range: 10 },
  lockheart:  { name: 'Vacuum', lore: 'the gulp', verb: 'gulp', does: 'Sucks in shots and small fish; refills energy', detail: 'Swallows a cone ahead for a second: enemy shots and the smallest fish. Each one refills 2 energy.', cooldown: 4, duration: 1, range: 8, angle: 35 },
  veritome:   { name: 'Flash', lore: 'the plate', verb: 'snap', does: 'Opens weak points for a few seconds', detail: 'Takes a photo of what is in view and holds a weak point open. A boss photographed goes in your Compendium.', cost: 6, cooldown: 4, duration: 3 },
  sondelass:  { name: 'Grapple', lore: 'the hook', verb: 'hook', does: 'Pulls loot in; yanks boarders off', detail: 'Hooks what you aim at: loot and casks are reeled aboard, and a boarder is yanked into the sea.', cooldown: 1, range: 16 },
  dreamvane:  { name: 'Radar', lore: 'the vane', verb: null, does: 'Warns you of attacks earlier (passive)', detail: 'Always on. Attack warnings come half again as early, and it marks the school\'s leader and a big creature about to surface.' },
};

/** The tools that can be mounted, from those worn (game.belt): every worn tool but the psygun, which is always the gun. */
export const mountable = (worn = []) => worn.filter((t) => MOUNTS[t] && !MOUNTS[t].always);
/** The loadout as sailed: the first `slotsOf(ship)` of `chosen` that are worn and mountable, in order. */
export const loadout = (chosen = [], worn = [], ship = 'sloop') => chosen.filter((t, i) => chosen.indexOf(t) === i && mountable(worn).includes(t)).slice(0, slotsOf(ship));
