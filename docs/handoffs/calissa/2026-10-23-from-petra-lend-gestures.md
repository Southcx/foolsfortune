# From Petra: the sub's seven verbs fire; their bodies are yours (main and sub, PNEUKA-BOX.md 5; 2026-10-23)

## What is built (on `claude/fps-third-person-demo-8zp2kx`)

- **R lends the sub's verb at once, on the press, from where the tool hangs** (`tools/belt.js` keys, each tool's `lend()`). The sub is
  never drawn.
- **Each verb is its effect alone, with no gesture yet:**

| sub | verb | what goes off | from |
|---|---|---|---|
| psygun | Snap shot | one round where the main aims (tracer, flash, sound; no gun moves, no vent) | the right hand (`lendHand`, `tools/lend.js`) |
| Sondelass | Grapple | the hook fired, reeling on its own: an anchor draws the Courier in, a catch is brought and dropped; R again lets go | the right hand (the line) |
| Soul Brush | Flick | the fan of paint, no swing of the club | the right hand |
| Veritome | Flash | the Flash's cone and stun | the right hand |
| Dreamvane | Lure throw | the fork thrown and ringing; R again calls it back | the vane's heel, on the back |
| Crucibelle | Toll | one toll round the Courier (stagger, the ring) | the bell's mouth, at the hip |
| Lockheart | Gulp | the Lockheart's parry window (0.25 real s), whatever is in the hands | the chest, as its parry |

- **The event:** `tool.lend { tool, main, by }`, once per verb that went off. Hang a gesture on it.
- **Each verb's own event still fires:** `shot.fire` (with `lent: true`), `hook.fire`, `brush.flick`, `flash.fire`, `fork.throw`,
  `crucibelle.toll`, `parry.try` (with `lent: true`).

## Your asks

1. **One gesture clip a verb**, played over the main's stance. The note is my sketch; the clip is your call. Seven clips:
   the snap shot (a quick draw from the back and back again), the hook thrown from the hand, the flick, the Flash held up, the fork
   pulled from the heel, the bell struck at the hip, the coffin raised to the mouth for the Gulp.
2. **The model at the hand for the move's length**, where a move needs it:
   - Grapple: the line leaves the right hand now, and the Sondelass stays on the back.
   - Gulp: the coffin.
   - The snap shot: the gun, if your clip draws it.
   Say which, and I wire them.
3. **The tool cards for Dovina's window:** `toolIcon(game, id)` in `pneuka/icons.js` renders each tool's own model as a picture
   (the tools are no longer items). The reading table's look is yours.
4. **The pruning item that waits on you:** `#charge` and `feedback/hud.js:44` go once THE PSYGUN, the Bombardier, the Pentagun and the
   Pepperbox each carry a charge readout in their own reticle (PNEUKA-BOX.md 7).

## Not verified

- Any of it by hand.
- How each verb reads with no body under it.
