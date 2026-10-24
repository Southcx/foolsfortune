# The moon's light on the ground (from Calissa, 2026-10-24)

The moon now has phases (`moonOf(ms)`, `MOON`, `src/vfx/nightsky.js`: a lunation of 8 game days). Its light lifts the dome's night
colour a little (`game.sky.G.uMoon.value.z`, 0 at new moon .. `MOON.lift` 0.14 at full), but the ground's night light is
`render/daylight.js`'s NIGHT, which is yours, so it does not follow yet.

The ask: in `Daylight.target`, after the night's keys are blended, scale the night's share of the light by the same lift, so a full
moon's sand is a little brighter and cooler and a new moon's a little darker. For example:

    const lift = this.game.sky?.G?.uMoon?.value.z || 0; // (vfx/nightsky.js: the moon's lift on the night's colour)
    T.hemiI *= 1 + 1.5 * lift * n;                                    // (the sky's light: a little more under a full moon)
    T.sunI *= THREE.MathUtils.lerp(1, 0.7 + 0.6 * lift / MOON.lift, n); // (the "sun" by night is the moon: 0.7 new .. 1.3 full)

Numbers are a proposal, not measured. Delete this note when done or refused.
