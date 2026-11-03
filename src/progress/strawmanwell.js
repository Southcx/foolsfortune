// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL: the 2D platformer's test bench, its rules (South, 2026-10-31: "design another Well within the WORKSHOP that is our test
// environment for the ultimate distillations of the 2d platformer genre. Use the Strawman as your muse"; docs/plans/STRAWMANS-WELL.md).
// Inside Strawman's head is a toy theatre, so the stage is a plane seen from the front: the body held to the stage's depth, the camera
// the audience, the keys turned to the run (the plan's section 2; the core movement untouched, the frame a modifier you can see). What is
// here is data and pure functions for the room (world/strawmanwell/): the stages and the verbs each tests, the dummies' percent and its
// knockback, the stage's falling-sand grid, the Pit's retry, a clear's rank and stars.
//
// Prior art: Super Smash Bros. Brawl's Subspace Emissary (the percent, the blast line, trophies, a stage a set piece), Elsword (a dungeon's
// rank by time, hits and combo), Super Meat Boy and I Wanna Be the Guy (instant retry, the death count, the run's ghosts), Noita and the
// Powder Toy (a falling-sand grid), VVVVVV (gravity flipped), Lemmings (dummies given jobs), Baba Is You (rules as words), Tomba! (lanes,
// grab and throw), Spelunky (bombs, ropes, the daily seeded run).
//
//   STAGES [{ id, wave, family, verbs: [id], par }]   VERB (id -> { name, from })   PERCENT   launchOf(power, percent) -> { speed, angle }
//   GRID   CELL   PIT   rankOf({ t, par, hits, string }) -> 'SS' .. 'D'   starsOf(rank) -> 0..3
//   ROPE POGO GRAB PULLEY FLOAT GUIDE TURRET (the room-side verbs' numbers, below)
//   events (the room's, each with `by`): well.stage.enter { stage }, well.stage.clear { stage, t, hits, string, rank, stars },
//   well.dummy.ko { stage, percent }, well.dummy.trophy { kind }, well.pit.death { stage, cause }, well.flood.fill { stage, cells },
//   well.verb { verb } (a verb used for the first time in the Well: the bench's checklist), well.pogo { stage, on }, well.grab { stage }, well.throw { stage, slam },
//   well.guide { stage, kind: 'guide' | 'rival', beat? }
// ---------------------------------------------------------------------------------------

