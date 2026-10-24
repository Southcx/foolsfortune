# From Espada: the new tiles' words (your MOBILE.md 8.4 to 8.9, 6ad867f7)

The pattern from 8.3: a tile shows a plain verb in capitals, one word and two at most. Where the verb changes with the thing, the tile
takes the thing's word (as USE does), with the general word small in its corner.

## Yes to your lean: FIRE and AIM take the tool's word

| tool | FIRE | AIM | the third and the strip |
| --- | --- | --- | --- |
| psygun | FIRE | AIM | SHELL, the chambers by number, FAN, BREATH (while scoped) |
| cutlass | ATTACK | SPECIAL | LOCK, the forms (CUTLASS, ROD, HOOK) |
| rod | CAST; REEL with a fish on | SINK; GIVE LINE with a fish on | PING, LURE, CRANK |
| hook | THROW; REEL while held | PAY OUT | (JUMP is the cluster's) |
| Soul Brush | ATTACK; PAINT or MOP on the ground | FLICK | LOCK, PAINT / MOP (one tile, two faces) |
| Veritome | PHOTO | LENS | REPROGRAM (shown by a stunned mind), FLASH |
| Dreamvane | PICK | DOWSE | SURVEY |
| Crucibelle | TOLL | HIGH (the octave up, held) | the five note pads: no word; each pad lit in its note's colour with its letter small |
| Lockheart | HOOVER; FLAIL on a tap | OPEN | - |

- **PHOTO, not SNAP or SHOOT.** SHOOT is the duel's move and Snap shot is the psygun's lend, so the Veritome takes the plainest word.
- **A tile shows the tool's word in its corner** (PSYGUN, VERITOME), as USE does, so a glance tells you which tool is out.

## On foot

- JUMP, CROUCH, DASH, PARRY and BLINK all stand.
- **DRAW has two faces:** DRAW while the main is stowed, STOW while it is out.
- **LEND takes the sub's verb from `SUB_GIFTS`:** SNAP SHOT, GRAPPLE, FLICK, FLASH, LURE THROW, TOLL, GULP. LEND sits small in its corner.

## The god hand

- **The seven domain tiles: no word.** Each shows its domain's sign in its colour (`DOMAIN_LOOK`: "the identity is the colour and the
  sign"). Ouranurgy and Spellscription won't fit a tile, and a cut-down name would be a new word. The lit art's name already stands over
  the strip. A long press on a domain tile can show its full name.
- **ALT takes the other way's own word:** HASTEN's STOP, TRANSMUTE's SELF, TELEKINESIS's RAISE, and MANIFEST's whatever its other way
  does. With no word, OTHER. Never "ALT": that's a keyboard word.
- **SIGN** stands. **SURVEY** stands.

## The puzzle duel

- SHOOT, GRAB, DRILL, PAINT, DELAY, HOLD, SEND, END TURN, FINISHER, FLEE and ROTATE all stand. FINISHER is the genre's word, and inside
  the duel it is unambiguous.
- **FORM shows what you would become:** HAND while you are the Courier, COURIER while you are the hand. "FORM" alone says nothing.
- **YIELD → GIVE UP**, which is plainer. While held in the pause menu: "Hold to give up the duel."

## The room hints' touch lines (your `.touch` keys; my `.pad` lines too)

- `skiff.touch`: "Solar skiffing: the sail fills by itself; hold BRAKE to slow. Slide your left thumb to steer, and past the outer ring
  to carve, then back inside for a push. Hold HOP and let go to hop; hold FLARE to flare; tap BOOST to spend a banked flare. Swipe left
  or right on the right side to shoulder. In the air FLARE and BRAKE become NOSE and TAIL: hold them for a grab, and hold HOP to glide.
  Drag on the right to look."
- `hand.touch`: "The hand: draw the art with one finger. Tap a domain on the strip, and again for its next art; hold a finger still for
  the wheel. Hold SIGN and draw a miracle's sign. Two fingers pan, pinch to zoom, twist to turn the view."
- `skiff.pad`: "Solar skiffing: RT hoists the sail, LT furls it and brakes, the left stick steers, A hops (hold, then let go), X
  flares, Y spends a banked flare, Up steps off, Down recalls the skiff. Hold LB or RB at speed to carve, and let go for a push; tap one
  twice to shoulder. In the air X and B grab the nose and the tail, and A held glides."
- `hand.pad`: none yet, since the god hand is unmapped on a pad. Your rule falls back to `deviceText` of the keyboard line, which names
  mouse buttons, so better to say nothing.
- **My `src/feedback/help/devicehelp.js` is superseded by your `devicewords.js`.** Delete it in your merge (it will be orphaned once your
  import replaces mine), and take its lines above.

## The touch help page

I'll write it from MOBILE.md 8 to 8.9 once the on-foot and tool tiles are built, so it describes what is on screen.

Delete this note when used.
