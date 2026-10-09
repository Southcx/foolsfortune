# Painting research: Soul Brush vs FLUDD and Splatoon's ink

Confidence marks: [V] read on a page this session; [M] from memory or the repo's own notes, not re-verified. Splatoon's ink storage is not publicly documented by Nintendo; I found no GDC or CEDEC rendering talk.

## 1. Splatoon

**Storage and look [M].** No primary source found. The usual account (fan reverse-engineering, not verified here): ink is a per-object paint texture on the level's UV set, and a shader mixes team colour over the base material. Inkable vs un-inkable is a property of the surface ([Surface](https://splatoonwiki.org/wiki/Surface) [V]: glass, grates, water, tarps and bumpers refuse ink; grates let ink pass through). Splatoon 2 sharpened ink shading and made droplets and trails more distinct ([Ink](https://splatoonwiki.org/wiki/Ink) [V]). Our PaintMap (a CPU grid sampled by a shader) is already a fair equivalent. The look rule is a crisp edge, a bright flat body and a gloss highlight, not a soft blur.

**A shot [V]** ([Data Explanation](https://splatoonwiki.org/wiki/User:XarrotD/Data_Explanation)):
- A shot flies in two states. First a short "brake" state (about 36% air resistance a frame, gravity about 0.07), then a "free" state (about 2% drag, gravity about 0.016), then a speed cap. The Splattershot flies straight for 9.06 units (4 frames), and its effective range is about 11.6 units.
- Puddle size is interpolated from distance travelled, per weapon. It stretches with the angle of impact. There is no extra size randomness.
- **Drop trails:** a projectile sheds droplets at set intervals. Each weapon cycles through a short list of droplet patterns shot by shot, with an average count, a spacing and a minimum distance from the player. The result is a line of dots or separate puddles along the arc, not one blob at the end.

**Accuracy [V]** ([Data Explanation](https://splatoonwiki.org/wiki/User:XarrotD/Data_Explanation), [Splattershot](https://splatoonwiki.org/wiki/Splattershot)):
- Each shot's angle is swerve (the maximum cone) times a random value shaped by a hidden "bias". Bias rises each consecutive shot, then drops when firing stops.
- Splattershot (Splatoon 3):
  - Deviation is 4.86 degrees on the ground and 11.66 degrees in the air (5 and 12 before v9.2.0; 6 and 12 in Splatoon 2).
  - Bias is a 1% chance of a full-deviation shot at the start, plus 1% per shot, capped at 25% (24 shots).
  - A jump sets it to 40% at once. It recovers 1.5% per frame, starting 6 frames after you stop firing (22 frames to minimum, 32 after shooting in the air).
  - The outer reticle swells on a jump, starts shrinking after 25 frames and finishes after 70.
- Other weapons ([Aerospray / Splash-o-matic / Sploosh-o-matic results](https://splatoonwiki.org/wiki/Splash-o-Matic)):
  - Splattershot Pro: 3 degrees on the ground, 12 in the air.
  - Sploosh-o-matic: 12 degrees on the ground, 18 in the air.
  - Aerospray MG: 16 degrees in the air after a patch. A patch removed the jump variance from the Splash-o-matic.
- **Reticle [V]:** the crosshair sits where the shot starts losing damage (the effective range). The outer ring is the swerve, so you read the cone before you fire. Damage falls from 36 to 18 between frames 8 and 40.

**Ink tank [V/M]:**
- It sits on the back of the squid and inkling, and a HUD gauge is drawn beside the reticle. A shot costs 0.92% of the tank (108 shots, about 10.8 s). A refill pauses for 20 frames after firing. If there is not enough ink, the gauge flashes a big red X ([Ink](https://splatoonwiki.org/wiki/Ink)).
- It refills only in your own ink, much faster as a squid. Ink Recovery Up adds up to 40% to the refill. The base refill in seconds is NOT verified; I could not read it from the ability pages.
- Swim speed is a baseline of 100%, up to 125% with Swim Speed Up ([Swim Speed Up](https://splatoonwiki.org/wiki/Swim_Speed_Up)). Absolute speeds were not read.

**Enemy ink [V]:** it damages you (Splatoon 2 caps at 40 damage in about 2.2 s, and Ink Resistance Up delays it by up to 39 frames and lowers the cap to 20), pushes you out of squid form, and sharply cuts walking speed. A guide put the penalty at 80% without Ink Resistance Up and 20% with it ([Ink Resistance Up](https://splatoonwiki.org/wiki/Ink_Resistance_Up), guide figure not re-verified). Your tank does not refill in it.

**Merging [M].** Ink is last-writer-wins per texel. The new team's ink replaces the old where it lands, with no blending. The fight for ground is the readable part.

**Coverage [V]:** at the end of the match, Judd counts the percentage of the stage covered from an overhead view. Walls count for nothing and ramps count less ([StrategyWiki](https://strategywiki.org/wiki/Splatoon/Modes)). Coverage is therefore a top-down projected area, which matches our `stamp()` returning m² of newly covered ground.

## 2. Super Mario Sunshine

- **FLUDD [V]** ([F.L.U.D.D.](https://www.mariowiki.com/F.L.U.D.D.), [Squirt Nozzle](https://www.mariowiki.com/Squirt_Nozzle), [Hover Nozzle](https://www.mariowiki.com/Hover_Nozzle)):
  - Squirt: a light hold of R sprays while running. A full hold plants Mario and lets the stick aim. A wide spray costs a lot, a spin-spray goes all round, and it is the only nozzle usable in over-the-shoulder mode.
  - Hover: about 4 s, rising slightly, two downward streams.
  - Rocket: a short charge, then straight up, and no fall damage.
  - Turbo: a fast run on land or water, and it breaks doors.
  - Only two nozzles at once. The tank drains gradually. Refill is by standing in water and holding R, or a Water Bottle. I could not find the tank size or a HUD description in these pages; the tank is a vertical meter on the HUD with the nozzle's icon [M].
- **Goop [V]** ([Goop](https://www.mariowiki.com/Goop)):
  - Types: ordinary (slippery, damage over time, dirties clothes), burning orange, electric teal and yellow, and the Rainbow M.
  - Water is the main cleaner. Piranha Plants need brown goop to appear. Goobles spawn from goop and spread more.
  - Structures sink in goop, and cleaning frees them. Enemies are "graffiti" and dissolve in water.
  - Bowser Jr. spreads goop with a magic brush.
- **Storage [M, from the repo's own header, which cites doldecomp/sms PollutionLayer]:** a bitmap per layer projected flat onto the floor, stamped by the spray and queried by collision. I could not fetch the decomp from this session, so the claim is unverified.
- **Slide on water [M]:** wet and goop surfaces cut friction. Mario's slide throws a rooster tail of spray. The sliding is a surface property the player feels in the feet, not a UI.

## 3. Paint that merges and smears

- **Viscera Cleanup Detail [V]** ([Mop wiki](https://viscera-cleanup-detail.fandom.com/wiki/Mop)):
  - The mop has 8 saturation stages. Drips start at stage 5, and the colour on the head shows the load.
  - A saturated mop redeposits a large splatter, and over-mopping "backfires".
  - Each decal has a hitbox, and the mop has a small splash radius. This is the model for mop feedback: the tool itself shows what it carries, and a full tool smears.
- **PowerWash Simulator [V]** ([PowerWash Simulator](https://en.wikipedia.org/wiki/PowerWash_Simulator), [Xbox Wire](https://news.xbox.com/en-us/2025/10/23/powerwash-simulator-2-how-futurlab-built-a-sparking-sequel/)):
  - Each object is split into segments, each with a progress bar. A button highlights the dirt that is left.
  - The sequel adds dirt particles coloured like the dirt, so you can tell if dirt remains. It also stacks dirt layers of differing toughness.
  - The dirt-mask storage is not documented, only what the player sees.
- **de Blob [V]** ([Gaming Nexus](https://www.gamingnexus.com/Article/De-Blob/Page0/Item2003.aspx), [Co-Optimus](https://www.co-optimus.com/review/698/de-blob-2-co-op-review.html)): paint is a reserve you carry, and the character's size shows the supply. Pools replace the colour. Primaries mix: blue and yellow make green. A touch of another colour shifts the hue, which one reviewer found harsh.
- **The Unfinished Swan [V]** ([Kill Screen](https://www.killscreen.com/unfinished-swan-suggests-painterly-and-literary/)): a splat's job is to reveal. Black paint shows surface detail, and water ripples where it lands. A single colour made scenes hard to read.
- **Okami [V]** ([Ink Pot](https://okami.fandom.com/wiki/Ink_Pot)): ink is counted in pots (10 maximum, 3 at the start), refilling over time in the original. When empty, Amaterasu turns white. A cost rising with the number of dots drawn is the one precedent for cost shown in the stroke.
- **Portal 2 gels [V]** ([Valve Developer Community](https://developer.valvesoftware.com/wiki/Gel_(Portal_2))): gel splats are placed on paint maps whose scale follows the lightmap scale (16 works best; lower values lag). Cleansing gel and water remove other gels' effects. Glass and grating refuse gel. How water interacts with the map was not documented.

## 4. Our code: why it is inaccurate and why stains do not merge

Files: `/home/user/foolsfortune/src/tools/soulbrush/load.js`, `src/world/ground/paintmap.js`, `src/world/ground/stains.js`, `src/progress/brushload.js`, `src/courier/moves/jets.js`.

**Why painting is inaccurate**
1. **Pitch is thrown away.** `club.aimDir()` ends in `.setY(0).normalize()`, so the spray goes along the look direction on the ground plane. Each drop gets a fixed random upward tilt (`up = 0.32 + rand*0.18`), whatever the camera looks at. You cannot aim at a point.
2. **Depth scatter is huge.** Speed is 9.5 times (0.8 to 1.15) and the launch tilt is about 18 to 27 degrees. By projectile maths, drops land about 3.4 to 9.7 m from the tip, a spread of about 6 m in depth, before the launch height adds more. Splatoon's equivalent is nearly flat, about 5 degrees.
3. **Sideways scatter** is +/-0.175 rad (+/-10 degrees), uniform. That is about +/-1.1 m at 6 m. The Splattershot is +/-4.9 degrees at its worst and bias-weighted (mostly near the centre).
4. **The splat is small and faint.** Each drop is a 0.55 m disc at k=0.45, falling off as (1-(d/r)^2). The shader needs alpha above 0.25 to 0.5 to show (smoothstep). A single drop only shows at its middle, so a stroke reads as scattered dots that only fill in where they overlap. Drop rate is 18 a second, so a sweep leaves gaps.
5. **No trail.** Drops are stamped only where they land, not along the arc, and there is nothing to show where the stream will land. `LOAD.spray.reach` (7) and `width` (1.2) look unused in `spray()`.
6. **Feeling flips.** In `stamp()`, a newer feeling takes a cell if its add exceeds half of what is there, so overlapping strokes can flicker between feelings.
7. **No spread growth or recovery.** The scatter never grows with sustained fire or with jumping, so it cannot be trained.
8. **The brush must be saturated for 0.85 s before spraying, and only works grounded** (`update()` ends the hold if not grounded), with no ink-meter feedback on the HUD.

**Why stains do not merge or smear**
1. Stains are separate point records `{x,y,z,grade,...}` drawn as individual meshes (`vfx/stains.js`). They are not cells in the PaintMap. `spill()` pushes a new entry with no overlap check, so two spills side by side are two meshes, never one.
2. Their size is a fixed table by stage (`RADIUS = [1.1, 1.6, 2.2, 2.8]`) and does not depend on the crude left. `drink()` only reduces `drunk`. The mesh gets an `amount` value, but its footprint does not shrink from the edge in.
3. `drink()` tests distance from the stain's centre to the mop point plus the radius. It does not clean the part you touched. There is no smearing; a mop pass has no velocity or direction.
4. Stains and paint never touch: the mop takes from stains first, then paint, and paint is never added to or taken from a stain. Stains also do not slip, burn or slow you, because the slide and status code asks the PaintMap (`at()`), not stains.
5. The PaintMap has no flow or diffusion. Paint only fades over 150 real seconds.
6. Negative "slip" is therefore missing for stains, and for paint it exists only as a tick of status on creatures (`STATUS_EVERY`, 0.5 s) and the Brush Slide.

**Movement techs and mop UI.** `jets.js` draws only drops and rings. I found no gauge for hover, rocket or skim; they call `spendLoad()`, which silently drains the bottle first and then the pool. The mop's feedback is the stream of drops (`vfx/brushload.js`) and a log line when the bottle is full.

## 5. Build rules

1. **Aim with pitch.** Fire along the full camera aim, not a flattened one. Launch the drop along the look ray and let gravity pull it down. Prior art: Sunshine's squirt (aimed with the stick when planted) and Splatoon's shots (straight, then arcing).
2. **A straight-then-fall arc with a published landing point.** Fly the drop straight for 4 frames at 2.27 units a frame, then add drag and gravity. Prior art: [Splatoon's two states](https://splatoonwiki.org/wiki/User:XarrotD/Data_Explanation). For us: 5 m straight, then fall. One range for all drops, with no random speed except 3%.
3. **Reticle on the ground, in two rings.** Inner point = where the centre of the stream lands, found by the same simulation; outer ring = the current cone, drawn on the surface. It is a world mark with no text. Prior art: Splatoon's reticle.
4. **Spread values.** Grounded still: 3 degrees (the Pro's figure). Moving: 5. In the air: 12. Use the bias model: a 1% chance per shot of a full-deviation drop, up to 25%, with a jump setting it to 40% and recovery of 1.5% a frame after a 6-frame delay. Prior art: Splattershot, Splatoon 3. Replace the uniform +/-10 degrees.
5. **Bigger, firmer splats, with a trail.** Splat radius grows with distance (0.35 m near, 0.7 m at 6 m); stretch along the line of fire when the angle is shallow. Shed droplets along the arc every 1 m (3 to 5 per shot, a cycle of patterns), small stamps radius 0.25 m. Make a single stamp strong enough to show (k above 0.6) so a drop is visible. Prior art: Splatoon's puddle size by distance and drop trails.
6. **One colour per cell, last writer wins, with a crisp edge.** Replace the "more than half" rule. A cell holds one aspect and a thickness. Opposite or enemy paint overwrites outright (Splatoon), while two paints of the same aspect add thickness. If you want mixing, do it by hue wheel, like de Blob (blue plus yellow). Do not flicker.
7. **Stains become paint.** Make a stain a seed in the PaintMap. A spill stamps a puddle of crude (radius from its stage) into the cells, and a later spill within reach joins it because it shares cells. Delete the separate mesh drawing and render stains from the map, so they merge for free. If the meshes stay, merge on spill: if a new spill lies within the sum of radii, add its crude to the nearest stain, grow its stage, and move its centre to the weighted point.
8. **Mop reads as a wipe.** The mop removes cells under a swept strip (reach 2.4 m wide, in the direction of the swing), edge first, and the footprint shrinks as crude goes. It should leave a thin wet smear in the mop's direction on the way (a stamp of the removed paint, reduced and pushed 0.5 m along the stroke). Prior art: VCD's mop with its splash radius, and PowerWash's progress against dirt.
9. **The mop head shows its load, and a full one smears.** Eight steps of the head from pale to dark, drips from step 5, and when full the next stroke redeposits a splatter instead of drinking. Prior art: [VCD mop stages](https://viscera-cleanup-detail.fandom.com/wiki/Mop). Our bottle-full line becomes a visual: the bottle's fill (already drawn on the back) plus the mop head.
10. **Show what is left when mopping.** A held key or the Dreamvane-style pulse highlights remaining stains, and a segment shows a clean ring on the ground where the mop has passed (PowerWash's highlight and per-segment bars, as a world mark and not text).
11. **The bottle gauge.** The Lachrymato Bottle is the gauge, on the Courier's back (Splatoon's tank and the character's size in de Blob), plus a thin arc beside the reticle that shows the same fill. Cost: a stream spends 0.92% of the bottle per drop-equivalent (about 10 s of continuous spray, the Splattershot's tank). No refill for 20 frames after you stop; refill only by mopping or standing in your own feeling (Splatoon). Empty: the arc flashes and the log says once "The bristles run dry." (the log is the only text).
12. **A gauge for the jets.** Hover (1.6 s in config) needs a visible fuel ring around the feet or on the bottle that drains by the second, like Sunshine's 4 s hover and its meter. Rocket needs a charge ring that fills over 0.55 s. Skim shows the bottle draining while it runs. All three share one gauge: the bottle's, since they spend from it (`spendLoad`).
13. **Negative slip.** A cell of paint under the feet (and any stain) cuts friction by a set amount for the enemy's feeling and kicks up a rooster tail (Sunshine's goop and Portal's propulsion gel). Splatoon's reverse: standing in your own feeling is a refill and a speed-up (up to +25%), in an enemy feeling a slow (0.2 times speed at worst) and no refill. Tune against the core movement; switching it off must restore the core movement exactly (CLAUDE.md).
14. **Coverage count is top-down.** Count only up-facing cells in the Zone of Influence for the ledger (`stamp()` already returns m²). Walls give nothing. Prior art: Turf War's overhead count.
15. **Prove it with a range test.** Paint a target ring from 3 m, 6 m and 9 m; at 9 m the cone should be about 0.8 m wide when still. This is a QAIS test with a debug chest, not a new check (the brush is in flux).

## What I could not verify
- Splatoon's paint storage format and resolution, and its swim and enemy-ink speeds in absolute units.
- Sunshine's tank size, per-nozzle drain, and the pollution bitmap (doldecomp could not be fetched).
- How PowerWash Simulator and Portal 2 clean paint internally.
- The flight maths in section 4 are my calculation from the constants, not a measurement; confirm with a headless run of `spray()` before quoting them.
