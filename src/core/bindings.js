// ---------------------------------------------------------------------------------------
// THE BINDINGS TABLE (docs/plans/MOBILE.md 6.1.1; the rows Dovina's, the shape and the precedence Petra's): every input action's keys,
// mouse button, pad button (the Gamepad API's standard mapping), touch control and the context it is live in, and the five axes. The
// keyboard and mouse are unchanged by it: the touch and pad drivers (core/touchdriver.js, core/paddriver.js) press a row's FIRST KEY
// (or its mouse button) through the reverse map (`codeFor`), so every key read in the game works on a phone and a pad on day one, and
// new code may ask `actions.down(id)` instead (core/actions.js).
//
// PRECEDENCE (Petra, 2026-10-24): a pad button or a touch control resolves to the first live ctx in CTX_ORDER that binds it; a narrower
// ctx shadows a wider one button by button, never whole (in the air X is the nose, while A is still the hop's glide).
//
// Prior art: Unity's Input System (actions bound to many devices, action maps by context), Unreal's Enhanced Input (mapping contexts
// with a priority), Steam Input's action sets; VirtualKeys (coop/sibling.js), the house's own drive by key codes.
//
//   AXES   ACTIONS   CTX_ORDER   PAD_BUTTONS (standard mapping index by name)   rowsFor(kind, id) -> [row]   codeFor(row) -> code
// ---------------------------------------------------------------------------------------

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
  { id: 'pause',    keys: ['Escape'],     pad: 'Start', touch: 'top.pause',  ctx: 'any', how: 'tap' },
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
  { id: 'swap',     keys: ['KeyH'],                     touch: 'swap',       ctx: 'foot', how: 'tap' },   // (the main and the sub change places: tools/belt.js swap; touch: the belt's pair's SWAP tile, Calissa's)
  { id: 'primary',  mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'foot', how: 'hold' },  // (the tool's LMB; the carry's throw. M3 per tool)
  { id: 'secondary', mouse: 'Mouse2',     pad: 'LT',    touch: 'aim',        ctx: 'foot', how: 'hold' },  // (the tool's RMB. M3 per tool)
  { id: 'parry',    keys: ['KeyV'],       pad: 'RB',    touch: 'parry',      ctx: 'foot', how: 'tap' },   // (the kick with nothing in hand, once learned)
  { id: 'blink',    keys: ['KeyE'],       pad: 'LB',    touch: 'blink',      ctx: 'foot', how: 'tap' },   // (once learned)
  { id: 'dash',     keys: ['ShiftLeft'],  pad: 'LS',    touch: 'dash',       ctx: 'foot', how: 'tap' },   // (a press: the air dash, the crouched roll; on touch a DASH tile, always on foot: the dash is the core movement's, MOBILE.md 6.1.1)
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
  // ---- the god hand (M1: MOBILE.md 8.4). One finger is the hand (the cursor); a long press is RMB (the art wheel); two fingers pan, pinch
  //      zooms (the wheel), a twist turns the view (Q / E): the driver's gestures. A domain tapped again goes through its arts, as its key.
  { id: 'ghD1',     keys: ['Digit1'],                   touch: 'gh.d1',      ctx: 'godhand', how: 'tap' },  // (Ouranurgy)
  { id: 'ghD2',     keys: ['Digit2'],                   touch: 'gh.d2',      ctx: 'godhand', how: 'tap' },  // (Manifestation)
  { id: 'ghD3',     keys: ['Digit3'],                   touch: 'gh.d3',      ctx: 'godhand', how: 'tap' },  // (Divination)
  { id: 'ghD4',     keys: ['Digit4'],                   touch: 'gh.d4',      ctx: 'godhand', how: 'tap' },  // (Psychokinesis)
  { id: 'ghD5',     keys: ['Digit5'],                   touch: 'gh.d5',      ctx: 'godhand', how: 'tap' },  // (Possession)
  { id: 'ghD6',     keys: ['Digit6'],                   touch: 'gh.d6',      ctx: 'godhand', how: 'tap' },  // (Alteration)
  { id: 'ghD7',     keys: ['Digit7'],                   touch: 'gh.d7',      ctx: 'godhand', how: 'tap' },  // (Spellscription)
  { id: 'ghAlt',    keys: ['ShiftLeft'],                touch: 'gh.alt',     ctx: 'godhand', how: 'hold' }, // (an art's other way: Hasten stops time, Transmute your feeling, Telekinesis raises; shown for those arts only)
  { id: 'ghSign',   mouse: 'Mouse1',                    touch: 'gh.sign',    ctx: 'godhand', how: 'hold' }, // (held: one finger draws a miracle's sign; with ALT held, the epic's)
  { id: 'ghSurvey', keys: ['KeyN'],                     touch: 'top.survey', ctx: 'godhand', how: 'tap' },
  // ---- the Spirit Garden (M1: MOBILE.md 8.2). One finger is the hand; a long press is RMB; two fingers turn and zoom; a two-finger tap undoes.
  { id: 'gaArt1',   keys: ['Digit1'],                   touch: 'art.grab',      ctx: 'garden', how: 'tap' },   // (GRAB .. PAINT, the bar's order: hand.js ARTS; the lit one tapped again puts it down, WALK)
  { id: 'gaArt2',   keys: ['Digit2'],                   touch: 'art.pull',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt3',   keys: ['Digit3'],                   touch: 'art.press',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt4',   keys: ['Digit4'],                   touch: 'art.smooth',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt5',   keys: ['Digit5'],                   touch: 'art.flatten',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt6',   keys: ['Digit6'],                   touch: 'art.carve',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt7',   keys: ['Digit7'],                   touch: 'art.roughen',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt8',   keys: ['Digit8'],                   touch: 'art.water',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt9',   keys: ['Digit9'],                   touch: 'art.place',      ctx: 'garden', how: 'tap' },
  { id: 'gaArt10',  keys: ['Digit0'],                   touch: 'art.paint',     ctx: 'garden', how: 'tap' },
  { id: 'gaTurn',   keys: ['KeyR'],                     touch: 'art.turn',    ctx: 'garden', how: 'tap' },   // (the choice turned: decor, ground, feeling)
  { id: 'gaSpring', keys: ['ShiftLeft'],                touch: 'art.spring',  ctx: 'garden', how: 'hold' },  // (with WATER: a spring)
  { id: 'gaDrain',  keys: ['ControlLeft'],              touch: 'art.drain',   ctx: 'garden', how: 'hold' },  // (with WATER: a drain)
  { id: 'gaUndo',   keys: ['KeyZ'], mods: ['ControlLeft'], touch: 'art.undo', ctx: 'garden', how: 'tap' },   // (and the two-finger tap)
  { id: 'gaJump',   keys: ['Space'],                    touch: 'jump',       ctx: 'garden', how: 'tap' },
  { id: 'gaUse',    keys: ['KeyF'],                     touch: 'use',        ctx: 'garden', how: 'tap' },
  { id: 'gaTop',    keys: ['Backquote'],                touch: 'top.overhead', ctx: 'garden', how: 'tap' }, // (TOP VIEW: the garden's ~ is the overhead view)
  // ---- the puzzle duel (M1: MOBILE.md 8.5). One finger is the cursor: a cell tapped, a path dragged; a long press drops a piece (RMB); a
  //      swipe that starts on the Courier steps it (W A S D), a long press then a swipe kicks (Shift held): the driver's gestures.
  { id: 'duShoot',  keys: ['KeyX'],                     touch: 'du.shoot',   ctx: 'duel', how: 'tap' },     // (the strip shows the worn tools' moves only)
  { id: 'duGrab',   keys: ['KeyQ'],                     touch: 'du.grab',    ctx: 'duel', how: 'tap' },
  { id: 'duDrill',  keys: ['KeyK'],                     touch: 'du.drill',   ctx: 'duel', how: 'tap' },
  { id: 'duPaint',  keys: ['KeyG'],                     touch: 'du.paint',   ctx: 'duel', how: 'tap' },
  { id: 'duDelay',  keys: ['KeyU'],                     touch: 'du.delay',   ctx: 'duel', how: 'tap' },
  { id: 'duHold',   keys: ['KeyI'],                     touch: 'du.hold',    ctx: 'duel', how: 'tap' },
  { id: 'duSend',   keys: ['KeyI'], mods: ['ShiftLeft'], touch: 'du.send',   ctx: 'duel', how: 'tap' },
  { id: 'duRotate', keys: ['KeyR'],                     touch: 'du.rotate',  ctx: 'duel', how: 'tap' },     // (shown while a piece is under the last touch)
  { id: 'duEnd',    keys: ['Space'],                    touch: 'du.end',     ctx: 'duel', how: 'tap' },     // (END TURN, the cluster's largest)
  { id: 'duFinish', keys: ['KeyF'],                     touch: 'du.finish',  ctx: 'duel', how: 'tap' },     // (shown on a broken foe)
  { id: 'duFlee',   keys: ['KeyE'],                     touch: 'du.flee',    ctx: 'duel', how: 'tap' },
  { id: 'duForm',   keys: ['Backquote'],                touch: 'du.form',    ctx: 'duel', how: 'tap' },     // (hand / Courier)
  { id: 'duYield',  keys: ['Backspace'],                touch: 'menu.yield', ctx: 'duel', how: 'hold' },    // (held 1.5 real s; in the pause menu)
  // ---- the rail (M4: a crossing at sea; Petra's ctx `rail`, 2026-10-24). The ship steers on the move area's stick (W A S D); the view is
  //      the rail's. FIRE held as on a pad (StarFox's), the lock-on held and let go; FORM, ROLL and SURGE in the cluster, BOOST and BRAKE held
  { id: 'raFire',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'rail', how: 'hold' },
  { id: 'raLock',   mouse: 'Mouse2',      pad: 'LT',    touch: 'lock',       ctx: 'rail', how: 'hold' },  // (the lock-on: held to mark, let go to loose the lances)
  { id: 'raRoll',   keys: ['KeyE'],       pad: 'B',     touch: 'roll',       ctx: 'rail', how: 'tap' },   // (the barrel roll; its two charges)
  { id: 'raForm',   keys: ['KeyQ'],       pad: 'Y',     touch: 'form',       ctx: 'rail', how: 'tap' },   // (Astral and Umbral)
  { id: 'raSurge',  keys: ['KeyR'],       pad: 'X',     touch: 'surge',      ctx: 'rail', how: 'tap' },   // (shown only with the surge's gauge full)
  { id: 'raBoost',  keys: ['ShiftLeft'],  pad: 'RB',    touch: 'boost',      ctx: 'rail', how: 'hold' },
  { id: 'raBrake',  keys: ['KeyC'],       pad: 'LB',    touch: 'brake',      ctx: 'rail', how: 'hold' },
  // ---- the free helm (M4: the open sea; Petra's ctx `helm`). The rudder on the move area's stick (A / D); the throttle a notch a tap
  { id: 'heUp',     keys: ['KeyW'],       pad: 'Up',    touch: 'throttle.up',   ctx: 'helm', how: 'tap' },
  { id: 'heDown',   keys: ['KeyS'],       pad: 'Down',  touch: 'throttle.down', ctx: 'helm', how: 'tap' },
  { id: 'heMoor',   keys: ['KeyF'],       pad: 'A',     touch: 'use',        ctx: 'helm', how: 'tap' },   // (moor, dock or board: USE names its thing)
  { id: 'heFix',    keys: ['KeyR'],       pad: 'Y',     touch: 'fix',        ctx: 'helm', how: 'tap' },   // (read the sky with the Dreamvane)
  { id: 'heFire',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'helm', how: 'hold' },  // (the ship's gun, aimed with the camera)
  { id: 'heBroad',  mouse: 'Mouse2',      pad: 'LT',    touch: 'broadside',  ctx: 'helm', how: 'tap' },   // (the side the camera looks over fires at once: seafight.js)
  { id: 'heParry',  keys: ['KeyV'],       pad: 'B',     touch: 'parry',      ctx: 'helm', how: 'tap' },   // (the outlined spit sent back: seafight.js)
  { id: 'hePlate',  keys: ['KeyE'],       pad: 'X',     touch: 'plate',      ctx: 'helm', how: 'tap' },   // (a plate from the helm, the Veritome worn: world/opensea/herds.js)
  // ---- the rhythm mode and busking (M3, Wanda's: ten lanes as ten pads in two rows; a held pad is a held lane, music/rhythm/rhythm.js)
  { id: 'rhLane1', keys: ['Digit1'], touch: 'rh.l1', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane2', keys: ['Digit2'], touch: 'rh.l2', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane3', keys: ['Digit3'], touch: 'rh.l3', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane4', keys: ['Digit4'], touch: 'rh.l4', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane5', keys: ['Digit5'], touch: 'rh.l5', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane6', keys: ['Digit6'], touch: 'rh.l6', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane7', keys: ['Digit7'], touch: 'rh.l7', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane8', keys: ['Digit8'], touch: 'rh.l8', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane9', keys: ['Digit9'], touch: 'rh.l9', ctx: 'rhythm', how: 'hold' },
  { id: 'rhLane10', keys: ['Digit0'], touch: 'rh.l10', ctx: 'rhythm', how: 'hold' },
  // ---- the tools in hand (M3: MOBILE.md 8.7). Each ctx is a main tool drawn (its form for the Sondelass); narrower than foot, so a tile
  //      means the tool's verb while it is out and the foot's while it is stowed. FIRE dragged while held aims (the driver's).
  { id: 'psFire',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.psygun', how: 'hold' },  // (held and let go: the charge)
  { id: 'psAim',    mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.psygun', how: 'hold' },  // (the sights; the Carbine's breath is ALT while scoped)
  { id: 'psShell',  mouse: 'Mouse1',      pad: 'RB',    touch: 'shell',      ctx: 'tool.psygun', how: 'hold' },  // (the chambered shell: tapped assisted; held, the seeker paints)
  { id: 'psFan',    keys: ['KeyQ'],                     touch: 'ps.fan',     ctx: 'tool.psygun', how: 'tap' },   // (once learned)
  { id: 'psBreath', keys: ['ShiftLeft'],                touch: 'ps.breath',  ctx: 'tool.psygun', how: 'hold' },  // (the Carbine scoped)
  { id: 'psCh1',    keys: ['Digit1'],                   touch: 'ps.ch1',     ctx: 'tool.psygun', how: 'tap' },   // (the chamber strip: the cylinder's own order)
  { id: 'psCh2',    keys: ['Digit2'],                   touch: 'ps.ch2',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'psCh3',    keys: ['Digit3'],                   touch: 'ps.ch3',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'psCh4',    keys: ['Digit4'],                   touch: 'ps.ch4',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'psCh5',    keys: ['Digit5'],                   touch: 'ps.ch5',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'psCh6',    keys: ['Digit6'],                   touch: 'ps.ch6',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'psCh7',    keys: ['Digit7'],                   touch: 'ps.ch7',     ctx: 'tool.psygun', how: 'tap' },
  { id: 'cuAttack', mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.cutlass', how: 'hold' }, // (ATTACK: the string)
  { id: 'cuSpecial', mouse: 'Mouse2',     pad: 'LT',    touch: 'aim',        ctx: 'tool.cutlass', how: 'tap' },  // (SPECIAL: swiped up, the forward special (W held); down, the back one (S held): the driver's)
  { id: 'cuLock',   mouse: 'Mouse1',                    touch: 'lock',       ctx: 'tool.cutlass', how: 'tap' },  // (the lock-on; a flick on the look area changes the target)
  { id: 'cuForm1',  keys: ['Digit1'],                   touch: 'so.cutlass', ctx: 'tool.cutlass', how: 'tap' },  // (the form strip: cutlass, rod, hook)
  { id: 'cuForm2',  keys: ['Digit2'],                   touch: 'so.rod',     ctx: 'tool.cutlass', how: 'tap' },
  { id: 'cuForm3',  keys: ['Digit3'],                   touch: 'so.hook',    ctx: 'tool.cutlass', how: 'tap' },
  { id: 'roCast',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.rod', how: 'hold' },     // (CAST: held and let go; a tap twitches; fish on: REEL)
  { id: 'roSink',   mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.rod', how: 'hold' },     // (SINK before a bite; GIVE LINE with a fish on)
  { id: 'roPing',   mouse: 'Mouse1',                    touch: 'ro.ping',    ctx: 'tool.rod', how: 'hold' },     // (tap: a ping; held: the ring)
  { id: 'roCrank',  mouse: 'Mouse0', mods: ['ShiftLeft'], touch: 'ro.crank', ctx: 'tool.rod', how: 'hold' },     // (fish on: the crank; before a bite: the fast retrieve)
  { id: 'roLure',   keys: ['Equal'],                    touch: 'ro.lure',    ctx: 'tool.rod', how: 'tap' },      // (the next lure; the lure ring's feeling a long press: the driver's wheel)
  { id: 'roForm1',  keys: ['Digit1'],                   touch: 'so.cutlass', ctx: 'tool.rod', how: 'tap' },
  { id: 'roForm3',  keys: ['Digit3'],                   touch: 'so.hook',    ctx: 'tool.rod', how: 'tap' },
  { id: 'hoFire',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.hook', how: 'hold' },    // (FIRE at the hook's mark; held: REEL)
  { id: 'hoAim',    mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.hook', how: 'hold' },    // (held: aim, paying out after 0.2 s; tapped: let go)
  { id: 'hoForm1',  keys: ['Digit1'],                   touch: 'so.cutlass', ctx: 'tool.hook', how: 'tap' },
  { id: 'hoForm2',  keys: ['Digit2'],                   touch: 'so.rod',     ctx: 'tool.hook', how: 'tap' },
  { id: 'brClub',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.brush', how: 'hold' },   // (ATTACK: the club; on the ground, paint or mop)
  { id: 'brFlick',  mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.brush', how: 'tap' },    // (tapped: the flick; held: Celestial mode, one finger then draws: the driver's)
  { id: 'brPaint',  keys: ['Digit1'],                   touch: 'br.paint',   ctx: 'tool.brush', how: 'tap' },    // (PAINT and MOP: one toggle tile, its two faces)
  { id: 'brMop',    keys: ['Digit2'],                   touch: 'br.mop',     ctx: 'tool.brush', how: 'tap' },
  { id: 'brLock',   mouse: 'Mouse1',                    touch: 'lock',       ctx: 'tool.brush', how: 'tap' },
  { id: 'veLens',   mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.veritome', how: 'hold' }, // (LENS held; with it up, a tap anywhere on the right half is the shutter: the driver's)
  { id: 'veShutter', mouse: 'Mouse0',     pad: 'RT',    touch: 'fire',       ctx: 'tool.veritome', how: 'tap' },
  { id: 'veFlash',  keys: ['Digit1'],                   touch: 've.flash',   ctx: 'tool.veritome', how: 'tap' },
  { id: 'veMind',   mouse: 'Mouse1',                    touch: 've.mind',    ctx: 'tool.veritome', how: 'tap' },  // (REPROGRAM: shown by a stunned mind)
  { id: 'dvPick',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.dreamvane', how: 'hold' }, // (the pick: held, let go full)
  { id: 'dvDowse',  mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.dreamvane', how: 'hold' }, // (held: dowse; tapped: the fork)
  { id: 'dvSurvey', mouse: 'Mouse1',                    touch: 'dv.survey',  ctx: 'tool.dreamvane', how: 'tap' },
  { id: 'crToll',   mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.crucibelle', how: 'tap' }, // (TOLL, on the beat)
  { id: 'crOctave', mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.crucibelle', how: 'hold' }, // (the octave up, held under a note)
  { id: 'crN1',     keys: ['Digit1'],                   touch: 'cr.n1',      ctx: 'tool.crucibelle', how: 'tap' },  // (the five pads, an instrument on glass)
  { id: 'crN2',     keys: ['Digit2'],                   touch: 'cr.n2',      ctx: 'tool.crucibelle', how: 'tap' },
  { id: 'crN3',     keys: ['Digit3'],                   touch: 'cr.n3',      ctx: 'tool.crucibelle', how: 'tap' },
  { id: 'crN4',     keys: ['Digit4'],                   touch: 'cr.n4',      ctx: 'tool.crucibelle', how: 'tap' },
  { id: 'crN5',     keys: ['Digit5'],                   touch: 'cr.n5',      ctx: 'tool.crucibelle', how: 'tap' },
  { id: 'lhHoover', mouse: 'Mouse0',      pad: 'RT',    touch: 'fire',       ctx: 'tool.lockheart', how: 'hold' }, // (held: hoover; tapped: the flail)
  { id: 'lhOpen',   mouse: 'Mouse2',      pad: 'LT',    touch: 'aim',        ctx: 'tool.lockheart', how: 'hold' }, // (OPEN; the wheel of odds turned by a finger round it: the driver's)
];

/** The precedence: the first live ctx in this order that binds a pad button or a touch control wins it (MOBILE.md 6.1.1). */
export const CTX_ORDER = ['race', 'skiff.rail', 'skiff.air', 'skiff', 'rhythm', 'duel', 'godhand', 'garden', 'rail', 'helm', 'tool.psygun', 'tool.cutlass', 'tool.rod', 'tool.hook', 'tool.brush', 'tool.veritome', 'tool.dreamvane', 'tool.crucibelle', 'tool.lockheart', 'foot', 'any'];
/** The Gamepad API's standard mapping, by the table's names. */
export const PAD_BUTTONS = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, Back: 8, Start: 9, LS: 10, RS: 11, Up: 12, Down: 13, Left: 14, Right: 15 };

const BY = { pad: new Map(), touch: new Map() };
for (const row of ACTIONS) for (const kind of ['pad', 'touch']) if (row[kind]) { const m = BY[kind]; if (!m.has(row[kind])) m.set(row[kind], []); m.get(row[kind]).push(row); }
for (const m of Object.values(BY)) for (const rows of m.values()) rows.sort((a, b) => CTX_ORDER.indexOf(a.ctx) - CTX_ORDER.indexOf(b.ctx));
/** The rows a pad button or a touch control carries, narrowest ctx first. */
export const rowsFor = (kind, id) => BY[kind].get(id) || [];
/** The code a driver presses for a row: its first key, or its mouse button. */
export const codeFor = (row) => row.keys?.[0] ?? row.mouse ?? null;
