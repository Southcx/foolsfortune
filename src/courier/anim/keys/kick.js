// ---------------------------------------------------------------------------------------
// THE KICK'S KEY POSES, A GUARD BETWEEN THE BLOWS (KEY-POSES.md 7 item 2; Petra's round 3, behind the setting `visual.keyPoses` until
// South has played it). The kick's jab string (courier/moves/kick.js, the moveset id 'kick': j1, j2, j3) written as keys: a guard, the
// strike at its clip's own frame, the follow-through, and back into the guard, so the string reads as blows thrown out of one stance and
// returned to it. Holds in 60 Hz frames add up to each move's `to` (j1 0.6, j2 0.7, j3 0.85 clip s); the strike lands on the clip's
// own strike frames (30 fps: Combo1 2-5, Combo2 4-7, Combo3 5-7). The guard is Fist_Combo1's first frame with the arms solved up (the
// fists before the chin, the lead hand forward) and the knees softened, aimed in the body's frame (+Z ahead, +Y up, +X the left).
// Where it comes from: the boxer's high guard (Tekken's and Virtua Fighter's idle stances), Guilty Gear Xrd's held strike frames.
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   GUARD (the still, for whoever wants it)
// ---------------------------------------------------------------------------------------

/** The guard: the fists up before the chin, the lead (left) forward, the knees softened (solved: scripts' aim of each limb). */
export const GUARD = {
  clip: 'Fist_Combo1', frame: 0,
  fix: {
    spine: [0.021, 0.001, -0.048], thighR: [0.354, -0.033, -0.184], thighL: [0.5, -0.021, -0.084],
    upper_armR: [0.565, 0.083, 0.284], forearmR: [-0.314, -0.059, 0.371], upper_armL: [-0.154, -0.011, 0.137], forearmL: [-0.18, -0.053, 0.568],
  },
};
const guard = (pose, hold, snap) => ({ pose, ...GUARD, hold, snap });

export const KEYS = {
  // the lead jab: out of the guard, the left fist straight, held, drawn back
  j1: [guard('guard', 4, 2),
    { pose: 'strike', clip: 'Fist_Combo1', frame: 4, hold: 7, snap: 1, active: true },
    { pose: 'follow', clip: 'Fist_Combo1', frame: 8, hold: 8, snap: 3 },
    guard('settle', 17, 6)],
  // the cross: the rear fist thrown through the turned hips
  j2: [guard('guard', 8, 2),
    { pose: 'strike', clip: 'Fist_Combo2', frame: 6, hold: 7, snap: 1, active: true },
    { pose: 'follow', clip: 'Fist_Combo2', frame: 10, hold: 9, snap: 3 },
    guard('settle', 18, 6)],
  // the finisher: held longest, the follow-through carried
  j3: [guard('guard', 10, 2),
    { pose: 'strike', clip: 'Fist_Combo3', frame: 6, hold: 6, snap: 1, active: true },
    { pose: 'follow', clip: 'Fist_Combo3', frame: 11, hold: 12, snap: 3 },
    guard('settle', 23, 6)],
};
