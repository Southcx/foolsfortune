// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFF ON TOUCH, ITS RULES (docs/plans/MOBILE.md 8): what a thumb on glass holds for the skiff beyond the stick's steer, read
// once a frame by the touch driver (Petra's core/touchdriver.js update()) and held as keys, so the skiff reads exactly what it reads
// from a keyboard (every rule as on the keyboard; only the bindings differ).
//   AUTO-SAIL     on the sand the sail is up (W held) unless BRAKE is held; BRAKE held with a combo live keeps W too, so the chord is
//                 the manual (W and S), as section 8 says. Mario Kart Tour's auto-accelerate: a thumb held down only to go is wasted.
//   THE GLIDE     in the air while gliding, the thumb is the glider: its x the bank (Q / E past STICK.key), its y the pitch (W / S),
//                 and A / D let go (the stick's own A / D are the spin, for a jump that is not a glide).
// Nothing here runs off touch, and with the knack-free board nothing here changes a number: switching touch off restores the keys.
//
// Prior art: Mario Kart Tour (auto-accelerate, the slide that steers is the slide that drifts), Alto's Odyssey (one thumb, one board),
// Sky: Children of the Light (the thumb as the glide's stick).
//
//   SKIFF_TOUCH { auto, key }   skiffTouchKeys(skiff, { x, y, brake }) -> { KeyW, KeyS, KeyQ, KeyE, noAD } | null (not riding)
// ---------------------------------------------------------------------------------------

/** auto: the sail up by itself on the sand; key: the thumb's component past which a glide key is held (the stick's own STICK.key). */
export const SKIFF_TOUCH = { auto: true, key: 0.38 };

/** What the driver holds for the skiff this frame, from the thumb (x right, y forward; 0 with no thumb) and the BRAKE control. */
export function skiffTouchKeys(skiff, { x = 0, y = 0, brake = false } = {}) {
  if (!skiff?.riding) return null;
  const k = SKIFF_TOUCH.key, live = (skiff.combo?.n || 0) > 0;
  if (skiff.air && skiff.gliding) return { KeyW: y > k, KeyS: y < -k, KeyQ: x < -k, KeyE: x > k, noAD: true };
  if (skiff.air) return { KeyW: false, KeyS: false, KeyQ: false, KeyE: false, noAD: false };
  return { KeyW: SKIFF_TOUCH.auto && !skiff.grind?.on && (!brake || live), KeyS: false, KeyQ: false, KeyE: false, noAD: false };
}
