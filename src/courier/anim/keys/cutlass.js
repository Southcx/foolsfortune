// ---------------------------------------------------------------------------------------
// THE CUTLASS'S KEY POSES (South, 2026-10-31: "Strong key poses and holds are the answer!"; docs/plans/KEY-POSES.md 7): the Sondelass's
// LMB string (the melee loadout's c1, c2, c3; sondelass/sondelassloadout.js) written as stills of its own clips, held and snapped in 60 Hz
// frames, played by Petra's key track (courier/anim/keyposes.js) in place of the clip's blend. The blow's timing stays the clip's: the
// key track runs on the move's clock (game dt times the move's rate), so key frame f stands at clip time f / 60, and each strike key is
// laid where the clip's measured strike window opens (melee.js measureSwing, the tip at 0.9 m: c1 0.03 .. 0.30 s, c2 0.17 .. 0.33 s,
// c3 0.40 .. 0.48 s). Each move's holds add up to its `to` (c1 0.85, c2 0.90, c3 1.05 clip s); its fade back to the stance is the row's.
// c4 (the leap, a whole-body move carried by the launch tech) is not keyed yet.
//
// A move reads lead-in, strike, follow-through, settle (Sakurai's three, and a settle so the stance's fade has a still to leave): the
// lead-in is the clip's own wind-up taken at its most drawn, held so the strike snaps out of it; the strike is the frame the blade
// crosses the front, snapped in over 2 frames (Smash's and Guilty Gear Xrd's cut); the follow-through the arc's far end, held.
// Prior art: Strawman's keyed moves (vfx/strawmanmoves.js), MUDRA_FRAMES (a clip's frame by name), the clips' own frames as measured.
//
//   KEYS[move] = [{ pose, clip, frame, fix?, hold, snap, plant?, holdWhile?, active? }]   (registered by courier/anim/keys/index.js)
// ---------------------------------------------------------------------------------------

export const KEYS = {
  // Slash: flat, right to left. The blade out to the right, across the front, wrapped round to the left.
  c1: [
    { pose: 'lead', clip: 'Sond_Combo1', frame: 1, hold: 3, snap: 3 },
    { pose: 'strike', clip: 'Sond_Combo1', frame: 5, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Sond_Combo1', frame: 8, hold: 12, snap: 3, active: true },
    { pose: 'settle', clip: 'Sond_Combo1', frame: 15, hold: 28, snap: 6 },
  ],
  // Rising Slash: low left to high right. Coiled low on the left, the blade rising across, carried up high on the right.
  c2: [
    { pose: 'lead', clip: 'Sond_Combo2', frame: 5, hold: 9, snap: 4 },
    { pose: 'strike', clip: 'Sond_Combo2', frame: 6, hold: 6, snap: 2, active: true },
    { pose: 'follow', clip: 'Sond_Combo2', frame: 9, hold: 12, snap: 3, active: true },
    { pose: 'settle', clip: 'Sond_Combo2', frame: 16, hold: 27, snap: 6 },
  ],
  // Hop Slash: the blade held out, the hop with it tucked, the flat cut as the feet come down, the landing's crouch.
  c3: [
    { pose: 'lead', clip: 'Sond_Combo3', frame: 6, hold: 12, snap: 4, plant: 'LR' },
    { pose: 'rise', clip: 'Sond_Combo3', frame: 10, hold: 12, snap: 3 },
    { pose: 'strike', clip: 'Sond_Combo3', frame: 13, hold: 6, snap: 2, active: true },
    { pose: 'land', clip: 'Sond_Combo3', frame: 16, hold: 10, snap: 2, plant: 'LR' },
    { pose: 'settle', clip: 'Sond_Combo3', frame: 24, hold: 23, snap: 6 },
  ],
};
