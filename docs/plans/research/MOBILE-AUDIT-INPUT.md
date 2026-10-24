# Input audit: every player input in Fool's Fortune (for a touch scheme beside mouse + keyboard)

Read-only audit of `/home/user/foolsfortune/src`, 2026-10-24. Reports what the code does; no design. Paths are under `src/`.
Glossary words are used as the glossary has them ("the Courier", "the Sondelass", "the Pneuka Box", "the god hand", "the Solar Skiff", "the rail", "the open sea"). Where a binding is only named in the pause menu's help pages (`feedback/help/pages.js`), that is said; the rows below were checked against code.

Flags: **AIM** = needs mouse-look / cursor precision. **HOLD** = held (state while down). **TIMING** = a press judged in a window. **CHORD** = two or more inputs at once. **MENU** = a window / UI action. **DRAG** = a pointer drag / flick on a delta.

---

## 0. The input layer

One class, `core/input.js` (104 lines), `game.input`, built in `main.js:580` on `renderer.domElement`. Everything the game reads is **plain sets and numbers**, no events:

| member | what | file:line |
| --- | --- | --- |
| `down` (Set of `KeyboardEvent.code` or `Mouse0/1/2`) | held now; `isDown(code)` | input.js:5, 93 |
| `pressed` (Set) | edge, this frame only (not auto-repeats); `wasPressed(code)`; cleared by `endFrame()` at the end of the frame (main.js:1501) | input.js:6, 94-103 |
| `dx`, `dy` | look delta in px, only while pointer-locked (or `lockFailed`); `player.js:219-220` does `yaw -= dx*k`, `pitch -= dy*k`, `k = 0.0022 * T.camera.sensitivity * lookScale.*` | input.js:48-51 |
| `wheel` | summed `deltaY` (wheel listener on the canvas, `passive:false`) | input.js:17 |
| `mx`, `my` | cursor px (used only when the pointer is free: god hand, garden, puzzle duel, track editor, haunt, maps) | input.js:11, 46 |
| `spend(...codes)` | a press that closed or picked something is removed so nothing else sees it (`onSpend` also clears the Courier's latch) | input.js:95, main.js:667 |
| `enabled`, `locked`, `lockFailed`, `wantLock()` | gates; `enabled=false` while the pause overlay is up | input.js:10-13 |

- Keyboard: `keydown`/`keyup` on `window`; ignores INPUT/TEXTAREA targets (the chat line, save codes); `preventDefault` on Space, Arrows Up/Down, F, Alt, E, G, V, Backquote, Minus while enabled; `blur` clears `down` (input.js:23-33).
- Mouse: `mousedown` on the canvas (only if `enabled`) sets `Mouse<button>`; a click also re-requests pointer lock; `mouseup` on window clears; `contextmenu` and `auxclick` are suppressed (input.js:35-44). Buttons 0, 1 (MMB), 2 (RMB) only. No buttons 3/4.
- Pointer lock: `requestLock()` with `unadjustedMovement`, fallback plain; failure path `lockFailed` = free-cursor look (`dx/dy` still from `e.movementX/Y` of `mousemove`); the page shows "Pointer lock unavailable here: look follows the cursor instead." (index.html:68). Losing the lock **is** the pause: `main.js:1055-1067` shows the `#overlay` pause menu and sets `input.enabled=false` unless a window / cursor-free mode holds it; the overlay is closed by a click (`main.js:1011`, `overlay.addEventListener('click', start)`). Esc while cursor-free: `main.js:1075-1080`.
- **Virtual input already exists as a pattern**: `coop/sibling.js:30-43` `VirtualKeys` (same `isDown/wasPressed/dx/dy` surface; the sibling's `Player` body reads it instead of `game.input`), `agent/agent.js:119-154` writes straight into `g.input.down` / `g.input.pressed` / `dx` (and `domKey()` for windows), and `core/replay.js:55-80` records and replays `down`, `pressed`, `dx`, `dy`, `wheel`, `mx`, `my`. So a touch layer that writes these sets is the same shape as the agent, replay and siblings. Edge case from the code: `keyup` deletes from `down` at once while `pressed` lasts one frame; the fixed step (1/60 s, `main.js:341`) reads `isDown`, the Courier latches `wasPressed` for 0.15 s (`player.js:237`), so a synthetic tap must hold `down` for at least a step (the agent holds 2 ticks).
- **Touch / gamepad support in the game layer: none.** `grep` for `touchstart|touchmove|pointerType|getGamepads|gamepad|maxTouchPoints|pointer: coarse` finds nothing in input or tool code (only unrelated words: ragdoll `onTouch`, "touch" in comments). `index.html:5` has a viewport meta (`width=device-width, initial-scale=1`), `index.html:10` `user-select:none`; no `touch-action`. The help page says "Needs a keyboard and mouse" (`help/pages.js` THE KEYS lead).
- **Already pointer-event based (touch-capable by nature, with `e.button===0` assumptions):** `world/raceway/haunt.js:43-44` (pointermove/down on the canvas: fire a trap), `world/raceway/editor.js:134, 274, 328-330` (track editor click/erase/map drag), `vfx/bazaartable.js:116` (Raku's tables: hover + pick), `ui/choicecard.js:154` (a 420 ms press-and-hold on a choice card, "place"), `feedback/gamelog.js:108-109`, `ui/seachart/seachart.js`, `ui/sealpicker.js`, `ui/scoreceremony.js`, `ui/railresults.js`, `ui/bugmarkup.js`, `ui/theme.js`, `ui/pixel.js`, `tools/veritome/reprogram.js:90`.
- **Mouse-event only (a finger does not drive these past a tap):** 15 files use `mousedown/mousemove/mouseup` (e.g. `feedback/cartography.js:436-455` map drag, RMB waypoint, wheel zoom; `courier/vessel/kilnui.js:61-63` drag; `world/emocean/seachart.js:131`; `ui` windows' `mousedown` stopPropagation). A tap emits one emulated mousedown/up/click, but no stream of `mousemove`. 23 files use hover (`mouseenter`, `:hover`) for detail text (choice cards, mounts' previews `emocean/pier.js:160`, dialogue options `npc/dialogue.js:177`).
- **HTML5 drag-and-drop:** `pneuka/ui.js:222-227` (Pneuka Box items), `pneuka/underside.js:167` (spread cards), `ui/readingtable.js:233-246` (tool cards). Right-click menus (`contextmenu`) are the Box's second verb everywhere (`pneuka/ui.js:226, 252, 269, 298, 325`; shop haggle `progress/shop/ui.js:96`).
- Settings that exist for input: `camera.sensitivity` (config.js:74), `camera.adsSensMult`, `visual.arrowCamera` (config.js:372, true), knacks `steadyHand` (psygun aim pull), `heldBreath` (parry window longer), `wideSights` (rail sights wider) (`progress/knacks.js:23, 35, 59`); lock-on has aim assist always on (`courier/lockon.js:33, 160-168`: eases yaw/pitch toward the target, `lookScale.lock = 0.2`).

Keyboard look: the arrow keys turn / tilt the camera as the mouse does (yaw 90 deg per real s, pitch 60 deg per s, eased 0.15 s; `player.js:69, 221-229`), also in the open-sea helm (`opensea/helm.js:82-85`), the Pneuka Box reading view (`render/readingscene.js:81-83`), and the track editor pan.

---

## 1. On foot: the core movement (always live; `courier/player.js`)

| key / button | verb | flags | file:line |
| --- | --- | --- | --- |
| mouse move | look (yaw/pitch) | AIM, HOLD(continuous) | player.js:219-220 |
| Arrow keys | look, keyboard (setting `visual.arrowCamera`) | HOLD | player.js:224 |
| W A S D | move (A/D also strafe) | HOLD, CHORD (2 keys) | player.js:245-246, 451-452 |
| Shift (L/R) | sprint (held, any way but back); a *press* buffers the air-dash (0.1 s) and the crouched roll (0.2 s `Dodge` latch) | HOLD, TIMING (dash/roll buffer) | player.js:460, 235, 239 |
| Alt (L/R) | walk (held) | HOLD | player.js:461 |
| Space | jump; again in the air the double jump; held at a ledge mantle chain; held in a wall run; buffer `M.jumpBuffer` | TIMING (buffered, `jumpHeldLast` edge), HOLD | player.js:501-502, 980, 995 |
| C | crouch -> prone -> stand (each press, `postureBuf`); at a run the slide (`slideBuf`); held in paint the Paint Dive; in the air looking down the ground slam | TIMING (buffer), HOLD, AIM (slam needs pitch < -0.52) | player.js:234, 459; moves/slam.js:47, 99; moves/latch.js:50; moves/slip.js:56, 83; moves/roll.js:30 |
| Z | first / third person | MENU-ish toggle | player.js:232 |
| O | other shoulder | toggle | player.js:236 |
| F | interact (chevron): pick up / set down, talk, use, open, sit; hold F at a heavy crate + W/S to push / pull | TIMING (latch 0.15 s), HOLD (push) | player.js:237; moves/talk.js:39; moves/carry.js:156-172; moves/push.js:29, 70-73; moves/kiln.js:29 (and ~25 world modules `peekLatch('KeyF')`) |
| LMB (while carrying) | throw the carried thing | AIM | moves/carry.js:169 |
| V | kick (nothing in hands), once learned; first 0.25 s of any tool's V is the parry | TIMING | moves/kick.js:144; courier/parries.js:19, 57, 69 |
| E | blink (a dodge along the move keys; two charges), once learned | TIMING (cancels strokes) | moves/blink.js:27, 31 |
| G | latched (`latches.KeyG`) but no consumer found in play | n/a | player.js:237 (index-menu room code only, basement.js:479) |
| Y (the Dunes) | summon / recall the Solar Skiff | single press | skiff/skiff.js:171, 316 |
| X / R | draw-stow the main tool / the sub tool's one verb (the "lend") | single press; R is a parry for Gulp so it can never wait for release | tools/belt.js:35, 88, 94 |
| ~ (Backquote) | go into / out of the god hand (in the garden: overhead view) | MENU | main.js:1282 |
| B / P / M | the Codex / the Pneuka Box / the map | MENU | main.js:1278-1279; feedback/cartography.js:461-462 |
| Enter or / | open the chat line | MENU (typing) | feedback/gamelog.js:187 |
| Esc | pause menu (browser lock-loss also pauses) | MENU | main.js:1076, 1055 |
| Tab | tuning panel (settings + knobs; DEBUG's tools) | MENU | main.js:1273 |
| F2 / F3 / F4 | interface off / perf panel / copy a report | debug | main.js:1290-1291; debug/diag.js:64 |
| F8 | QAIS window (owner's test tool) | debug | main.js:581 `qais.keysFirst` |
| T (held) + mouse flick | the party's order wheel (when siblings are called); `dx/dy` pick a wedge, release = order | HOLD, DRAG(flick), CHORD(T + look) | coop/party.js:40, 146 |

Tech keys read inside `courier/moves/*` (all on W A S D + C / Space / Shift, no new keys): ladder (W/S, Shift fast, C slide, Space off: ladder.js:90-93), hang (W pull-up, A/D shimmy, C drop, Space kick off: hang.js:79, 114-118), pole/rope (W/S, A/D round, Shift, C: pole.js:67-85), grate (W A S D, Shift, C: grate.js:93-100), wall latch (C in the air by a wall, WASD crawl: latch.js:50-94), swim (W/S, A/D, Space up, C dive, Shift fast: swim.js:72-104), balance beam (W/S along, A/D step off, Shift trot, Space hop, C: balance.js:52-66), hover / rocket / skim arts of the Soul Brush load (Space, Shift on water: jets.js:50-111), emotes stop on any of W A S D Space (emote.js:31, 89, 134), prone holster (X: proneholster.js:45).

**Peak simultaneous inputs on foot:** mouse-look + W + A or D + Shift + Space (+ C slide, + LMB in a fight) = 5 to 6 held at once (look, two move keys, sprint, a jump press, a tool button). A slide-hop is C then Space within a buffer (a sequence, not a chord).

---

## 2. Tool in hand (X draws the main; R lends the sub's verb; `tools/belt.js`)

Common: look continues; W A S D / Shift / Space / C all stay live (except where "the gun stays out at a walk" etc.). Most verbs need the camera centre as the aim.

### 2a. The psygun (`tools/psygun/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| LMB | fire a shot (buffered `W.inputBuffer`) | AIM, TIMING(buffer) | weapon.js:107, 225-228 |
| LMB held, let go | charge a piercing beam | HOLD, AIM | weapon.js:231, 310 |
| RMB held | aim down the sights | HOLD, AIM | weapon.js:160 |
| MMB | fire the chambered shell (the seeker: hold to paint targets, release) | HOLD, AIM | weapon.js:174-179 |
| 1 2 3 .. 9 0 Minus, wheel | pick a chamber | single press / wheel | weapon.js:172-173 |
| Q | fan the hammer (six shots), once learned | single press | tools/psygun/gunmoves.js:43; weapon.js:107 |
| (variant) Shift held while scoped | hold breath (Carbine) | HOLD, CHORD(RMB + Shift) | psygun/variantplay.js:82 |
| (variant) MMB held | both barrels (Pepperbox) | HOLD | variantplay.js:94 |
| shoot down in the air | recoil jump | AIM, TIMING | help page |

Peak: look + move (2) + RMB + LMB = 5 (+ Shift scoped, + Space).

### 2b. The Sondelass (`tools/sondelass/`): 1 2 3 pick cutlass / rod / hook (sondelass.js:137); V snaps back to the cutlass (sondelass.js:138)

| input | form | verb | flags | file:line |
| --- | --- | --- | --- | --- |
| LMB | cutlass | the string (four hits); also a counter out of the guard | TIMING (combo/buffer, paid cut), AIM | moveset.js:384-420; cutlass.js:184 |
| RMB tap (+ W / S / crouched) | cutlass | the loadout's special: tap / forward / back / iaido | CHORD(RMB + W or S), TIMING | cutlass.js:197-198 |
| crouched, hold RMB, then LMB | cutlass | Blade Mode (time stops; mouse `dx/dy` turn the line of the cut; LMB cuts) | HOLD, AIM, DRAG(delta cursor), CHORD | cutlass.js:223; blade.js:135-148 |
| E | cutlass | blink cancels any stroke; next LMB carries the combo on | TIMING | cutlass.js:179 |
| MMB | cutlass / brush | lock-on toggle; mouse flick `dx>90` or wheel cycles the target | AIM/DRAG | cutlass.js:182; courier/lockon.js:170-171 |
| V (hold) | cutlass | guard; pressed in time a parry; pressed in a blow's recovery the paid cut | TIMING (0.25 s), HOLD | cutlass.js:338-339; parries.js:19 |
| LMB hold, release | rod | charge and cast; tap LMB twitch | HOLD, AIM | angler.js:252 |
| wheel | rod | lure depth / aspect | wheel | angler.js:247-249 |
| 4 5 6 7 8 9 0 | rod | the lure's feeling (aspect) | single press | angler.js:53, 245 |
| Minus / Equal | rod | previous / next lure | single press | angler.js:54, 246 |
| RMB (held) | rod | sinks the lure (before a bite); gives line (fish on) | HOLD | angler.js:253 |
| MMB | rod | ping (tap) / ring (held) | HOLD | angler.js:368-371 |
| A / D, S (held 0.x s = brace), W | rod, fish on | lean, haul, bow ("ease"); with LMB reel; Shift+LMB crank; S then W+LMB pump | HOLD, CHORD (up to look + A/D + S/W + Shift + LMB + RMB) | angling/rodhands.js:45-60 |
| Shift + LMB | rod | fast retrieve before a bite | CHORD | rodhands.js:28, 60 |
| LMB | hook | fire the grappling hook (at the hook's mark) | AIM | hookshot.js:119 |
| RMB held | hook | aim; paying out after 0.2 s; tap = let go | HOLD, TIMING(0.2 s) | hookshot.js:112, 281-290 |
| LMB held | hook | reel (drains the pool) | HOLD | hookshot.js:281 |
| Space (in the air) | hook | jump off | single press | help page; hookshot.js:14 |
| W A S D | hook | pump a swing | HOLD | help page |

Peak: look + W + A/D + Shift + LMB + RMB + V = 6 to 7 (cutlass), the rod's fish-on fight is 6 (look is idle; A/D + S + W + Shift + LMB + RMB).

### 2c. The Soul Brush (`tools/soulbrush/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| LMB, held | the club's blows / charge / slam; on the ground the bristles then paint or mop | HOLD, AIM | club.js:179-183; load.js:89 |
| 1 / 2 | PAINT / MOP mode (tap); 1 held = quick-pick ring turned by mouse `dx` | HOLD, DRAG(flick) | soulbrush.js:155; radial.js:39-44 |
| RMB tap | flick (a fan of paint) | TIMING(tap) | soulbrush.js:145-148 |
| RMB held | Celestial mode (world turns to paper; mouse `dx/dy` move a virtual brush cursor; LMB draws; release RMB to take the painting) | HOLD, AIM, DRAG(delta), CHORD (RMB + LMB + mouse) | celestial.js:73-81 |
| MMB | lock-on | AIM | soulbrush.js:143 |
| wheel | turns the ring | wheel | soulbrush.js:157 |
| C at speed | Brush Slide (painting) | HOLD | help page; moves/slip.js |

Peak (Celestial): mouse delta + RMB held + LMB held = 3, precision stroking.

### 2d. The Veritome (`tools/veritome/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| RMB held | raise the lens (frame; third-person four corners) | HOLD, AIM | veritome.js:153 |
| LMB (lens up) | take a photograph (shutter) | AIM, TIMING(cool) | veritome.js:236 |
| wheel | zoom | wheel | veritome.js:213 |
| 1 | the Flash (after 0.6 s drawn) | single press | flash.js:45 |
| MMB (by a stunned mind) | reprogram it (opens a typing window, Enter) | MENU | reprogram.js:111, 160-166 |

### 2e. The Dreamvane (`tools/dreamvane/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| LMB, hold, let go full | the pick; the Dreamquake once learned; crystals are struck at an aimed height from a side | HOLD, AIM, TIMING | dreamvane.js:113 |
| RMB held | dowse (rod leans); wheel attunes | HOLD, wheel | dreamvane.js:116-122 |
| RMB tap | throw / call back the tuning fork | TIMING(tap) | dreamvane.js:116-119 |
| MMB | the survey | single press | dreamvane.js:115 |
| V (hold after the window) | spin (guard) | HOLD | parries.js:69 |

### 2f. The Crucibelle (`tools/crucibelle/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| 1 2 3 4 5 | the five notes (RMB held = octave up); notes on the beat build FEVER | TIMING (musical), CHORD(RMB + digit) | crucibelle.js:132 |
| LMB (also in the air) | toll the bell (judged at the press against the beat) | TIMING | crucibelle.js:133, 136 |
| V | parry (the toll's ring, wider on the beat) | TIMING | parries.js:57 |
| (songs) | a song is a sequence of notes typed | TIMING | tools/crucibelle/songs.js |

### 2g. The Lockheart (`tools/lockheart/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| LMB held | vacuum; tap = the flail | HOLD, TIMING(tap threshold) | lockheart.js:166-171 |
| RMB | open it (full and a Possibilikey); the wheel of odds held and spun; wheel turns the ring | HOLD, wheel | lockheart.js:175-180 |

### 2h. Sub tool "lend" (R, tools/belt.js:94; each tool's `lend()`): one press, verb from `progress/toolpairs.js` SUB_GIFTS. R is also the surge on the rail and the fix at the open-sea helm (see below).

---

## 3. The Solar Skiff (the Dunes / the Raceway; `courier/skiff/`)

Summoned with Y (skiff.js:171), mounted with F at a parked board (skiff.js:172). The psygun is stowed; the camera look stays live.

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| mouse look / arrows | camera | AIM | skiff.js:514, 566 |
| A / D | steer (spin in the air; the grind's balance on a rail) | HOLD | skiff.js:323, 530 |
| W / S | hoist / furl the sail (S brakes); W+S together with a combo live = the manual; in the air W/S pitch the glide | HOLD, CHORD(W+S) | skiff.js:325, 544; boardrules.js:110 |
| Space | hold = crouch the springs, release = hop; released in the air just after leaving a crest = a late pop (perfect in the first moment); held in the air = glide | HOLD, TIMING (POP.window / perfect), CHORD with A/D (spin) | skiff.js:328, 448-461 |
| Shift | the solar flare (pool) | HOLD | skiff.js:326, 546 |
| C | spend a banked flare whole (edge) | single press | skiff.js:327, 548 |
| Q / E (held on sand at speed) | the carve (three tiers by hold time; release = push); in the air the glider's bank | HOLD, TIMING(tier), CHORD(with A/D) | skiff.js:330, 408-446 |
| Q / E tapped twice on the sand | the shoulder (a slam sideways; a rival is taken down) | TIMING (double tap) | boardrules.js:138 |
| LMB / RMB (held in the air) | grab: nose / tail / both = double; held longer = more; released before landing | HOLD, TIMING, CHORD(LMB+RMB) | skiff.js:464 |
| LMB / RMB double-click on a rail | nose grind / tail slide | TIMING (double click) | skiff.js:535-541 |
| W/A/S/D in a bail | aftertouch steers the thrown body | HOLD | boardrules.js:153 |
| F | step off slowly / at a parked board, on | single press | help page; skiff.js:172 |
| Y | recall | single press | skiff.js:316 |
| Backspace (held) / (tap) | rewind (practice) / restart | HOLD/single | world/raceway/race.js:149-150; rewind.js:2 |
| (Raceway) F at the start pillar / race board | begin a race / pick a track | MENU | raceway/race.js:136-137 |
| /race, /retire, /edit | chat line | typed | raceway/race.js:80-87; editor.js:91 |

**Peak simultaneous inputs:** look + W + A/D + Shift + Space-held + Q/E + LMB + RMB (in the air, grabs) = up to 8 on paper; ordinary racing is look + W + A/D + Shift + Space/Q/E = 5. Carve is A/D plus Q/E on the same side while W is held.

---

## 4. The god hand (~; `godhand/`) and the Spirit Garden (cursor free, no pointer lock)

The cursor is the hand; `cursorFree()` (main.js:685) keeps the pointer unlocked in the god hand, the garden, a puzzle duel, the track editor and the haunt.

### 4a. The god hand over the island

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| mouse (cursor) | the hand follows (ray to the ground) | AIM | godhand.js:353-354 |
| W A S D, screen edges | pan the view (edge scroll uses `mx,my` at the window edge) | HOLD, edge-scroll | godhand.js:285-292 |
| Q / E | turn the view in eighths | single press | godhand.js:265-266 |
| wheel | zoom | wheel | godhand.js:267 |
| 1 .. 7 | pick a domain (pressing again cycles its arts) | single press | godhand.js:268 |
| LMB | use the art: press to begin, drag to shape, release to end (Portal / Fold / Gust / Herd / Muster drag a stroke; Manifest raises clay; Swell / Wring / Sunder drag deltas of `mx,my`) | HOLD, AIM, DRAG | arts.js:327-343, 395-403; matterarts.js:62, 101 |
| LMB (Telekinesis) | grab a thing / release; Shift raises the held thing | HOLD, AIM, CHORD(Shift) | godhand.js:388-400 |
| RMB held | the art wheel (flick by cursor, release = pick) | HOLD, DRAG | godhand.js:384-385 |
| MMB held | draw a miracle's sign with the cursor stroke; Shift held = the epic miracle | HOLD, DRAG, CHORD(Shift) | miracles.js:45-53 |
| Shift | alternates on arts (Hasten stops time, Transmute your feeling, Manifest ...) | CHORD | arts.js:42, 67; matterarts.js:96, 135; powers.js:67 |
| N | a survey from the Pneuka Jar | single press | main.js:1281 |
| ~ | back out | MENU | main.js:1282 |
| Esc | closes the wheel, then pauses | MENU | main.js:1075-1080 |

### 4b. The Spirit Garden (Inner Realm; `world/garden/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| W A S D | hop the Pneuka Jar (hold = longer); overhead view: pan | HOLD | realm.js:258-268 |
| Space | high jump | single press | realm.js:268 |
| Q / E, wheel | turn the camera, zoom | HOLD, wheel | gardencam.js:101, 134 |
| Z, ~ | first person; overhead view | toggle | realm.js:285; main.js:1282 |
| mouse + LMB | hand: use the art (grab, throw, pet a spirit, place, paint, pour) | AIM, HOLD, DRAG | hand.js:121-162 |
| RMB | flick a spirit; clear (paint); drink (water) | HOLD | hand.js:129, 183 |
| 1 .. 9, 0 | pick an art | single press | hand.js:31, 118 |
| R | turn decor / next ground / next feeling | single press | hand.js:119 |
| Ctrl+Z, Ctrl+Backspace (twice) | undo, reset the planetoid | CHORD | hand.js:123-125 |
| Shift + wheel | brush size; Shift/Ctrl + LMB/RMB water springs and drains | CHORD | hand.js:117-134 |
| F | use what the chevron is on (the gate, the shed, a spirit's page); at the press Esc/F leaves | MENU | realm.js:318; press.js:122 |
| the press (the Athanor): LMB drag the lever (`my` delta), RMB flick | alchemy | DRAG | press.js:125-151 |
| P, Esc | the Pneuka Box, pause | MENU | |

**Peak:** cursor + LMB-drag + Shift + a letter key (+ wheel) = 4. Everything is cursor-driven (a finger is a good fit); the RMB / MMB / Shift variants are the cost.

---

## 5. Puzzle duel (cursor free; `world/duel/duelsession.js`; turn-based, no timing)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| cursor over the board | hover a cell (ray pick) | AIM | duelsession.js:125-132 |
| LMB press, drag, release | path-draw a piece / a run (up to four cells) | DRAG | duelsession.js:140-158 |
| W A S D | step: push (Shift: kick) in a direction | CHORD(Shift) | duelsession.js:156-157 |
| R | rotate a piece under the cursor | single press | duelsession.js:150 |
| RMB | drop a piece at a cell | AIM | duelsession.js:151 |
| X / Q / K / G / U / I (Shift+I = Send) | tool moves: Shoot, Grab, Drill, Paint, Delay, Hold | single press | duelsession.js:41, 159-165 |
| F | the finisher | single press | duelsession.js:152 |
| E | flee | single press | duelsession.js:137 |
| Space | end my turn | single press | duelsession.js:136 |
| ~ | switch form (hand / Courier) | single press | duelsession.js:135 |
| Backspace (hold 1.5 s) | yield | HOLD | duelsession.js:138 |
| Esc, Tab, F-keys, B | left to the rest of the game | MENU | duelsession.js:42 |

---

## 6. The rail / crossing (the ship; `courier/ship/ship.js`, `world/emocean/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| W A S D | move the ship in the view's plane | HOLD, CHORD | ship.js:134 |
| Shift / C | boost / brake (place along the rail) | HOLD | ship.js:140 |
| mouse (`dx,dy` as a share of the screen) | the far reticle / aim (when the view shows a cursor) | AIM, DRAG(delta) | ship.js:aimAt (cursor lines ~203+) |
| LMB held | the gun (on the sixteenth; spread of three Astral / one heavy Umbral) | HOLD, AIM | ship.js:177 |
| RMB held, release | lock-on sweep: paints up to eight targets; release fires lances (not in the "above" view) | HOLD, AIM | ship.js:188-205 |
| E | barrel roll (0.35 s; its first quarter second turns plain shots and sends an outlined shot home: the parry at sea), two charges | TIMING | ship.js:165-171 |
| Q | the forms: Astral <-> Umbral | single press | ship.js:172-173 |
| R | the surge (when full) | single press | ship.js:187 |
| 1 2 3 | the mounted tools' uses (a frigate carries three) | HOLD/single | ship/mounts.js:37, 56 |
| V | retired on the rail (the roll is the parry) | n/a | ship.js:25 comment |
| F at a jetty's end | seal into the helm (the pier page) | MENU | emocean/pier.js:109 |
| pier page, results window | card clicks; any key skips the results | MENU | pier.js:160; ui/railresults.js |

**Peak:** W/A/S/D (2) + Shift or C + LMB held + RMB held + E (+ mouse aim) = 6 or 7.

## 7. The open sea helm (`world/opensea/`)

| input | verb | flags | file:line |
| --- | --- | --- | --- |
| W / S (taps) | throttle up / down through four steps | single press | helm.js:48-49 |
| A / D (held) | rudder | HOLD | helm.js:50 |
| mouse `dx/dy` or Arrow keys | swing the chase camera round / tilt (the gun is aimed with the camera) | AIM/HOLD | helm.js:82-85 |
| LMB held | the ship's gun, aimed with the camera, height found for you | HOLD, AIM | opensea/seafight.js:135 |
| V | the parry: send the spit back | TIMING | seafight.js:159 |
| R | take a fix by the sky (the Dreamvane) | single press | opensea.js:140 |
| F | moor / dock at a quay or islet; on an islet, walk (then the on-foot set); F again boards | MENU/single | opensea.js:141-153 |

Peak: look + W/S taps + A/D + LMB = 4.

## 8. The Courier at a window or a place (the F-opened UIs; all mostly cursor + click)

| UI | inputs | flags | file:line |
| --- | --- | --- | --- |
| The dialogue box | F / Space / Enter / LMB advance; W S / Up Down + Enter pick; Digit1..9 pick; Esc ends | MENU | npc/dialogue.js:277-286 |
| The Index (basement hub) | Arrow keys + Enter/Space, or one letter per room (K workshop, L lab, B braid, C mill race, P spindle, S siege, D dunes, E shore, O open sea, R raceway, G bazaar, W Dunemaw), F / Esc closes | MENU | feedback/indexmenu.js:64-73; world/basement/basement.js:468-479 |
| The Pneuka Box (P) | LMB uses, RMB lists / context menu, HTML5 drag between slots, F flips to the underside, H hides the window, Esc / P closes | MENU, DRAG | pneuka/ui.js:103-113, 222-325 |
| The Codex (B) | clicks on shelves; B / Esc closes; F on the Sondelass shelf; loadout cards: click, hold 420 ms | MENU | feedback/codex/codex.js:84-90 |
| The map (M) | mouse drag pans, wheel zooms, RMB clears the waypoint; calibrate button | MENU, DRAG | feedback/cartography.js:436-462 |
| Shops / the Purser | clicks, RMB haggle | MENU | progress/shop/ui.js:60-96 |
| The kiln | mouse drag to turn, clicks, Esc | MENU, DRAG | courier/vessel/kilnui.js:58-68 |
| Raku's tables (a seat) | cursor pick on the cloth (pointermove/down), action bar buttons keyed 1 to 9, Esc leaves | MENU, AIM | vfx/bazaartable.js:116; ui/tablebuttons.js:141-151 |
| Reprogramming (Veritome) | a typed line in a field; Enter, Esc; composer R / F rotate / flip | typing | tools/veritome/reprogram.js:160-166; mind/composer.js:149-150 |
| Track editor (`/edit`) | click to lay / select, RMB erase, W A S D / arrows pan, Ctrl+Z, `[ ]` width, PageUp/Down height, `= -  . ,` trap period/offset, Delete, Esc | MENU, AIM, CHORD | raceway/editor.js:134, 226-235 |
| Haunt (fire traps) | click a trap; Q / E change lane, Space fire next, Backspace retire | AIM | raceway/haunt.js:43, 80-83 |
| Rhythm mode (`/rhythm`, busk) | keys 1 2 3 4 5 6 7 8 9 0 are ten lanes (single notes, no chords); Esc ends | TIMING | music/rhythm/rhythm.js:56-83; chart.js:21 |
| The pause menu (Esc / lock loss) | click to resume; help pages | MENU | main.js:1011; feedback/help/ |
| The chat line (Enter or /) | typed text, Esc closes, Up/Down history, PageUp/PageDown scroll the log, End to latest, `\` mini, `[` `]` tabs | MENU (typing) | feedback/gamelog.js:127-195 |
| The title | click / keys | MENU | title/ui.js:53-54 |
| Co-op | T held wheel (sec. 1); `/sib` | | coop/party.js |

---

## 9. Chat-line commands (typed; `feedback/chat.js` table, `game.chat.add`)

Opened with Enter or `/`. Defaults in `feedback/chat.js:46-81`; 146 emotes are commands too (`chat.js:57-59`, `courier/emotes.js`). `debug: true` is refused outside DEBUG (`chat.js:40`).

**Normal play (STORY and DEBUG):**
- built-ins: `/help` (aliases `?` `commands`), `/emotes [family]`, `/em <words>` (aliases `emote` `me`), `/say <words>` (`s`), `/stand` (`stop`), `/clear`, `/voice on|off`, `/music ...`, `/window <colour>`, `/where` (`loc` `pos`); plain words (no slash) say aloud.
- an emote per name: `/sit`, `/wave`, `/dance`, `/bow` ... (146; the folk react).
- game systems: `/knack [id on|off]` (progress/knacks.js:72), `/goals` (progress/goals.js:93), `/sight <place|home|off>` (progress/sight.js:64), `/time` (main.js:924), `/rhythm [track] [light|steady|full]` (main.js:991), `/overture` (main.js:942), `/vfx <name>` (main.js:934), `/glitch` (main.js:969), `/mawwipe` (main.js:968), `/workbench` (main.js:971), `/skiff invert` (courier/skiff/skiffsettings.js:15), `/race <track> [mode] [solo|siblings]`, `/retire` (raceway/race.js:80-87), `/edit [slot|name|code|off]` (raceway/editor.js:91), `/name <words>` (garden/raising.js:34), `/realmname` (main.js:985), `/tree ...` (main.js:982; `dawn` is DEBUG), `/spore ...` (main.js:978; `bed` is DEBUG), `/howto` (bazaar.js:137), `/harmony`, `/letters` (progress/harmony.js, progress/spiritlife.js), `/pairs` (feedback/tracking/pairs.js), `/sib` (the party; coop/party.js:50), `/letter <name> <words>` and `@name <words>` (coop/letters.js:39, answer.js), `/chat` (`chatroom`), `/say` (coop/chatroom.js:65-66), `/usage` (coop/usage.js:31).
- Of these, the ones a normal player is likely to need: `/knack` (the assists switch), `/goals`, `/sight`, `/skiff invert`, `/edit` and `/race` (the only way to start a race by command; also the race board stone), `/name` (spirit), `/realmname`, `/sib` (the party's orders), `/tree`, `/spore`.

**DEBUG only (`debug: true`):** `/psyche`, `/mudra`, `/art` (opt-in Movement Arts: hover, rocket, skim), `/goto`, `/garden`, `/cavern`, `/awaken`, `/aberrantwipe`, `/pull`, `/vertexpaint`, `/opening` (`ult`), `/crossing`, `/figure`, `/serpent`; `/psygun <kind>` and `/grant [n]` (refuse themselves outside DEBUG, economy.js:61-70); `/replay`, `/record` (debug/replay.js:46-58); `/tree dawn`, `/spore bed ...` (partly DEBUG).

---

## 10. Summary

### Peak simultaneous inputs by context (from the code)
| context | peak held/pressed at once |
| --- | --- |
| on foot, no tool | look + 2 move keys + Shift + Space or C = 5 |
| psygun | look + 2 move + RMB (ADS) + LMB (charge) = 5, +Shift when scoped |
| cutlass | look + 2 move + Shift + LMB + V (guard) or RMB special, E blink in a stroke = 6 to 7 |
| rod, fish on | A/D + S + W + Shift + LMB + RMB (+ look) = 6 |
| hook | look + WASD pump (2) + LMB reel + RMB pay out = 5 |
| Soul Brush, Celestial mode | mouse delta + RMB held + LMB held = 3 |
| Veritome | look + RMB + LMB + wheel = 3 to 4 |
| Solar Skiff | look + W + A/D + Shift + Space held + Q/E (+ LMB + RMB in the air) = 5 to 8 |
| the rail | WASD (2) + Shift or C + LMB + RMB + E (+ mouse aim) = 6 to 7 |
| open-sea helm | look + A/D + LMB + (W/S tap) = 4 |
| god hand | cursor + LMB drag + Shift + a letter (+ RMB / MMB wheel) = 3 to 4 |
| Spirit Garden | cursor + LMB/RMB + WASD + Shift/Ctrl (+ wheel) = 4 to 5 |
| puzzle duel | cursor + LMB drag; tool keys one at a time = 2 |
| Raku's tables, windows | cursor + click (1 to 9 optional) = 1 |
| rhythm mode | one lane key at a time (no chords by design) = 1 |

### What is hardest on touch (from the code)
1. **Free aim while holding other things**: look is a raw pixel delta (`dx/dy`) fed to `yaw/pitch`, and every tool aims by the camera centre; LMB/RMB held plus 2 move keys plus Shift is the common fight posture.
2. **Pointer lock itself**: leaving the lock is the pause, `enabled` follows it, a click resumes. No lock on a phone means the overlay/pause logic and `lockFailed` look (cursor-follow) need an owner.
3. **Timing windows with buffers**: the parry (V, 0.25 s, `parries.js:19`), blink, Space pop released within `POP.window` (perfect in the first moment), the toll against the beat (Crucibelle), the barrel roll (E), a double tap Q/Q or E/E (shoulder), a double click LMB/LMB or RMB/RMB on a rail (grind trick), Shift tap as dash/roll buffers.
4. **Chords on one side of the face**: skiff carve (Q/E + A/D + W + Shift), cutlass special (RMB + W/S), rod fight (A/D + S + W + Shift + LMB + RMB), grab double (LMB + RMB), MMB-held-with-Shift (epic miracle), RMB-held-with-digit (Crucibelle octave).
5. **Mouse-delta cursors that are not on screen**: Blade Mode and Celestial mode move a virtual cursor with `dx/dy` (blade.js:137, celestial.js:77-78), the order wheel, the quick-pick ring (radial.js:44), the lock-on flick (`dx>90`, lockon.js:170), the god hand's Swell/Wring/Sunder deltas (arts.js:395-403) and the lever (press.js:131).
6. **Right and middle mouse as verbs**: RMB is aim / special / lens / wheel / lock sweep / dowse in nearly every tool; MMB is lock-on / shell / survey / reprogram / miracle sign. Both are held as often as tapped.
7. **Keyboard-only mappings with no pointer equivalent**: digits 1 to 0 (chambers, forms, aspects, domains, arts, rhythm lanes, mounts, dialogue options), Esc (pause), Tab (settings), Enter / `/` (chat), `~`, X, R, Q, E, F, Z, O, T, Y, and every window's key letter. Chat commands are typed.
8. **UI built on hover, right-click and HTML5 drag**: the Pneuka Box (`pneuka/ui.js`), the reading table, the underside, map drag, kiln drag; hover text in 23 files; context menus.

### Already touch-capable or close to it
- Window UIs are DOM with `click` handlers: a tap works (emulated click), as do the choice cards, shops, the Codex shelves, the Index rows, table action-bar buttons, and the pause overlay's click-to-resume.
- Pointer-event consumers (touch works with no change): the haunt (`haunt.js:43`), the track editor's clicks and map drag (`editor.js:134, 328`), Raku's table view (`bazaartable.js:116`), the choice-card press-and-hold (`choicecard.js:154`), the chat log drag (`gamelog.js:108`), sea chart, seal picker.
- The input set model (`down`, `pressed`, `dx`, `dy`, `wheel`, `mx`, `my`) is already written to by three non-keyboard drivers (agent, replay, siblings' `VirtualKeys`), and `Input.spend` exists. A touch driver that writes the same fields is the same pattern (taps need `down` held at least one 1/60 s step; blur clears `down`).
- Assist infrastructure exists and is earned-and-switchable: lock-on aim assist (always on), Steady Hand, Held Breath, Wide Sights, keyboard look at 90 and 60 degrees per real s, `camera.sensitivity`, `camera.adsSensMult`.
- Nothing in code mentions touch, pointer type, gamepad, coarse pointers or safe areas; the help page says "Needs a keyboard and mouse".

### Notes for accuracy
- The help pages (`feedback/help/pages.js`) lag the code in a few places (e.g. THE VERITOME page still says "also your bank", the Box's retired bank; the 'skiff' help omits Q/E carve, the grabs and the shoulder). The tables here follow the code lines cited.
- `KeyG` is latched on the Courier (`player.js:237`) but nothing consumes it in play; it is only the Index's code for Raku's Bazaar.
- Not audited key by key: the title screen's own key handler (`title/ui.js:17-18`), the Workbench (`/workbench`, an Anim Lab for development), QAIS (F8) windows, the tuning panel (Tab), the sibling's mind (`coop/follow.js`, `fight.js`: they press virtual keys; not player input).
