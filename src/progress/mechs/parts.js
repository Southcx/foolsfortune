// ---------------------------------------------------------------------------------------
// A MECH'S PARTS (docs/plans/MECHS.md 4.1, 4.3; South, 2026-11-02: "Giant robots. Pilotable ... Neon Genesis Evangelion mixed with armored
// core, mixed with the giant robot sections from Ratchet and clank"): every part a row of honest physical numbers, so the frame moves as
// physics (MECHS.md 3: a = F / m, p = m v, P = E / t, the pendulum's stride). Masses in tonnes, thrust in kilonewtons, power in kilowatts,
// energy in kilojoules, lengths in metres.
//
// Prior art: Armored Core's assembly (a part a slot, each a trade of weight, energy load and armour; the legs' load limit and the arms');
// its four leg types (biped, reverse joint, tetrapod, tank); Ratchet & Clank's Giant Clank (a short moveset: the fist's three punches);
// the seven tools at giant scale (TOOLS-TOGETHER.md's grammar kept: the big gun shoots, the great bell tolls).
//
//   SLOTS   PARTS[id] = { slot, label, line, mass, draw?, ...the slot's numbers, earn? }   LEG_TYPES   CLAY_FRAME   partOf(id)   partsIn(slot)
// ---------------------------------------------------------------------------------------

/** The nine slots, in the assembly page's order. */
export const SLOTS = ['head', 'core', 'arms', 'legs', 'booster', 'generator', 'weaponL', 'weaponR', 'back'];

/** The leg types (AC's four): how a frame moves, beyond its numbers. */
export const LEG_TYPES = {
  biped:   { label: 'Biped', line: 'The all-round frame: the pendulum stride and a jump.', jump: 1, hoverFree: false, stride: true },
  reverse: { label: 'Reverse joint', line: 'A spring in the joint: jumps twice as high, carries less.', jump: 2, hoverFree: false, stride: true },
  tetra:   { label: 'Tetrapod', line: 'Hovers still for free: a steady platform, slow to walk.', jump: 0.6, hoverFree: true, stride: true },
  tank:    { label: 'Tank', line: 'Treads: carries the most, turns on the spot, never jumps.', jump: 0, hoverFree: false, stride: false, treads: 9 },
};

/**
 * The parts. Slot numbers:
 *   head      lock (m: how far a weapon locks), radar (m)
 *   core      armour (a region's crack multiplier: below 1 cracks less)
 *   arms      load (t: the weapons' mass the arms hold), punch (the fist's force, x), aim (turn-rate multiplier)
 *   legs      load (t), type (LEG_TYPES), leg (m: the leg's length, which sets the stride and the walk's top speed), armour
 *   booster   thrust (kN), fire (kW drawn while firing)
 *   generator output (kW, what it refills and powers), capacity (kJ: the battery off the cable)
 *   weapon    tool (the tool it is the giant form of), k (a hit's blow, a full blow 1), stagger (gauge a hit), cost (kJ a use),
 *             range (m), plus its own verb's numbers
 *   back      as a weapon, or a unit's own (shield, radar, plate)
 * `draw` (kW) is what a part pulls standing still. `earn` names the achievement that opens it (the clay frame is given).
 */
