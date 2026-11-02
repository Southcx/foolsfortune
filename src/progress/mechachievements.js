// ---------------------------------------------------------------------------------------
// MECHS' ACHIEVEMENTS (docs/plans/MECHS.md 7): predicates over the ledger tracking/mechs.js keeps, under THE HAND's new "The Hangar" sub
// (the hangar is a THE HAND room at the Index, beside the Sandbox and Strawman's Well). Several open parts (parts.js `earn`). Words
// placeholders for Espada's.
//
// Prior art: Armored Core's arena ranks (a frame proven, then the next), Evangelion's sync tests (a ratio held, a record), Old School
// RuneScape's tiers (Easy to Elite; a hidden one for the berserk).
//
//   mechAchievements({ C, H, F })   (moduleachievements.js calls it)   MECH_LEGS   (v2, MECHS.md 9: mk8 to mk17)
// ---------------------------------------------------------------------------------------
import { LEG_TYPES } from './mechs/parts.js';
import { TECHNIQUE_IDS } from './mechs/techniques.js';

export const MECH_LEGS = Object.keys(LEG_TYPES);

export function mechAchievements({ C, H, F }) {
  C('mk1', 'hand', 'The Hangar', 1, 'count', 'First Sync', 'Seal your Pneuka Jar into a mech.', 'mech.seal', 1);
  C('mk2', 'hand', 'The Hangar', 1, 'count', 'Launch', 'Ride the lift up to the proving ground.', 'mech.launch', 1);
  C('mk3', 'hand', 'The Hangar', 2, 'mechanic', 'Straw Giant', 'Fell the straw giant.', 'giant.down.straw', 1);
  H('mk4', 'hand', 'The Hangar', 4, 'mechanic', 'In Step', 'Hold sync at 90% for 30 real seconds: walk on the stride.', 'mech.sync.run', 30, { unit: 's' });
  C('mk5', 'hand', 'The Hangar', 4, 'mechanic', 'Off the Cable', 'Fell a giant with the cable out.', 'giant.down.offcable', 1);
  F('mk6', 'hand', 'The Hangar', 5, 'collect', 'Every Leg', 'Fell a giant on each leg type: biped, reverse joint, tetrapod and tank.', (L) => MECH_LEGS.filter((t) => L.get(`giant.down.leg.${t}`) >= 1).length, MECH_LEGS.length);
  C('mk7', 'hand', 'The Hangar', 5, 'mechanic', 'Unit Zero', 'Live through a berserk.', 'mech.berserk', 1, { hidden: true });
  // v2 (MECHS.md 9): the ring, the toy city, what you pick up (words placeholders, Espada's)
  C('mk8', 'hand', 'The Hangar', 2, 'mechanic', 'First Bout', 'Win a bout in the ring.', 'mech.bout.won', 1);
  C('mk9', 'hand', 'The Hangar', 3, 'mechanic', 'Charge Breaker', 'Put the heavy frame down on its charge with one body blow.', 'mech.bout.chargebreak', 1);
  C('mk10', 'hand', 'The Hangar', 4, 'mechanic', 'Knock Its Block Off', 'Win a bout with your rival\'s head popped off.', 'mech.bout.how.head', 1);
  C('mk11', 'hand', 'The Hangar', 5, 'mechanic', 'Champion', 'Beat the champion frame.', 'mech.bout.won.champion', 1);
  C('mk12', 'hand', 'The Hangar', 5, 'mechanic', 'Perfect Bout', 'Win a bout without taking a blow.', 'mech.bout.perfect', 1);
  C('mk13', 'hand', 'The Hangar', 3, 'endure', 'Wrecking Crew', 'Break 10,000 cells of the toy city.', 'mech.destroy.cells', 10000);
  C('mk14', 'hand', 'The Hangar', 3, 'mechanic', 'Bring It Down', 'Bring a building down with one blow.', 'mech.destroy.topple', 1);
  C('mk15', 'hand', 'The Hangar', 4, 'mechanic', 'Under the Rubble', 'Fell a giant with a falling building.', 'giant.down.weapon.rubble', 1);
  C('mk16', 'hand', 'The Hangar', 3, 'mechanic', 'Spare Parts', 'Strike a giant with its own torn-off arm.', 'mech.limb.own', 1);
  F('mk17', 'hand', 'The Hangar', 4, 'collect', 'Every Technique', 'Use every technique.', (L) => TECHNIQUE_IDS.filter((t) => L.get(`mech.technique.${t}`) >= 1).length, TECHNIQUE_IDS.length);
}
