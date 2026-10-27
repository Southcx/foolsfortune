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
//   SEA_MOUNTS[tool] = { arc, angle?, reach, cost?, cooldown?, charges?, hold?, passive?, does }: the same tools at the free helm (OPEN-SEA.md 14.2)
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
  // cuts: small fish a spray cuts; refill: energy each thing gulped gives; angle: a cone or fan's full width (the hook's: its aim's, 60 wide); a ship's locks are SHIPS[ship].locks.
  psygun:     { name: 'Blaster', lore: 'the gun', verb: 'fire', does: 'Fire with LMB; hold RMB to lock on', detail: 'Full auto on LMB. Hold RMB to lock on to up to 8 targets; release fires a lance at each.', cost: 3, always: true },
  soulbrush:  { name: 'Absorb', lore: 'the wake brush', verb: 'spray', does: 'Eats enemy shots of your colour', detail: 'A fan of spray ahead. Enemy shots of your colour inside it are drunk, and it cuts up to three small fish.', cost: 4, range: 9, angle: 50, cuts: 3 },
  crucibelle: { name: 'Bomb', lore: 'the toll', verb: 'toll', does: 'Clears every shot around you', detail: 'A ring that clears every shot around you, wider on the beat. It scatters fish and staggers boarders.', charges: 3, range: 10 },
  lockheart:  { name: 'Vacuum', lore: 'the gulp', verb: 'gulp', does: 'Sucks in shots and small fish; refills energy', detail: 'Swallows a cone ahead for a second: enemy shots and the smallest fish. Each one refills 2 energy.', cooldown: 4, duration: 1, range: 8, angle: 35, refill: 2 },
  veritome:   { name: 'Flash', lore: 'the plate', verb: 'snap', does: 'Opens weak points for a few seconds', detail: 'Takes a photo of what is in view and holds a weak point open. A boss photographed goes in your Compendium.', cost: 6, cooldown: 4, duration: 3 },
  sondelass:  { name: 'Grapple', lore: 'the hook', verb: 'hook', does: 'Pulls loot in; yanks boarders off', detail: 'Hooks what you aim at: loot and casks are reeled aboard, and a boarder is yanked into the sea.', cooldown: 1, range: 16, angle: 60 },
  dreamvane:  { name: 'Radar', lore: 'the vane', verb: null, does: 'Warns you of attacks earlier (passive)', detail: 'Always on. Attack warnings come half again as early, and it marks the school\'s leader and a big creature about to surface.' },
};

/** The tools that can be mounted, from those worn (game.belt): every worn tool but the psygun, which is always the gun. */
export const mountable = (worn = []) => worn.filter((t) => MOUNTS[t] && !MOUNTS[t].always);
/** The loadout as sailed: the first `slotsOf(ship)` of `chosen` that are worn and mountable, in order. */
export const loadout = (chosen = [], worn = [], ship = 'sloop') => chosen.filter((t, i) => chosen.indexOf(t) === i && mountable(worn).includes(t)).slice(0, slotsOf(ship));

/** THE MOUNTS AT THE FREE HELM (docs/plans/OPEN-SEA.md 14.2; the owner, 2026-10-27: "the ship combat feels shallow"): the same tools as on
 *  the rail, each given an ARC at sea, so the fight is where you put the ship (Sea of Thieves' broadsides, Assassin's Creed IV's chase and
 *  side guns, Wind Waker's bow cannon). A beast's move asks an answer (opensea/seabeasts.js ANSWERS); most of the answers are a mount.
 *  arc: 'bow' (ahead, `angle` wide), 'beam' (either side, `angle` wide round the beam: turn your side to it), 'stern' (laid behind),
 *  'ring' (all round); reach (m); cost (pool); cooldown (real s); charges (a sortie, filled at a dock); hold (real s an effect lasts).
 *  The runtime is Petra's (world/opensea/seafight.js), the looks Calissa's. */
export const SEA_MOUNTS = {
  psygun:     { arc: 'bow', angle: 60, reach: 160, cost: 0, does: 'the bow gun: aimed with the camera, the height found for you' },
  sondelass:  { arc: 'beam', angle: 70, reach: 60, cost: 5, cooldown: 8, hold: 6, does: 'a harpoon: a beast tethered cannot dive and its ram is blunted; a crate hooked is reeled aboard' },
  crucibelle: { arc: 'ring', reach: 40, charges: 3, does: 'the toll: every windup inside the ring broken, its beast staggered 2 s (a parry at range)' },
  lockheart:  { arc: 'bow', angle: 50, reach: 25, cost: 0, cooldown: 5, does: 'the gulp: a spit drunk and carried back on the next shot (x3); the umibozu\'s sea drunk out of the hull' },
  dreamvane:  { arc: 'ring', reach: 300, cooldown: 10, passive: true, does: 'sonar: every dive within reach shows where it will surface, 2 s early; salvage and caches show under the water; read through ink' },
  veritome:   { arc: 'bow', angle: 40, reach: 120, cost: 8, cooldown: 12, hold: 4, does: 'flash: a weak point held open, and a plate taken (in a habit, its bonus)' },
  soulbrush:  { arc: 'stern', reach: 30, cost: 10, cooldown: 15, hold: 20, does: 'a slick laid astern: a beast swimming through it is slowed by half for 3 s (kite it through your wake)' },
};
