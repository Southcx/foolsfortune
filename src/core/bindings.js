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

/** The precedence: the first live ctx in this order that binds a pad button or a touch control wins it (MOBILE.md 6.1.1). */
export const CTX_ORDER = ['race', 'skiff.rail', 'skiff.air', 'skiff', 'foot', 'any'];
/** The Gamepad API's standard mapping, by the table's names. */
export const PAD_BUTTONS = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, Back: 8, Start: 9, LS: 10, RS: 11, Up: 12, Down: 13, Left: 14, Right: 15 };

const BY = { pad: new Map(), touch: new Map() };
for (const row of ACTIONS) for (const kind of ['pad', 'touch']) if (row[kind]) { const m = BY[kind]; if (!m.has(row[kind])) m.set(row[kind], []); m.get(row[kind]).push(row); }
for (const m of Object.values(BY)) for (const rows of m.values()) rows.sort((a, b) => CTX_ORDER.indexOf(a.ctx) - CTX_ORDER.indexOf(b.ctx));
/** The rows a pad button or a touch control carries, narrowest ctx first. */
export const rowsFor = (kind, id) => BY[kind].get(id) || [];
/** The code a driver presses for a row: its first key, or its mouse button. */
export const codeFor = (row) => row.keys?.[0] ?? row.mouse ?? null;