export const PARTS = {
  // heads
  clayHead:    { slot: 'head', label: 'Clay head', line: 'A haniwa face. It sees far enough.', mass: 2.0, draw: 30, lock: 180, radar: 300 },
  watcherHead: { slot: 'head', label: 'Watcher head', line: 'Long sight: locks at half again the range.', mass: 1.6, draw: 50, lock: 270, radar: 520, earn: 'mk4' },
  // cores
  clayCore:  { slot: 'core', label: 'Clay core', line: 'The cradle in its chest, the generator at its back.', mass: 12, draw: 40, armour: 1 },
  kilnCore:  { slot: 'core', label: 'Kiln core', line: 'Fired twice: the core cracks a third less.', mass: 16, draw: 45, armour: 0.67, earn: 'mk3' },
  lightCore: { slot: 'core', label: 'Light core', line: 'Bisque thin: light, and it cracks sooner.', mass: 9, draw: 35, armour: 1.35, earn: 'mk2' },
  // arms
  clayArms:   { slot: 'arms', label: 'Clay arms', line: 'Holds what a frame needs, punches well.', mass: 6, draw: 40, load: 12, punch: 1, aim: 1 },
  strongArms: { slot: 'arms', label: 'Strong arms', line: 'Holds heavy weapons; a harder fist.', mass: 8, draw: 60, load: 18, punch: 1.4, aim: 0.85, earn: 'mk3' },
  quickArms:  { slot: 'arms', label: 'Quick arms', line: 'Light and quick to aim; holds little.', mass: 4.5, draw: 35, load: 8, punch: 0.8, aim: 1.4, earn: 'mk4' },
  // legs (each type's frame; `leg` is the pendulum's length: the stride and the walk's top speed come from it)
  clayLegs:    { slot: 'legs', label: 'Clay legs', line: 'Biped. The stride every frame learns on.', mass: 14, draw: 40, load: 60, type: 'biped', leg: 6, armour: 1 },
  springLegs:  { slot: 'legs', label: 'Spring legs', line: 'Reverse joint: twice the jump, less load.', mass: 11, draw: 40, load: 48, type: 'reverse', leg: 6.5, armour: 1.15, earn: 'mk4' },
  crabLegs:    { slot: 'legs', label: 'Crab legs', line: 'Tetrapod: a steady platform that hovers still.', mass: 18, draw: 55, load: 72, type: 'tetra', leg: 4, armour: 0.9, earn: 'mk5' },
  treadLegs:   { slot: 'legs', label: 'Tread base', line: 'Tank: the heaviest load, treads, no jump.', mass: 24, draw: 60, load: 95, type: 'tank', leg: 0, armour: 0.7, earn: 'mk3' },
  // boosters
  clayBooster: { slot: 'booster', label: 'Clay booster', line: 'Enough thrust to dash and hop.', mass: 2.5, draw: 10, thrust: 900, fire: 1800 },
  highBooster: { slot: 'booster', label: 'High booster', line: 'Half again the thrust, and the draw.', mass: 3, draw: 15, thrust: 1300, fire: 2800, earn: 'mk5' },
  // generators (the clay generator's battery is five minutes at the clay frame's idle draw: Evangelion's five minutes)
  clayGenerator:  { slot: 'generator', label: 'Clay generator', line: 'Five minutes off the cable at rest.', mass: 4, output: 600, capacity: 48000 },
  bigGenerator:   { slot: 'generator', label: 'Big generator', line: 'More output and battery; heavy.', mass: 6.5, output: 900, capacity: 72000, earn: 'mk5' },
  lightGenerator: { slot: 'generator', label: 'Light generator', line: 'Light, and a short battery.', mass: 2.5, output: 450, capacity: 30000, earn: 'mk2' },
  // arm weapons: the blade and the blaster, and the bare fist (South, 2026-11-02: "the mechs don't need access to all the lachryma tools. A
  // blade and a blaster is more than enough for now"; MECHS.md 4.3: the brush, bell and flail retired, with the vane and the lens)
  fist:       { slot: 'weapon', label: 'Fist', line: 'Three punches, the third a heavy one.', mass: 0, tool: null, k: 0.8, stagger: 16, cost: 0, range: 9, string: 3, heavy: true },
  bigGun:     { slot: 'weapon', label: 'Blaster', line: 'Shots on a press; held, a beam that pierces a barrier.', mass: 5, tool: 'psygun', k: 0.45, stagger: 5, cost: 150, range: 220, rate: 3, charge: { hold: 1.2, k: 2.2, cost: 2500, pierce: true } },
  greatBlade: { slot: 'weapon', label: 'Blade', line: 'A cutlass string of three; the third staggers.', mass: 4, tool: 'sondelass', k: 1.1, stagger: 12, cost: 350, range: 13, string: 3, heavy: true, earn: 'mk2' },
  // back units
  missiles:  { slot: 'back', label: 'Missiles', line: 'Six motes of Lachryma, homing.', mass: 3, tool: null, k: 0.2, stagger: 3, cost: 900, range: 260, volley: 6, earn: 'mk3' },
  shield:    { slot: 'back', label: 'Shield', line: 'Raised, it takes blows from the front.', mass: 4, tool: null, cost: 0, hold: 300, block: 0.25, earn: 'mk2' },
};

/** The frame every hangar starts with (given at the first visit: MECHS.md 6). */
export const CLAY_FRAME = { head: 'clayHead', core: 'clayCore', arms: 'clayArms', legs: 'clayLegs', booster: 'clayBooster',
  generator: 'clayGenerator', weaponL: 'fist', weaponR: 'bigGun', back: null };

export const partOf = (id) => (id ? PARTS[id] || null : null);
/** The parts that fit a slot (the two arm slots share the weapons). */
export const partsIn = (slot) => Object.keys(PARTS).filter((id) => PARTS[id].slot === (slot === 'weaponL' || slot === 'weaponR' ? 'weapon' : slot));