/** The verbs, each with its prior art: the plan's section 3, one row a verb, the checklist the stages are measured by. */
export const VERB = {
  run: { name: 'Run', from: 'Super Mario Bros' }, jump: { name: 'Variable jump', from: 'Super Mario Bros' }, doubleJump: { name: 'Double jump', from: 'Kid Icarus' },
  dash: { name: 'Air dash', from: 'Mega Man X, Celeste' }, slide: { name: 'Slide', from: 'Mega Man 3' }, crawl: { name: 'Crawl', from: 'Metroid' },
  wallJump: { name: 'Wall jump', from: 'Mega Man X' }, wallRun: { name: 'Back-wall run', from: 'Prince of Persia' }, mantle: { name: 'Ledge grab', from: 'Prince of Persia' },
  dropThrough: { name: 'Drop through', from: 'Super Mario Bros 2' }, spring: { name: 'Spring', from: 'Sonic' }, slope: { name: 'Slope speed', from: 'Sonic' },
  ice: { name: 'Ice', from: 'Super Mario Bros 3' }, goo: { name: 'Goo', from: 'Super Meat Boy' },
  ropeLaunch: { name: 'Rope launch', from: 'Bionic Commando, Donkey Kong Country' }, rival: { name: 'Beat the rival', from: 'Mario Kart, Celeste' },
  ladder: { name: 'Ladder', from: 'Donkey Kong' }, vine: { name: 'Vine', from: 'Tomba!' }, swingRope: { name: 'Rope swing', from: 'Donkey Kong Country' },
  hang: { name: 'Monkey bars', from: 'Bionic Commando' }, beam: { name: 'Balance beam', from: 'Prince of Persia' }, pole: { name: 'Pole swing', from: 'Strider' },
  stomp: { name: 'Stomp', from: 'Super Mario Bros' }, groundPound: { name: 'Ground pound', from: 'Super Mario 64' }, pogo: { name: 'Pogo', from: 'Shovel Knight' },
  bonk: { name: 'Bonk a block', from: 'Super Mario Bros' },
  string: { name: 'Combo string', from: 'Elsword' }, juggle: { name: 'Air juggle', from: 'Devil May Cry' }, launch: { name: 'Knockback', from: 'Super Smash Bros.' },
  ringOut: { name: 'Ring out', from: 'Super Smash Bros.' }, grabThrow: { name: 'Grab and throw', from: 'Tomba!, Smash' }, trophy: { name: 'Trophy', from: 'Subspace Emissary' },
  shoot8: { name: 'Eight-way shot', from: 'Contra' }, chargeShot: { name: 'Charge shot', from: 'Mega Man' }, bomb: { name: 'Terrain bomb', from: 'Spelunky, Worms' },
  grapple: { name: 'Grapple swing', from: 'Bionic Commando' }, elastic: { name: 'Elastic line', from: 'Umihara Kawase' }, zip: { name: 'Zip line', from: 'Spider-Man' },
  push: { name: 'Push and pull', from: 'Limbo' }, seesaw: { name: 'Seesaw', from: 'LittleBigPlanet' }, pulley: { name: 'Pulley', from: 'Limbo' },
  conveyor: { name: 'Conveyor', from: 'Mega Man' }, crumble: { name: 'Crumbling floor', from: 'Super Mario Bros 3' }, mover: { name: 'Moving platform', from: 'every platformer' },
  switch: { name: 'Switch and door', from: 'Super Mario Maker' }, onOff: { name: 'On/off blocks', from: 'Super Mario Maker' }, key: { name: 'Key and lock', from: 'Spelunky' },
  cannon: { name: 'Cannon', from: 'Super Mario Bros' }, carry: { name: 'Carry it there', from: 'Spelunky' },
  pour: { name: 'Pour liquid', from: 'Where\'s My Water?' }, carve: { name: 'Carve a channel', from: 'From Dust' }, float: { name: 'Float a crate', from: 'Inside' },
  dig: { name: 'Dig through', from: 'Lemmings' }, freeze: { name: 'Freeze a liquid', from: 'Ice Climber' }, raise: { name: 'Raise clay', from: 'Drawn to Life' },
  flip: { name: 'Gravity flip', from: 'VVVVVV' }, flick: { name: 'Flick-screen room', from: 'VVVVVV' }, portal: { name: 'Portal momentum', from: 'Portal' },
  jobs: { name: 'Dummy jobs', from: 'Lemmings' }, rules: { name: 'Rule words', from: 'Baba Is You' }, drawLine: { name: 'Draw a platform', from: 'Crayon Physics' },
  retry: { name: 'Instant retry', from: 'Super Meat Boy' }, shootSave: { name: 'Shoot to save', from: 'I Wanna Be the Guy' }, troll: { name: 'Troll trap', from: 'I Wanna Be the Guy' },
  ghosts: { name: 'Every death replayed', from: 'Super Meat Boy' },
  jarRoll: { name: 'Jar roll', from: 'Metroid\'s morph ball' }, jarThrow: { name: 'Throw the Jar', from: 'Kirby: Canvas Curse' },
  lanes: { name: 'Lane hop', from: 'Tomba!, Klonoa' }, chase: { name: 'Chase', from: 'Rayman' }, autoscroll: { name: 'Auto-scroll', from: 'Super Mario Bros 3' },
  beat: { name: 'Beat blocks', from: 'Super Mario 3D World' },
  wallFace: { name: 'Into the wall', from: 'Zelda: A Link Between Worlds' }, seeded: { name: 'The day\'s maze', from: 'Spelunky' },
  // the platform fighter's kit (FIGHTER.md; South, 2026-10-31: "adding all the other SSBM-like and platform fighter mechanics")
  shield: { name: 'Shield', from: 'Super Smash Bros. Melee' }, spotDodge: { name: 'Spot dodge', from: 'Melee' }, roll: { name: 'Roll', from: 'Melee' },
  airDodge: { name: 'Air dodge', from: 'Melee' }, wavedash: { name: 'Wavedash', from: 'Melee' }, shortHop: { name: 'Short hop', from: 'Melee' },
  fastFall: { name: 'Fast fall', from: 'Melee' }, lCancel: { name: 'L-cancel', from: 'Melee' }, grab: { name: 'Grab', from: 'Melee' },
  pummel: { name: 'Pummel', from: 'Melee' }, throw: { name: 'Throw', from: 'Melee' }, jab: { name: 'Jab', from: 'Melee' }, tilt: { name: 'Tilt', from: 'Melee' },
  smash: { name: 'Charged smash', from: 'Melee' }, aerial: { name: 'Aerial', from: 'Melee' }, special: { name: 'Special', from: 'Melee' },
  ledgeGrab: { name: 'Ledge hang', from: 'Melee' }, ledgeGetup: { name: 'Ledge getup', from: 'Melee' }, tech: { name: 'Tech', from: 'Melee' },
  di: { name: 'Survival DI', from: 'Melee' }, crouchCancel: { name: 'Crouch cancel', from: 'Melee' }, powerShield: { name: 'Powershield', from: 'Melee' },
  shieldBreak: { name: 'Shield break', from: 'Melee' }, edgeguard: { name: 'Edgeguard', from: 'Melee' }, stock: { name: 'Take a stock', from: 'Melee' },
};

