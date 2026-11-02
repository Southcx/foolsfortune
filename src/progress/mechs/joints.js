// ---------------------------------------------------------------------------------------
// A MECH'S JOINTS (docs/plans/MECHS.md 9.3; South, 2026-11-02: "do you know the game Toribash? ... dismembered mechanical joints like rock em
// sock em robots would be sick"). Under a frame's six regions (vessel.js FORMS.mech) are its joints, and a blow on a region strains the
// joints in it. A strained joint FRACTURES past `fracture` (Toribash's word: it locks: the limb past it works at `locked` of itself, its
// blows slower and lighter, a leg's stride shorter); a fractured joint struck hard once more, or strained past whole, SNAPS (Toribash's
// dismemberment): the limb past it comes off and falls, a thing in the world anyone can pick up and swing (techniques.js PROPS 'limb').
// The neck snapped is Rock 'Em Sock 'Em's "knocked his block off": the head pops up on its spring and the bout is over (rivals.js RING),
// and outside the ring the frame has lost its head: the lock-on and the long sight go with it. Every frame has the same nine joints, the
// rival boxers and the giants too, so a fight can take an arm off either side and the arm keeps fighting in the other's hands.
// Joints are the vessel's rule one level down (a blow on a region, base change bad, modifiers good: a fractured elbow is a modifier on the
// arm's blows with its source, the joint, drawn where it bites); they mend at the gantry with the cracks.
//
// Prior art: Toribash (joints that fracture and dismember past a force threshold, the limb left in play), Rock 'Em Sock 'Em Robots (the
// head popped up on its spring: the knockout), Robot Wars and BattleBots (a weapon torn off, the bot fighting on), Front Mission's parts
// (an arm destroyed, its weapon gone), Monster Hunter's breakable parts and severed tails (a carve off a part), Zone of the Enders.
//
//   JOINTS[id] = { region, limb (what comes off with it: the part slots and the joints past it), tough (strain a full blow puts in, divided by) }
//   JOINT = { fracture, snap, heavy, locked, legLocked }   REGION_JOINTS[region] = [[joint, share]]
//   newJoints() -> { [id]: { strain, state ('whole' | 'fractured' | 'snapped') } }
//   strainBlow(J, region, k, armour, min = JOINT.min) -> [{ joint, from, to }] (each joint whose state changed; J changed in place)
//   past(J, id) -> bool (is this joint, or one nearer the core on its limb, snapped: the part is gone)   armOK(J, side)   lockOf(J, part) -> 0..1
//   headOff(J) -> bool (the neck snapped: Rock 'Em Sock 'Em's KO)   mendJoints() -> newJoints()
// ---------------------------------------------------------------------------------------

/** The joints. `limb`: the slots and joints that come off when it snaps (an elbow takes the forearm and its weapon; a shoulder the whole
 *  arm); `tough`: how much a full blow's share strains it, divided by this (the waist the stoutest, the elbow and the neck the weakest).
 *  `toward`: the joint nearer the core on its limb (a shoulder snapped takes its elbow off with it). */
export const JOINTS = {
  neck:      { region: 'head', limb: ['head'], tough: 3 },
  shoulderL: { region: 'armL', limb: ['armL', 'weaponL', 'elbowL'], tough: 1.5 },
  shoulderR: { region: 'armR', limb: ['armR', 'weaponR', 'elbowR'], tough: 1.5 },
  elbowL:    { region: 'armL', limb: ['weaponL'], tough: 1.0, toward: 'shoulderL' },
  elbowR:    { region: 'armR', limb: ['weaponR'], tough: 1.0, toward: 'shoulderR' },
  waist:     { region: 'core', limb: [], tough: 2.4 },            // (never snaps: the frame is its core; fractured, it turns slower)
  hipL:      { region: 'legs', limb: ['legL'], tough: 1.8 },
  hipR:      { region: 'legs', limb: ['legR'], tough: 1.8 },
  backMount: { region: 'back', limb: ['back'], tough: 1.2 },      // (the back unit's mount: snapped, the back unit falls off)
};
export const JOINT_IDS = Object.keys(JOINTS);

