// ---------------------------------------------------------------------------------------
// WHAT IS TUNED: every knob of the tuning panel (Tab, debug/tuning.js) that stands away from its default (core/config.js DEFAULTS), so
// a tuned game is never mistaken for a bug (the owner, 2026-10-05: "I adjust a parameter, forget about it, and then mistakenly identify
// it as a bug"). The tuning is kept between sessions, so it is said at the start of play (`tuning.tuned`, a log rule), marked on the
// panel itself, carried on every QAIS report, and shown at the top of QAIS's Brief.
//
// Two kinds, told apart: a SETTING is the player's own preference (mouse sensitivity, resolution, volume, how a charge fires) and is
// never a warning; a KNOB is everything else (the feel, the numbers) and is. Both ride on a report.
//
// Prior art: Unreal's console variables shown as changed from default (`DumpCVars` marks the overridden), Chrome's flags page (the
// changed ones listed first, "Reset all"), and a bug tracker's "environment" field: the conditions a report was filed under.
//
//   tuned() -> { knobs: [{ key, now, was }], settings: [{ key, now, was }] }   isSetting(key)   differs(key)   line(knobs, n?) -> text
// ---------------------------------------------------------------------------------------
import { T, DEFAULTS } from '../core/config.js';

/** The player's own preferences: kept, never warned about (they are not the game under test); `visual.shadows` is one (a performance
 *  and taste choice, Calissa). */
export const SETTINGS = new Set(['camera.sensitivity', 'camera.adsSensMult', 'visual.resolution', 'visual.upscale', 'visual.shadows', 'visual.glitch', 'visual.pendulumSize', 'visual.compassContrast', 'audio.volume', 'charge.mode']); // (shadows, glitch, the pendulum's size, the compass's contrast: Calissa)
export const isSetting = (key) => SETTINGS.has(key);

const get = (o, key) => key.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)) : a === b);
/** Whether one knob (`group.key`, or deeper) stands away from its default. */
export const differs = (key) => !same(get(T, key), get(DEFAULTS, key));

/** Every knob and setting away from its default, by its dotted key. */
export function tuned() {
  const knobs = [], settings = [];
  const walk = (d, t, prefix) => {
    for (const k of Object.keys(d)) {
      const key = prefix ? `${prefix}.${k}` : k, was = d[k], now = t?.[k];
      if (was && typeof was === 'object') { walk(was, now, key); continue; } // (an array is walked too: its entries are knobs)
      if (same(now, was)) continue;
      (isSetting(key) ? settings : knobs).push({ key, now, was });
    }
  };
  walk(DEFAULTS, T, '');
  return { knobs, settings };
}

const fmt = (v) => (typeof v === 'number' ? String(+v.toFixed(4)) : String(v));
/** One line for the log or the Brief: the first few knobs, "now (default was)". */
export function line(knobs, n = 4) {
  const shown = knobs.slice(0, n).map((k) => `${k.key} ${fmt(k.now)} (default ${fmt(k.was)})`).join(', ');
  return knobs.length > n ? `${shown}, and ${knobs.length - n} more` : shown;
}
