// ---------------------------------------------------------------------------------------
// PSYGUNS: the kinds of psygun, and what each carries. Every caster shell has a number (TYPE-00, the Cleave, to TYPE-99:
// progress/combat/castershells.js), and a psygun is two numbers and a few exceptions:
//   CHAMBERS   how many types of shell it carries at once (each a chamber; 1, 2, 3... picks one): what is not chambered cannot be fired
//   CAPACITY   how many of a type a chamber holds: the cap for a common, by the shell's tier for the rest (chamberHolds), and some
//              held more or fewer by this psygun (a bomb is fat)
// So one psygun is a narrow gun deep in a few shells, another a wide one shallow in many. Which shells sit in the chambers is the
// Courier's choice (the Pneuka Box's window, under the psygun), as a loadout. Data only.
//
// Prior art: the revolver cylinder (a chamber per round, and choosing what goes in each), Monster Hunter's bowguns (each gun loads
// only some ammo types, each to its own clip size), Destiny's ammo types per weapon frame, and Caster's own shell set.
//
//   PSYGUNS[id] = { id, name, chambers, shape, cap, capacity: { typeId: n }, loadout: [typeId], heart?, blurb }   typeNo(i) -> 'TYPE-00'
//   play: how each variant fights (OVERLAY.md 19; Ratchet & Clank's weapons, the owner's model): numbers here, behaviour variantplay.js
//   capacityOf(gun, typeId)   chamberCapacity(gun, i, typeId)   (the heart's double: shells.js asks it once Petra wires it)
// ---------------------------------------------------------------------------------------
import { chamberHolds, shellById } from '../../progress/combat/castershells.js';
export const typeNo = (i) => `TYPE-${String(i).padStart(2, '0')}`;

export const PSYGUNS = {
  // (the cylinder's shape is its chamber count: docs/plans/OVERLAY.md 18; the owner's four variants, 2026-10-18, beside the first)
  'psygun.first': {
    id: 'psygun.first', name: 'THE PSYGUN', chambers: 6, shape: 'hexagon', cap: 8, capacity: { bomb: 4, well: 4, anchor: 4 },
    loadout: ['slicer', 'push', 'well', 'mark', 'bomb', 'paint'],
    play: { fanHammer: { window: 0.25, rateMult: 1.4 }, turn: 0.08 }, // (the all-rounder: plain shots tapped within 0.25 s fire 1.4x as fast; the quickest cylinder)
    blurb: 'The hand-cannon you woke with: six chambers, eight of a shell in each (four of the heavy ones).',
  },
  'psygun.bombardier': {
    id: 'psygun.bombardier', name: 'THE BOMBARDIER', chambers: 1, shape: 'one', cap: 32, capacity: { bomb: 16, well: 16, anchor: 16 },
    loadout: ['bomb'],
    play: { areaMult: 6, radiusMult: 2.449, lob: ['bolt', 'bounce'], flare: { reveal: 6, life: 8 }, kick: 2, plainRate: 0.5, turn: 0.2 }, // (+500% area: radius x sqrt 6; straight carriers lob; the plain shot a flare)
    blurb: 'One chamber, and it never seems to empty: thirty-two of a shell, sixteen of the heavy ones.',
  },
  'psygun.carbine': {
    id: 'psygun.carbine', name: 'THE CARBINE', chambers: 3, shape: 'triangle', cap: 16, capacity: { bomb: 8, well: 8, anchor: 8 },
    loadout: ['slicer', 'push', 'bomb'],
    play: { scope: { zoom: 2.5, breath: 3 }, fullDraw: { timeMult: 1.6, dmgMult: 2.5, falloff: 0 }, dart: { statusMult: 1.5 }, weakScoped: 2, turn: 0.25 }, // (the scope on ADS, the full draw, status shells as darts)
    blurb: 'Three deep chambers: sixteen of a shell, eight of the heavy ones.',
  },
  'psygun.pentagun': {
    id: 'psygun.pentagun', name: 'THE PENTAGUN', chambers: 5, shape: 'pentagon', cap: 10, capacity: { bomb: 5, well: 5, anchor: 5 },
    loadout: ['slicer', 'push', 'well', 'mark', 'bomb'],
    play: { pentacle: { window: 4, radius: 4, types: 5, build: 0.2 }, turn: 0.12 }, // (five different chambers within 4 s: the fifth draws the pentacle, a hit of each damage type)
    blurb: 'Five chambers, ten of a shell in each (five of the heavy ones).',
  },
  // the Pepperbox's seventh chamber is its HEART (the middle of the hexagon): any shell, and a rare or the Caster's own in it holds twice
  'psygun.pepperbox': {
    id: 'psygun.pepperbox', name: 'THE PEPPERBOX', chambers: 7, shape: 'hexagon+heart', cap: 5, capacity: { bomb: 3, well: 3, anchor: 3 }, heart: 6,
    loadout: ['slicer', 'push', 'well', 'mark', 'bomb', 'ricochet', 'homing'],
    play: { pellets: { n: 7, spread: 12, range: 12, each: 0.25, knock: 2, pushCap: 6 }, shellSpread: { n: 3, each: 0.5 }, slug: 2, bothBarrels: { hold: 0.5, cooldown: 6 }, turn: 0.15 }, // (a shotgun: seven pellets; shells in threes; the heart a slug; both barrels)
    blurb: 'Six round a heart: five of a shell in each (three of the heavy ones), and the heart holds twice its share of the rarest.',
  },
};
export const DEFAULT_PSYGUN = 'psygun.first';
/** How many of a shell type a psygun holds: its own exception, else the shell's tier's share of the cap. */
export const capacityOf = (gun, typeId) => gun.capacity[typeId] ?? chamberHolds(typeId, gun.cap);
/** What the chamber at `i` holds of a type: its capacity, twice for a rare or the Caster's own in the Pepperbox's heart. */
export const chamberCapacity = (gun, i, typeId) => capacityOf(gun, typeId) * (gun.heart === i && (shellById(typeId)?.tier || 1) >= 3 ? 2 : 1);
