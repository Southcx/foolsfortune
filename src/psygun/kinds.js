// ---------------------------------------------------------------------------------------
// PSYGUNS: the kinds of psygun, and what each carries. Every caster shell has a number (TYPE-00, the Cleave, to TYPE-10, the Hatch:
// shells.js SHELL_TYPES, in that order), and a psygun is two numbers and a few exceptions:
//   CHAMBERS   how many types of shell it carries at once (each a chamber; 1, 2, 3... picks one): what is not chambered cannot be fired
//   CAPACITY   how many of a type a chamber holds (one number for all, and some types held more or fewer: a bomb is fat)
// So one psygun is a narrow gun deep in a few shells, another a wide one shallow in many. Which shells sit in the chambers is the
// Courier's choice (the Pneuka Box's window, under the psygun), as a loadout. Data only.
//
// Prior art: the revolver cylinder (a chamber per round, and choosing what goes in each), Monster Hunter's bowguns (each gun loads
// only some ammo types, each to its own clip size), Destiny's ammo types per weapon frame, and Caster's own shell set.
//
//   PSYGUNS[id] = { id, name, chambers, cap, capacity: { typeId: n }, loadout: [typeId], blurb }   typeNo(i) -> 'TYPE-00'
// ---------------------------------------------------------------------------------------
export const typeNo = (i) => `TYPE-${String(i).padStart(2, '0')}`;

export const PSYGUNS = {
  'psygun.first': {
    id: 'psygun.first', name: 'THE PSYGUN', chambers: 6, cap: 8, capacity: { bomb: 4, well: 4, anchor: 4 },
    loadout: ['slicer', 'push', 'well', 'mark', 'bomb', 'slip'],
    blurb: 'The hand-cannon she woke with: six chambers, eight of a shell in each (four of the heavy ones).',
  },
  'psygun.pepperbox': {
    id: 'psygun.pepperbox', name: 'THE PEPPERBOX', chambers: 11, cap: 3, capacity: {},
    loadout: ['slicer', 'push', 'well', 'mark', 'bomb', 'ricochet', 'homing', 'slip', 'groove', 'anchor', 'hatch'],
    blurb: 'A barrel for every shell there is, and only three of each.',
  },
  'psygun.longtube': {
    id: 'psygun.longtube', name: 'THE LONG TUBE', chambers: 3, cap: 16, capacity: { bomb: 8 },
    loadout: ['slicer', 'push', 'bomb'],
    blurb: 'Three deep magazines: sixteen of a shell, eight of the bombs.',
  },
};
export const DEFAULT_PSYGUN = 'psygun.first';
/** How many of a shell type a psygun holds. */
export const capacityOf = (gun, typeId) => gun.capacity[typeId] ?? gun.cap;