/** How a blow on a region shares out among its joints (a blow on the arm strains the elbow more than the shoulder: the lever). */
export const REGION_JOINTS = {
  head: [['neck', 1]], core: [['waist', 1]], back: [['backMount', 1]],
  armL: [['elbowL', 0.6], ['shoulderL', 0.4]], armR: [['elbowR', 0.6], ['shoulderR', 0.4]], legs: [['hipL', 0.5], ['hipR', 0.5]],
  body: [['waist', 1]], // (a giant's body region)
};

/** The thresholds (strain, 0..). Toribash's rule: a joint answers only to force past a threshold, so a blow under `min` (a full blow's
 *  share, after armour) strains nothing, and a blow over it strains by what it carries past it (x its share / the joint's tough). A joint
 *  is fractured at `fracture`, snapped at `snap`, or, fractured, snapped by one blow adding `heavy` or more (a fracture is the warning,
 *  the next hard blow takes it). A guard taking blows strains its own arms with no threshold (strainBlow's `min` 0: blocking costs the
 *  arms: Toribash's). A fractured joint's limb works at `locked` (its blows' k and speed), a fractured hip's leg at `legLocked` of the
 *  stride. Sized (scripts/mechs.mjs, the ring): a plain punch (0.6) never strains; a counter to the head (1.0) adds 0.17 to the neck; a
 *  3-star punch (2.9) fractures the neck in one and snaps it with the next heavy; the champion's dynamite (2) adds 1, so the third that
 *  lands takes your head; about 15 punches into one arm's guard snap its elbow. */
export const JOINT = { min: 0.8, fracture: 1.4, snap: 2.6, heavy: 0.9, locked: 0.6, legLocked: 0.7 };

export const newJoints = () => Object.fromEntries(JOINT_IDS.map((id) => [id, { strain: 0, state: 'whole' }]));
export const mendJoints = newJoints;

/** A blow of k (a full blow's share) on a region, after armour (the frame's armour on that region, frame.js stats.armour: 1 plain, under 1
 *  tougher): past `min`, each joint in it strained by what is past it x share / tough. Returns the joints whose state moved. */
export function strainBlow(J, region, k, armour = 1, min = JOINT.min) {
  const out = [], over = k * armour - min; if (over <= 0) return out;
  for (const [id, share] of REGION_JOINTS[region] || []) {
    const j = J[id]; if (!j || j.state === 'snapped' || past(J, id)) continue;
    const add = (over * share) / JOINTS[id].tough, from = j.state;
    j.strain += add;
    if (id !== 'waist' && (j.strain >= JOINT.snap || (from === 'fractured' && add >= JOINT.heavy))) j.state = 'snapped';
    else if (j.strain >= JOINT.fracture) j.state = 'fractured';
    if (j.state !== from) out.push({ joint: id, from, to: j.state, strain: +j.strain.toFixed(2) });
  }
  return out;
}

/** Is this joint gone, itself or with its limb (a shoulder snapped takes its elbow)? */
export const past = (J, id) => J[id]?.state === 'snapped' || (!!JOINTS[id]?.toward && J[JOINTS[id].toward]?.state === 'snapped');
/** Has an arm (side 'L' | 'R') still its weapon? */
export const armOK = (J, side) => !past(J, `elbow${side}`);
/** How well a part works by its joints: 0 gone, `locked` past a fractured joint, 1 whole. part: 'armL' | 'armR' | 'legL' | 'legR' | 'head' | 'back' | 'waist'. */
export function lockOf(J, part) {
  const chain = { armL: ['shoulderL', 'elbowL'], armR: ['shoulderR', 'elbowR'], legL: ['hipL'], legR: ['hipR'], head: ['neck'], back: ['backMount'], waist: ['waist'] }[part] || [];
  if (chain.some((id) => past(J, id))) return 0;
  return chain.some((id) => J[id]?.state === 'fractured') ? (part.startsWith('leg') ? JOINT.legLocked : JOINT.locked) : 1;
}
/** Rock 'Em Sock 'Em's knockout: the neck snapped, the head popped up on its spring. */
export const headOff = (J) => J.neck?.state === 'snapped';
/** Legs left (0, 1 or 2): one, the frame kneels and drags itself; none, it sits where it is. */
export const legsLeft = (J) => (past(J, 'hipL') ? 0 : 1) + (past(J, 'hipR') ? 0 : 1);
