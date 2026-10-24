# MOBILE: the whole game on a phone, one build with mouse and keyboard

**Asked:** the owner, 2026-10-24: "let's get fuckin crazy mode on it and evaluate what systems we can make mobile friendly, how to do it, and
plan for eventual full mobile play that integrates with the mouse+keyboard build". The owner steers the game from screenshots on a phone;
the first aim is that they can **play** what we build, there.

**Owners:** this plan is Dovina's (what is played, how each system maps to a thumb, the order); the input layer, rendering, performance,
the save and publishing are Petra's; the HUD's layout and every control's look are Calissa's; sound, its recovery and haptics are
Wanda's (asked); the words on the controls and the help are Espada's. Nothing here is built by Dovina outside her own files.

**Evidence:** three audits of the code, 2026-10-24 (`docs/plans/research/MOBILE-AUDIT-INPUT.md`, `-UI.md`, `-PERF.md`; summarised in
section 2): every input verb (`core/input.js` and 322 key reads), every window and HUD element (61 surfaces), and the rendering, memory,
boot, audio, save and platform state. Nothing has been measured on a phone yet; section 7 starts there.

---

## 1. The verdict

1. **It can be done, and the game's own shape helps.** Every input already goes through one small, plain layer (`game.input`: sets of
   held and pressed keys, a look delta, a cursor, a wheel), and three drivers that are not a keyboard already write it (the agent, the
   replay, the siblings' `VirtualKeys`). A touch driver is the fourth. The 480-line present means a phone shades about half a megapixel
   whatever its screen. Sound is all synthesised (nothing to download). The save is small (about 6 KB fresh).
2. **The walls are not input.** They are CPU (draw calls: 679 GL calls in the workshop on desktop, a third of them the shadow pass, a
   third of the main pass outline hulls; never measured on a phone), boot (one 13.3 MB script, about 190 shader programs compiled at
   start), and memory (a 273 to 294 MB heap, the Raceway 450+). These are measured on the owner's phone first (section 7), before any
   target is set: ambition first, cost after (CLAUDE.md).
3. **One game, one build, one save.** No mobile edition. The input is chosen by the last device touched (a finger, a key, a stick), and the
   HUD follows it; the rules never change by device (DESIGN.md 22: base change bad). Where a finger is worse at something, the game offers
   the assists it already has (the lock-on's aim assist, the knacks), never a different rule.
4. **Some systems get better on a phone, and those come first**: everything the cursor already drives (the god hand, the Spirit Garden,
   the puzzle duel, Raku's tables, the track editor and the haunt), and the verbs that are drawn (Celestial mode's sigils, a miracle's
   sign, Blade Mode's cut: a finger draws better than a mouse delta does). Then the Solar Skiff, which a phone racer has taught everyone
   to play with two thumbs. The cutlass fight and free aim are last.
5. **Gamepad comes in the same layer, nearly free.** A Bluetooth pad on a phone (and on desktop) is the cheapest full-precision mobile
   input there is; Sky: Children of the Light's reviewers said its pad support is what made the phone version feel right.

## 2. What the audits found (the facts the plan stands on)

| area | state now | consequence |
| --- | --- | --- |
| input | keyboard + mouse with pointer lock only; no touch, no gamepad, no coarse-pointer code; losing the lock is the pause | a touch mode must not pause on "no lock"; look must come from a finger |
| peak inputs at once | on foot 5; cutlass 6 to 7; rod with a fish 6; Solar Skiff 5 (8 with grabs); the rail 6 to 7; helm 4; god hand 3 to 4; duel 2; tables 1 | the skiff, helm, god hand, duel and tables fit two thumbs as they are; the cutlass and the rail need the context to choose |
| hardest verbs | free aim while holding others; timing windows (parry 0.25 s, late pop, toll on the beat, roll); chords (carve, rod fight, cutlass specials); mouse-delta cursors (Blade Mode, Celestial mode, the order wheel, the quick pick); RMB and MMB as held verbs; keys with no pointer route (digits, Esc, Tab, Enter, `~`, X, R, F, Z, T, Y) | each gets a touch form in section 4 |
| windows | 61 surfaces: 11 work, 25 need layout, 20 need redesign, 5 dev-only. Hover carries information in 23 handlers and 37 rules; right-click is required in about 10 places; HTML5 drag in the Pneuka Box, the reading table and the underside; the map pans by mouse-move and zooms by wheel | a press-and-hold detail (the choice cards already have one, 420 ms) replaces hover; tap-to-pick-then-tap-to-place replaces drag; a long press replaces right-click |
| HUD sizing | five sizing systems, all keyed to height; in portrait the Lachrimeter is 58% of the width, the Sight 77%, the psygun cylinder off the left edge; no safe areas | one layout manager with safe areas and the thumbs' areas (Calissa's) |
| settings | the player's real settings (sensitivity, graphics, volume) live only in the Tab panel (lil-gui) | a settings window reachable by touch |
| render | 480-line present (a phone draws about 1039 x 480); tiers High/Low/Minimum and dynamic resolution exist; an iPhone auto-detects as High (4x MSAA twice, 8 lamps, PCF shadows); Minimum still needs half-float render targets | a phone tier and a fixed detector; a direct-to-canvas fallback |
| boot | 30.8 MB dist; about 23.5 MB on the boot path (11.3 MB gzipped); one 13.3 MB `game.js`; about 190 programs compiled behind a text screen (22 s of a 59 s boot on SwiftShader) | lazy rooms, shader warm-up spread, a progress bar; measured on the phone |
| memory | heap 273 to 294 MB, budget 320; the Raceway 452 to 467 MB inside | measured on the phone; rooms let go as the Raceway's ground already is |
| audio | synthesised (zero bytes); unlock on a gesture is right; about 5 convolvers and 3 compressors live; no recovery from an iOS interruption or a hidden tab | Wanda's: resume on return, fewer reverbs on a phone |
| save | localStorage, written whole per scope, 5 s ledger debounce; no flush on `pagehide`; a failed write is silent; iOS evicts a non-installed page's storage after 7 days | flush on hide, say when a write fails, the export code offered |
| platform | bare viewport meta; no `touch-action`, fullscreen, orientation, safe area, manifest, wake lock or context-lost handling | the plumbing of M0 |

## 3. Prior art, and what to take

| game | what it does | take |
| --- | --- | --- |
| **Mario Kart Tour** (Nintendo, 2019) | the kart accelerates by itself; one finger's sideways slide steers and starts a drift; Smart Steering keeps you on the road, switchable; gyro optional; manual drift for experts | auto-sail; steering as a slide from where the thumb lands; the carve as a hard steer; the assist as a switch the player owns |
| **Asphalt 9's TouchDrive** (Gameloft, 2018) | the game steers; you choose a route at each fork with a swipe, and press drift and nitro; manual steering is still there | a route choice by swipe at the cavern's fork; never the default |
| **Rocket League Sideswipe** (Psyonix, 2021) | a mobile-only redesign: a stick, two buttons, and swipes on the right side for flips | swipes on the right half for the skiff's sideways verbs (the shoulder) |
| **Genshin Impact** (HoYoverse, 2020) | one account across PC and phone; a floating left stick, a right-half look drag, contextual buttons; on-screen buttons hide the view | one save across devices; floating stick, look drag, few buttons at a time |
| **Call of Duty Mobile / PUBG Mobile / Fortnite** | a fire button you can drag to aim; aim assist; a layout editor where the player moves and sizes every button | the drag-to-aim fire button; a layout editor (M5) |
| **Brawl Stars** (Supercell) | tap a skill to auto-aim it at the nearest target, drag it to aim by hand | tap = assisted, drag = manual, for the psygun's shell and the cutlass's specials |
| **Sky: Children of the Light** (thatgamecompany) | the touch camera was its weakest part by its own reviews; its pad support is what made it | the camera follows by itself unless the right thumb takes it; pad support from M0 |
| **Alto's Odyssey** (Snowman) | one tap to jump, hold for tricks: a whole board game on one thumb | the skiff's hop and glide on one held button |
| **Metal Gear Rising's Blade Mode** on a stick, **Fruit Ninja** on glass | a cut along a line | Blade Mode's cut as a swipe across the screen |
| **Hearthstone / Marvel Snap** | drag a card to play it, or tap then tap the target; press and hold to read | the Pneuka Box, the reading table, the underside, the house's choice cards |
| **Minecraft (Bedrock)** | the same world on keyboard, pad and touch; tap to break, hold to place; split controls option | one world; long press for the second verb |

## 4. The touch grammar (one set of rules for every system)

1. **Two areas and a cluster.** The left half of the screen is the move area: a thumb landing anywhere makes a floating stick there
   (Genshin's). The right half is the look area: a drag turns the camera. In the right half's bottom corner sits the **cluster**: at most
   four buttons, the context's verbs (section 5), the main one largest under the thumb (96 px), the others round it (72 px). Nothing is
   smaller than 44 px (Apple's and Google's minimum hit target).
2. **Context decides the buttons.** The cluster shows only what the moment can use (on the skiff: HOP, FLARE, BRAKE; in the air: HOP, NOSE,
   TAIL; at a rail: NOSE, TAIL). It is the same list the keyboard player already has, cut to the moment; the game tells the HUD what is
   live (each system declares its context: section 6).
3. **Every verb keeps its rule.** A held key is a held button; a released key a released button; a timed press a timed press. Windows are
   never widened for a finger; latency is measured first (section 7), and if a window is out of reach the answer is an assist the game
   already grants (Held Breath for the parry), switched by the player.
4. **The second verb is a long press.** Right-click, hover and "examine" become a press held 0.42 s (the choice card's own, `choicecard.js`):
   it opens the detail or the menu; a tap does the first verb.
5. **Drag becomes tap, tap.** In any window that drags (the Pneuka Box, the reading table, the underside, the composer), a tap lifts a
   thing (it rises and glows) and a tap on a place puts it there; a real drag still works.
6. **Drawn verbs are drawn.** Wherever the game reads a mouse delta as a stroke (Blade Mode's cut, Celestial mode, a miracle's sign, the god
   hand's arts, the press's lever), the finger draws it on the screen where it is seen.
7. **Keys with no place get a home.** The windows (Codex, Pneuka Box, map, settings, chat) are icons in a top bar, small and out of the
   thumbs' way (the pause menu holds them too); the chat line opens a real field (the phone's keyboard); the digits become a strip of the
   context's choices (chambers, domains, arts, lures), a swipe or a tap.
8. **The camera helps.** On a phone the camera follows by itself (the chase's own behaviour), and the right thumb takes it only while it
   drags; let go, it eases back (Sky's lesson). Aim-heavy contexts turn the lock-on on by default (it already has aim assist).
9. **The HUD makes room.** The instruments (the Lachrimeter, the Sight, a tool's own UI) step out of the thumbs' areas on a phone, in a
   layout keyed to the screen's shorter side and its safe areas (Calissa's: section 6.3).
10. **Landscape for action, either for the rest.** The action modes are landscape (a 222 x 480 portrait buffer is too narrow to steer by);
    the windows, the god hand, the garden, the duel and Raku's tables also work in portrait.

## 5. Every system, judged

Green: works on touch as it is or with the grammar alone. Amber: needs its own mapping (given). Red: needs design work before it plays well.

| system | verdict | how on touch | phase |
| --- | --- | --- | --- |
| windows: Index, race board, dialogue, shops, Codex pages, choice cards, pause | green after layout | taps already work (emulated clicks); sizes and the long press | M1 |
| Raku's tables and the table view | green | tap a piece, long press its tip; the action bar is already buttons; the HUD's type needs the shorter-side unit (landscape type is 5 to 7 px now) | M1 |
| the puzzle duel | green | tap a cell, drag a path (pointer events), tool moves as a strip, END TURN a button; hover becomes the drag's own preview | M1 |
| the track editor, the haunt | green | pointer events already; a pinch zooms, two fingers pan; the panel as a drawer | M1 |
| the god hand | green (better) | the finger is the hand: drag to shape, a strip of domains and arts, the art wheel a long press, a miracle drawn with two fingers held (in place of MMB), pinch to zoom, two-finger drag to pan | M1 |
| the Spirit Garden | green (better) | the hand as above; the Pneuka Jar's hop on the left stick | M2 |
| **the Solar Skiff and the Raceway** | amber, specified (section 8) | the first action mode on a phone | **M1** |
| on foot (the core movement) | amber | left stick moves (its push sets walk, run, sprint); JUMP, CROUCH (slide at a run), DASH; F's interact as a USE button that names its thing; ladders, hanging, swimming read the stick as they read W A S D | M2 |
| the Pneuka Box, the reading table, the underside | red to green | tap, tap (section 4.5); the hover line becomes the detail on a long press; the window laid out for the screen, not shrunk to 0.4 | M2 |
| the map | red to green | one finger pans, two pinch; a long press sets the waypoint (a tap after the long press's menu clears it) | M2 |
| the Veritome | amber (better) | the lens a button (hold to raise), the shutter a tap anywhere on the right half, pinch to zoom: the phone is a camera | M3 |
| Celestial mode, Blade Mode, a miracle's sign | green (better) | drawn (section 4.6) | M3 |
| the psygun | amber | aim by look drag with the lock-on on; the FIRE button is dragged to aim while held (CoD Mobile); a chamber strip; the shell tapped (assisted) or dragged (aimed: Brawl Stars) | M3 |
| the Sondelass: cutlass | red | the string on ATTACK; the special on a SPECIAL button whose swipe direction picks forward or back (in place of W / S held); the guard and parry on GUARD; the lock-on on; Blade Mode drawn | M3 |
| the Sondelass: rod and angling | amber | cast by a held button and a release; the fight's A / D, S, W on the left stick (its own axes), reel and crank on the right | M3 |
| the Sondelass: hook | amber | aim at the hook's mark (it already snaps), fire, hold to reel | M3 |
| the Soul Brush | amber | the club on ATTACK; paint and mop a toggle; Celestial mode drawn | M3 |
| the Dreamvane, the Lockheart | amber | each a held main verb and a tapped second; the Lockheart's wheel of odds turned by a finger round it | M3 |
| the Crucibelle | green (better) | five notes as five pads on the right; the toll on the beat a pad of its own: an instrument on glass | M3 |
| the rhythm mode and busking | amber | ten lanes as ten pads in two rows (a phone's width), notes are single | M3 |
| the rail (the crossing) | amber | the ship on the left stick; FIRE held; the lock-on sweep a drag across the screen with the right thumb (release fires); ROLL and FORM buttons; the surge a button that lights when full | M4 |
| the open sea's helm | green after mapping | throttle up and down as two buttons (W / S are taps already), rudder on the stick, the gun on FIRE with the camera aimed by the right thumb | M4 |
| reprogramming (a typed macro) | red | its hidden input made a real field so the phone's keyboard opens; the composer's right-click rotate a long press | M4 |
| the seal picker (the title) | red | the name typed into a real field (it reads keys A to Z now) | M1 (it is the first screen) |
| the party's order wheel, the brush's quick pick | amber | a long press opens the wheel where the thumb is; slide to a wedge, let go | M3 |
| settings (Tab, lil-gui) | red | a settings window in the house's dress, reachable from the pause menu and the top bar: sensitivity, the camera's follow, graphics, volume, the touch layout | M1 |
| QAIS (F8) | amber | a corner button in DEBUG builds, so the owner files reports from the phone | M1 |

## 6. The architecture (Petra's, proposed; each to be settled in the discussion, section 10)

### 6.1 Actions and axes
- The input layer gains **actions** and **axes** beside its keys: `input.action('hop')` (held, pressed, released) and `input.axis('moveX')`
  (-1 .. 1). Keyboard, mouse, touch and pad all write them; the keyboard's own codes stay readable, so nothing breaks while systems move
  over one at a time. A table of bindings (`ACTIONS`: id, keys, mouse button, pad button, touch control, its context) is the one place
  that says what each verb is on each device.
- Analog axes matter for two systems at once: the skiff's steering and the Courier's walk-run-sprint read a stick's push (today they read
  binary keys). The core movement is unchanged on a keyboard: full push equals the key.
- **The touch driver** writes the same fields the agent, replay and siblings write (a synthetic tap held at least one fixed step), and the
  look delta from the right half's drag. Replays then record touch play for free.
- **The pad driver**: the Gamepad API, polled once a frame; standard mapping.
- **The last device wins**: the input layer reports `input.device` (keyboard, touch, pad); the HUD and the help follow it.

### 6.1.1 The bindings table, first cut (Dovina's contents, Petra's shape: `core/bindings.js`)

Petra's M0 (section 10): no system moves to actions yet. The touch and pad drivers press **key codes** through the table's reverse map,
as `VirtualKeys` does, so all 322 key reads work on day one; `action(id)` is the read for new code. So each row's **first key is the code
a driver presses**. The core movement on a stick (Petra): a unit direction plus the walk and sprint flags, never a speed in between.

- **Columns:**
  - `id`;
  - `keys` (`KeyboardEvent.code`; the first is pressed by the drivers);
  - `mouse` (`Mouse0` to `Mouse2`);
  - `pad` (the Gamepad API's standard mapping: `A B X Y LB RB LT RT Back Start LS RS Up Down Left Right`);
  - `touch` (a control id: Calissa's tiles, section 4);
  - `ctx` (where it is live, `ctx` below);
  - `how` (`hold`, `tap`, `double`, `release`: held then let go).
- **ctx:**
  - `any` (unless a window has the keys);
  - `foot` (the Courier on foot, nothing riding);
  - `skiff` (riding, on the sand);
  - `skiff.air`;
  - `skiff.rail` (the keel grinding);
  - `race` (the Raceway with a run live).
  - A driver asks which ctx is live; the game already knows it (`player.tech`, `skiff.riding`, `skiff.air`, `skiff.grind`, `race.live`).
- **A touch control shows only in its ctx** (section 4's "context decides the buttons"). A tile that names its thing (USE) takes the
  chevron's target's label.

```js
// AXES: -1 .. 1. Keys give ±1 (the keyboard is unchanged); a stick or the move area gives its push.
export const AXES = {
  moveX: { neg: 'KeyA', pos: 'KeyD', pad: 'LSx', touch: 'move.x' },
  moveY: { neg: 'KeyS', pos: 'KeyW', pad: 'LSy', touch: 'move.y' },   // (forward is +)
  steer: { neg: 'KeyA', pos: 'KeyD', pad: 'LSx', touch: 'move.x' },   // (the skiff; truly analog: full at 60 px on touch, 0.9 on a pad)
  lookX: { neg: 'ArrowLeft', pos: 'ArrowRight', pad: 'RSx', touch: 'look.x' },
  lookY: { neg: 'ArrowDown', pos: 'ArrowUp', pad: 'RSy', touch: 'look.y' },
};
// The gaits from a push (Petra): below 0.55 walk (the driver holds AltLeft), to full run, sprint (ShiftLeft held) past the move area's outer
// ring on touch, or LS clicked on a pad (latched until the push falls under 0.55: the genre's L3 sprint, so a full push is still a run).

export const ACTIONS = [
  // ---- anywhere
  { id: 'pause',    keys: ['Escape'],     pad: 'Start', touch: 'pause',      ctx: 'any', how: 'tap' },
  { id: 'box',      keys: ['KeyP'],       pad: 'Back',  touch: 'top.box',    ctx: 'any', how: 'tap' },
  { id: 'map',      keys: ['KeyM'],                     touch: 'top.map',    ctx: 'any', how: 'tap' },
  { id: 'codex',    keys: ['KeyB'],                     touch: 'top.codex',  ctx: 'any', how: 'tap' },
  { id: 'chat',     keys: ['Enter', 'Slash'],           touch: 'top.chat',   ctx: 'any', how: 'tap' },
  { id: 'godhand',  keys: ['Backquote'],  pad: 'Right', touch: 'top.godhand', ctx: 'any', how: 'tap' },
  // ---- on foot (M2 for touch; the pad on day one)
  { id: 'jump',     keys: ['Space'],      pad: 'A',     touch: 'jump',       ctx: 'foot', how: 'hold' },  // (held: the mantle chain, the wall run)
  { id: 'crouch',   keys: ['KeyC'],       pad: 'B',     touch: 'crouch',     ctx: 'foot', how: 'hold' },  // (a press cycles the posture; at a run the slide; held in paint the Paint Dive)
  { id: 'use',      keys: ['KeyF'],       pad: 'X',     touch: 'use',        ctx: 'foot', how: 'hold' },  // (shown only with a chevron; held: the push)
  { id: 'draw',     keys: ['KeyX'],       pad: 'Y',     touch: 'tool',       ctx: 'foot', how: 'tap' },   // (draw / stow the main)
  { id: 'lend',     keys: ['KeyR'],       pad: 'RS',    touch: 'lend',       ctx: 'foot', how: 'tap' },   // (the sub's verb; a parry for Gulp: never waits for release)
  { id: 'primary',  mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'foot', how: 'hold' },  // (the tool's LMB; the carry's throw. M3 per tool)
  { id: 'secondary', mouse: 'Mouse2',     pad: 'LT',    touch: 'aim',        ctx: 'foot', how: 'hold' },  // (the tool's RMB. M3 per tool)
  { id: 'parry',    keys: ['KeyV'],       pad: 'RB',    touch: 'parry',      ctx: 'foot', how: 'tap' },   // (the kick with nothing in hand, once learned)
  { id: 'blink',    keys: ['KeyE'],       pad: 'LB',    touch: 'blink',      ctx: 'foot', how: 'tap' },   // (once learned)
  { id: 'dash',     keys: ['ShiftLeft'],  pad: 'LS',                         ctx: 'foot', how: 'tap' },   // (a press: the air dash, the crouched roll. Touch: open, below)
  { id: 'view',     keys: ['KeyZ'],       pad: 'Up',                         ctx: 'foot', how: 'tap' },   // (first / third person; touch: the pause menu)
  { id: 'shoulder', keys: ['KeyO'],       pad: 'Left',                       ctx: 'foot', how: 'tap' },   // (touch: the pause menu)
  { id: 'skiff',    keys: ['KeyY'],       pad: 'Down',  touch: 'top.skiff',  ctx: 'foot', how: 'tap' },   // (summon / recall: in the Dunes and the Raceway)
  // ---- the Solar Skiff (M1: section 8)
  { id: 'sail',     keys: ['KeyW'],       pad: 'RT',    touch: 'auto',       ctx: 'skiff', how: 'hold' }, // (touch: held by the driver while riding unless BRAKE is held)
  { id: 'brake',    keys: ['KeyS'],       pad: 'LT',    touch: 'brake',      ctx: 'skiff', how: 'hold' }, // (with a combo live and the sail up: the manual)
  { id: 'hop',      keys: ['Space'],      pad: 'A',     touch: 'hop',        ctx: 'skiff', how: 'release' }, // (held: the springs; let go: the hop and the late pop; in the air held: the glide)
  { id: 'flare',    keys: ['ShiftLeft'],  pad: 'X',     touch: 'flare',      ctx: 'skiff', how: 'hold' },
  { id: 'boost',    keys: ['KeyC'],       pad: 'Y',     touch: 'boost',      ctx: 'skiff', how: 'tap' },  // (shown only with a flare banked)
  { id: 'carveL',   keys: ['KeyQ'],       pad: 'LB',    touch: 'move.outerL', ctx: 'skiff', how: 'hold' }, // (touch: the slide past the outer ring; tapped twice: the shoulder, a swipe on touch)
  { id: 'carveR',   keys: ['KeyE'],       pad: 'RB',    touch: 'move.outerR', ctx: 'skiff', how: 'hold' },
  { id: 'shoulderL', keys: ['KeyQ'],      pad: 'LB',    touch: 'swipe.left', ctx: 'skiff', how: 'double' },
  { id: 'shoulderR', keys: ['KeyE'],      pad: 'RB',    touch: 'swipe.right', ctx: 'skiff', how: 'double' },
  { id: 'nose',     mouse: 'Mouse0',      pad: 'X',     touch: 'nose',       ctx: 'skiff.air', how: 'hold' }, // (FLARE's place in the air)
  { id: 'tail',     mouse: 'Mouse2',      pad: 'B',     touch: 'tail',       ctx: 'skiff.air', how: 'hold' }, // (BRAKE's place in the air)
  { id: 'bankL',    keys: ['KeyQ'],       pad: 'LB',    touch: 'move.x',     ctx: 'skiff.air', how: 'hold' }, // (the glide's bank; touch: the left thumb)
  { id: 'bankR',    keys: ['KeyE'],       pad: 'RB',    touch: 'move.x',     ctx: 'skiff.air', how: 'hold' },
  { id: 'noseGrind', mouse: 'Mouse0',     pad: 'X',     touch: 'nose',       ctx: 'skiff.rail', how: 'double' },
  { id: 'tailSlide', mouse: 'Mouse2',     pad: 'B',     touch: 'tail',       ctx: 'skiff.rail', how: 'double' },
  { id: 'stepOff',  keys: ['KeyF'],       pad: 'Up',    touch: 'menu.stepOff', ctx: 'skiff', how: 'tap' }, // (and the race board, the start pillar: USE on touch)
  { id: 'recall',   keys: ['KeyY'],       pad: 'Down',  touch: 'top.skiff',  ctx: 'skiff', how: 'tap' },
  { id: 'toGate',   keys: ['KeyR'],       pad: 'Left',  touch: 'menu.back',  ctx: 'race', how: 'tap' },  // (held: retire, RETIRE in the pause menu on touch)
  { id: 'restart',  keys: ['Backspace'],  pad: 'Back',  touch: 'menu.restart', ctx: 'race', how: 'tap' }, // (held in practice: the rewind; Back is the Box off a race)
];
```

- **Precedence** (Petra, 2026-10-24). A pad button or a tile resolves to the first live ctx in this order that binds it: `race`,
  `skiff.rail`, `skiff.air`, `skiff`, `foot`, `any`.
  - A narrower ctx shadows a wider one **button by button, never whole**. In the air, X is the nose (`skiff.air`) while A is still the
    hop's glide (`skiff`). In a race, Back is the restart while the other `any` rows still work.
  - A mouse row is pressed as `keys[0] ?? mouse`. `input.js` keeps `Mouse0` to `Mouse2` in the same `down` set as the keys.
  - One button may carry a hold and a double in the same ctx (LB: carveL held, shoulderL twice). Both press KeyQ, and the game already
    tells a hold from a double.
- **Two keys, two meanings.** Space, Shift, C, E, Q, F, R and Y mean one thing on foot and another riding. The ctx column is what lets a pad
  button or a tile press the right code. Where a pad button carries two (X: flare on the sand, nose in the air), it is the same physical
  button pressing the code its ctx names, as section 8 says for the tiles.
- **On a pad, the skiff's W is RT and S is LT** (the racer's triggers). The keyboard's W + S chord for the manual is RT + LT. Sail stays
  manual on a pad: a trigger costs no thumb. Auto-sail is touch only, and it is a binding, not a rule (Petra agreed).
- **Open (mine, by M2):**
  - The dash and the roll are a Shift *press* on foot. On touch, either a flick of the move area to its outer ring from rest within
    0.15 real s, or a DASH tile once the air dash is learned. I'll measure the flick's false presses in the sweeps' touch lane before
    choosing.
  - The pad's R3 for `lend` is weak in a fight; the alternative is LB, moving `blink` to R3. I'll ask the owner once a pad is in their
    hands.
- **Not in the first cut:** the tools' own verbs past LMB and RMB (M3: each tool's context, with its owner), the god hand, the garden,
  the rail and the helm (M1 to M4), the digit keys (their strips), T's order wheel (the top bar), Alt (a gait now), Tab and F-keys (debug,
  the keyboard's only).

### 6.2 A touch mode for the shell
- No pointer lock on touch, and its loss is not the pause; the pause is a button. `cursorFree` contexts take the finger as the cursor.
- The platform's plumbing: `viewport-fit=cover`, `touch-action: none` on the canvas, no pinch-zoom or pull-to-refresh of the page,
  `env(safe-area-inset-*)`, `dvh` in place of `vh`, a fullscreen button, landscape asked for in the action modes, a wake lock while
  playing, `pagehide` and `visibilitychange` flushing the save, a failed save write said in the log, WebGL context loss and restore handled
  with a message (and the warm-up repaid behind it).
- Installing to the home screen (a manifest) would give fullscreen and lift iOS's 7-day storage eviction; whether the published page's
  host allows it is Petra's to find out.

### 6.3 The HUD's layout (Calissa's)
- One layout manager places every corner instrument, window and the touch controls inside the safe area, with the thumbs' areas reserved
  when the device is touch; its unit is keyed to the screen's **shorter side**, not its height, so portrait stops overflowing.
- The touch controls are the house's, never stock: in the System's type and the island's dress, the cluster's main button the largest,
  each lit by its state (a held HOP glows as it loads the spring). No words where a glyph says it; a label where it does not (Espada's).
- Windows: one breakpoint family for coarse pointers (44 px targets, 14 px least type, the long press for detail), the Pneuka Box and the
  underside laid out for a phone instead of shrunk.

### 6.4 Performance (Petra's, measured first)
- A **phone tier** beside High, Low and Minimum: MSAA off, the shadow at a lower rate and size, fewer lamps, the outline hulls only near
  the camera (a third of the main pass's draws now), a frame cap at 30 with steady pacing if 60 is out of reach. Its contents come from
  the measurement, never before it.
- The detector reads touch and the screen (an iPhone now lands on High); a direct-to-canvas path where half-float targets are missing.
- Boot: rooms loaded when first entered (as the Raceway's ground, the garden and a Well floor already are), the shader warm-up shown as a
  progress bar and spread, the workbench out of the published bundle.

### 6.5 Sound (Wanda's, asked)
- Resume after an interruption (a call, Siri, the tab hidden) and on return; the schedulers' lookahead made safe for a throttled tab.
- A phone budget for reverbs (five convolvers live now).
- **Haptics** as an avenue of feedback where the device has it (Android's `navigator.vibrate`; iOS web has none): a pop's perfect moment,
  a parry, a hit taken, the trick combo banked. Every number that matters has two avenues or more (CLAUDE.md); a buzz is a third. Wanda's
  ear for when a sound wants a body to feel it.

## 7. Measure first (the owner's phone is the test bench)

1. **A phone readout**: `?perf` on the URL shows the F3 panel's numbers in a corner (fps, frame ms, draw calls, heap, the tier), since a
   phone has no F3. The owner opens the published build on their phone at four places (the workshop, the Dunes, the Raceway, the god hand)
   and sends a screenshot of each. That is the baseline every target is set from.
2. **Headless touch**: Playwright's `hasTouch` and `isMobile` with a phone's viewport, so the sweeps and the stress test can drive the
   touch driver (Dovina's sweeps gain a touch pass per room as each phase lands).
3. **Latency**: a timing probe on the phone (a tap to the frame that shows it) before any timing window is judged reachable.

## 8. The Solar Skiff on touch (the first action mode, specified)

The skiff peaks at five inputs at once (eight with the air's grabs), its verbs are a racer's, and racing is where phones have the deepest
prior art. Landscape. Every rule as on the keyboard (`courier/skiff/skiff.js`, `boardrules.js`); only the bindings differ.

| verb (keyboard) | touch | why |
| --- | --- | --- |
| hoist the sail (W held) | **on by itself while riding** (the sail is up unless BRAKE is held) | Mario Kart Tour's auto-accelerate; holding a thumb down only to go wastes a thumb |
| furl, brake (S) | **BRAKE**, held (cluster, left of HOP) | |
| the manual (W and S with a combo live) | BRAKE held while a combo is live (the sail being up already) | the same chord, one button |
| steer (A / D) | **the left thumb's slide** from where it landed: analog, full at 60 px | Mario Kart Tour's slide |
| the carve (Q / E held on the sand at speed, its side) | **slide past the outer ring** (beyond 90 px) on that side: the carve begins and loads its tiers; slide back inside to let it go (its push) | MK Tour: the slide that steers is the slide that drifts |
| the shoulder (Q / E tapped twice) | **a swipe** left or right on the right half | Rocket League Sideswipe's right-side swipes |
| crouch the springs, hop (Space held, let go) | **HOP**, held and let go (96 px, the cluster's heart) | Alto's one-button board |
| the late pop, perfect pop | HOP let go just after the crest, as on the keyboard | the same window: measured on the phone before judged |
| glide (Space held in the air) | HOP held in the air | |
| spin and the glide's bank and pitch (A / D, W / S, Q / E in the air) | the left thumb, all directions | |
| the solar flare (Shift held) | **FLARE**, held (cluster, above HOP) | |
| spend a banked flare (C) | **BOOST**, which appears only while a flare is banked (the combo's suns over the stern say so too) | context decides the buttons |
| grab nose / tail (LMB / RMB held in the air), double (both) | in the air FLARE and BRAKE become **NOSE** and **TAIL**; both held is the double | the air has no use for brakes |
| a grind trick (LMB / RMB double-clicked on a rail) | on a rail NOSE and TAIL stay up: double-tap them | |
| the grind's balance (A / D) | the left thumb | |
| aftertouch in a bail | the left thumb | |
| the camera (mouse) | follows by itself; the right half's drag looks round and eases back on release | Sky's lesson |
| summon / recall (Y), step off (F) | a SKIFF button in the top bar when on foot in the Dunes or the Raceway; STEP OFF in the pause menu | out of the thumbs' way |
| back to the last gate (R), retire (R held), restart (Backspace), rewind (Backspace held, practice) | in the pause menu while racing: BACK, RESTART (hold to rewind in practice), RETIRE (Calissa's: the top stays clear) | Trackmania's restart is one press: still one tap, behind the pause |
| the race board, the start pillar (F) | USE, naming its thing ("Race board") | |
| a route at the cavern's fork | the steering itself (as now); no TouchDrive | the skill is the steering |

**The assist (a question for the owner, section 11):** Mario Kart Tour's Smart Steering keeps a kart off the walls. The skiff has none.
By the design laws an assist is a knack: earned, optional, switched, never gating. A **Steady Keel** knack (the board leans back toward the
line's centre when no steer is given, and never past it) would serve a thumb and a keyboard alike; its count way and feat way would be the
Raceway's first race finished and first lap under bronze.

## 8.2 The Spirit Garden on touch (M1, either orientation; the owner, section 11)

The garden is a cursor game already (`world/garden/hand.js`: "the cursor is the hand, always"). On a phone **the finger is the hand**,
which is closer to Black & White's hand than a mouse ever was. Every rule stays as on the keyboard; only the bindings differ. Prior art:
- Animal Crossing Pocket Camp and Stardew Valley mobile: tap the ground to walk there.
- Townscaper: tap to place.
- Viva Piñata: one hand, tools on a bar.
- Monument Valley: two fingers turn the world.
- Procreate: two-finger tap to undo.

| verb (keyboard and mouse) | touch | why |
| --- | --- | --- |
| hop the Pneuka Jar (W A S D) | **tap the ground with no art up** (the bar's first slot, WALK): the Jar hops toward it, again until it is there. In landscape the move area also hops it as a stick | Pocket Camp's tap-to-go; a phone held upright has no left thumb free |
| high jump (Space) | **JUMP**, a tile shown only while the Jar is moving or on a launch lotus | the cluster rule: context decides the buttons |
| an art (1 .. 9, 0) | **the art bar**: ten glazed tiles along the bottom edge (portrait) or the right edge (landscape), WALK first; tap to pick, tap the lit one again to put it down (WALK) | Viva Piñata's tool bar; the keys' order kept, so the desk and the phone teach each other |
| use the art (LMB: press, drag, release) | **one finger** on the planetoid: press, drag, lift | the hand already reads press, drag and release |
| the second verb (RMB: flick a spirit, clear paint, drink water) | **a long press** (420 ms, the ring filling under the finger), then drag or lift | section 4's one grammar for the right button |
| pet a spirit (a quick tap with GRAB) | a quick tap (under 0.22 real s, `HAND.tap`) | the same window |
| turn the choice (R: decor, ground, feeling) | **a two-finger twist** while placing; elsewhere a TURN tile beside the lit art | Townscaper's twist; the tile for what a twist can't say (the next feeling) |
| brush size (Shift + wheel) | a size slider beside the art bar while a shaping art or PAINT is lit | a pinch is the camera's |
| a spring / a drain (Shift or Ctrl + LMB / RMB with WATER) | a SPRING / DRAIN toggle beside WATER | no chord on glass |
| turn the camera, zoom (Q / E, wheel) | **two fingers**: drag to turn, pinch to zoom | Monument Valley and every maps app |
| the overhead view (~) | a top-bar tile, TOP VIEW (Espada's word); there one finger pans | |
| first person (Z) | the pause menu | rare, and it costs a thumb |
| undo (Ctrl+Z) | **two-finger tap**, and an UNDO tile at the art bar's end | Procreate's undo |
| put a planetoid back (Ctrl+Backspace twice) | the pause menu, with a confirm | it destroys work: never one gesture |
| use (F: the gate, the shed, a spirit's page) | **USE**, naming its thing ("Shed", a spirit's name), shown when the chevron is on one | section 4 |
| the press at the Athanor (drag the lever, RMB flick) | drag the lever with a finger; flick is a long press | the press is already a drag |
| the Pneuka Box (P), pause (Esc) | the top bar, the pause button | section 4 |

- **Two fingers never reach the hand.** A second finger down cancels the first finger's stroke before it lands; nothing is shaped by a
  pinch. The ring of the long press is the only wait, and it shows.
- **Portrait:** the art bar along the bottom over the safe area; the log's ticker at the top; the planetoid in the middle third.
  **Landscape:** the art bar down the right edge, the move area on the left for the Jar.
- **The harmony's thorns, the decor grid and the shed** need no new verb: pruning is GRAB, placing is PLACE, the shed is USE.
- **The god hand over the island** shares this grammar: the finger is the hand, the art bar is its domains and arts, two fingers turn and
  zoom. Its miracle sign (MMB held) is drawn with one finger after a SIGN tile is held, and the epic sign with SIGN held twice. Its own
  table follows when the god hand's turn comes in M1.

**Who builds what:**
- **Petra:** the touch driver's garden ctx (`garden`, `garden.overhead`). The two-finger gestures go to the camera (`gardencam.js`) and
  undo, before the hand sees them.
- **Calissa:** the art bar and its tiles, the size slider, the TURN and SPRING / DRAIN tiles, and the long press's ring.
- **Me:** the ctx rows in `core/bindings.js` and tap-to-go's rule. **Built:** `world/garden/tapgo.js` and `realm.goTo(point)`. The
  Jar hops toward the point with the hop unchanged, and lets it go on any key or stick, when picked up, on another planetoid, or after 12
  real s. Measured headless: 5.8 m covered in about a real second, no errors. Petra's touch driver calls `realm.goTo` on a tap with WALK up.

## 8.3 The words (Espada, 2026-10-24; plain until the owner rules)
- **The tiles:** HOP, BRAKE, FLARE, BOOST, NOSE, TAIL, JUMP, DASH, TURN, UNDO, SIGN, TOP VIEW, WALK, SPRING / DRAIN, SKIFF, STEP OFF,
  BACK, RESTART, RETIRE.
  - **USE** shows its thing's own label (RACE BOARD, START, INDEX, TALK for one of the folk), with a small USE in the tile's corner. A
    thing with no label shows USE alone. One word, two at most.
- **The turn card:** "Turn your phone sideways." Under it, by context, a smaller line: "Racing needs the width." / "This part plays
  sideways." Never "landscape".
- **The cloud save** (section 12):
  - **The offer:** "Your save from your phone, 3 real hours ago, played longer than this one. LOAD" ("from another device" when unknown;
    "N real minutes ago", "just now").
  - **In the Codex:** "Your other save, from your computer, 2 real hours ago. Kept until the next game day. LOAD"
  - **LOAD's confirm:** "Load it? The save you are playing now is kept here in its place."
  - **The longer wins at boot, the log once:** "Your save from your phone was played longer, so it is the one loaded. The other is kept in
    the Codex until the next game day."
  - **Local only, once:** "Your save is kept on this device only." Add "Sign in to keep it on every device." only if the page can offer
    signing in.
  - **The labels:** "your computer", "your phone", "your tablet", "another device". Never "desktop": the user agent can't tell a laptop
    from a desktop.
- **The touch help page:** Espada writes it once the tiles exist.

## 9. The phases

| phase | what | who | the owner can then |
| --- | --- | --- | --- |
| **M0** foundations | actions and axes; the touch and pad drivers; touch mode for the shell (no lock, pause button, top bar); the platform plumbing; save flush; the `?perf` readout; headless touch for the sweeps | Petra (input, shell, render, save); Calissa (the top bar's and pause button's look); Dovina (the bindings table's contents) | open the build on the phone, move, look, open every window, send perf screenshots |
| **M1** first play | the Solar Skiff and the Raceway on touch (section 8); the Spirit Garden, either orientation (the owner, section 11); the race board, the Index, dialogue and every M1 window sized; Raku's tables; the puzzle duel; the god hand; the track editor and haunt; the seal picker's name field; a settings window; QAIS's corner button | Dovina (the skiff's and the modes' contexts, the cluster's lists), Petra (the drivers' hooks into the skiff and the god hand), Calissa (the cluster, the layout manager, the windows), Espada (the words) | **race on the phone**, tend the garden, play the tables, the god hand, the duels, build tracks |
| **M2** the island on foot | the core movement on the stick and the cluster; USE; the Pneuka Box, the map and the Codex for touch | as M1 | walk the island, manage the kit |
| **M3** the tools | each tool's context and cluster (section 5); the drawn verbs; the Crucibelle's pads; the rhythm mode | Dovina (each tool's mapping, with each tool's owner), Petra, Calissa | fight, photograph, fish, paint, play music |
| **M4** the sea | the rail and the open sea's helm; reprogramming's field | as above, with Wanda for the rail's cue | cross the Emocean |
| **M5** parity | a layout editor (move and size the cluster: CoD's and PUBG's), gyro steering as an option (Mario Kart Tour's), haptics everywhere they help, the phone tier tuned from the measurements | all | play the whole game on the phone as well as on the desk |

## 10. Settled with Petra (sent 2026-10-24; her answers below the list)

1. Actions and axes in `core/input.js`, or a module beside it; the bindings table's home and its owner (Dovina writes the contents).
2. The touch mode's shell: pause, pointer lock, `cursorFree`, the top bar.
3. The phone readout (`?perf`) and the four-place baseline on the owner's phone; whether the published page's host allows fullscreen,
   orientation and a manifest.
4. The phone tier's candidates (MSAA, the shadow pass, outline hulls near only, a 30 fps cap) and the detector's fix for iPhones.
5. Boot: lazy rooms, the warm-up's progress and spread, the workbench out of the published bundle.
6. Save on `pagehide`, failed-write notice.
7. Headless touch in the sweeps and the stress test.
8. M0's order and size: what lands in her next round.

### Petra's answers (2026-10-24; 9213f61 merged the plan)
1. **Actions and axes.**
   - `core/actions.js` (Petra's) holds `action(id)` and `axis(id)`.
   - `core/input.js` stays the devices.
   - The table is `core/bindings.js`: its contents are Dovina's (section 6.1.1), its shape Petra's.
   - **Changed from section 6.1:** in M0 no system moves to actions. The drivers press key codes through the reverse map (HOP presses
     `Space`), so every key read works on day one; `action()` is for new code, adopted one system at a time.
   - The only new reads are the axes `moveX`, `moveY`, `steer`, `lookX` and `lookY`.
   - **The core movement on a stick:** the direction at unit length, its push picking one of the three gaits the body has (walk below
     0.55, run, sprint past the outer ring). A half push as a new speed would change the feel, so there is none. The animation tree and
     the stress test meet no new state.
   - The skiff's `steer` is truly analog; keys still give ±1.
2. **The shell's touch mode:** as written, plus `input.device`. On touch the lock is never asked for, and losing it pauses only on
   keyboard and mouse. Petra wires the pause button and the top bar; Calissa dresses them.
3. **Measuring first.**
   - **`?perf`** (Petra) shows:
     - fps, frame ms (tick and draw apart), GL calls with the shadow pass, heap, tier and lines;
     - `EXT_color_buffer_float`, half floats, `KHR_parallel_shader_compile` and the renderer string;
     - what the host allows: whether the page is framed, fullscreen, wake lock, orientation lock, pointer lock. Whether a manifest
       install is possible waits on the framing answer.
   - **`?at=dunes|raceway|godhand|workshop`** sets the boot down there, so the owner can shoot all four places before touch play exists.
4. **The phone tier**, ordered by the wall the audit found (the CPU, not fill):
   - the shadow pass every 2nd or 3rd frame (31% of GL calls);
   - outline hulls near only (36% of the main pass's draws; Calissa's fade band);
   - MSAA off, the scene's and the canvas's (about 33 MB at High);
   - lamps to 4;
   - a 30 fps cap, with a caveat: physics stays at fixed 1/60 steps, so a 30 fps frame runs 2 steps. It halves the draw, not the
     simulation; to be measured before it is promised.
   - **The detector:** `Apple GPU` with a coarse pointer and touch points means the phone tier (a copy of Low until the numbers come).
   - **Direct-to-canvas** only if a device lacks half-float targets.
5. **Boot.**
   - Yes in M0: the workbench as a dynamic import behind `/workbench` (QAIS stays), and a real progress bar over the warm-up.
   - Not in M0: spreading the compile (it would trade away the no-mid-play-hitch property, unmeasured) and lazy rooms (structural; they
     wait on the phone's heap).
6. **The save, all in M0:**
   - a flush on `pagehide` and `visibilitychange` (the ledger's 5 s debounce too);
   - a failed `setItem` said in the log, throttled, with the export code;
   - `webglcontextlost` pauses with a message, and a restore recompiles behind the loading screen.
7. **Headless touch:** `open(room, { touch: true })` in the sweeps' harness (Playwright's `hasTouch`, `isMobile`, 844 × 390). The sweeps'
   touch rooms are Dovina's; the stress test's touch lane is Petra's, once the driver exists.
8. **M0 in Petra's order, one round:**
   1. `?perf` and `?at=`;
   2. the save flush, the write-failure notice and context loss;
   3. `input.device`, axes and actions, the touch driver pressing keys, and the pad driver;
   4. the shell's touch mode;
   5. the platform plumbing (`viewport-fit=cover`, `touch-action: none`, safe areas, `dvh`, fullscreen where allowed);
   6. the harness's touch option;
   7. the detector and the workbench split.
   - Then M1 is Dovina's to map: the skiff on touch.
   - Step 3 needed the bindings' first cut: section 6.1.1.
- **Steady Keel** is the owner's to rule (section 11).
- **Not verified by Petra:** anything on a phone, the host's permissions, Safari's half floats and parallel compile. The readout is for
  those.

### Calissa's answers (2026-10-24: yes to all five, with these)
1. **The layout manager** is one module (`src/ui/hudlayout.js`), its unit `su` = 1% of the safe area's shorter side; every corner
   instrument registers an anchor and a size in su; on touch the thumbs' areas are reserved rects nothing may enter. On touch **the log
   becomes a two-line ticker** top-left under the top bar (a tap opens it full, as a sheet), never under the steering thumb, since it is
   the only narration; **the Lachrimeter moves up the right edge** under the Sight, clear of HOP; the place plate drops to its icon line.
2. **The race's BACK / RESTART / RETIRE go into the pause menu** while racing (section 8 amended).
3. **The touch controls are glazed clay tiles** in the Clay dress, each the action's glyph in the UI icons' hand, its state lit in the
   labradorite's play (HOP's rim fills as the spring loads, FLARE embers as the scorch nears, BOOST shows the banked suns); the floating
   stick's ring speaks the slip arc's language (calm in the film, the carve's sides an ember band); a word only under a glyph Espada says
   needs one, 14 px least.
4. **The long press shows a ring filling under the finger** over its 420 ms. **Tap-then-tap**: the picked thing lifts and glows as the
   table marks' chosen piece does (one language for "held"), the legal drops lit; she needs a `pick(id)` / `drop(slot)` pair beside the
   drag handlers in the Pneuka Box (Dovina's `pneuka/ui.js`), the reading table and the underside (Dovina's `pneuka/underside.js`). The
   Box on a phone: its grid full height on one side, the detail a bottom sheet, the worn kit a strip.
5. **Outline hulls near only** are acceptable if the hull's width fades out over a band (about 25 to 40 m), never a hard cut; far things
   keep their silhouette from the grade. Petra measures first.
6. She builds M0's top bar and pause button as soon as Petra's touch mode lands, to its hook (`game.touch` or a body class: Petra's call).

### Espada's answer (2026-10-24)
The move and look **areas** (not zones: a zone is a render zone). The stale help pages are fixed on claude/espada-lore (9782ee55): the
Veritome's keeps no things, the skiff's teaches the carve, the grabs, the banked flare and the shoulder.

### Wanda's answers (2026-10-24, claude/friendly-knuth-vbv82r cd55f0b8)
1. **Recovery is built** (`audio/core.js recover()`): a hidden page suspends the audio context and a visible one resumes it; any stop
   (iOS's `interrupted`, a suspend nobody asked for) resumes after 0.25 real s, or on the next touch, click or key if the browser wants a
   gesture; the schedulers run on the context's clock, so a suspended stretch is skipped, never piled up (casebook
   289; headless only, not yet on a phone).
2. **Haptics are Wanda's** (`audio/haptics.js`, off the bus, 120 ms between buzzes): a perfect pop [12]; a parry [10, 40, 14]; a combo
   banked [12, 50, 28]; a hit taken (a crack, not your own) [36]; the shield broken [30, 60, 30]; shattered [80, 40, 160]; the hull struck
   at sea [40]; a line snapped [24]; a fish's lift [16, 60, 30] (a record or legend [16, 60, 16, 60, 40]). Off with `T.audio.haptics =
   false`, a knob for now; a settings row is Calissa's or Petra's (the settings window, M1).
3. **The lighter reverb path** waits on the phone numbers; then the five convolvers share one send in the phone tier.

## 11. Ruled by the owner (2026-10-24)

1. **The phone is an iPhone** (iOS Safari, inside the claude.ai page). The baseline and the phone tier are set from it.
2. **No gamepad.** The pad driver stays in M0 (it is cheap and serves the desk), but nothing waits on it. Touch is the path; the pad's
   rows in 6.1.1 are kept for whoever has one.
3. **Steady Keel: yes, switchable.**
   - **Built:** `world/raceway/keel.js` and the knack `steadyKeel` in `progress/knacks.js`.
   - **Opened by** the first race finished (the count way) or any medal (the feat way).
   - **Measured headless** (the Sun Circuit, 75 real s, W held and nothing else): off, the board ran 25 m off the line on average and
     passed 1 gate; on, 1.1 m and 4 gates, no bails. That is strong: it nearly drives the line alone, like Mario Kart's Smart Steering.
     The skill left is the racing line, the carves and the flares.
   - **What it does:** on in a race with no steer given, it aims the board 14 m down the line at no more than 0.4 of a full steer, and
     does nothing once you are on the line. Your own steer always wins.
4. **Landscape for the action modes** (the skiff, on foot, the rail). **Either orientation** for windows, the god hand, Raku's tables,
   the duels and **the Spirit Garden**. The owner: "managing the Spirit Garden (which I think will do really nicely on mobile)", so the
   garden moves up to M1 beside the skiff (section 9).
5. **Saves move between platforms** (the owner: "implicit in all this"). One save, desk and phone alike: section 12.

### 11.1 What iOS Safari changes (facts to check on the owner's phone with `?perf`; none assumed)
- **No orientation lock and no element fullscreen on an iPhone** (Safari gives fullscreen to video only). So landscape cannot be forced:
  an action mode held in portrait shows a "turn your phone" card instead of the play (Calissa's look), and nothing runs under it.
  Fullscreen comes only from a home-screen web app, which the framed claude.ai page may not allow (Petra's readout says).
- **No Vibration API in iOS Safari.** Wanda's haptics (`audio/haptics.js`) are silent on the owner's phone. Safari 18's
  `<input type="checkbox" switch>` gives a system haptic tick when toggled, which is the only web haptic iOS has. It is Wanda's to try
  (one tick, no patterns); unverified.
- **No pointer lock.** Already planned: touch mode never asks for it.
- **Storage that Safari may clear.** Safari's tracking prevention can delete script-written storage (localStorage) of a site not visited
  for seven days, and storage in a frame on claude.ai is partitioned. The save in localStorage alone is at risk on the owner's iPhone.
  This makes section 12's cloud save the save's safety, not only its migration.
- **Audio** starts only after a touch; Wanda's `recover()` already covers it (section 10).

## 12. One save on every device (the owner, 2026-10-24)

The save is already one format on every platform: `core/save.js`'s sections, and the Codex's EXPORT CODE (`FFS2.<base64>.<checksum>`,
`save.code()` / `save.fromCode()`). **It works today by hand:** export on the desk, paste on the phone. The plan makes it automatic.
- **The cloud save** (Petra's: `core/save.js`, and the published page's capabilities):
  - The published page already declares `db` and `user` (the chatroom uses both).
  - The save is written to the viewer's private path, `data/users/<id>/save/<section>` (`<id>` from `user.id()`). That path is private even
    from the owner, so a guest's save is theirs alone.
  - **One document a section**, so no document nears the 256 KiB cap. A fresh save measures 6.2 KB as a code (the `keys` section is 4.6 KB of
    it). A long-played save is unmeasured; the ledger and the explored area are the ones to watch.
  - **Written on the same flush** as localStorage: `pagehide`, `visibilitychange`, and the dirty sections at most once a real minute.
    Only a changed section is written, one write at a time a document.
  - **Read at boot**, before the title. Each section carries `{ build, at, device }`. A section from another build is not loaded:
    progress resets on every new build, settings are kept, as now.
  - **When both are newer than the last sync** (played on the desk and the phone without a sync between), the save that was played
    longer wins whole, never section by section. A save is one thing: state that must agree is one section, but the sections still
    agree with each other. The other is kept as a code in the Codex for a game day ("Your other save, from your desktop, 2 real hours
    ago: LOAD"). A real hour of play is never lost silently.
  - **Settings are per device**, never synced: a phone's graphics tier and touch layout are not the desk's.
  - **Signed out, or `db` absent:** localStorage alone, as now. The log says once that the save is kept on this device only.
- **Petra's refinements (2026-10-24):**
  1. **Boot never waits on the db.** `claude.use('db')` resolves late, and as null after 10 real s. So boot reads localStorage as now,
     and the cloud read gets 1.5 real s before the title. A cloud save that answers later and was played longer is offered as the loser
     copy is ("Your save from another device, N real hours ago: LOAD"). It never swaps under a running game.
  2. **"Played longer" is the ledger's play time**, kept in the save itself. A section's `at` only says when it was written.
  3. **`device` is a random id kept in the settings section** (local, one a browser). Its label in the Codex ("your desktop", "your
     phone") is read from the user agent when the save is written.
  - **For `?perf`:** `navigator.storage.persisted()` and `estimate()`, standalone mode (`display-mode`), and whether fullscreen,
    orientation lock, wake lock and vibrate exist. A missing one is reported as missing.
  - **M0 as a whole waits on the owner's go.**
- **The ledger's 5 s debounce** and the save's flush already land in M0 (section 10, answer 6). The cloud write is M0's step 2 too: the
  same hook, one more writer. It goes before touch play, because the owner's phone storage is the one at risk (11.1).
- **What I check** (the sweeps' touch lane): a save written on one page and read on a fresh one; a section from an old build refused;
  the longer play winning whole, the other kept.