/** The platform fighter's verbs, one checklist for both of its stages (the Arena and the flat stage). */
const FIGHTER_VERBS = ['shield', 'spotDodge', 'roll', 'airDodge', 'wavedash', 'shortHop', 'fastFall', 'lCancel', 'grab', 'pummel', 'throw', 'jab', 'tilt', 'smash', 'aerial', 'special', 'ledgeGrab', 'ledgeGetup', 'tech', 'di', 'crouchCancel', 'powerShield', 'shieldBreak', 'edgeguard', 'stock'];

/** The stages, in the wings' order, and the wave each is built in (the plan's section 4). `par` real seconds for a rank. */
export const STAGES = [
  { id: 'run', wave: 1, family: 'The Run', par: 60, verbs: ['run', 'jump', 'doubleJump', 'dash', 'slide', 'crawl', 'wallJump', 'wallRun', 'mantle', 'dropThrough', 'spring', 'slope', 'ice', 'goo'] },
  { id: 'climb', wave: 1, family: 'The Climb', par: 60, verbs: ['ladder', 'vine', 'swingRope', 'ropeLaunch', 'hang', 'beam', 'pole'] },
  { id: 'stomp', wave: 1, family: 'The Stomp', par: 50, verbs: ['stomp', 'groundPound', 'pogo', 'bonk'] },
  { id: 'brawl', wave: 1, family: 'The Brawl', par: 90, verbs: ['string', 'juggle', 'launch', 'ringOut', 'grabThrow', 'trophy'] },
  { id: 'machine', wave: 1, family: 'The Machine', par: 90, verbs: ['push', 'seesaw', 'pulley', 'conveyor', 'crumble', 'mover', 'switch', 'onOff', 'key', 'cannon', 'carry'] },
  { id: 'flood', wave: 1, family: 'The Flood', par: 120, verbs: ['pour', 'carve', 'float', 'dig', 'freeze', 'raise'] },
  { id: 'arsenal', wave: 2, family: 'The Arsenal', par: 60, verbs: ['shoot8', 'chargeShot', 'bomb'] },
  { id: 'swing', wave: 2, family: 'The Swing', par: 60, verbs: ['grapple', 'elastic', 'zip'] },
  { id: 'flip', wave: 2, family: 'The Flip', par: 60, verbs: ['flip', 'flick', 'portal'] },
  { id: 'pit', wave: 2, family: 'The Pit', par: 120, verbs: ['retry', 'shootSave', 'troll', 'ghosts', 'rival'] },
  { id: 'jar', wave: 2, family: 'The Jar', par: 60, verbs: ['jarRoll', 'jarThrow'] },
  { id: 'troupe', wave: 3, family: 'The Troupe', par: 150, verbs: ['jobs'] },
  { id: 'script', wave: 3, family: 'The Script', par: 150, verbs: ['rules', 'drawLine'] },
  { id: 'depth', wave: 3, family: 'The Depth', par: 60, verbs: ['lanes'] },
  { id: 'chase', wave: 3, family: 'The Chase', par: 90, verbs: ['chase', 'autoscroll', 'beat'] },
  { id: 'wall', wave: 3, family: 'The Wall', par: 90, verbs: ['wallFace'] },
  { id: 'maze', wave: 3, family: 'The Maze', par: 180, verbs: ['seeded'] },
  { id: 'arena', wave: 4, family: 'The Arena', par: 180, verbs: FIGHTER_VERBS },
  { id: 'flatstage', wave: 4, family: 'The Flat Stage', par: 180, verbs: FIGHTER_VERBS }, // (Final Destination's layout, FIGHTER.md 5.1: the same kit, verbs and par as the Arena's, unmeasured apart)
];
export const stageOf = (id) => STAGES.find((s) => s.id === id) || null;

/** The dummies' percent (Smash 64's knockback, simplified): a blow of power 1..3 adds power x `perPower` %, and sends the dummy at
 *  power x (base + growth x percent) m/s, `angle` degrees up. At 0% a light blow nudges (2 m/s); at 120% a heavy one sends it about 28 m/s,
 *  past the blast line `blast` m beyond the stage's edge from mid-stage. `max` keeps a readout sane. */
export const PERCENT = { perPower: 8, base: 2, growth: 0.06, angle: 40, blast: 14, max: 999, trophyAt: 100 };
export function launchOf(power = 1, percent = 0) {
  const p = Math.max(0, Math.min(3, power));
  return { speed: p * (PERCENT.base + PERCENT.growth * Math.max(0, percent)), angle: PERCENT.angle };
}
/** A blow's percent added. */
export const percentOf = (power = 1) => Math.round(Math.max(0, power) * PERCENT.perPower);

