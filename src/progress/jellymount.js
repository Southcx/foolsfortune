// ---------------------------------------------------------------------------------------
// THE SLIP JELLY MOUNT: gj3's drop (progress/combat/greatjelly.js DROPS `mount.slipjelly`: "a slip jelly to ride"), its rules as data. A
// feature of its own beside the Solar Skiff: the skiff is the sand's (fast, sailed, the sun's); the jelly is everywhere else outdoors (slow,
// bouncing, at home in paint and crude, which it is made of). Petra builds its body and controls from this; Calissa its look; Wanda its
// sounds. Nothing here changes the core movement: riding is a mode, and getting off restores the Courier exactly.
//
// Prior art: Yoshi (Super Mario World: a mount that is also a life, lost on a hit and run after), Dragon Quest's slime knights and the
// bouncing slimes of every JRPG, the Donkey Kong Country animal buddies (each opens ground the hero cannot), Splatoon's squid form (fast in
// your own ink), Breath of the Wild's horses (called, and they come; dismissed, they go).
//
//   JELLY_MOUNT = { call, speeds, hop, ground, hp, ends, events, ledger }   (each number with its reason below)
//   jellyOpen(L) -> bool   (the drop was given: the ledger's `foe.drop.mount.slipjelly`)
//   groundSpeed(kind) -> the speed multiplier on that ground ('sand', 'stone', 'paint', 'crude', 'liquid', 'indoors')
// ---------------------------------------------------------------------------------------

export const JELLY_MOUNT = {
  /** How it is called (Petra's plan, kept): Y held opens a choice of the two mounts (the Solar Skiff and the jelly) round the Courier; Y
   *  tapped calls the last one chosen. The jelly comes out of the nearest paint, crude or sand in `arrive` 1.2 real s (it rises, as a slip
   *  jelly rises from a blot), never indoors (a door is where it is left). */
  call: { hold: 0.35, arrive: 1.2 },
  /** Its speeds, m/s: `cruise` 9 (the sprint's 6.8 and a third: a ride is worth calling, never a skiff), `max` 13 (under the core movement's
   *  14, so it never outruns what the world was built for), `accel` 14 (to cruise in under a second: it is all muscle), `turn` 3.5 rad/s
   *  (it pivots where the skiff carves). */
  speeds: { cruise: 9, max: 13, accel: 14, turn: 3.5 },
  /** Its hop: `up` 8.4 m/s (the Paint Dive's jump: the same body of slip), and a bounce chain: a hop pressed within `window` 0.25 real s of
   *  landing adds `gain` 0.12 of the hop a link, up to `links` 3 (to x1.36, about a mantle's height again), lost on a hop out of rhythm
   *  (Yoshi's flutter and the slime's bounce: timing pays, mashing does not). */
  hop: { up: 8.4, window: 0.25, gain: 0.12, links: 3 },
  /** What the ground does to it (multipliers of `cruise`): sand slows it (`sand` 0.8: the skiff's ground, the jelly sinks in a little);
   *  stone and grass are its own (1); in a feeling's paint it runs at the Paint Dive's speed over the sprint (`paint` 1.4) and takes the
   *  paint's feeling for `tint` 10 real s (a look and the blows' draught, never a status of its own); in crude it is at home too (`crude`
   *  1.4) and drinks a blot under it at the mop's rate (`drink` 1: each cell drunk counts as `stain.wash` by the Courier); on liquid
   *  Lachryma or water it floats at `liquid` 0.6, and never dives. */
  ground: { sand: 0.8, stone: 1, paint: 1.4, crude: 1.4, liquid: 0.6, tint: 10, drink: 1 },
  /** It is a life, as Yoshi is: blows on the rider land on it first. `hp` 8 (a slip jelly's own: it is one); at none it bursts (the slip
   *  jelly's burst), the Courier is set down unhurt, and it re-forms to be called again after `reform` 60 real s (long enough to matter in
   *  a fight, short enough never to be a chore). It mends `mend` 1 hp every 4 real s while you ride it through paint or crude. */
  hp: { max: 8, reform: 60, mend: 0.25 },
  /** How it ends: Y tapped (it slumps back into the ground where it stands), a burst, a door (it waits outside: the next call is at once),
   *  the Solar Skiff called, a seam (a Well, the Index, a crossing). No ride is ever lost to a fall: off a ledge it lands and splashes. */
  ends: ['dismiss', 'burst', 'door', 'skiff', 'seam'],
  /** Its events (each with `by` and `mount: 'slipjelly'`): `mount.call`, `mount.hop { chain }`, `mount.hurt { hp }`, `mount.burst`,
   *  `mount.drink { cells }`, `mount.end { why, secs }` (tracking/jellymount.js books them). */
  events: ['mount.call', 'mount.hop', 'mount.hurt', 'mount.burst', 'mount.drink', 'mount.end'],
  /** What the ledger keeps (tracking's): `mount.slipjelly.secs` (time ridden), `.hops.best` (a bounce chain's longest), `.drink` (blot cells
   *  drunk), `.burst`. */
  ledger: ['mount.slipjelly.secs', 'mount.slipjelly.hops.best', 'mount.slipjelly.drink', 'mount.slipjelly.burst'],
};

/** The drop was given (gj3: every clutch broken before the pull), or lent in DEBUG (the Racing row lends the Raceway's mounts too). */
export const jellyOpen = (L, g = null) => (L?.get?.('foe.drop.mount.slipjelly') || 0) > 0 || !!g?.lend?.has?.('racing');

/** The speed multiplier on a ground (an unknown ground is stone's). */
export const groundSpeed = (kind) => JELLY_MOUNT.ground[kind] ?? 1;
