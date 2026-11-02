// ---------------------------------------------------------------------------------------
// A MECH'S CLIP MAP (plain name): which of the Courier's clips each of a mech's states plays, and how much of it each joint takes, a
// profile a form. The hero (the clay warrior) and the doll (Haydee's android, South, 2026-11-02: "I feel like the Doll mech is going to
// need specialized animations to accommodate her frame") read different clips: her idle and walk the Courier's feminine ones (the walk
// in the social pack, asked for the first time she is built: suite.js `pack.social`; the masculine walk stands in until it lands), and
// her own layer over them (keys.js DOLL: contrapposto, the hip's sway, the arms carried clear of the hips, the skater's line).
//   a state's clip   idle, walk (a stride of two steps: frame 0 the left heel's strike, so a step lands on the gait's whole numbers),
//                    skate (the Solar Skiff's ride: a low wide stance, its turns for the carve), assault (the skiff's boost), air /
//                    fall, a quick boost's lurch (the air dash, four ways, held at `lurchFrame`: its lean, its legs left out); the
//                    landing is the mech's own key alone (keys.js SQUASH: a landing clip under it folded the frame flat)
//   WEIGHT           a share of the clip a joint takes (the arms half, so a heavy frame never flails; the legs whole while it walks)
// Prior art: the Courier's own clip choices (courier/anim/stances.js), Armored Core's skating stances, the figure skater's line.
//
//   MECH_CLIPS[profile]   WEIGHT[profile][state]   profileOf(form)
// ---------------------------------------------------------------------------------------

export const MECH_CLIPS = {
  hero: {
    idle: 'Loco_IdleAlert', walk: 'Loco_WalkMasc', walkAlt: null, skate: 'Skiff_RideCruise', carveL: 'Skiff_RideTurnL', carveR: 'Skiff_RideTurnR',
    assault: 'Skiff_BoostLoop', air: 'Air_JumpLoop', fall: 'Air_FallLoop',
    lurch: { f: 'Air_AirDash', b: 'Air_AirDashBack', l: 'Air_AirDashL', r: 'Air_AirDashR' }, lurchFrame: 4,
  },
  doll: {
    idle: 'Loco_IdleFem', walk: 'Loco_WalkFem', walkAlt: 'Loco_WalkMasc', skate: 'Skiff_RideCruise', carveL: 'Skiff_RideTurnL', carveR: 'Skiff_RideTurnR',
    assault: 'Skiff_BoostLoop', air: 'Air_JumpLoop', fall: 'Air_FallLoop',
    lurch: { f: 'Air_AirDash', b: 'Air_AirDashBack', l: 'Air_AirDashL', r: 'Air_AirDashR' }, lurchFrame: 4,
  },
};

const ALL = (v, over = {}) => ({ pelvis: v, waist: v, chest: v, neck: v, head: v, shoulderL: v, elbowL: v, wristL: v, shoulderR: v, elbowR: v, wristR: v, hipL: v, kneeL: v, ankleL: v, hipR: v, kneeR: v, ankleR: v, ...over });
const ARMS = (v) => ({ shoulderL: v, elbowL: v, wristL: v * 0.5, shoulderR: v, elbowR: v, wristR: v * 0.5 });
/** A joint's share of the clip a state: the walk's legs whole; the skate's legs a little under (its key stance takes the rest). */
export const WEIGHT = {
  hero: {
    ground: ALL(0.85, { pelvis: 0.7, ...ARMS(0.45), hipL: 1, kneeL: 1, ankleL: 1, hipR: 1, kneeR: 1, ankleR: 1 }),
    skate: ALL(0.7, { ...ARMS(0.4), hipL: 0.6, kneeL: 0.6, ankleL: 0.6, hipR: 0.6, kneeR: 0.6, ankleR: 0.6 }),
    air: ALL(0.7, ARMS(0.4)),
    lurch: ALL(0.55, { hipL: 0, kneeL: 0, ankleL: 0, hipR: 0, kneeR: 0, ankleR: 0, pelvis: 0.35, ...ARMS(0.35) }),
  },
  doll: {
    ground: ALL(0.9, { pelvis: 0.85, ...ARMS(0.55), hipL: 1, kneeL: 1, ankleL: 1, hipR: 1, kneeR: 1, ankleR: 1 }),
    skate: ALL(0.7, { ...ARMS(0.15), hipL: 0.55, kneeL: 0.55, ankleL: 0.55, hipR: 0.55, kneeR: 0.55, ankleR: 0.55 }),
    air: ALL(0.75, ARMS(0.45)),
    lurch: ALL(0.5, { hipL: 0, kneeL: 0, ankleL: 0, hipR: 0, kneeR: 0, ankleR: 0, pelvis: 0.3, ...ARMS(0.12) }),
  },
};
/** The profile a form plays: a feminine form the doll's. */
export const profileOf = (F) => (F?.fem ? 'doll' : 'hero');