/** The stage's falling-sand grid (Noita, the Powder Toy): 160 x 90 cells at 0.25 m (40 m x 22.5 m), stepped `rate` times a real second, a
 *  `share` of its rows a step so it stays under a millisecond on a phone. Each cell one of CELL. */
export const GRID = { w: 160, h: 90, size: 0.25, rate: 30, share: 0.25 };
export const CELL = { empty: 0, stone: 1, sand: 2, clay: 3, lachryma: 4, crude: 5, ice: 6 };
/** How each cell moves (falling sand's rules): `falls` drops straight and slides down a diagonal, `flows` also spreads sideways
 *  (`spread` cells a step), `burns` to empty when lit; `solid` stands where it is. `heavy` sinks through a lighter liquid. Lachryma's
 *  spread 6. Under a full stream the mound is 13 rows (3.25 m) after 4 real s and flat within 5 more: the rate a cell is visited (7.5 a real
 *  second, the phone's budget) is the limit, not spread (6 to 32 measured the same); the spray that stood 42 rows was a cell spreading
 *  in mid-air, stopped in grid.js. */
export const MATTER = {
  stone: { solid: true }, clay: { solid: true }, ice: { solid: true, melts: 'lachryma' },
  sand: { falls: true, heavy: 3 },
  lachryma: { falls: true, flows: true, spread: 6, heavy: 1, freezes: 'ice' },
  crude: { falls: true, flows: true, spread: 2, heavy: 0.8, burns: true },
};

/** The room-side verbs added after wave 1 (STRAWMANS-WELL.md 4, GAPS G250 to G254), each a modifier with a source you can see in the stage:
 *  the rope's swing `ROPE` (A and D pump it, `pump` rad/s each real s; let go with Space and its tip's speed x `launch` is added to the kick, at
 *  most `cap` m/s, counted a launch from `min`), the pogo `POGO` (a downward blow over a foe's head or a spike's row within `reach` m above it
 *  and `side` m beside it throws you up at `speed` m/s, `cd` real s apart), grab and throw `GRAB` (a dummy within `reach` m held over the head
 *  up to `hold` real s, thrown as a blow of `power`, or slammed down at `slam` m/s), the pulley `PULLEY` (a platform's load: the Courier 1, a
 *  crate `crate`; it moves `speed` m/s while someone stands on it), a crate in a liquid `FLOAT` (its lift x `lift` of gravity at full depth, the
 *  water's damping `damp` 1/s), Strawman's guide and rival `GUIDE` (the ghost's pace `speed` m/s, hop height `hop` m, opacity `alpha`, how far
 *  ahead of you it starts `lead` real s) and the cannon as the Wisp's turret `TURRET` (a ball every `every` real s, its speed, how long a parried
 *  ball stuns it `stun`, the knock on you). */
export const ROPE = { pump: 1.6, launch: 0.95, cap: 12, min: 2 };
export const POGO = { speed: 11.5, reach: 2.2, side: 0.9, cd: 0.25 };
export const GRAB = { reach: 1.0, hold: 6, power: 2, slam: 14 };
export const PULLEY = { speed: 1.8, crate: 2, courier: 1 };
export const FLOAT = { lift: 1.9, damp: 3 };
export const GUIDE = { speed: 5, hop: 0.6, alpha: 0.4, lead: 0 };
export const TURRET = { every: 2.6, speed: 7, stun: 6, knock: 6.5, r: 0.32 };

/** The Pit's retry (Super Meat Boy): a fall puts you back at the last checkpoint in `retry` real s, never a shatter (a test bench). */
export const PIT = { retry: 0.4, ghosts: 64 };

/** A clear's rank (Elsword's dungeon rank): time against par, hits taken, and the longest string. */
export function rankOf({ t = Infinity, par = 60, hits = 0, string = 0 } = {}) {
  const time = Math.max(0, Math.min(1, (2 * par - t) / par)); // (1 at par or better, 0 at twice par)
  const safe = Math.max(0, 1 - hits / 6);
  const style = Math.min(1, string / 12);
  const s = 0.5 * time + 0.3 * safe + 0.2 * style;
  return s >= 0.95 ? 'SS' : s >= 0.85 ? 'S' : s >= 0.7 ? 'A' : s >= 0.55 ? 'B' : s >= 0.4 ? 'C' : 'D';
}
export const starsOf = (rank) => ({ SS: 3, S: 3, A: 2, B: 1, C: 1, D: 0 })[rank] ?? 0;
