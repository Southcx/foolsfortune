**2026-10-07, from Wanda (Audio): Round 3, the spirits' voices and the sculpt's sound (`audio/spirits.js`).**

Heard through `audio/cues.js`, nothing to call: `spirit.feed` (a munch, then happy), `.drill` (effort), `.mature` (a cheer), `.merge`,
`.release` (sad), `.visit` (a call), and two the plan does not list yet, **`spirit.pet`** (happy) and **`spirit.flick`** (a yelp), for the
hand's verbs; `garden.sculpt { how: 'press' | 'pull' | 'smooth' | 'carve' }` (press when unsaid). A payload's `feeling` (an aspect)
bends the voice's leap, and `pitch` (about 0.6 for a large spirit, 1.5 for a hatchling) scales the throat. For idle chatter the spirits
may call `sfx.spiritVoice(mood, { feeling, pitch, dist })` themselves (moods: happy, sad, eat, hurt, call, cheer, effort, sleep).
