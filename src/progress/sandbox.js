// ---------------------------------------------------------------------------------------
// THE SANDBOX AND THE THROWN HIT: the god hand's physics room and its kickabout (South, 2026-10-30: "a room in the workshop kind of like
// the Siege, but as a little physics sandbox to test god powers ... a little area to practice kicking a physics enabled ball around.
// Dawn of Mana is a huge inspiration"), and the rule that makes the world a weapon everywhere (docs/plans/SANDBOX.md).
//
// THE THROWN HIT (Dawn of Mana's lesson): anything loose that the hand throws or the Courier kicks (a crate, a pot, a brick, the ball)
// strikes a creature it meets fast enough, as an Impact blow scaled by the energy it carries (half its mass times its speed squared:
// a light ball stings, a heavy crate floors). A creature so struck PANICS (Dawn of Mana's Panic, which paid out more when an enemy was
// hit by the world): its agitation (EmO, combat/emo.js) is thrown into the band where its Lachryma yields most, so playing with the
// world pays without a new number. A heavy hit also deepens its stun (creatures/stun.js). Thrown things that hit two or more creatures
// in one flight are a strike, as a bowling ball's.
// What was thrown out (Dawn of Mana's ill-advised): its stats reset at every chapter (progress here is the ledger's and stays); the
// vine's lock that picked the wrong thing (the hand grabs what is under it, the lock-on is the Courier's); objects that vanished
// when they had been used (a crate stays where it lands until it breaks).
//
// THE SANDBOX: a hall off the Index beside the Siege (THE HAND group), its floor flat clay the hand works; a yard of loose things restocked
// at its rack, a pen where slip jellies are called up to try powers on (training bodies: they pay nothing and count nothing, as the
// Throwing Room's), the ground put back at once at its third lectern, and a pitch at its east end with a ball and a goal. Your own
// powers only (DEBUG's lend panel lends the rest): it is a place to practise, not a shortcut past learning one.
//
// Prior art: Dawn of Mana (Square Enix, 2006: the Havok world as a weapon, the vine's grab and fling, Panic and its medals); Black & White's
// creature pen and its toss of villagers; Garry's Mod's sandbox (a room of props and a reset); Breath of the Wild's physics shrines;
// Super Mario Sunshine's and Mario Strikers' kickable balls; keepy-uppy (the juggle's record).
//
//   SANDBOX = { at, size, arrive, lecterns, yard, pen, pitch }   STOCK [{ kind, size, n, at }]   BALL   GOAL   IMPACT
//   impactOf(mass, speed) -> { power, heavy, energy } | null   (a thrown hit's blow, or none under IMPACT.speed)
//   panicOf(emo) -> emo (raised into the yield band)            inGoal(p) -> bool (the ball's middle inside the mouth, local metres)
// ---------------------------------------------------------------------------------------
import { EMO } from './combat/emo.js';

/** The hall: where it stands (east of the Touchstone, out of every sky, as Petra placed that one), its floor in local metres (north is
 *  -z), where you arrive, and its three lecterns. The pitch takes the east third; the yard and the pen the west two. */
export const SANDBOX = {
  at: { x: 3080, y: 200, z: -3000 }, size: { w: 48, d: 40, h: 14 },
  arrive: { x: 0, z: 16, yaw: Math.PI },
  lecterns: {
    rack: { x: -16, z: 14, line: 'Restock the yard: crates, bricks and pots.' },
    pen: { x: -4, z: 14, line: 'Call three slip jellies into the pen (training bodies: they count nothing).' },
    ground: { x: 8, z: 14, line: 'Put the ground back as it was.' },
  },
  yard: { x: -12, z: -4, w: 16, d: 14 }, // (where the stock is laid out)
  pen: { x: -2, z: -12, r: 6 },           // (a ring of low clay posts the jellies are called into)
  pitch: { x: 15, z: -4, w: 16, d: 28 },  // (its middle and size: the ball's ground, low walls round it so the ball comes back)
};
/** What the rack lays out each time (sizes in metres; the level's own crate, brick and pot props, so the kick and the hand know them). */
export const STOCK = [
  { kind: 'crate', size: 0.6, n: 8 },   // (a light crate: lifted, thrown, a sting)
  { kind: 'crate', size: 1.1, n: 3 },   // (a heavy crate: pushed, a flooring hit when thrown)
  { kind: 'brick', size: [0.5, 0.25, 0.25], n: 18, tower: true }, // (a tower to knock down: a chain of things falling)
  { kind: 'pot', n: 6 },                // (the workshop's breakable pots: a pot thrown breaks where it lands)
];
/** The ball: a size between a football's and a beach ball's so it reads from the god hand's height, light enough to fly off a kick, and
 *  lively (its bounce). `respawn`: real seconds out of the pitch before it is set back on the spot. */
export const BALL = { r: 0.32, density: 9, restitution: 0.62, friction: 0.7, linearDamping: 0.12, angularDamping: 0.4, spot: { x: 15, z: -4 }, respawn: 4 };
/** The goal at the pitch's north end: its mouth's middle (local metres), width and height (a five-a-side goal's). A juggle is kicks
 *  in a row with the ball never touching the floor (a kick within `juggleGap` real seconds of the ball's last touch). */
export const GOAL = { x: 15, z: -17.5, w: 3.6, h: 2, depth: 1.2, juggleGap: 2.5 };
export const inGoal = (p) => Math.abs(p.x - GOAL.x) < GOAL.w / 2 && p.y < GOAL.h && p.z < GOAL.z && p.z > GOAL.z - GOAL.depth;

/** The thrown hit's numbers. `speed`: m/s under which a loose thing only bumps (a crate rolled into a jelly is not a blow). `unit`: joules a
 *  blow of power 1 carries (a 1 kg ball at about 9 m/s: a good kick). `max`: the most a blow can be (a power 3 is a heavy finisher's).
 *  `heavy`: joules from which it deepens a stun and knocks down. `panic`: what it adds to agitation, and it is lifted at least to the
 *  yield band's floor (EMO.optimal). `cool`: real seconds before the same thing may strike the same creature again. `strike`: creatures
 *  one throw must hit to be a strike. */
export const IMPACT = { speed: 6, unit: 40, max: 3, heavy: 250, panic: 0.2, cool: 0.6, strike: 2 };
/** A loose thing's blow, from its mass (kg) and speed (m/s): its power, whether it is heavy, the energy it carried; none if too slow. */
export function impactOf(mass, speed) {
  if (!(speed >= IMPACT.speed) || !(mass > 0)) return null;
  const energy = 0.5 * mass * speed * speed;
  return { power: Math.min(IMPACT.max, Math.max(0.3, energy / IMPACT.unit)), heavy: energy >= IMPACT.heavy, energy: Math.round(energy) };
}
/** A struck creature's agitation, panicked: up by IMPACT.panic and at least into the band where its Lachryma yields most. */
export const panicOf = (emo = 0) => Math.min(1, Math.max(EMO.optimal[0], emo + IMPACT.panic));
