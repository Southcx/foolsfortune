# The parries' clips: found, not authored (Calissa; PARRY.md is Dovina's)

From UAL (`anims.bin`) and CMU (`anims_cmu.bin`), by name in `character.clips.clips`. Each is played the kick's way (`courier/moves/kick.js`,
casebook rule 19): one-shot, squeezed onto the window, drawn while its weight is above zero (the last frame held as it eases out),
crossfaded from where the body was, its pelvis re-rooted to its first frame. Upper body only unless the row says, so the feet keep
running (the core movement is the gold standard). Timings are the clip's own seconds.

| tool | parry | clip (found) | the stretch played | mask | notes |
|---|---|---|---|---|---|
| nothing | the kick | `kick_a` / `kick_b` (CMU) | as in kick.js | the whole body | kept; fixed today |
| Sondelass: cutlass | the deflect | `swordA` / `swordB` (UAL) | as in cutlass.js | upper | kept |
| Sondelass: rod, hook | the cutlass's deflect | `swordB` (UAL) | 0 .. 0.53 s | upper | the blade snaps out: the cutlass's own swing, the form changing back after |
| psygun | the gun parry | `castShoot` (UAL), the gun arm | 0.05 .. 0.35 s over the window, then the psygun's own recoil kick doubled | upper | a point-blank snap shot; the arm thrust is the cast's, the gun's recoil is the weapon's own (no new clip) |
| Soul Brush, paint | the bat | `swordB` (UAL) at 1.25 times its rate | 0.1 .. 0.5 s | upper | the club's own swing as a bat, flatter; the bristles' flick is the club's (club.js `bat: true`) |
| Soul Brush, mop | the soak | `block` (UAL) | 0.3 .. 0.6 s, held | upper | the brush braced across the body like a guard, its tuft toward the projectile; the drink is brushload.js's stream reversed into the tuft |
| Veritome | the shutter | `punchJab` (UAL), the book arm | 0.05 .. 0.3 s | the book arm and the spine | the book snapped out at the threat for the last-instant shot; the lens's flash is the Flash's own |
| Dreamvane | the twirl | `block` (UAL), held | 0.42 s (the guard's frame) | upper | **the body is found, the spin is not a clip**: the crook spins in the hands about its grip (the held tool's own rotation, 2.5 turns a real second, procedural, as the swing trails are). Nothing in UAL or CMU spins a staff. If the hands must move with it, I will author one two-key loop (authoring.js), and say so first |
| Crucibelle | the toll | `castShoot` (UAL) | 0.1 .. 0.5 s, as the toll's own | upper | the toll's clip already (crucibelle.js); on the beat the ring is wider, which is the look's job, not the clip's |
| Lockheart | the gulp | `block` (UAL), then `stance:lockheartChannel` | 0.3 s of the guard, then the channel stance while the lid is open | upper | the coffin raised before them; its lid opening is the model's (no body clip), the Lachryma drawn in is the data drain's look turned inward |

**Authored:** nothing. The only candidate is the Dreamvane's hand loop, if the procedural spin reads wrong with the hands still.
