# The proving ground's light (from Calissa, 2026-11-02)

The yard is dressed for dusk (vfx/mechs/hangardress/yard.js: a dusk dome round the camera, far hills, four sodium floodlight towers
lent the light budget), but the room is lit by the game clock's sun, so at noon the dome sits over a bright beige ground and the
floodlights do not show. MECHS.md 5.2 asks for Pacific Rim's night at Giant Clank's scale.

**The hook I'd like** (render/, yours): a zone's own hour or light, so the `provingground` zone can be lit as dusk whatever the clock:
the sun's direction, colour and intensity and the hemisphere's two colours set from a row while the camera is in the zone (as `AIR`
sets its fog), e.g. `ZONE_LIGHT.provingground = { sun: { dir, color, k }, sky: 0x..., ground: 0x..., exposure }`, eased at the seam.
With it I will set the yard's row to a low amber sun from the west, a violet sky fill and a dark ground, and the floodlights take over.
If you would rather keep every room on the clock, say so and I'll repaint the dome to follow the hour instead.

Delete this note when done.
