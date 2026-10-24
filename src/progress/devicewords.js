// ---------------------------------------------------------------------------------------
// THE DEVICE'S WORDS (docs/plans/MOBILE.md 8.3; the owner's round, 2026-10-24: "the help and the log's hints follow the device"): what to
// call an input action on the device last touched (`input.device`), read from the one bindings table (core/bindings.js), so a hint is
// written once and reads right on every device: "Press {use} to talk" says "Press F" at a keyboard, "Press USE" on a phone, "Press X"
// with a pad. The words are Espada's (MOBILE.md 8.3); the rule that picks them is this module's.
//
// Prior art: Steam Input's and every console port's glyph swap (the prompt follows the last device), Unreal's Common UI input action
// widgets, Celeste's prompts.
//
//   deviceWord(id, device, ctx?) -> 'F' | 'USE' | 'X' | null   deviceText(text, device, ctx?) -> text with each {id} said   KEY_WORDS   TILE_WORDS
// ---------------------------------------------------------------------------------------
import { ACTIONS } from '../core/bindings.js';

/** A key's or button's own word on the keyboard and mouse. */
export const KEY_WORDS = { Space: 'Space', ShiftLeft: 'Shift', ControlLeft: 'Ctrl', AltLeft: 'Alt', Escape: 'Esc', Enter: 'Enter', Backquote: '~',
  Backspace: 'Backspace', Slash: '/', Equal: '=', Minus: '-', Mouse0: 'Left click', Mouse1: 'Middle click', Mouse2: 'Right click' };
const keyWord = (c) => KEY_WORDS[c] || (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c);

/** A touch control's word on its tile (Espada's, MOBILE.md 8.3; plain until the owner rules). A control not here is said by its id's last
 *  part in capitals (`gh.alt` -> ALT). */
export const TILE_WORDS = { use: 'USE', jump: 'JUMP', crouch: 'CROUCH', dash: 'DASH', tool: 'DRAW', lend: 'LEND', parry: 'PARRY', blink: 'BLINK',
  hop: 'HOP', brake: 'BRAKE', flare: 'FLARE', boost: 'BOOST', nose: 'NOSE', tail: 'TAIL', fire: 'FIRE', aim: 'AIM', pause: 'the pause button',
  'top.topview': 'TOP VIEW', 'top.godhand': "the god hand's tile", 'top.skiff': "the skiff's tile", 'top.survey': 'SURVEY', 'top.box': 'the Pneuka Box', 'top.map': 'the map', 'top.codex': 'the Codex', 'top.chat': 'the chat',
  'move.outerL': 'the stick pushed past its ring', 'move.outerR': 'the stick pushed past its ring', 'swipe.left': 'a swipe', 'swipe.right': 'a swipe',
  'du.end': 'END TURN', 'menu.yield': 'YIELD in the pause menu', 'menu.restart': 'RESTART in the pause menu', 'menu.back': 'BACK in the pause menu' };
const tileWord = (t) => TILE_WORDS[t] || t.split('.').pop().toUpperCase();

/** The row an action id means, in `ctx` if given (else its first). */
const rowOf = (id, ctx) => ACTIONS.find((r) => r.id === id && (!ctx || r.ctx === ctx)) || ACTIONS.find((r) => r.id === id) || null;

/** What to call input action `id` on `device` ('keyboard' | 'touch' | 'pad'): its key or button, its tile, its pad button; null if the
 *  device has none for it (the hint should then say nothing of how). */
export function deviceWord(id, device = 'keyboard', ctx = null) {
  const r = rowOf(id, ctx); if (!r) return null;
  if (device === 'touch') return r.touch ? tileWord(r.touch) : null;
  if (device === 'pad') return r.pad || null;
  const k = r.keys?.[0] ?? r.mouse; if (!k) return null;
  return [...(r.mods || []), k].map(keyWord).join(' + ');
}

/** A hint with its {id}s said for the device ("Press {use} to talk"). An id with no word on this device keeps its id's own name. */
export const deviceText = (text, device = 'keyboard', ctx = null) => String(text).replace(/\{([a-zA-Z0-9]+)\}/g, (m, id) => deviceWord(id, device, ctx) ?? id);

